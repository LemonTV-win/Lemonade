#!/usr/bin/env bun
import { createClient } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

type GameMap =
	| 'base_404'
	| 'area_88'
	| 'port_euler'
	| 'windy_town'
	| 'space_lab'
	| 'cauchy_district'
	| 'cosmite'
	| 'ocarnus';

type Character =
	| 'Yvette'
	| 'Nobunaga'
	| 'Kokona'
	| 'Michele'
	| 'Flavia'
	| 'Yugiri'
	| 'Leona'
	| 'Chiyo'
	| 'Reiichi'
	| 'Lawine'
	| 'Ming'
	| 'Meredith'
	| 'Eika'
	| 'Kanami'
	| 'Fragrans'
	| 'Mara'
	| 'Nora'
	| 'Audrey'
	| 'Celestia'
	| 'Maddelena'
	| 'Bai Mo'
	| 'Fuchsia'
	| 'Galatea'
	| 'Cielle';

type Rank =
	| 'Unranked'
	| 'Substance III'
	| 'Substance II'
	| 'Substance I'
	| 'Molecule III'
	| 'Molecule II'
	| 'Molecule I'
	| 'Atom IV'
	| 'Atom III'
	| 'Atom II'
	| 'Atom I'
	| 'Proton IV'
	| 'Proton III'
	| 'Proton II'
	| 'Proton I'
	| 'Neutron IV'
	| 'Neutron III'
	| 'Neutron II'
	| 'Neutron I'
	| 'Electron V'
	| 'Electron IV'
	| 'Electron III'
	| 'Electron II'
	| 'Electron I'
	| 'Quark V'
	| 'Quark IV'
	| 'Quark III'
	| 'Quark II'
	| 'Quark I'
	| 'Superstring'
	| 'Singularity';

type VodType = 'ranked' | 'scrim' | 'tournament' | 'demolition';

type ExistingVod = {
	id: string;
	url: string;
	title: string;
	player: string;
	published_at: number | null;
};

type BiliArchive = {
	aid: number;
	bvid: string;
	pubdate: number;
	ctime?: number;
	duration?: number;
	pic: string;
	title: string;
	stat?: { view?: number; danmaku?: number; vt?: number };
};

type Candidate = {
	id: string;
	url: string;
	title: string;
	thumbnail: string;
	platform: 'bilibili';
	player: string;
	mid: number;
	aid: number;
	bvid: string;
	server: 'CN';
	season: string;
	map: GameMap | null;
	character_first: Character | null;
	character_second: Character | null;
	rank: Rank | null;
	type: VodType;
	publishedAt: string;
	publishedAtUnix: number;
	durationSeconds: number | null;
	viewCount: number | null;
	score: number;
	matchConfidence: 'high' | 'medium' | 'low';
	characterConfidence: 'high' | 'medium' | 'low' | 'none';
	reasons: string[];
	needsReview: boolean;
	source: string;
};

type Seed = { mid: number; player: string; source: string };

const OFFICIAL_CN_SEASON_STARTS = [
	// Chinese official server. Old numeric seasons continue through C13, then official naming changes.
	{ season: 'C12', start: '2025-08-26', name: '第十二赛季「至日之翼」' },
	{ season: 'C13', start: '2025-10-21', name: '第十三赛季「虚想龙歌」' },
	{ season: '26SP1', start: '2025-12-18', name: '26SP1「猎夜呢喃」' },
	{ season: '26SP2', start: '2026-03-10', name: '26SP2「长廊追迹」' },
	{ season: '26SP3', start: '2026-05-19', name: '26SP3「虚弦暗变」' }
] as const;

const GAME_TITLE_TERMS = [
	'卡拉彼丘',
	'卡丘',
	'超弦',
	'奇点',
	'上奇',
	'超奇',
	'排位',
	'巅峰',
	'质量对局',
	'pov',
	'POV',
	'实战',
	'段位',
	'觉醒',
	'下包',
	'拆包'
];

const FULL_MATCH_TERMS = [
	'对局',
	'整局',
	'一局',
	'全场',
	'半场',
	'第一把',
	'第二把',
	'第三把',
	'第四把',
	'第五把',
	'图1',
	'图2',
	'图3',
	'图4',
	'图5',
	'排位',
	'奇点局',
	'超弦局',
	'夸超局',
	'顶分局',
	'录像',
	'POV',
	'pov',
	'实战',
	'决赛',
	'半决',
	'比赛',
	'杯'
];

