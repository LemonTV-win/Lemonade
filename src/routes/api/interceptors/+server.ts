import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getAllInterceptors, createInterceptor } from '$lib/server/data/interceptors';

// GET /api/interceptors - Get all interceptors
export const GET: RequestHandler = async () => {
	const data = await getAllInterceptors();
	return json({
		message: 'Get all interceptors',
		data,
		status: 'success'
	});
};

// POST /api/interceptors - Create new interceptor
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const id = await createInterceptor(body);
	return json({
		message: 'Interceptor created',
		data: { id },
		status: 'success'
	});
};
