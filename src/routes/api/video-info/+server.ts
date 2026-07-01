import { fetchVideoInfo } from '$lib/server/data/video-info';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const videoUrl = url.searchParams.get('url');
	if (!videoUrl) return json({ error: 'Missing url' }, { status: 400 });

	const info = await fetchVideoInfo(videoUrl);
	if (!info)
		return json({ error: 'Unsupported video url or failed to fetch info' }, { status: 400 });

	return json(info);
}