const HIGHLIGHT_OR_NON_MATCH_TERMS = [
	'集锦',
	'高光',
	'精彩时刻',
	'击杀秀',
	'五杀',
	'ACE',
	'ace',
	'切片',
	'剪辑',
	'片段',
	'短片',
	'混剪',
	'速看',
	'名场面',
	'PV',
	'pv',
	'展示PV',
	'预告',
	'锐评',
	'鉴挂',
	'bug',
	'BUG',
	'外挂',
	'唱歌',
	'赛后环节',
	'退网',
	'补档',
	'抽卡'
];

const LOW_SIGNAL_TERMS = ['直播回放', '切片', '集锦'];
const NEGATIVE_TERMS = ['狼人杀', '捞女游戏', '无畏契约', '瓦罗兰特', '永劫无间', '抽卡', '杂谈'];

const MAP_ALIASES: Record<GameMap, string[]> = {
	base_404: ['404基地', '基地404', '404', 'Base 404', 'base404'],
	area_88: ['88区', 'Area 88', 'area88'],
	port_euler: ['欧拉港口', '欧拉港', '港口', 'Port Euler'],
	windy_town: ['风曳镇', '风曳', 'Windy Town'],
	space_lab: ['空间实验室', '空间站', '空间', 'Space Lab'],
	cauchy_district: ['柯西街区', '柯西', 'Cauchy'],
	cosmite: ['科斯迷特', '科斯', 'Cosmite'],
	ocarnus: ['奥卡努斯', 'Ocarnus']
};

const CHARACTER_ALIASES: Record<Character, string[]> = {
	Yvette: ['伊薇特', '雪怪', 'Yvette'],
	Nobunaga: ['信', '信长', 'Nobunaga'],
	Kokona: ['心夏', 'Kokona'],
	Michele: ['米雪儿', '米雪', 'Michele'],
	Flavia: ['芙拉薇娅', '蝴蝶', 'Flavia'],
	Yugiri: ['忧雾', '悠莉', 'Yugiri'],
	Leona: ['蕾欧娜', 'Leona'],
	Chiyo: ['千代', '御天织', 'Chiyo'],
	Reiichi: ['令', 'Reiichi'],
	Lawine: ['拉薇', 'Lawine'],
	Ming: ['明', 'Ming'],
	Meredith: ['梅瑞狄斯', 'Meredith'],
	Eika: ['艾卡', 'Eika'],
	Kanami: ['香奈美', '大狙', 'Kanami'],
	Fragrans: ['珐格兰丝', '花', 'Fragrans'],
	Mara: ['玛拉', 'Mara'],
	Nora: ['诺诺', '諾諾', 'Nora'],
	Audrey: ['奥黛丽', 'Audrey'],
	Celestia: ['星绘', 'Celestia'],
	Maddelena: ['玛德蕾娜', '泡泡', 'Maddelena'],
	'Bai Mo': ['白墨', '沙猫', 'Bai Mo'],
	Fuchsia: ['绯莎', 'Fuchsia'],
	Galatea: ['加拉蒂亚', '卡牌', 'Galatea'],
	Cielle: ['汐', 'Cielle']
};

const WEAK_CHARACTER_ALIASES = new Set(['信', '令', '明', '花']);
const CHARACTER_USE_CONTEXT =
	/(玩|只玩|专精|秒锁|选择|反手选择|掏出|拿出|使用|用|新版|实战|思路|教学|觉醒|一觉|二觉|三觉|全场|半场|奇点局|超弦局|排位)/;
const CHARACTER_PAIR_SEPARATORS = /(&|＆|\+|＋|和|与|\/|、|-)/;
const NON_USER_CHARACTER_CONTEXT = /(白墨信标|对面|敌方|队友|遇到|偷袭|打白墨|打令|打明)/;

const RANK_ALIASES: Array<{ rank: Rank; aliases: string[] }> = [
	{ rank: 'Singularity', aliases: ['奇点', '上奇', '奇点局', '前十'] },
	{ rank: 'Superstring', aliases: ['超弦', '超奇'] },
	{ rank: 'Quark I', aliases: ['夸克'] },
	{ rank: 'Electron I', aliases: ['电子'] },
	{ rank: 'Neutron I', aliases: ['中子'] },
	{ rank: 'Proton I', aliases: ['质子', '聚变质子'] }
];

