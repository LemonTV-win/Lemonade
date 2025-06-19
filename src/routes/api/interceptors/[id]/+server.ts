import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import {
	getInterceptorById,
	updateInterceptor,
	deleteInterceptor
} from '$lib/server/data/interceptors';

// GET /api/interceptors/[id] - Get specific interceptor
export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	if (!id) {
		return json({ message: 'Missing interceptor id', status: 'error' }, { status: 400 });
	}

	const data = await getInterceptorById(id);
	if (!data) {
		return json({ message: 'Interceptor not found', status: 'error' }, { status: 404 });
	}

	return json({ message: 'Get interceptor', data, status: 'success' });
};

// PUT /api/interceptors/[id] - Update specific interceptor
export const PUT: RequestHandler = async ({ params, request }) => {
	const { id } = params;
	if (!id) {
		return json({ message: 'Missing interceptor id', status: 'error' }, { status: 400 });
	}

	const body = await request.json();
	const success = await updateInterceptor(id, body);

	if (!success) {
		return json({ message: 'Interceptor not found', status: 'error' }, { status: 404 });
	}

	return json({ message: 'Interceptor updated', data: { id }, status: 'success' });
};

// DELETE /api/interceptors/[id] - Delete specific interceptor
export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;
	if (!id) {
		return json({ message: 'Missing interceptor id', status: 'error' }, { status: 400 });
	}

	const success = await deleteInterceptor(id);
	if (!success) {
		return json({ message: 'Interceptor not found', status: 'error' }, { status: 404 });
	}

	return json({ message: 'Interceptor deleted', data: { id }, status: 'success' });
};
