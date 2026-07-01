import * as m from '$lib/paraglide/messages';

export const VOD_PLATFORMS = ['youtube', 'bilibili', 'twitch'] as const;
export type VodPlatform = (typeof VOD_PLATFORMS)[number];

export const VOD_PLATFORMS_LABELS: Record<VodPlatform, string> = {
	youtube: 'YouTube',
	bilibili: 'Bilibili',
	twitch: 'Twitch'
};

export const VOD_TYPES = ['ranked', 'scrim', 'tournament', 'demolition'] as const;
export type VodType = (typeof VOD_TYPES)[number];

export const VOD_TYPES_LABELS: Record<VodType, () => string> = {
	ranked: m.ranked,
	scrim: m.scrim,
	tournament: m.tournament,
	demolition: m.demolition
};

// Video format: how the footage is presented (independent of match context `type`).
export const VOD_FORMATS = [
	'player_pov',
	'pov_review',
	'team_review',
	'broadcast',
	'tournament_vod',
	'guide',
	'highlight',
	'other'
] as const;
export type VodFormat = (typeof VOD_FORMATS)[number];

export const VOD_FORMATS_LABELS: Record<VodFormat, string> = {
	player_pov: 'Player POV',
	pov_review: 'POV Review',
	team_review: 'Team Review',
	broadcast: 'Broadcast',
	tournament_vod: 'Tournament VOD',
	guide: 'Guide',
	highlight: 'Highlight',
	other: 'Other'
};

/** Formats where a single player's character(s) are expected metadata. */
export const CHARACTER_RELEVANT_FORMATS: readonly VodFormat[] = ['player_pov', 'pov_review'];

export function isCharacterRelevantFormat(format: VodFormat): boolean {
	return CHARACTER_RELEVANT_FORMATS.includes(format);
}

// Which build of the game the footage is from.
export const GAME_VERSIONS = ['pc', 'mobile', 'unknown'] as const;
export type GameVersion = (typeof GAME_VERSIONS)[number];

export const GAME_VERSIONS_LABELS: Record<GameVersion, string> = {
	pc: 'PC',
	mobile: 'Mobile',
	unknown: 'Unknown'
};
