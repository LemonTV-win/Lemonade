import type { Actions, PageServerLoad } from './$types';
import { addVOD, getVODs, updateVOD } from '$lib/server/data/vods';
import { fail } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import type { Character } from '$lib/data/game';
import type { GameMap } from '$lib/data/game';
import type { Rank } from '$lib/data/game';

export const load: PageServerLoad = async () => {
	const vods = await getVODs();

	// Extract unique platforms and maps for filters
	const platforms = Array.from(new Set(vods.map((vod) => vod.platform)));
	const maps = Array.from(new Set(vods.map((vod) => vod.map)));
	const servers = Array.from(new Set(vods.map((vod) => vod.server)));
	const characters = Array.from(
		new Set(vods.flatMap((vod) => [vod.character_first, vod.character_second]))
	);
	const players = Array.from(new Set(vods.map((vod) => vod.player)));
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
		const publishedAt = formData.get('publishedAt');

		// Validate required fields
		if (!url || !title || !thumbnail || !platform || !player || !server || !character_first) {
			return fail(400, { message: 'All required fields must be filled.' });
		}

		const mapValue = map && map !== '' ? (map as GameMap) : undefined;
		const characterFirstValue =
			character_first && character_first !== '' ? (character_first as Character) : undefined;
		const characterSecondValue =
			character_second && character_second !== '' ? (character_second as Character) : undefined;

		if (!mapValue || !characterFirstValue) {
			return fail(400, { message: 'Map and first character are required.' });
		}

		const vod = await addVOD({
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
			publishedAt: publishedAt ? new Date(publishedAt as string) : undefined
		});

		return { success: true };
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
		const publishedAt = formData.get('publishedAt');

		// Validate required fields
		if (
			!id ||
			!url ||
			!title ||
			!thumbnail ||
			!platform ||
			!player ||
			!server ||
			!character_first
		) {
			return fail(400, { message: 'All required fields must be filled.' });
		}

		const mapValue = map && map !== '' ? (map as GameMap) : undefined;
		const characterFirstValue =
			character_first && character_first !== '' ? (character_first as Character) : undefined;
		const characterSecondValue =
			character_second && character_second !== '' ? (character_second as Character) : undefined;

		if (!mapValue || !characterFirstValue) {
			return fail(400, { message: 'Map and first character are required.' });
		}

		const vod = await updateVOD({
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
			publishedAt: publishedAt ? new Date(publishedAt as string) : undefined
		});

		return { success: true };
	}
};
