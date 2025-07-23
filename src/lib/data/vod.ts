export const VOD_PLATFORMS = ['youtube', 'bilibili', 'twitch'] as const;
export type VodPlatform = (typeof VOD_PLATFORMS)[number];

export const VOD_PLATFORMS_LABELS: Record<VodPlatform, string> = {
	youtube: 'YouTube',
	bilibili: 'Bilibili',
	twitch: 'Twitch'
};
