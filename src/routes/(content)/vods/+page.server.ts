import type { Actions, PageServerLoad } from './$types';
import { addVOD, addVODs, getExistingVodUrls, getVODs, updateVOD } from '$lib/server/data/vods';
import { fail } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import type { Character } from '$lib/data/game';
import type { GameMap } from '$lib/data/game';
import type { Rank } from '$lib/data/game';
import type { Server } from '$lib/data/game';
import type { VodType } from '$lib/data/vod';
import type { NewVod } from '$lib/server/db/schemas/vod';
import { fetchVideoInfo, normalizeVideoUrl } from '$lib/server/data/video-info';
import {
	detectCharactersFromTitle,
	detectMapFromTitle,
	detectSeasonForUnix
} from '$lib/data/detection';

export const load: PageServerLoad = async () => {
	const vods = await getVODs();

	// Extract unique platforms and maps for filters
	const platforms = Array.from(new Set(vods.map((vod) => vod.platform)));
	const maps = Array.from(
		new Set(vods.map((vod) => vod.map).filter((m): m is GameMap => Boolean(m)))
	);
	const servers = Array.from(new Set(vods.map((vod) => vod.server)));
	const characters = Array.from(
		new Set(
			vods
				.flatMap((vod) => [vod.character_first, vod.character_second])
				.filter((c): c is Character => Boolean(c))
		)
	);
	const players = Array.from(
		new Set(
			vods
				.map((vod) => vod.player)
				.sort((a, b) => {
					const countA = vods.filter((vod) => vod.player === a).length;
					const countB = vods.filter((vod) => vod.player === b).length;
					return countB - countA;
				})
		)
	);
	const seasons = Array.from(new Set(vods.map((vod) => vod.season).filter(Boolean)));
	const ranks = Array.from(new Set(vods.map((vod) => vod.rank).filter(Boolean)));
	console.log(vods);

	return {
		vods,
		platforms,
		maps,
		servers,
		characters,
		players,
		seasons,
		ranks
	};
};

