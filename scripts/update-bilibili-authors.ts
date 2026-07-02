#!/usr/bin/env bun
// Author-based Bilibili update: sweep the *existing* Bilibili uploaders in the
// library and pull in their new Strinova videos.
//
// Unlike bilibili-vod-sync.ts (which follows two hardcoded season collections),
// this lists each author's full upload feed via the space arc/search API, so it
// catches standalone POVs that aren't organised into a collection (e.g. 北原滴西's
// 【滴西の幽默实况】 series). That API is wbi-signed and login-gated, so it needs
// BILIBILI_COOKIE (a logged-in cookie incl. SESSDATA) in .env.
//
// Usage:
//   bun scripts/update-bilibili-authors.ts                    # discover, write JSON only
//   bun scripts/update-bilibili-authors.ts --insert true      # also insert
//   bun scripts/update-bilibili-authors.ts --author 北原滴西    # limit to one author
import { createClient } from '@libsql/client';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
	detectCharactersFromTitle,
	detectGameVersionFromTitle,
	detectMapFromTitle,
	detectSeasonForUnix,
	detectVodFormatFromTitle,
	isStrinovaRelevantTitle,
	shouldAutoDetectSeason
} from '../src/lib/data/detection';

const UA =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

// Titles that clearly belong to another game — excluded even for a Strinova author.
// The second group is games these specific uploaders also stream (found via the
// no-Strinova-signal review): Forts, Escape from Tarkov (塔科夫), 枪神纪, 异环, plus
// gacha/horror markers.
const OTHER_GAME =
	/(无畏契约|瓦罗兰特|valorant|永劫无间|三角洲行动|命运方舟|绝地求生|apex|csgo|cs2|守望先锋|overwatch|英雄联盟|league of legends|原神|genshin|forts|塔科夫|tarkov|枪神纪|异环|恐怖游戏|多少抽|抽能出|抽干)/i;

type Args = {
	authors: string[];
	pages: number;
	minDurationSeconds: number;
	insert: boolean;
	out: string;
};

function parseArgs(argv: string[]): Args {
	const args: Args = {
		authors: [],
		pages: 1,
		minDurationSeconds: 300,
		insert: false,
		out: 'tmp/bilibili-author-candidates.json'
	};
	for (let i = 0; i < argv.length; i++) {
		const next = () => argv[++i];
		switch (argv[i]) {
			case '--author':
				args.authors.push(next());
				break;
			case '--pages':
				args.pages = Number(next());
				break;
			case '--minDuration':
				args.minDurationSeconds = Number(next());
				break;
			case '--insert':
				args.insert = next() === 'true';
				break;
			case '--out':
				args.out = next();
				break;
			default:
				console.warn(`[authors] ignoring unknown arg: ${argv[i]}`);
		}
	}
	return args;
}

function loadDotenv(path = '.env') {
	if (!existsSync(path)) return;
	for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
		if (!match) continue;
		if (process.env[match[1]]) continue;
		process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
	}
}

function biliHeaders(mid: number) {
	return {
		'user-agent': UA,
		cookie: process.env.BILIBILI_COOKIE ?? '',
		referer: `https://space.bilibili.com/${mid}/video`,
		accept: 'application/json, text/plain, */*'
	};
}

// --- wbi signing ---------------------------------------------------------
const MIXIN_TAB = [
	46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28,
	14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54,
	21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52
];
const md5 = (s: string) => createHash('md5').update(s).digest('hex');

async function getMixinKey(): Promise<string> {
	const nav = await (
		await fetch('https://api.bilibili.com/x/web-interface/nav', { headers: biliHeaders(0) })
	).json();
	if (!nav.data?.isLogin) {
		console.warn(
			'[authors] WARNING: cookie is not logged in — arc/search will be risk-controlled.'
		);
	}
	const key = (url: string) => url.split('/').pop()!.split('.')[0];
	const raw = key(nav.data.wbi_img.img_url) + key(nav.data.wbi_img.sub_url);
	return MIXIN_TAB.map((i) => raw[i])
		.join('')
		.slice(0, 32);
}

function signWbi(params: Record<string, string | number>, mixinKey: string): string {
	params.wts = Math.floor(Date.now() / 1000);
	const query = Object.keys(params)
		.sort()
		.map(
			(k) =>
				`${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]).replace(/[!'()*]/g, ''))}`
		)
		.join('&');
	return `${query}&w_rid=${md5(query + mixinKey)}`;
}

