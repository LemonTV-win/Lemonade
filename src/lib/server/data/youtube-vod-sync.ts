import { addVODs, getExistingVodUrls } from '$lib/server/data/vods';
import { db } from '$lib/server/db';
import { vod } from '$lib/server/db/schemas/vod';
import type { NewVod } from '$lib/server/db/schemas/vod';
import {
	detectCharactersFromTitle,
	detectMapFromTitle,
	detectVodFormatFromTitle,
	isStrinovaRelevantTitle
} from '$lib/data/detection';
import type { Server } from '$lib/data/game';
import type { VodFormat, VodType } from '$lib/data/vod';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

const YT_API = 'https://www.googleapis.com/youtube/v3';

/**
 * Channels whose uploads are predominantly one format the title detector can't
 * infer — e.g. montage channels whose titles read like ranked POVs. The override
 * replaces the per-title format guess for every upload from that channel.
 */
const CHANNEL_FORMAT_OVERRIDES: Record<string, VodFormat> = {
	UCYxBNIG_RMJxyNr_uhcJocA: 'highlight' // TammGG — mostly montages
};

/**
 * A channel to follow, derived at runtime from the YouTube VODs already in the
 * database (rather than a hardcoded list): each existing uploader becomes a
 * seed, and we ingest their new Strinova uploads. The player name and server
 * are carried over from the existing rows so we stay consistent per channel.
 */
export type YoutubeSeedChannel = {
	channelId: string;
	uploadsPlaylistId: string;
	player: string;
	server: Server;
	type: VodType;
};

type YoutubeUpload = {
	videoId: string;
	title: string;
	thumbnail: string;
	publishedAt: number; // unix seconds
	durationSeconds: number;
};

type SyncOptions = {
	apiKey?: string;
	dryRun?: boolean;
	/** How many recent uploads to inspect per channel (newest first). */
	maxVideosPerChannel?: number;
	/** Videos shorter than this are treated as clips/shorts and skipped. */
	minDurationSeconds?: number;
};

type SyncChannelResult = {
	channelId: string;
	player: string;
	server: Server;
	fetched: number;
	candidates: number;
	inserted: number;
	skippedExisting: number;
	skippedIrrelevant: number;
	skippedShort: number;
	failed: { videoId?: string; reason: string }[];
};

