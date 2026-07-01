import { addVODs, getExistingVodUrls } from '$lib/server/data/vods';
import type { NewVod } from '$lib/server/db/schemas/vod';
import {
	detectCharactersFromTitle,
	detectMapFromTitle,
	detectSeasonForUnix,
	detectGameVersionFromTitle,
	detectVodFormatFromTitle,
	shouldAutoDetectSeason
} from '$lib/data/detection';
import type { Server } from '$lib/data/game';
import type { GameVersion, VodFormat, VodType } from '$lib/data/vod';
import { randomUUID } from 'node:crypto';

export type BilibiliVodSubscription = {
	id: string;
	name: string;
	mid: number;
	seasonId: number;
	url: string;
	player: string;
	server: Server;
	type: VodType;
	format?: VodFormat;
	gameVersion?: GameVersion;
	since?: string;
	minDurationSeconds?: number;
};

export const BILIBILI_VOD_SUBSCRIPTIONS: BilibiliVodSubscription[] = [
	{
		id: 'xiaoyao-sama-quality-pov',
		name: '逍遥Samaノ · 卡丘质量对局实战pov',
		mid: 485937243,
		seasonId: 5167146,
		url: 'https://space.bilibili.com/485937243/lists/5167146?type=season',
		player: '逍遥Samaノ',
		server: 'CN',
		type: 'ranked',
		format: 'player_pov',
		gameVersion: 'pc',
		since: '2025-08-26',
		minDurationSeconds: 480
	},
	{
		id: 'xiaoyao-sama-tournament-pov',
		name: '逍遥Samaノ · 卡拉彼丘比赛pov',
		mid: 485937243,
		seasonId: 5167160,
		url: 'https://space.bilibili.com/485937243/lists/5167160?type=season',
		player: '逍遥Samaノ',
		server: 'CN',
		type: 'tournament',
		format: 'player_pov',
		gameVersion: 'pc'
	}
];

type BilibiliArchive = {
	aid: number;
	bvid: string;
	pubdate: number;
	duration?: number;
	pic: string;
	title: string;
	stat?: { view?: number; danmaku?: number };
};

type SyncOptions = {
	maxPages?: number;
	cookie?: string;
	dryRun?: boolean;
};

type SyncSubscriptionResult = {
	subscriptionId: string;
	name: string;
	fetched: number;
	candidates: number;
	inserted: number;
	skippedExisting: number;
	skippedShort: number;
	failed: { bvid?: string; reason: string }[];
};

function canonicalBiliUrl(bvid: string) {
	return `https://www.bilibili.com/video/${bvid}/`;
}

function normalizeBiliImage(url: string) {
	if (!url) return '';
	return url.startsWith('//') ? `https:${url}` : url.replace(/^http:\/\//, 'https://');
}

function toCnUnix(date: string): number {
	return Math.floor(new Date(`${date}T00:00:00+08:00`).getTime() / 1000);
}

async function requestJson(url: string, referer: string, cookie?: string) {
	const headers: Record<string, string> = {
		'user-agent':
			'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
		referer,
		accept: 'application/json,text/plain,*/*'
	};
	if (cookie) headers.cookie = cookie;
	const res = await fetch(url, { headers });
	const text = await res.text();
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 160)}`);
	const json = JSON.parse(text);
	if (json.code !== 0) throw new Error(`Bilibili API ${json.code}: ${json.message}`);
	return json;
}

async function fetchSubscriptionArchives(
	subscription: BilibiliVodSubscription,
	options: SyncOptions
) {
	const archives: BilibiliArchive[] = [];
	const seen = new Set<string>();
	const maxPages = options.maxPages ?? 3;
	for (let page = 1; page <= maxPages; page++) {
		const url = `https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid=${subscription.mid}&season_id=${subscription.seasonId}&sort_reverse=true&page_num=${page}&page_size=30`;
		const json = await requestJson(url, subscription.url, options.cookie);
		const pageArchives = (json.data?.archives ?? []) as BilibiliArchive[];
		for (const archive of pageArchives) {
			if (!archive.bvid || seen.has(archive.bvid)) continue;
			seen.add(archive.bvid);
			archives.push(archive);
		}
		if (pageArchives.length < 30) break;
	}
	return archives;
}

export async function syncBilibiliVodSubscriptions(options: SyncOptions = {}) {
	const existingUrls = await getExistingVodUrls();
	const results: SyncSubscriptionResult[] = [];
	let totalInserted = 0;

	for (const subscription of BILIBILI_VOD_SUBSCRIPTIONS) {
		const result: SyncSubscriptionResult = {
			subscriptionId: subscription.id,
			name: subscription.name,
			fetched: 0,
			candidates: 0,
			inserted: 0,
			skippedExisting: 0,
			skippedShort: 0,
			failed: []
		};
		try {
			const archives = await fetchSubscriptionArchives(subscription, options);
			result.fetched = archives.length;
			const rows: NewVod[] = [];
			for (const archive of archives) {
				const url = canonicalBiliUrl(archive.bvid);
				if (subscription.since && archive.pubdate < toCnUnix(subscription.since)) continue;
				if (existingUrls.has(url)) {
					result.skippedExisting++;
					continue;
				}
				if (
					subscription.minDurationSeconds &&
					archive.duration &&
					archive.duration < subscription.minDurationSeconds
				) {
					result.skippedShort++;
					continue;
				}
				const gameVersion = subscription.gameVersion ?? detectGameVersionFromTitle(archive.title);
				const format = subscription.format ?? detectVodFormatFromTitle(archive.title);
				const map = detectMapFromTitle(archive.title);
				const characterRelevant = format === 'player_pov' || format === 'pov_review';
				const characters = characterRelevant
					? detectCharactersFromTitle(archive.title)
					: { first: null, second: null };
				const season = shouldAutoDetectSeason({ gameVersion, format })
					? detectSeasonForUnix(archive.pubdate)
					: undefined;
				rows.push({
					id: randomUUID(),
					url,
					title: archive.title,
					thumbnail: normalizeBiliImage(archive.pic),
					platform: 'bilibili',
					player: subscription.player,
					server: subscription.server,
					map: map ?? undefined,
					character_first: characters.first ?? undefined,
					character_second: characters.second ?? undefined,
					season,
					rank: undefined,
					type: subscription.type,
					format,
					gameVersion,
					publishedAt: new Date(archive.pubdate * 1000)
				});
				existingUrls.add(url);
			}
			result.candidates = rows.length;
			if (!options.dryRun && rows.length) {
				await addVODs(rows);
			}
			result.inserted = options.dryRun ? 0 : rows.length;
			totalInserted += result.inserted;
		} catch (error) {
			result.failed.push({ reason: (error as Error).message });
		}
		results.push(result);
	}

	return {
		ok: results.every((result) => result.failed.length === 0),
		dryRun: Boolean(options.dryRun),
		totalInserted,
		results
	};
}
