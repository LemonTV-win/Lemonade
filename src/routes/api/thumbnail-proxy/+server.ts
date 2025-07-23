import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const targetUrl = url.searchParams.get('url');
	if (!targetUrl) {
		throw error(400, 'Missing url parameter');
	}

	try {
		const res = await fetch(targetUrl);
		if (!res.ok) {
			throw error(res.status, 'Failed to fetch image');
		}

		const contentType = res.headers.get('content-type') || 'image/jpeg';
		return new Response(res.body, {
			headers: {
				'content-type': contentType,
				'cache-control': 'public, max-age=3600'
			}
		});
	} catch (e) {
		throw error(500, 'Proxy fetch failed');
	}
};
