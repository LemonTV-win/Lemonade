import { GOOGLE_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const videoUrl = url.searchParams.get('url');
	if (!videoUrl) return json({ error: 'Missing url' }, { status: 400 });

	// Bilibili
	const bilibiliMatch = videoUrl.match(/bilibili\.com\/video\/([A-Za-z0-9]+)/);
	if (bilibiliMatch) {
		const bvid = bilibiliMatch[1];
		const res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
		if (!res.ok) return json({ error: 'Failed to fetch bilibili info' }, { status: 502 });
		const data = await res.json();
		if (!data.data) return json({ error: 'No data from bilibili' }, { status: 502 });
		return json({
			platform: 'bilibili',
			title: data.data.title,
			thumbnail: data.data.pic,
			player: data.data.owner?.name ?? '',
			publishedAt: data.data.pubdate ? new Date(data.data.pubdate * 1000).toISOString() : undefined
		});
	}

	// YouTube
	const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
	if (youtubeMatch) {
		const videoId = youtubeMatch[1];
		const oembedRes = await fetch(
			`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
		);
		if (!oembedRes.ok) return json({ error: 'Failed to fetch youtube info' }, { status: 502 });
		const data = await oembedRes.json();
		// Try to get publish date from YouTube Data API if available (not in oembed)
		let publishedAt;
		try {
			const apiRes = await fetch(
				`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${GOOGLE_API_KEY}`
			);
			console.log('apiRes', apiRes);
			if (apiRes.ok) {
				const apiData = await apiRes.json();
				console.log('apiData', apiData);
				publishedAt = apiData.items?.[0]?.snippet?.publishedAt;
			}
		} catch {}
		return json({
			platform: 'youtube',
			title: data.title,
			thumbnail: data.thumbnail_url,
			player: data.author_name,
			publishedAt
		});
	}

	// Twitch
	const twitchMatch = videoUrl.match(/twitch\.tv\/videos\/(\d+)/);
	if (twitchMatch) {
		const videoId = twitchMatch[1];
		const oembedRes = await fetch(
			`https://api.twitch.tv/v5/oembed?url=https://www.twitch.tv/videos/${videoId}`
		);
		if (!oembedRes.ok) return json({ error: 'Failed to fetch twitch info' }, { status: 502 });
		const data = await oembedRes.json();
		// Twitch oembed does not provide publish date; skip for now
		return json({
			platform: 'twitch',
			title: data.title,
			thumbnail: data.thumbnail_url,
			player: data.author_name
		});
	}

	return json({ error: 'Unsupported video url' }, { status: 400 });
}
