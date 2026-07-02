#!/usr/bin/env bun
// Broad YouTube discovery for Strinova VODs.
//
// Unlike the automated subscription sync (src/lib/server/data/youtube-vod-sync.ts),
// which only follows channels we already have VODs from, this offline script
// casts a wide net via the YouTube search API to *discover new channels*, then
// writes reviewable candidates to JSON. The intended flywheel: run this to find
// fresh creators, review + insert a few of their VODs, and the subscription sync
// then keeps following those channels automatically.
//
// The search API costs 100 quota units per call, so this is a manual tool, not a
// cron job. Usage:
//   bun scripts/farm-youtube-vods.ts                 # discover, write JSON only
//   bun scripts/farm-youtube-vods.ts --insert true   # also insert candidates
//   bun scripts/farm-youtube-vods.ts -q "Strinova ace" -q "卡拉彼丘 pov"
import { createClient } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
// Single source of truth for detection heuristics, shared with the app.
import {
	detectCharactersFromTitle,
	detectMapFromTitle,
	detectVodFormatFromTitle,
	isStrinovaRelevantTitle
} from '../src/lib/data/detection';

const YT_API = 'https://www.googleapis.com/youtube/v3';

const DEFAULT_QUERIES = [
	// English
	'Strinova',
	'Strinova ranked pov',
	'Strinova gameplay',
	'Strinova tournament',
	'Strinova montage',
	'Strinova competitive',
	'Strinova Lebrun City',
	// Japanese
	'ストリノヴァ',
	'ストリノヴァ 実況',
	'ストリノヴァ ランク',
	// Chinese
	'卡拉彼丘',
	'卡拉彼丘 pov',
	'卡拉彼丘 排位',
	'卡拉彼丘 比赛',
	// Korean
	'스트리노바',
	'스트리노바 랭크',
	// Russian
	'стринова',
	// Vietnamese / Thai / Indonesian communities
	'Strinova Việt Nam',
	'Strinova ไทย',
	'Strinova Indonesia'
];

type Server = 'CN' | 'APAC' | 'NA' | 'EU';

type Candidate = {
	url: string;
	videoId: string;
	title: string;
	thumbnail: string;
	platform: 'youtube';
	player: string;
	channelId: string;
	server: Server;
	map: string | null;
	character_first: string | null;
	character_second: string | null;
	season: string | null;
	rank: string | null;
	type: string;
	format: string;
	gameVersion: string;
	durationSeconds: number;
	publishedAtUnix: number;
	matchedQueries: string[];
	needsReview: boolean;
};

type Args = {
	queries: string[];
	maxPerQuery: number;
	minDurationSeconds: number;
	includeShorts: boolean;
	insert: boolean;
	out: string;
};

function parseArgs(argv: string[]): Args {
	const args: Args = {
		queries: [],
		maxPerQuery: 25,
		minDurationSeconds: 300,
		includeShorts: false,
		insert: false,
		out: 'tmp/youtube-vod-candidates.json'
	};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		const next = () => argv[++i];
		switch (arg) {
			case '-q':
			case '--query':
				args.queries.push(next());
				break;
			case '--max':
				args.maxPerQuery = Number(next());
				break;
			case '--minDuration':
				args.minDurationSeconds = Number(next());
				break;
			case '--includeShorts':
				args.includeShorts = true;
				break;
			case '--insert':
				args.insert = next() === 'true';
				break;
			case '--out':
				args.out = next();
				break;
			default:
				console.warn(`[farm] ignoring unknown arg: ${arg}`);
		}
	}
	if (args.queries.length === 0) args.queries = DEFAULT_QUERIES;
	return args;
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

async function fetchJson(url: string) {
	const res = await fetch(url);
	const text = await res.text();
	if (!res.ok) {
		let reason = `${res.status} ${res.statusText}`;
		try {
			const parsed = JSON.parse(text);
			if (parsed?.error?.message) reason = `${res.status}: ${parsed.error.message}`;
		} catch {
			reason = `${reason}: ${text.slice(0, 160)}`;
		}
		throw new Error(reason);
	}
	return JSON.parse(text);
}

