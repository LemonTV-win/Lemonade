import { env } from '$env/dynamic/private';
import { syncYoutubeVodSubscriptions } from '$lib/server/data/youtube-vod-sync';
import { json } from '@sveltejs/kit';

export async function GET({ request, url }) {
	const secret = env.CRON_SECRET;
	if (secret) {
		const authorization = request.headers.get('authorization');
		if (authorization !== `Bearer ${secret}`) {
			return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}
	}

	const dryRun = url.searchParams.get('dryRun') === 'true';
	const maxVideosParam = url.searchParams.get('maxVideosPerChannel');
	const result = await syncYoutubeVodSubscriptions({
		dryRun,
		apiKey: env.GOOGLE_API_KEY,
		maxVideosPerChannel: maxVideosParam ? Number(maxVideosParam) : undefined
	});

	return json({ ...result, generatedAt: new Date().toISOString() });
}
