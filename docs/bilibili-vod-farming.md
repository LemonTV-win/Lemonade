# Bilibili VOD farming notes

## Why this changed

The CN server season labels are no longer a simple `C<number>` sequence after the old numbered seasons:

| Local season key | Official CN naming     | Starts     |
| ---------------- | ---------------------- | ---------- |
| `C12`            | 第十二赛季「至日之翼」 | 2025-08-26 |
| `C13`            | 第十三赛季「虚想龙歌」 | 2025-10-21 |
| `26SP1`          | 26SP1「猎夜呢喃」      | 2025-12-18 |
| `26SP2`          | 26SP2「长廊追迹」      | 2026-03-10 |
| `26SP3`          | 26SP3「虚弦暗变」      | 2026-05-19 |

The 2025-12-18 official notice says the season naming was unified to `year + season serial`; for example, 2026 first season is `26SP1`, second season is `26SP2`.

## Best current farming path

We already have old Bilibili VOD rows, so the highest-yield path is creator-first rather than global-search-first:

1. Read existing Bilibili VODs from `vod`.
2. Resolve each historical BV id through `https://api.bilibili.com/x/web-interface/view?bvid=...` to recover the creator `mid`.
3. For each known creator, list public collections through:
   - `https://api.bilibili.com/x/polymer/web-space/home/seasons_series?mid=...`
   - `https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid=...&season_id=...`
4. Also run a few pubdate-ordered global search queries for unknown new uploaders when search is not disabled.
5. Score candidate archives by title/collection keywords, map aliases, character aliases, rank aliases, and tournament/scrim keywords.
6. Emit a review JSON instead of inserting directly, because the app currently requires `map` and `character_first`, and Bilibili titles are often incomplete.

This collection route has worked without a login cookie. Pubdate-ordered `x/web-interface/search/type` global search also works when sent with a normal browser user-agent and search-page referer, but it is noisier than creator collections. Unsigned space archive search remains fragile and can return captcha/risk-control responses (`412`, `-352`, or `-799`).

## Runbook

Dry-run candidate farming:

```bash
bun scripts/farm-bilibili-vods.ts \
  --since 2025-08-26 \
  --out tmp/bilibili-vod-candidates.json \
  --searchPages 2
```

Focus one known creator:

```bash
bun scripts/farm-bilibili-vods.ts \
  --player '逍遥Samaノ' \
  --since 2025-08-26 \
  --out tmp/xiaoyao-candidates.json
```

Add a new creator manually:

```bash
bun scripts/farm-bilibili-vods.ts \
  --mid 485937243:逍遥Samaノ \
  --mid 660091334:卡拉彼丘官方 \
  --since 2026-05-19 \
  --out tmp/manual-seeds.json
```

Review output fields:

- `needsReview: false` usually has enough title evidence for map + character.
- `needsReview: true` can still be useful, but check the video/thumbnail manually.
- `season` is inferred from publish date and the table above.
- Existing DB BVs are skipped.

## Next useful automation

- Add a small import script for manually edited candidate JSON once `map` and `character_first` are filled.
- Store Bilibili `mid` in a separate source table; re-resolving from old videos is okay but slow.
- Add an optional browser-cookie path for Bilibili global search when creator collections miss new uploaders.

## Match / non-highlight criteria

Default farming is intentionally conservative. A candidate is kept only when it looks like a match VOD, not a montage/highlight/commentary/PV.

Hard exclusions by default:

- title contains highlight/montage markers: `集锦`, `高光`, `精彩时刻`, `击杀秀`, `五杀`, `ACE`, `剪辑`, `切片`, `片段`, `混剪`, etc.
- title contains non-match markers: `PV`, `预告`, `锐评`, `鉴挂`, `BUG`, `外挂`, `唱歌`, `赛后环节`, `抽卡`, etc.
- duration is below `--minDurationSeconds` (default 480 seconds). This catches most highlight/short edited clips even when the title is vague.

Positive match evidence:

- map terms: `404基地`, `88区`, `柯西街区`, `科斯迷特`, etc.
- format terms: `图1`, `图2`, `第一把`, `第二把`, `决赛`, `半决`, `比赛`, `杯`.
- full-match terms: `对局`, `整局`, `一局`, `全场`, `半场`, `录像`, `POV`, `实战`.
- ranked terms: `排位`, `奇点局`, `超弦局`, `夸超局`, `顶分局`.
- character + rank together is enough for a medium-confidence review candidate even without map, if duration is long enough.

The output has `matchConfidence`:

- `high`: strong match evidence, usually map + format/full-match term.
- `medium`: plausible match VOD, but needs human review.
- `low`: filtered out by default.

## Character decision criteria

The script uses title evidence only, so character fields are guesses until reviewed.

High-confidence character guess:

- character alias appears near usage context like `玩`, `只玩`, `专精`, `秒锁`, `选择`, `掏出`, `拿出`, `使用`, `实战`, `思路`, `觉醒`, `全场`, `半场`, `奇点局`, `超弦局`, `排位`.
- examples: `只玩大狙上奇点` => `Kanami`; `新版拉薇实战` => `Lawine`.

Medium-confidence character guess:

- official/common character alias appears, but usage context is weak.
- if two characters appear with a separator (`&`, `＋`, `和`, `与`, `/`, `、`), the script treats them as possible first/second characters.

Low/no-confidence:

- no character in title.
- alias appears in enemy/team/object context such as `白墨信标`, `对面`, `敌方`, `队友`, etc.
- very short aliases (`信`, `令`, `明`, `花`) need usage context or they are ignored.

`character_first` and `character_second` are filled only from title evidence. Any candidate with `characterConfidence` below `high`, missing map, or missing first character has `needsReview: true`.

Current new-agent aliases included in title parsing:

- `Cielle` / `汐` belongs to Urbino.
- `Nora` / `诺诺` / `諾諾` belongs to The Scissors.

## Batch adding into the site (human-in-the-loop)

Until AI character detection lands, the fastest path is:

1. Run the farm script to produce candidate JSON.
2. Extract just the URLs:
   ```bash
   bun -e 'const j=require("./tmp/bilibili-vod-candidates.json");console.log(j.candidates.map(c=>c.url).join("\n"))'
   ```
3. On the `/vods` page, click **Batch add URLs**, paste the list, pick a default server/type/season, and import.
   - Title, thumbnail, uploader and publish date are auto-fetched server-side.
   - `map` and `character_first` are intentionally left empty.
4. Use the **Needs annotation** filter on `/vods` to find imported VODs and fill in map/characters via **Edit** later.

The app and farm script now share `src/lib/data/detection.ts` as the alias database for title-based detection. Keep character/map aliases there instead of duplicating them in server actions or scripts.

To discover from existing creator leads and insert directly:

```bash
bun run vod:farm:bilibili --since 2026-05-19 --insert true --out tmp/bilibili-vod-candidates.json
```

The script still skips URLs already present in the DB, and it pre-fills map/characters when aliases are confidently found in the title.