export const actions: Actions = {
	addVod: async ({ request }) => {
		const formData = await request.formData();
		const url = formData.get('url');
		const title = formData.get('title');
		const thumbnail = formData.get('thumbnail');
		const platform = formData.get('platform');
		const player = formData.get('player');
		const server = formData.get('server');
		const map = formData.get('map');
		const character_first = formData.get('character_first');
		const character_second = formData.get('character_second');
		const season = formData.get('season');
		const rank = formData.get('rank');
		const type = formData.get('type');
		const publishedAt = formData.get('publishedAt');

		// Only core identity fields are required; map/character can be annotated later.
		if (!url || !title || !thumbnail || !platform || !player || !server) {
			return fail(400, {
				message: 'URL, title, thumbnail, platform, player and server are required.'
			});
		}

		const mapValue = map && map !== '' ? (map as GameMap) : undefined;
		const characterFirstValue =
			character_first && character_first !== '' ? (character_first as Character) : undefined;
		const characterSecondValue =
			character_second && character_second !== '' ? (character_second as Character) : undefined;

		await addVOD({
			id: randomUUID(),
			url: String(url),
			title: String(title),
			thumbnail: String(thumbnail),
			platform: String(platform) as 'youtube' | 'bilibili',
			player: String(player),
			server: String(server) as 'CN' | 'APAC' | 'NA' | 'EU',
			map: mapValue,
			character_first: characterFirstValue,
			character_second: characterSecondValue,
			season: season ? String(season) : undefined,
			rank: rank && rank !== '' ? (rank as Rank) : undefined,
			type: type ? (type as VodType) : 'ranked',
			publishedAt: publishedAt ? new Date(publishedAt as string) : undefined
		});

		return { success: true };
	},
	addVodsBatch: async ({ request }) => {
		const formData = await request.formData();
		const rawUrls = String(formData.get('urls') ?? '');
		const defaultServer = (String(formData.get('server') ?? 'CN') || 'CN') as Server;
		const defaultType = (String(formData.get('type') ?? 'ranked') || 'ranked') as VodType;
		const defaultSeason = formData.get('season') ? String(formData.get('season')) : undefined;
		const playerOverride = formData.get('player') ? String(formData.get('player')).trim() : '';

		const urls = Array.from(
			new Set(
				rawUrls
					.split(/[\s,]+/)
					.map((entry) => normalizeVideoUrl(entry))
					.filter(Boolean)
			)
		);

		if (urls.length === 0) {
			return fail(400, { batch: { message: 'Paste at least one video URL.' } });
		}

		const existingUrls = await getExistingVodUrls();
		const toInsert: NewVod[] = [];
		const failed: { url: string; reason: string }[] = [];
		let skippedExisting = 0;

		for (const url of urls) {
			if (existingUrls.has(url)) {
				skippedExisting++;
				continue;
			}
			const info = await fetchVideoInfo(url);
			if (!info || !info.title || !info.thumbnail) {
				failed.push({ url, reason: 'Could not fetch title/thumbnail' });
				continue;
			}
			const pubUnix = info.publishedAt
				? Math.floor(new Date(info.publishedAt).getTime() / 1000)
				: null;
			// Best-effort auto-detection from the title so obvious cases are pre-filled;
			// anything undetected stays null for later human annotation.
			const detectedMap = detectMapFromTitle(info.title);
			const detectedCharacters = detectCharactersFromTitle(info.title);
			const detectedSeason =
				defaultSeason ?? (pubUnix != null ? detectSeasonForUnix(pubUnix) : undefined);
			toInsert.push({
				id: randomUUID(),
				url,
				title: info.title,
				thumbnail: info.thumbnail,
				platform: info.platform,
				player: playerOverride || info.player || 'Unknown',
				server: defaultServer,
				map: detectedMap ?? undefined,
				character_first: detectedCharacters.first ?? undefined,
				character_second: detectedCharacters.second ?? undefined,
				season: detectedSeason,
				rank: undefined,
				type: defaultType,
				publishedAt: info.publishedAt ? new Date(info.publishedAt) : undefined
			});
			// Guard against duplicate URLs inside the same paste.
			existingUrls.add(url);
		}

		if (toInsert.length > 0) {
			await addVODs(toInsert);
		}

		return {
			batch: {
				success: true,
				requested: urls.length,
				inserted: toInsert.length,
				skippedExisting,
				failed
			}
		};
	},
	updateVod: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		const url = formData.get('url');
		const title = formData.get('title');
		const thumbnail = formData.get('thumbnail');
		const platform = formData.get('platform');
		const player = formData.get('player');
		const server = formData.get('server');
		const map = formData.get('map');
		const character_first = formData.get('character_first');
		const character_second = formData.get('character_second');
		const season = formData.get('season');
		const rank = formData.get('rank');
		const type = formData.get('type');
		const publishedAt = formData.get('publishedAt');

		// Only core identity fields are required; map/character can be annotated later.
		if (!id || !url || !title || !thumbnail || !platform || !player || !server) {
			return fail(400, {
				message: 'URL, title, thumbnail, platform, player and server are required.'
			});
		}

		const mapValue = map && map !== '' ? (map as GameMap) : undefined;
		const characterFirstValue =
			character_first && character_first !== '' ? (character_first as Character) : undefined;
		const characterSecondValue =
			character_second && character_second !== '' ? (character_second as Character) : undefined;

		await updateVOD({
			id: id as string,
			url: url as string,
			title: title as string,
			thumbnail: thumbnail as string,
			platform: platform as 'youtube' | 'bilibili',
			player: player as string,
			server: server as 'CN' | 'APAC' | 'NA' | 'EU',
			map: mapValue,
			character_first: characterFirstValue,
			character_second: characterSecondValue,
			season: season ? String(season) : undefined,
			rank: rank && rank !== '' ? (rank as Rank) : undefined,
			type: type ? (type as VodType) : 'ranked',
			publishedAt: publishedAt ? new Date(publishedAt as string) : undefined
		});

		return { success: true };
	}
};
