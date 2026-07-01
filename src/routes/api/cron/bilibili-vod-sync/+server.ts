import { env } from '$env/dynamic/private';
import { syncBilibiliVodSubscriptions } from '$lib/server/data/bilibili-vod-sync';
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
	const maxPages = Number(url.searchParams.get('maxPages') ?? '3');
	const result = await syncBilibiliVodSubscriptions({
		dryRun,
		maxPages,
		cookie: env.BILIBILI_COOKIE
	});

	return json({ ...result, generatedAt: new Date().toISOString() });
}