function youtubeVideoUrl(videoId: string): string {
	return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Extract the 11-char video id from a watch?v= or youtu.be URL. */
function extractYoutubeId(url: string): string | null {
	const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
	return match ? match[1] : null;
}

/** Parse an ISO 8601 duration (e.g. `PT1H2M3S`) into seconds. */
function parseIsoDuration(iso: string): number {
	const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
	if (!match) return 0;
	const [, h, m, s] = match;
	return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

type YoutubeThumbnails = Record<string, { url?: string } | undefined>;

/** Pick the highest-resolution thumbnail available. */
function pickThumbnail(thumbnails: YoutubeThumbnails | undefined): string {
	if (!thumbnails) return '';
	for (const key of ['maxres', 'standard', 'high', 'medium', 'default']) {
		const url = thumbnails[key]?.url;
		if (url) return url;
	}
	return '';
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

/** Most frequently occurring value in a list (first-seen wins ties). */
function dominant<T>(values: T[]): T {
	const counts = new Map<T, number>();
	for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
	let best = values[0];
	let bestCount = 0;
	for (const [value, count] of counts) {
		if (count > bestCount) {
			best = value;
			bestCount = count;
		}
	}
	return best;
}

/**
 * Build the seed channel list from the YouTube VODs already in the database.
 * Groups existing rows by uploader, resolves each to a channel id via a single
 * batched videos.list call, and carries the dominant server/type per channel.
 */
async function deriveSeedChannels(apiKey: string): Promise<YoutubeSeedChannel[]> {
	const rows = await db.query.vod.findMany({
		columns: { url: true, player: true, server: true, type: true },
		where: eq(vod.platform, 'youtube')
	});

	type Group = { videoId: string; servers: Server[]; types: VodType[] };
	const byPlayer = new Map<string, Group>();
	for (const row of rows) {
		if (!row.player) continue;
		const videoId = extractYoutubeId(row.url);
		if (!videoId) continue;
		let group = byPlayer.get(row.player);
		if (!group) {
			group = { videoId, servers: [], types: [] };
			byPlayer.set(row.player, group);
		}
		if (row.server) group.servers.push(row.server as Server);
		if (row.type) group.types.push(row.type as VodType);
	}
	if (byPlayer.size === 0) return [];

	// Resolve every representative video id to its channel id in one request.
	const players = [...byPlayer.keys()];
	const ids = players.map((player) => byPlayer.get(player)!.videoId);
	const json = await fetchJson(`${YT_API}/videos?part=snippet&id=${ids.join(',')}&key=${apiKey}`);
	const channelByVideo = new Map<string, string>();
	for (const item of json.items ?? []) {
		if (item?.id && item?.snippet?.channelId) channelByVideo.set(item.id, item.snippet.channelId);
	}

	const seeds: YoutubeSeedChannel[] = [];
	const seenChannels = new Set<string>();
	for (const player of players) {
		const group = byPlayer.get(player)!;
		const channelId = channelByVideo.get(group.videoId);
		if (!channelId || seenChannels.has(channelId)) continue;
		seenChannels.add(channelId);
		seeds.push({
			channelId,
			// A channel's uploads playlist is its id with the `UC` prefix swapped for `UU`.
			uploadsPlaylistId: `UU${channelId.slice(2)}`,
			player,
			server: group.servers.length ? dominant(group.servers) : 'APAC',
			type: group.types.length ? dominant(group.types) : 'ranked'
		});
	}
	return seeds;
}

/** List a channel's most recent uploads (title + publish time), newest first. */
async function fetchChannelUploads(
	uploadsPlaylistId: string,
	apiKey: string,
	maxVideos: number
): Promise<{ videoId: string; title: string }[]> {
	const uploads: { videoId: string; title: string }[] = [];
	let pageToken = '';
	while (uploads.length < maxVideos) {
		const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
		const json = await fetchJson(
			`${YT_API}/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsPlaylistId}&key=${apiKey}${pageParam}`
		);
		const items = json.items ?? [];
		for (const item of items) {
			const videoId = item?.snippet?.resourceId?.videoId;
			const title = item?.snippet?.title;
			if (!videoId || !title || title === 'Private video' || title === 'Deleted video') continue;
			uploads.push({ videoId, title });
		}
		if (!json.nextPageToken || items.length < 50) break;
		pageToken = json.nextPageToken;
	}
	return uploads.slice(0, maxVideos);
}

/** Fetch duration + snippet detail for up to 50 video ids in one request. */
async function fetchVideoDetails(videoIds: string[], apiKey: string): Promise<YoutubeUpload[]> {
	if (videoIds.length === 0) return [];
	const json = await fetchJson(
		`${YT_API}/videos?part=snippet,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`
	);
	const details: YoutubeUpload[] = [];
	for (const item of json.items ?? []) {
		if (!item?.id || !item?.snippet) continue;
		const publishedAt = item.snippet.publishedAt
			? Math.floor(new Date(item.snippet.publishedAt).getTime() / 1000)
			: 0;
		details.push({
			videoId: item.id,
			title: item.snippet.title ?? '',
			thumbnail: pickThumbnail(item.snippet.thumbnails),
			publishedAt,
			durationSeconds: parseIsoDuration(item.contentDetails?.duration ?? '')
		});
	}
	return details;
}

export async function syncYoutubeVodSubscriptions(options: SyncOptions = {}) {
	const apiKey = options.apiKey;
	if (!apiKey) {
		return {
			ok: false,
			dryRun: Boolean(options.dryRun),
			totalInserted: 0,
			seeds: 0,
			results: [] as SyncChannelResult[],
			error: 'Missing GOOGLE_API_KEY'
		};
	}

	const maxVideos = options.maxVideosPerChannel ?? 50;
	const minDuration = options.minDurationSeconds ?? 300;

	let seeds: YoutubeSeedChannel[];
	try {
		seeds = await deriveSeedChannels(apiKey);
	} catch (error) {
		return {
			ok: false,
			dryRun: Boolean(options.dryRun),
			totalInserted: 0,
			seeds: 0,
			results: [] as SyncChannelResult[],
			error: `Failed to derive seed channels: ${(error as Error).message}`
		};
	}

	const existingUrls = await getExistingVodUrls();
	const results: SyncChannelResult[] = [];
	let totalInserted = 0;

	for (const seed of seeds) {
		const result: SyncChannelResult = {
			channelId: seed.channelId,
			player: seed.player,
			server: seed.server,
			fetched: 0,
			candidates: 0,
			inserted: 0,
			skippedExisting: 0,
			skippedIrrelevant: 0,
			skippedShort: 0,
			failed: []
		};
		try {
			const uploads = await fetchChannelUploads(seed.uploadsPlaylistId, apiKey, maxVideos);
			result.fetched = uploads.length;

			// Cheap prefilter on the title before spending a details request.
			const candidateIds: string[] = [];
			for (const upload of uploads) {
				if (existingUrls.has(youtubeVideoUrl(upload.videoId))) {
					result.skippedExisting++;
					continue;
				}
				if (!isStrinovaRelevantTitle(upload.title)) {
					result.skippedIrrelevant++;
					continue;
				}
				candidateIds.push(upload.videoId);
			}

			const details = await fetchVideoDetails(candidateIds, apiKey);
			const rows: NewVod[] = [];
			for (const video of details) {
				if (video.durationSeconds && video.durationSeconds < minDuration) {
					result.skippedShort++;
					continue;
				}
				const url = youtubeVideoUrl(video.videoId);
				if (existingUrls.has(url)) {
					result.skippedExisting++;
					continue;
				}
				const format =
					CHANNEL_FORMAT_OVERRIDES[seed.channelId] ?? detectVodFormatFromTitle(video.title);
				const characterRelevant = format === 'player_pov' || format === 'pov_review';
				const characters = characterRelevant
					? detectCharactersFromTitle(video.title)
					: { first: null, second: null };
				const map = detectMapFromTitle(video.title);
				rows.push({
					id: randomUUID(),
					url,
					title: video.title,
					thumbnail: video.thumbnail,
					platform: 'youtube',
					player: seed.player,
					server: seed.server,
					map: map ?? undefined,
					character_first: characters.first ?? undefined,
					character_second: characters.second ?? undefined,
					// Season is left unset: our season boundaries are CN-only, and
					// these channels play on Global (G-series) servers.
					season: undefined,
					rank: undefined,
					type: seed.type,
					format,
					gameVersion: 'pc',
					publishedAt: video.publishedAt ? new Date(video.publishedAt * 1000) : undefined
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
		seeds: seeds.length,
		results
	};
}