// --- Bilibili calls -------------------------------------------------------
async function getOwnerMid(bvid: string): Promise<number | null> {
	const json = await (
		await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
			headers: biliHeaders(0)
		})
	).json();
	return json.data?.owner?.mid ?? null;
}

type BiliUpload = {
	bvid: string;
	title: string;
	created: number;
	durationSeconds: number;
	pic: string;
};

function parseLength(raw: string): number {
	const parts = String(raw).split(':').map(Number);
	if (parts.some(Number.isNaN)) return 0;
	return parts.reduce((acc, p) => acc * 60 + p, 0);
}

async function fetchAuthorUploads(
	mid: number,
	mixinKey: string,
	pages: number
): Promise<BiliUpload[]> {
	const uploads: BiliUpload[] = [];
	for (let pn = 1; pn <= pages; pn++) {
		const qs = signWbi(
			{ mid, pn, ps: 30, order: 'pubdate', platform: 'web', web_location: '1550101' },
			mixinKey
		);
		const res = await fetch(`https://api.bilibili.com/x/space/wbi/arc/search?${qs}`, {
			headers: biliHeaders(mid)
		});
		const json = await res.json();
		if (json.code !== 0) throw new Error(`arc/search code ${json.code}: ${json.message}`);
		const vlist = json.data?.list?.vlist ?? [];
		for (const v of vlist) {
			uploads.push({
				bvid: v.bvid,
				title: v.title,
				created: v.created,
				durationSeconds: parseLength(v.length),
				pic: v.pic
			});
		}
		if (vlist.length < 30) break;
		await new Promise((r) => setTimeout(r, 400)); // be gentle
	}
	return uploads;
}

type Candidate = {
	url: string;
	bvid: string;
	title: string;
	thumbnail: string;
	platform: 'bilibili';
	player: string;
	mid: number;
	server: string;
	map: string | null;
	character_first: string | null;
	character_second: string | null;
	season: string | null;
	type: string;
	format: string;
	gameVersion: string;
	durationSeconds: number;
	publishedAtUnix: number;
	strinovaSignal: boolean;
};

