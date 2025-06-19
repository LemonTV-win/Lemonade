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

// GET /api/interceptors - Get all interceptors
export const GET: RequestHandler = async () => {
	const interceptors = await db.select().from(interceptor);
	const positions = await db.select().from(interceptorPosition);
	const images = await db
		.select({
			id: interceptorImage.id,
			interceptorId: interceptorImage.interceptorId,
			type: interceptorImage.type,
			fileId: interceptorImage.fileId,
			fileS3Key: uploadedFile.s3Key
		})
		.from(interceptorImage)
		.leftJoin(uploadedFile, eq(interceptorImage.fileId, uploadedFile.id));

	// Compose full objects
	const data = interceptors.map((inc) => {
		const pos = positions.filter((p) => p.interceptorId === inc.id);
		const imgs = images.filter((img) => img.interceptorId === inc.id);
		return {
			...inc,
			position: pos.find((p) => p.type === 'position'),
			deploy_position: pos.find((p) => p.type === 'deploy_position'),
			images: Object.fromEntries(imgs.map((img) => [img.type, img.fileS3Key || null]))
		};
	});

	return json({
		message: 'Get all interceptors',
		data,
		status: 'success'
	});
};

// POST /api/interceptors - Create new interceptor
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	// Validate body (not implemented here)
	const id = body.id || randomUUID();
	const now = new Date();
	await db.insert(interceptor).values({
		id,
		map: body.map,
		name: body.name,
		side: body.side,
		roundStart: !!body.roundStart,
		video: body.video,
		jump: body.jump,
		createdAt: now,
		updatedAt: now
	});
	// Insert positions
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
	// Insert images (expects body.images[type] = uploadedFile.id)
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
	return json({
		message: 'Interceptor created',
		data: { id },
		status: 'success'
	});
};
