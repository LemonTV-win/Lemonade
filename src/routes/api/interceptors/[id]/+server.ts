import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	interceptor,
	interceptorPosition,
	interceptorImage,
	uploadedFile
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// GET /api/interceptors/[id] - Get specific interceptor
export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	if (!id) {
		return json({ message: 'Missing interceptor id', status: 'error' }, { status: 400 });
	}
	const [inc] = await db.select().from(interceptor).where(eq(interceptor.id, id));
	if (!inc) {
		return json({ message: 'Interceptor not found', status: 'error' }, { status: 404 });
	}
	const positions = await db
		.select()
		.from(interceptorPosition)
		.where(eq(interceptorPosition.interceptorId, id));
	const images = await db
		.select({
			id: interceptorImage.id,
			interceptorId: interceptorImage.interceptorId,
			type: interceptorImage.type,
			fileId: interceptorImage.fileId,
			fileS3Key: uploadedFile.s3Key
		})
		.from(interceptorImage)
		.leftJoin(uploadedFile, eq(interceptorImage.fileId, uploadedFile.id))
		.where(eq(interceptorImage.interceptorId, id));

	const data = {
		...inc,
		position: positions.find((p) => p.type === 'position'),
		deploy_position: positions.find((p) => p.type === 'deploy_position'),
		images: Object.fromEntries(images.map((img) => [img.type, img.fileS3Key || null]))
	};
	return json({ message: 'Get interceptor', data, status: 'success' });
};

// PUT /api/interceptors/[id] - Update specific interceptor
export const PUT: RequestHandler = async ({ params, request }) => {
	const { id } = params;
	if (!id) {
		return json({ message: 'Missing interceptor id', status: 'error' }, { status: 400 });
	}
	const body = await request.json();
	const [inc] = await db.select().from(interceptor).where(eq(interceptor.id, id));
	if (!inc) {
		return json({ message: 'Interceptor not found', status: 'error' }, { status: 404 });
	}
	const now = new Date();
	await db
		.update(interceptor)
		.set({
			map: body.map,
			name: body.name,
			side: body.side,
			roundStart: !!body.roundStart,
			video: body.video,
			jump: body.jump,
			updatedAt: now
		})
		.where(eq(interceptor.id, id));
	// Update positions: delete old, insert new
	await db.delete(interceptorPosition).where(eq(interceptorPosition.interceptorId, id));
	if (body.position) {
		await db.insert(interceptorPosition).values({
			id: randomUUID(),
			interceptorId: id,
			type: 'position',
			x: body.position.x,
			y: body.position.y
		});
	}
	if (body.deploy_position) {
		await db.insert(interceptorPosition).values({
			id: randomUUID(),
			interceptorId: id,
			type: 'deploy_position',
			x: body.deploy_position.x,
			y: body.deploy_position.y
		});
	}
	// Update images: delete old, insert new
	await db.delete(interceptorImage).where(eq(interceptorImage.interceptorId, id));
	if (body.images) {
		for (const type of ['deploy', 'overview', 'end'] as const) {
			if (body.images[type]) {
				await db.insert(interceptorImage).values({
					id: randomUUID(),
					interceptorId: id,
					fileId: body.images[type],
					type
				});
			}
		}
	}
	return json({ message: 'Interceptor updated', data: { id }, status: 'success' });
};

// DELETE /api/interceptors/[id] - Delete specific interceptor
export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;
	if (!id) {
		return json({ message: 'Missing interceptor id', status: 'error' }, { status: 400 });
	}
	const [inc] = await db.select().from(interceptor).where(eq(interceptor.id, id));
	if (!inc) {
		return json({ message: 'Interceptor not found', status: 'error' }, { status: 404 });
	}
	await db.delete(interceptorPosition).where(eq(interceptorPosition.interceptorId, id));
	await db.delete(interceptorImage).where(eq(interceptorImage.interceptorId, id));
	await db.delete(interceptor).where(eq(interceptor.id, id));
	return json({ message: 'Interceptor deleted', data: { id }, status: 'success' });
};