const DEFAULT_ARGS = {
	since: OFFICIAL_CN_SEASON_STARTS[0].start,
	out: 'tmp/bilibili-vod-candidates.json',
	maxCollectionPages: '8',
	searchPages: '2',
	minDurationSeconds: '480',
	minScore: '2',
	sleepMs: '450',
	limitSeeds: '0',
	noSearch: 'false',
	includeHighlights: 'false',
	includeLowSignal: 'false'
};

function parseArgs() {
	const args = {
		...DEFAULT_ARGS,
		mids: [] as Seed[],
		players: [] as string[],
		searches: [
			'卡丘 奇点局',
			'卡拉彼丘 排位',
			'卡拉彼丘 POV',
			'卡拉彼丘 决赛 图',
			'卡拉彼丘 全场'
		] as string[]
	};
	for (let i = 2; i < process.argv.length; i++) {
		const arg = process.argv[i];
		if (arg === '--help' || arg === '-h') {
			printHelp();
			process.exit(0);
		}
		if (!arg.startsWith('--')) continue;
		const [rawKey, inlineValue] = arg.slice(2).split('=', 2);
		const value = inlineValue ?? process.argv[++i];
		if (rawKey === 'mid') {
			const [mid, ...nameParts] = value.split(':');
			args.mids.push({
				mid: Number(mid),
				player: nameParts.join(':') || `mid:${mid}`,
				source: 'cli'
			});
		} else if (rawKey === 'player') {
			args.players.push(value);
		} else if (rawKey === 'search') {
			args.searches.push(value);
		} else if (rawKey in args) {
			(args as Record<string, unknown>)[rawKey] = value;
		} else {
			throw new Error(`Unknown argument --${rawKey}`);
		}
	}
	return args;
}

function printHelp() {
	console.log(`Farm reviewable Bilibili VOD candidates from existing Lemonade DB seeds.

Usage:
  bun scripts/farm-bilibili-vods.ts [options]

Options:
  --since YYYY-MM-DD          Earliest publish date. Default: ${DEFAULT_ARGS.since}
  --out PATH                  JSON output path. Default: ${DEFAULT_ARGS.out}
  --mid MID[:name]            Add an explicit Bilibili space seed. Can repeat.
  --player NAME               Only use DB seeds with this player. Can repeat.
  --maxCollectionPages N      Max pages per Bilibili collection. Default: ${DEFAULT_ARGS.maxCollectionPages}
  --search QUERY              Add a Bilibili global-search query. Can repeat.
  --searchPages N             Search pages per query. Default: ${DEFAULT_ARGS.searchPages}
  --noSearch true             Disable default global-search queries.
  --minDurationSeconds N      Exclude short non-match videos. Default: ${DEFAULT_ARGS.minDurationSeconds}
  --minScore N                Candidate score threshold. Default: ${DEFAULT_ARGS.minScore}
  --sleepMs N                 Delay between Bilibili requests. Default: ${DEFAULT_ARGS.sleepMs}
  --limitSeeds N              Debug cap for seed count. 0 means unlimited.
  --includeHighlights true    Allow highlight/montage/PV/commentary-like videos. Default: false
  --includeLowSignal true     Include low-signal long replays/cuts more aggressively.

Notes:
  - Reads DATABASE_URL and DATABASE_AUTH_TOKEN from .env/process.env.
  - Writes candidates only; it does not insert into vod because map/character still need review.
  - Uses Bilibili collection APIs that currently work without login. Add --mid for new creators.
`);
}

