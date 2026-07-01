import { GOOGLE_API_KEY } from '$env/static/private';
import type { VodPlatform } from '$lib/data/vod';

export type VideoInfo = {
	platform: VodPlatform;
	title: string;
	thumbnail: string;
	player: string;
	publishedAt?: string;
};

/**
 * Normalize a supported video URL to a canonical, share-friendly form.
 * For Bilibili we drop all query params except the timestamp (`t`).
 */
export function normalizeVideoUrl(rawUrl: string): string {
	const trimmed = rawUrl.trim();
	if (!trimmed) return trimmed;
	try {
		if (/bilibili\.com\/video\//i.test(trimmed)) {
			const url = new URL(trimmed);
			for (const key of [...url.searchParams.keys()]) {
				if (key !== 't') url.searchParams.delete(key);
			}
			return url.toString();
		}
	} catch {
		// fall through and return the trimmed string
	}
	return trimmed;
}

/**
 * Fetch normalized metadata for a supported video URL.
 * Returns `null` when the URL is unsupported or the upstream lookup fails,
 * so callers can keep going during batch imports.
 */
export async function fetchVideoInfo(rawUrl: string): Promise<VideoInfo | null> {
	const videoUrl = normalizeVideoUrl(rawUrl);
	if (!videoUrl) return null;

	// Bilibili
	const bilibiliMatch = videoUrl.match(/bilibili\.com\/video\/([A-Za-z0-9]+)/);
	if (bilibiliMatch) {
		const bvid = bilibiliMatch[1];
		try {
			const res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
			if (!res.ok) return null;
			const data = await res.json();
			if (!data?.data) return null;
			return {
				platform: 'bilibili',
				title: data.data.title,
				thumbnail: data.data.pic,
				player: data.data.owner?.name ?? '',
				publishedAt: data.data.pubdate
					? new Date(data.data.pubdate * 1000).toISOString()
					: undefined
			};
		} catch {
			return null;
		}
	}

	// YouTube
	const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
	if (youtubeMatch) {
		const videoId = youtubeMatch[1];
		try {
			const oembedRes = await fetch(
				`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
			);
			if (!oembedRes.ok) return null;
			const data = await oembedRes.json();
			let publishedAt: string | undefined;
			try {
				const apiRes = await fetch(
					`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${GOOGLE_API_KEY}`
				);
				if (apiRes.ok) {
					const apiData = await apiRes.json();
					publishedAt = apiData.items?.[0]?.snippet?.publishedAt;
				}
			} catch {
				// publish date is best-effort
			}
			return {
				platform: 'youtube',
				title: data.title,
				thumbnail: data.thumbnail_url,
				player: data.author_name,
				publishedAt
			};
		} catch {
			return null;
		}
	}

	// Twitch
	const twitchMatch = videoUrl.match(/twitch\.tv\/videos\/(\d+)/);
	if (twitchMatch) {
		const videoId = twitchMatch[1];
		try {
			const oembedRes = await fetch(
				`https://api.twitch.tv/v5/oembed?url=https://www.twitch.tv/videos/${videoId}`
			);
			if (!oembedRes.ok) return null;
			const data = await oembedRes.json();
			return {
				platform: 'twitch',
				title: data.title,
				thumbnail: data.thumbnail_url,
				player: data.author_name
			};
		} catch {
			return null;
		}
	}

	return null;
}