function normalizeBiliImage(url: string): string {
	if (!url) return '';
	return url.startsWith('//') ? `https:${url}` : url.replace(/^http:\/\//, 'https://');
}
const canonicalUrl = (bvid: string) => `https://www.bilibili.com/video/${bvid}/`;

function dominant<T>(values: T[], fallback: T): T {
	if (!values.length) return fallback;
	const counts = new Map<T, number>();
	for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
	return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
	return items.reduce<Record<string, number>>((acc, item) => {
		const k = keyFn(item);
		acc[k] = (acc[k] ?? 0) + 1;
		return acc;
	}, {});
}

async function main() {
	loadDotenv();
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Put it in .env.');
	if (!process.env.BILIBILI_COOKIE) throw new Error('BILIBILI_COOKIE is missing. Put it in .env.');
	const args = parseArgs(process.argv.slice(2));
	const client = createClient({
		url: process.env.DATABASE_URL,
		authToken: process.env.DATABASE_AUTH_TOKEN
	});

	// Existing Bilibili rows → per-author representative bvid, server, type; and a global URL set for dedup.
	const rows = (
		await client.execute("select url, player, server, type from vod where platform = 'bilibili'")
	).rows as unknown as { url: string; player: string; server: string; type: string }[];
	const existingUrls = new Set(
		(await client.execute('select url from vod')).rows.map((r) => String(r.url))
	);

	type Author = { player: string; bvid: string; servers: string[]; types: string[] };
	const byAuthor = new Map<string, Author>();
	for (const row of rows) {
		if (!row.player) continue;
		if (args.authors.length && !args.authors.includes(row.player)) continue;
		const bvid = String(row.url).match(/BV[0-9A-Za-z]+/)?.[0];
		if (!bvid) continue;
		let a = byAuthor.get(row.player);
		if (!a) {
			a = { player: row.player, bvid, servers: [], types: [] };
			byAuthor.set(row.player, a);
		}
		if (row.server) a.servers.push(row.server);
		if (row.type) a.types.push(row.type);
	}
	console.log(`[authors] sweeping ${byAuthor.size} author(s), ${args.pages} page(s) each`);

	const mixinKey = await getMixinKey();
	const candidates: Candidate[] = [];
	const errors: { author: string; reason: string }[] = [];

	for (const author of byAuthor.values()) {
		try {
			const mid = await getOwnerMid(author.bvid);
			if (!mid) throw new Error('could not resolve mid');
			const server = dominant(author.servers, 'CN');
			const type = dominant(author.types, 'ranked');
			const uploads = await fetchAuthorUploads(mid, mixinKey, args.pages);
			let fresh = 0;
			for (const up of uploads) {
				const url = canonicalUrl(up.bvid);
				if (existingUrls.has(url)) continue;
				if (up.durationSeconds && up.durationSeconds < args.minDurationSeconds) continue;
				if (OTHER_GAME.test(up.title)) continue;
				const gameVersion = detectGameVersionFromTitle(up.title);
				const format = detectVodFormatFromTitle(up.title);
				const characterRelevant = format === 'player_pov' || format === 'pov_review';
				const characters = characterRelevant
					? detectCharactersFromTitle(up.title)
					: { first: null, second: null };
				const season = shouldAutoDetectSeason({ gameVersion, format })
					? detectSeasonForUnix(up.created)
					: undefined;
				candidates.push({
					url,
					bvid: up.bvid,
					title: up.title,
					thumbnail: normalizeBiliImage(up.pic),
					platform: 'bilibili',
					player: author.player,
					mid,
					server,
					map: detectMapFromTitle(up.title),
					character_first: characters.first,
					character_second: characters.second,
					season: season ?? null,
					type,
					format,
					gameVersion,
					durationSeconds: up.durationSeconds,
					publishedAtUnix: up.created,
					strinovaSignal: isStrinovaRelevantTitle(up.title)
				});
				existingUrls.add(url);
				fresh++;
			}
			console.log(
				`  ${author.player.padEnd(16)} mid=${mid}  ${uploads.length} uploads → ${fresh} new`
			);
		} catch (error) {
			errors.push({ author: author.player, reason: (error as Error).message });
			console.warn(`  ${author.player}: ${(error as Error).message}`);
		}
	}

	candidates.sort((a, b) => b.publishedAtUnix - a.publishedAtUnix);
	const noSignal = candidates.filter((c) => !c.strinovaSignal);
	const output = {
		generatedAt: new Date().toISOString(),
		args,
		summary: {
			authors: byAuthor.size,
			candidates: candidates.length,
			withStrinovaSignal: candidates.length - noSignal.length,
			withoutSignal: noSignal.length,
			byFormat: countBy(candidates, (c) => c.format),
			byPlayer: countBy(candidates, (c) => c.player)
		},
		errors,
		candidates
	};
	const outPath = resolve(args.out);
	mkdirSync(dirname(outPath), { recursive: true });
	writeFileSync(outPath, JSON.stringify(output, null, 2));
	console.log(`\n[authors] ${candidates.length} new candidates → ${outPath}`);
	console.log('[authors] by format:', output.summary.byFormat);
	console.log('[authors] by player:', output.summary.byPlayer);
	if (noSignal.length) {
		console.log(`\n[authors] ${noSignal.length} have no explicit Strinova keyword (verify these):`);
		for (const c of noSignal.slice(0, 20)) console.log(`   ${c.player}: ${c.title.slice(0, 50)}`);
	}
	if (errors.length) console.warn(`[authors] ${errors.length} errors; see output.errors`);

	if (args.insert) {
		let inserted = 0;
		let failed = 0;
		for (const c of candidates) {
			const exists = await client.execute({
				sql: 'select id from vod where url = ? limit 1',
				args: [c.url]
			});
			if (exists.rows.length) continue;
			try {
				const now = Math.floor(Date.now() / 1000);
				await client.execute({
					sql: `insert into vod (id, url, title, thumbnail, platform, player, server, map, character_first, character_second, season, rank, type, format, game_version, published_at, created_at, updated_at)
						values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					args: [
						randomUUID(),
						c.url,
						c.title,
						c.thumbnail,
						'bilibili',
						c.player,
						c.server,
						c.map,
						c.character_first,
						c.character_second,
						c.season,
						null,
						c.type,
						c.format,
						c.gameVersion,
						c.publishedAtUnix,
						now,
						now
					]
				});
				inserted++;
			} catch (error) {
				failed++;
				console.warn(`[authors] insert failed ${c.url}:`, (error as Error).message);
			}
		}
		console.log(`\n[authors] INSERT: inserted=${inserted} failed=${failed}`);
	}
}

main().catch((error) => {
	console.error('[authors] fatal:', error);
	process.exit(1);
});