function loadDotenv(path = '.env') {
	if (!existsSync(path)) return;
	const body = readFileSync(path, 'utf8');
	for (const line of body.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
		if (!match) continue;
		const [, key, raw] = match;
		if (process.env[key]) continue;
		process.env[key] = raw.replace(/^['"]|['"]$/g, '');
	}
}

function toUnix(date: string) {
	return Math.floor(new Date(`${date}T00:00:00+08:00`).getTime() / 1000);
}

function seasonForPubdate(pubdate: number) {
	let current = OFFICIAL_CN_SEASON_STARTS[0];
	for (const season of OFFICIAL_CN_SEASON_STARTS) {
		if (pubdate >= toUnix(season.start)) current = season;
	}
	return current.season;
}

function findBvid(urlOrText: string) {
	return urlOrText.match(/BV[0-9A-Za-z]{10,}/)?.[0] ?? null;
}

function normalizeBiliImage(url: string) {
	if (!url) return '';
	return url.startsWith('//') ? `https:${url}` : url.replace(/^http:\/\//, 'https://');
}

function canonicalBiliUrl(bvid: string) {
	return `https://www.bilibili.com/video/${bvid}/`;
}

function includesAny(text: string, terms: string[]) {
	return terms.some((term) => text.includes(term));
}

function inferMap(title: string): GameMap | null {
	for (const [map, aliases] of Object.entries(MAP_ALIASES) as Array<[GameMap, string[]]>) {
		if (includesAny(title, aliases)) return map;
	}
	return null;
}

type CharacterHit = {
	character: Character;
	alias: string;
	index: number;
	confidenceScore: number;
	reason: string;
};

function inferCharacters(title: string): {
	first: Character | null;
	second: Character | null;
	confidence: Candidate['characterConfidence'];
	reasons: string[];
	hits: CharacterHit[];
} {
	const hitsByCharacter = new Map<Character, CharacterHit>();
	const reasons: string[] = [];
	for (const [character, aliases] of Object.entries(CHARACTER_ALIASES) as Array<
		[Character, string[]]
	>) {
		for (const alias of aliases) {
			const index = title.indexOf(alias);
			if (index === -1) continue;
			const contextStart = Math.max(0, index - 8);
			const contextEnd = Math.min(title.length, index + alias.length + 8);
			const context = title.slice(contextStart, contextEnd);
			if (NON_USER_CHARACTER_CONTEXT.test(context)) continue;

			let confidenceScore = alias.length >= 2 || /[A-Za-z]/.test(alias) ? 2 : 1;
			const hasUseContext = CHARACTER_USE_CONTEXT.test(context);
			if (hasUseContext) confidenceScore += 2;
			if (WEAK_CHARACTER_ALIASES.has(alias) && !hasUseContext) confidenceScore -= 1;
			if (confidenceScore <= 0) continue;

			const hit: CharacterHit = {
				character,
				alias,
				index,
				confidenceScore,
				reason: `character:${character}(${alias},score=${confidenceScore},ctx=${context})`
			};
			const previous = hitsByCharacter.get(character);
			if (!previous || previous.confidenceScore < confidenceScore)
				hitsByCharacter.set(character, hit);
		}
	}
	const hits = [...hitsByCharacter.values()].sort(
		(a, b) => b.confidenceScore - a.confidenceScore || a.index - b.index
	);
	const titleHasPairSeparator =
		hits.length >= 2 &&
		CHARACTER_PAIR_SEPARATORS.test(
			title.slice(
				Math.min(hits[0].index, hits[1].index),
				Math.max(hits[0].index, hits[1].index) +
					Math.max(hits[0].alias.length, hits[1].alias.length)
			)
		);
	if (titleHasPairSeparator) {
		hits[0].confidenceScore += 1;
		hits[1].confidenceScore += 1;
		reasons.push('character-pair-separator');
		hits.sort((a, b) => b.confidenceScore - a.confidenceScore || a.index - b.index);
	}
	reasons.push(...hits.map((hit) => hit.reason));
	const first = hits[0]?.character ?? null;
	const second = hits[1]?.character ?? null;
	const topScore = hits[0]?.confidenceScore ?? 0;
	const confidence: Candidate['characterConfidence'] =
		topScore >= 4 ? 'high' : topScore >= 2 ? 'medium' : topScore > 0 ? 'low' : 'none';
	return { first, second, confidence, reasons, hits };
}

function inferRank(title: string): Rank | null {
	for (const { rank, aliases } of RANK_ALIASES) {
		if (
			rank === 'Superstring' &&
			/超弦体/.test(title) &&
			!/(超弦局|超弦击破|超弦段|超弦兄弟|超弦排位|超奇)/.test(title)
		) {
			continue;
		}
		if (includesAny(title, aliases)) return rank;
	}
	return null;
}

function inferType(title: string): VodType {
	if (/爆破|爆破模式|拆弹|demolition/i.test(title)) return 'demolition';
	if (/训练赛|约战|scrim/i.test(title)) return 'scrim';
	if (/比赛|杯|赛事|决赛|半决赛|冠军|锦标赛|tournament/i.test(title)) return 'tournament';
	return 'ranked';
}

async function requestJson(url: string, referer: string) {
	const res = await fetch(url, {
		headers: {
			'user-agent':
				'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
			referer,
			accept: 'application/json,text/plain,*/*'
		}
	});
	const text = await res.text();
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 160)}`);
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 160)}`);
	}
}

