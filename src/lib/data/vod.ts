import * as m from '$lib/paraglide/messages';

export const VOD_PLATFORMS = ['youtube', 'bilibili', 'twitch'] as const;
export type VodPlatform = (typeof VOD_PLATFORMS)[number];

export const VOD_PLATFORMS_LABELS: Record<VodPlatform, string> = {
	youtube: 'YouTube',
	bilibili: 'Bilibili',
	twitch: 'Twitch'
};

export const VOD_TYPES = ['ranked', 'scrim', 'tournament'] as const;
export type VodType = (typeof VOD_TYPES)[number];

export const VOD_TYPES_LABELS: Record<VodType, () => string> = {
	ranked: m.ranked,
	scrim: m.scrim,
	tournament: m.tournament
};