function parseIsoDuration(iso: string): number {
	const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
	if (!match) return 0;
	const [, h, m, s] = match;
	return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

function pickThumbnail(
	thumbnails: Record<string, { url?: string } | undefined> | undefined
): string {
	if (!thumbnails) return '';
	for (const key of ['maxres', 'standard', 'high', 'medium', 'default']) {
		const url = thumbnails[key]?.url;
		if (url) return url;
	}
	return '';
}

/**
 * Best-effort server guess from the title's script. YouTube Strinova content is
 * region-mixed and the API doesn't expose server, so this is a heuristic only —
 * every candidate is flagged `needsReview` for a human to confirm/correct.
 * (CN players mostly live on Bilibili, so YouTube CJK content skews APAC.)
 */
function guessServer(text: string): Server {
	if (/[Ѐ-ӿ]/.test(text)) return 'EU'; // Cyrillic
	if (/[぀-ヿ]/.test(text)) return 'APAC'; // Hiragana/Katakana (JP)
	if (/[가-힯]/.test(text)) return 'APAC'; // Hangul (KR)
	if (/[一-鿿]/.test(text)) return 'APAC'; // CJK (TW/HK on YouTube)
	if (/[฀-๿]/.test(text)) return 'APAC'; // Thai
	return 'NA'; // Latin/other: default NA (ambiguous with EU)
}

async function searchVideos(
	query: string,
	apiKey: string,
	maxResults: number,
	includeShorts: boolean
) {
	// videoDuration=medium (4-20min) cheaply excludes Shorts at the search layer.
	const durationParam = includeShorts ? '' : '&videoDuration=medium';
	const json = await fetchJson(
		`${YT_API}/search?part=snippet&type=video&order=relevance&maxResults=${Math.min(maxResults, 50)}${durationParam}&q=${encodeURIComponent(query)}&key=${apiKey}`
	);
	return (json.items ?? [])
		.map((item: { id?: { videoId?: string }; snippet?: { title?: string } }) => ({
			videoId: item.id?.videoId,
			title: item.snippet?.title
		}))
		.filter((v: { videoId?: string; title?: string }) => v.videoId && v.title) as {
		videoId: string;
		title: string;
	}[];
}

type VideoDetail = {
	videoId: string;
	title: string;
	thumbnail: string;
	channelId: string;
	channelTitle: string;
	publishedAtUnix: number;
	durationSeconds: number;
};

async function fetchVideoDetails(videoIds: string[], apiKey: string): Promise<VideoDetail[]> {
	const details: VideoDetail[] = [];
	for (let i = 0; i < videoIds.length; i += 50) {
		const batch = videoIds.slice(i, i + 50);
		const json = await fetchJson(
			`${YT_API}/videos?part=snippet,contentDetails&id=${batch.join(',')}&key=${apiKey}`
		);
		for (const item of json.items ?? []) {
			if (!item?.id || !item?.snippet) continue;
			details.push({
				videoId: item.id,
				title: item.snippet.title ?? '',
				thumbnail: pickThumbnail(item.snippet.thumbnails),
				channelId: item.snippet.channelId ?? '',
				channelTitle: item.snippet.channelTitle ?? '',
				publishedAtUnix: item.snippet.publishedAt
					? Math.floor(new Date(item.snippet.publishedAt).getTime() / 1000)
					: 0,
				durationSeconds: parseIsoDuration(item.contentDetails?.duration ?? '')
			});
		}
	}
	return details;
}

async function loadExistingUrls(): Promise<Set<string>> {
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Put it in .env.');
	const client = createClient({
		url: process.env.DATABASE_URL,
		authToken: process.env.DATABASE_AUTH_TOKEN
	});
	const res = await client.execute({ sql: 'select url from vod', args: [] });
	return new Set(res.rows.map((row) => String(row.url)));
}

async function insertCandidates(candidates: Candidate[]) {
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Put it in .env.');
	const client = createClient({
		url: process.env.DATABASE_URL,
		authToken: process.env.DATABASE_AUTH_TOKEN
	});
	let inserted = 0;
	let skippedExisting = 0;
	let failed = 0;
	for (const candidate of candidates) {
		const existing = await client.execute({
			sql: 'select id from vod where url = ? limit 1',
			args: [candidate.url]
		});
		if (existing.rows.length) {
			skippedExisting++;
			continue;
		}
		try {
			const now = Math.floor(Date.now() / 1000);
			await client.execute({
				sql: `insert into vod (
					id, url, title, thumbnail, platform, player, server, map,
					character_first, character_second, season, rank, type, format, game_version, published_at,
					created_at, updated_at
				) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				args: [
					randomUUID(),
					candidate.url,
					candidate.title,
					candidate.thumbnail,
					candidate.platform,
					candidate.player || 'Unknown',
					candidate.server,
					candidate.map,
					candidate.character_first,
					candidate.character_second,
					candidate.season,
					candidate.rank,
					candidate.type,
					candidate.format,
					candidate.gameVersion,
					candidate.publishedAtUnix || null,
					now,
					now
				]
			});
			inserted++;
		} catch (error) {
			failed++;
			console.warn(`[farm] insert failed ${candidate.url}:`, (error as Error).message);
		}
	}
	return { inserted, skippedExisting, failed };
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
	return items.reduce<Record<string, number>>((acc, item) => {
		const key = keyFn(item);
		acc[key] = (acc[key] ?? 0) + 1;
		return acc;
	}, {});
}

async function main() {
	loadDotenv();
	const apiKey = process.env.GOOGLE_API_KEY;
	if (!apiKey) throw new Error('GOOGLE_API_KEY is missing. Put it in .env.');
	const args = parseArgs(process.argv.slice(2));

	const existingUrls = await loadExistingUrls();
	const errors: { query?: string; reason: string }[] = [];

	// 1. Search: gather unique candidate video ids + which queries matched each.
	const queriesByVideo = new Map<string, Set<string>>();
	const titleByVideo = new Map<string, string>();
	for (const query of args.queries) {
		try {
			const hits = await searchVideos(query, apiKey, args.maxPerQuery, args.includeShorts);
			for (const hit of hits) {
				titleByVideo.set(hit.videoId, hit.title);
				if (!queriesByVideo.has(hit.videoId)) queriesByVideo.set(hit.videoId, new Set());
				queriesByVideo.get(hit.videoId)!.add(query);
			}
			console.log(`[farm] q="${query}": ${hits.length} hits`);
		} catch (error) {
			errors.push({ query, reason: (error as Error).message });
			console.warn(`[farm] q="${query}" failed:`, (error as Error).message);
		}
	}

	// 2. Relevance-gate on title, and drop videos already in the DB.
	const toDetail: string[] = [];
	let skippedIrrelevant = 0;
	let skippedExisting = 0;
	for (const [videoId, title] of titleByVideo) {
		if (existingUrls.has(`https://www.youtube.com/watch?v=${videoId}`)) {
			skippedExisting++;
			continue;
		}
		if (!isStrinovaRelevantTitle(title)) {
			skippedIrrelevant++;
			continue;
		}
		toDetail.push(videoId);
	}

	// 3. Fetch durations/metadata, then build classified candidates.
	const details = await fetchVideoDetails(toDetail, apiKey);
	const candidates: Candidate[] = [];
	let skippedShort = 0;
	for (const video of details) {
		if (
			!args.includeShorts &&
			video.durationSeconds &&
			video.durationSeconds < args.minDurationSeconds
		) {
			skippedShort++;
			continue;
		}
		const format = detectVodFormatFromTitle(video.title);
		const characterRelevant = format === 'player_pov' || format === 'pov_review';
		const characters = characterRelevant
			? detectCharactersFromTitle(video.title)
			: { first: null, second: null };
		candidates.push({
			url: `https://www.youtube.com/watch?v=${video.videoId}`,
			videoId: video.videoId,
			title: video.title,
			thumbnail: video.thumbnail,
			platform: 'youtube',
			player: video.channelTitle,
			channelId: video.channelId,
			server: guessServer(video.title),
			map: detectMapFromTitle(video.title),
			character_first: characters.first,
			character_second: characters.second,
			season: null, // Global (G-series) seasons aren't in our CN-only boundaries.
			rank: null,
			type: 'ranked',
			format,
			gameVersion: 'pc',
			durationSeconds: video.durationSeconds,
			publishedAtUnix: video.publishedAtUnix,
			matchedQueries: [...(queriesByVideo.get(video.videoId) ?? [])],
			needsReview: true
		});
	}
	candidates.sort((a, b) => b.publishedAtUnix - a.publishedAtUnix);

	// 4. Channel discovery summary — the "expand from there" payload.
	const byChannel = new Map<
		string,
		{ player: string; count: number; server: Server; sample: string }
	>();
	for (const candidate of candidates) {
		const entry = byChannel.get(candidate.channelId) ?? {
			player: candidate.player,
			count: 0,
			server: candidate.server,
			sample: candidate.title
		};
		entry.count++;
		byChannel.set(candidate.channelId, entry);
	}
	const channels = [...byChannel.entries()]
		.map(([channelId, info]) => ({ channelId, ...info }))
		.sort((a, b) => b.count - a.count);

	const output = {
		generatedAt: new Date().toISOString(),
		args: {
			queries: args.queries,
			maxPerQuery: args.maxPerQuery,
			minDurationSeconds: args.minDurationSeconds,
			includeShorts: args.includeShorts
		},
		summary: {
			searched: titleByVideo.size,
			skippedExisting,
			skippedIrrelevant,
			skippedShort,
			candidates: candidates.length,
			distinctChannels: channels.length,
			byServer: countBy(candidates, (c) => c.server),
			byFormat: countBy(candidates, (c) => c.format)
		},
		channels,
		errors,
		candidates
	};

	const outPath = resolve(args.out);
	mkdirSync(dirname(outPath), { recursive: true });
	writeFileSync(outPath, JSON.stringify(output, null, 2));
	console.log(
		`[farm] ${candidates.length} candidates across ${channels.length} channels → ${outPath}`
	);
	console.log('[farm] by server:', output.summary.byServer);
	console.log('[farm] top channels:');
	for (const channel of channels.slice(0, 15)) {
		console.log(
			`  ${channel.count}x  ${channel.player} (${channel.server})  ${channel.sample.slice(0, 54)}`
		);
	}
	if (errors.length) console.warn(`[farm] ${errors.length} query errors; see output.errors`);
	console.log(
		'[farm] NOTE: server is a language-based guess — review before trusting. Rows are marked needsReview.'
	);

	if (args.insert) {
		const result = await insertCandidates(candidates);
		console.log('[farm] insert result:', result);
	}
}

main().catch((error) => {
	console.error('[farm] fatal:', error);
	process.exit(1);
});