async function sleep(ms: number) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getView(bvid: string) {
	const url = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`;
	const json = await requestJson(url, canonicalBiliUrl(bvid));
	if (json.code !== 0 || !json.data)
		throw new Error(`Bilibili view failed for ${bvid}: ${json.message}`);
	return json.data;
}

async function getCollections(mid: number) {
	const url = `https://api.bilibili.com/x/polymer/web-space/home/seasons_series?mid=${mid}&page_num=1&page_size=20`;
	const json = await requestJson(url, `https://space.bilibili.com/${mid}/video`);
	if (json.code !== 0) throw new Error(`Bilibili collections failed for ${mid}: ${json.message}`);
	return (json.data?.items_lists?.seasons_list ?? []) as Array<{
		meta: { season_id: number; name: string; title: string; total: number };
		archives?: BiliArchive[];
	}>;
}

async function getCollectionArchives(
	mid: number,
	seasonId: number,
	maxPages: number,
	sleepMs: number
) {
	const archives: BiliArchive[] = [];
	const seen = new Set<string>();
	for (let page = 1; page <= maxPages; page++) {
		const url = `https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid=${mid}&season_id=${seasonId}&sort_reverse=false&page_num=${page}&page_size=30`;
		const json = await requestJson(
			url,
			`https://space.bilibili.com/${mid}/channel/collectiondetail?sid=${seasonId}`
		);
		if (json.code !== 0)
			throw new Error(`Bilibili archives failed for ${mid}/${seasonId}: ${json.message}`);
		const pageArchives = (json.data?.archives ?? []) as BiliArchive[];
		for (const archive of pageArchives) {
			if (!seen.has(archive.bvid)) {
				seen.add(archive.bvid);
				archives.push(archive);
			}
		}
		if (pageArchives.length < 30) break;
		await sleep(sleepMs);
	}
	return archives;
}

async function searchArchives(keyword: string, pages: number, sleepMs: number) {
	const archives: Array<BiliArchive & { author: string; mid: number }> = [];
	const seen = new Set<string>();
	for (let page = 1; page <= pages; page++) {
		const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&order=pubdate&page=${page}&keyword=${encodeURIComponent(
			keyword
		)}`;
		const json = await requestJson(
			url,
			`https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`
		);
		if (json.code !== 0)
			throw new Error(`Bilibili search failed for "${keyword}": ${json.message}`);
		const results = (json.data?.result ?? []) as Array<Record<string, unknown>>;
		for (const result of results) {
			const bvid = String(result.bvid ?? '');
			if (!bvid || seen.has(bvid)) continue;
			seen.add(bvid);
			archives.push({
				aid: Number(result.aid ?? 0),
				bvid,
				pubdate: Number(result.pubdate ?? 0),
				duration: parseDuration(String(result.duration ?? '')),
				pic: normalizeBiliImage(String(result.pic ?? '')),
				title: String(result.title ?? '').replace(/<[^>]+>/g, ''),
				stat: { view: Number(result.play ?? 0), danmaku: Number(result.video_review ?? 0) },
				author: String(result.author ?? ''),
				mid: Number(result.mid ?? 0)
			});
		}
		if (results.length < 20) break;
		await sleep(sleepMs);
	}
	return archives;
}

function parseDuration(raw: string) {
	if (!raw) return undefined;
	const parts = raw.split(':').map((part) => Number(part));
	if (parts.some((part) => Number.isNaN(part))) return undefined;
	return parts.reduce((acc, part) => acc * 60 + part, 0);
}

async function loadExistingVods() {
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Put it in .env.');
	const client = createClient({
		url: process.env.DATABASE_URL,
		authToken: process.env.DATABASE_AUTH_TOKEN
	});
	const res = await client.execute({
		sql: `select id, url, title, player, published_at from vod where platform = 'bilibili' order by published_at desc`,
		args: []
	});
	return res.rows as unknown as ExistingVod[];
}

async function buildSeeds(
	existing: ExistingVod[],
	cliSeeds: Seed[],
	onlyPlayers: string[],
	sleepMs: number
) {
	const seeds = new Map<number, Seed>();
	for (const seed of cliSeeds) seeds.set(seed.mid, seed);

	const playerRows = new Map<string, ExistingVod[]>();
	for (const row of existing) {
		if (onlyPlayers.length && !onlyPlayers.includes(row.player)) continue;
		if (!playerRows.has(row.player)) playerRows.set(row.player, []);
		playerRows.get(row.player)!.push(row);
	}

	for (const [player, rows] of playerRows) {
		if ([...seeds.values()].some((seed) => seed.player === player)) continue;
		const bvid = rows.map((row) => findBvid(row.url)).find(Boolean);
		if (!bvid) continue;
		try {
			const view = await getView(bvid);
			if (view.owner?.mid) {
				seeds.set(Number(view.owner.mid), {
					mid: Number(view.owner.mid),
					player: view.owner.name || player,
					source: `db:${player}:${bvid}`
				});
			}
		} catch (error) {
			console.warn(`[seed] failed to resolve ${player} ${bvid}:`, (error as Error).message);
		}
		await sleep(sleepMs);
	}
	return [...seeds.values()];
}

function scoreArchive(
	archive: BiliArchive,
	collectionName: string,
	options: { includeLowSignal: boolean; includeHighlights: boolean; minDurationSeconds: number }
) {
	const text = `${archive.title} ${collectionName}`;
	let score = 0;
	let matchEvidence = 0;
	const reasons: string[] = [];
	const hardExcludeTerm = HIGHLIGHT_OR_NON_MATCH_TERMS.find((term) => archive.title.includes(term));
	if (hardExcludeTerm && !options.includeHighlights) {
		return {
			excluded: true,
			excludeReason: `highlight-or-non-match:${hardExcludeTerm}`,
			score: -999,
			reasons: [`highlight-or-non-match:${hardExcludeTerm}`],
			map: null,
			characterFirst: null,
			characterSecond: null,
			characterConfidence: 'none' as const,
			rank: null,
			matchConfidence: 'low' as const
		};
	}
	for (const term of GAME_TITLE_TERMS) {
		if (text.includes(term)) {
			score += term.length >= 3 ? 2 : 1;
			reasons.push(`term:${term}`);
		}
	}
	for (const term of FULL_MATCH_TERMS) {
		if (archive.title.includes(term)) {
			score += term.length >= 3 ? 2 : 1;
			matchEvidence += term.length >= 3 ? 2 : 1;
			reasons.push(`match-term:${term}`);
		}
	}
	if (LOW_SIGNAL_TERMS.some((term) => archive.title.includes(term))) {
		score += options.includeLowSignal ? 1 : -1;
		reasons.push('low-signal-title');
	}
	for (const term of NEGATIVE_TERMS) {
		if (archive.title.includes(term)) {
			score -= 4;
			reasons.push(`negative:${term}`);
		}
	}
	const map = inferMap(archive.title);
	if (map) {
		score += 2;
		matchEvidence += 2;
		reasons.push(`map:${map}`);
	}
	const character = inferCharacters(archive.title);
	if (character.first) {
		score += character.confidence === 'high' ? 3 : character.confidence === 'medium' ? 2 : 1;
		matchEvidence += 1;
	}
	if (character.second) score += 1;
	reasons.push(...character.reasons);
	const rank = inferRank(archive.title);
	if (rank) {
		score += 1;
		matchEvidence += 1;
		reasons.push(`rank:${rank}`);
	}
	if (archive.duration && archive.duration < options.minDurationSeconds) {
		if (!options.includeHighlights) {
			return {
				excluded: true,
				excludeReason: `too-short:${archive.duration}<${options.minDurationSeconds}`,
				score: -999,
				reasons: [`too-short:${archive.duration}<${options.minDurationSeconds}`],
				map,
				characterFirst: character.first,
				characterSecond: character.second,
				characterConfidence: character.confidence,
				rank,
				matchConfidence: 'low' as const
			};
		}
		score -= 4;
		reasons.push(`too-short:${archive.duration}<${options.minDurationSeconds}`);
	}
	const hasEnoughDuration = !archive.duration || archive.duration >= options.minDurationSeconds;
	const matchConfidence: Candidate['matchConfidence'] =
		matchEvidence >= 5 && hasEnoughDuration ? 'high' : matchEvidence >= 2 ? 'medium' : 'low';
	const noConcreteMatchEvidence = !map && !character.first && !rank && matchEvidence < 3;
	if ((noConcreteMatchEvidence || matchConfidence === 'low') && !options.includeHighlights) {
		return {
			excluded: true,
			excludeReason: `not-enough-match-evidence:${matchEvidence}`,
			score,
			reasons: [...reasons, `not-enough-match-evidence:${matchEvidence}`],
			map,
			characterFirst: character.first,
			characterSecond: character.second,
			characterConfidence: character.confidence,
			rank,
			matchConfidence
		};
	}
	return {
		excluded: false,
		score,
		reasons,
		map,
		characterFirst: character.first,
		characterSecond: character.second,
		characterConfidence: character.confidence,
		rank,
		matchConfidence
	};
}

function makeCandidate(
	archive: BiliArchive,
	seed: Seed,
	collectionName: string,
	source: string,
	minScore: number,
	options: { includeLowSignal: boolean; includeHighlights: boolean; minDurationSeconds: number }
): Candidate | null {
	const scored = scoreArchive(archive, collectionName, options);
	if (scored.excluded) return null;
	if (scored.score < minScore) return null;
	const type = inferType(archive.title);
	const needsReview =
		!scored.map ||
		!scored.characterFirst ||
		scored.characterConfidence !== 'high' ||
		scored.matchConfidence !== 'high' ||
		scored.score < minScore + 2;
	return {
		id: randomUUID(),
		url: canonicalBiliUrl(archive.bvid),
		title: archive.title,
		thumbnail: normalizeBiliImage(archive.pic),
		platform: 'bilibili',
		player: seed.player,
		mid: seed.mid,
		aid: archive.aid,
		bvid: archive.bvid,
		server: 'CN',
		season: seasonForPubdate(archive.pubdate),
		map: scored.map,
		character_first: scored.characterFirst,
		character_second: scored.characterSecond,
		rank: scored.rank,
		type,
		publishedAt: new Date(archive.pubdate * 1000).toISOString(),
		publishedAtUnix: archive.pubdate,
		durationSeconds: archive.duration ?? null,
		viewCount: archive.stat?.view ?? null,
		score: scored.score,
		matchConfidence: scored.matchConfidence,
		characterConfidence: scored.characterConfidence,
		reasons: scored.reasons,
		needsReview,
		source
	};
}

async function main() {
	loadDotenv();
	const args = parseArgs();
	const sinceUnix = toUnix(args.since);
	const maxCollectionPages = Number(args.maxCollectionPages);
	const searchPages = Number(args.searchPages);
	const minDurationSeconds = Number(args.minDurationSeconds);
	const minScore = Number(args.minScore);
	const sleepMs = Number(args.sleepMs);
	const includeHighlights = args.includeHighlights === 'true';
	const includeLowSignal = args.includeLowSignal === 'true';
	const scoringOptions = { includeLowSignal, includeHighlights, minDurationSeconds };
	const existing = await loadExistingVods();
	const existingBvids = new Set(
		existing.map((row) => findBvid(row.url)).filter(Boolean) as string[]
	);
	const seeds = await buildSeeds(existing, args.mids, args.players, sleepMs);
	const limitedSeeds =
		Number(args.limitSeeds) > 0 ? seeds.slice(0, Number(args.limitSeeds)) : seeds;
	console.log(`[farm] existing bilibili vods=${existing.length}, seeds=${limitedSeeds.length}`);
	console.log(
		`[farm] seasons=${OFFICIAL_CN_SEASON_STARTS.map((s) => `${s.season}@${s.start}`).join(', ')}`
	);

	const candidatesByBvid = new Map<string, Candidate>();
	const errors: string[] = [];
	for (const [index, seed] of limitedSeeds.entries()) {
		console.log(`[farm] ${index + 1}/${limitedSeeds.length} ${seed.player} mid=${seed.mid}`);
		try {
			const collections = await getCollections(seed.mid);
			await sleep(sleepMs);
			for (const collection of collections) {
				const collectionName = collection.meta?.title || collection.meta?.name || '';
				const collectionText = collectionName + ' ' + (collection.meta?.name ?? '');
				const collectionLooksRelevant =
					includesAny(collectionText, GAME_TITLE_TERMS) ||
					includesAny(collectionText, Object.values(MAP_ALIASES).flat()) ||
					includesAny(collectionText, Object.values(CHARACTER_ALIASES).flat());
				if (!collectionLooksRelevant && !includeLowSignal) continue;
				let archives: BiliArchive[] = collection.archives ?? [];
				try {
					const detailedArchives = await getCollectionArchives(
						seed.mid,
						collection.meta.season_id,
						maxCollectionPages,
						sleepMs
					);
					if (detailedArchives.length) archives = detailedArchives;
				} catch (error) {
					const msg = `[farm] collection failed ${seed.player} (${seed.mid}) ${collection.meta.season_id} ${collectionName}: ${
						(error as Error).message
					}`;
					errors.push(msg);
					console.warn(msg);
					if (!archives.length) continue;
				}
				for (const archive of archives) {
					if (archive.pubdate < sinceUnix) continue;
					if (existingBvids.has(archive.bvid)) continue;
					const candidate = makeCandidate(
						archive,
						seed,
						collectionName,
						`collection:${collection.meta.season_id}:${collectionName}`,
						minScore,
						scoringOptions
					);
					if (!candidate) continue;
					const previous = candidatesByBvid.get(candidate.bvid);
					if (!previous || previous.score < candidate.score)
						candidatesByBvid.set(candidate.bvid, candidate);
				}
				await sleep(sleepMs);
			}
		} catch (error) {
			const msg = `[farm] seed failed ${seed.player} (${seed.mid}): ${(error as Error).message}`;
			errors.push(msg);
			console.warn(msg);
		}
	}

	if (args.noSearch !== 'true') {
		const uniqueSearches = [...new Set(args.searches)];
		for (const [index, keyword] of uniqueSearches.entries()) {
			console.log(`[farm] search ${index + 1}/${uniqueSearches.length} "${keyword}"`);
			try {
				const archives = await searchArchives(keyword, searchPages, sleepMs);
				for (const archive of archives) {
					if (archive.pubdate < sinceUnix) continue;
					if (existingBvids.has(archive.bvid)) continue;
					const candidate = makeCandidate(
						archive,
						{
							mid: archive.mid,
							player: archive.author || `mid:${archive.mid}`,
							source: `search:${keyword}`
						},
						'',
						`search:${keyword}`,
						minScore,
						scoringOptions
					);
					if (!candidate) continue;
					const previous = candidatesByBvid.get(candidate.bvid);
					if (!previous || previous.score < candidate.score)
						candidatesByBvid.set(candidate.bvid, candidate);
				}
			} catch (error) {
				const msg = `[farm] search failed "${keyword}": ${(error as Error).message}`;
				errors.push(msg);
				console.warn(msg);
			}
			await sleep(sleepMs);
		}
	}

	const candidates = [...candidatesByBvid.values()].sort(
		(a, b) => b.publishedAtUnix - a.publishedAtUnix
	);
	const output = {
		generatedAt: new Date().toISOString(),
		args: {
			since: args.since,
			maxCollectionPages,
			searchPages,
			minDurationSeconds,
			minScore,
			includeHighlights,
			includeLowSignal,
			seedCount: limitedSeeds.length
		},
		seasonStarts: OFFICIAL_CN_SEASON_STARTS,
		summary: {
			existingBilibiliVods: existing.length,
			candidates: candidates.length,
			needsReview: candidates.filter((candidate) => candidate.needsReview).length,
			bySeason: countBy(candidates, (candidate) => candidate.season),
			byPlayer: countBy(candidates, (candidate) => candidate.player)
		},
		errors,
		candidates
	};

	const outPath = resolve(args.out);
	mkdirSync(dirname(outPath), { recursive: true });
	writeFileSync(outPath, JSON.stringify(output, null, 2));
	console.log(`[farm] wrote ${candidates.length} candidates to ${outPath}`);
	console.log('[farm] by season:', output.summary.bySeason);
	console.log('[farm] top players:', Object.entries(output.summary.byPlayer).slice(0, 10));
	if (errors.length) console.warn(`[farm] errors=${errors.length}; see output.errors`);
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
	return items.reduce<Record<string, number>>((acc, item) => {
		const key = keyFn(item);
		acc[key] = (acc[key] ?? 0) + 1;
		return acc;
	}, {});
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
