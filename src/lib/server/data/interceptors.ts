import { db } from '$lib/server/db';
import {
	interceptor,
	interceptorPosition,
	interceptorImage,
	uploadedFile
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface InterceptorWithRelations {
	id: string;
	map: string;
	name: string;
	side: 'attacker' | 'defender';
	roundStart: boolean;
	video?: string | null;
	jump: 'none' | 'once' | 'twice';
	createdAt: Date;
	updatedAt: Date;
	position?: { x: number; y: number } | null;
	deploy_position?: { x: number; y: number } | null;
	images: Record<string, string | null>;
}

export interface CreateInterceptorData {
	id?: string;
	map: string;
	name: string;
	side: 'attacker' | 'defender';
	roundStart: boolean;
	video?: string;
	jump: 'none' | 'once' | 'twice';
	position?: { x: number; y: number };
	deploy_position?: { x: number; y: number };
	images?: Record<string, string>; // type -> uploadedFile.id
}

export interface UpdateInterceptorData {
	map?: string;
	name?: string;
	side?: 'attacker' | 'defender';
	roundStart?: boolean;
	video?: string;
	jump?: 'none' | 'once' | 'twice';
	position?: { x: number; y: number };
	deploy_position?: { x: number; y: number };
	images?: Record<string, string>; // type -> uploadedFile.id
}

// Helper function to compose interceptor with relations
function composeInterceptorWithRelations(
	inc: any,
	positions: any[],
	images: any[]
): InterceptorWithRelations {
	const pos = positions.filter((p) => p.interceptorId === inc.id);
	const imgs = images.filter((img) => img.interceptorId === inc.id);

	return {
		...inc,
		position: pos.find((p) => p.type === 'position') || null,
		deploy_position: pos.find((p) => p.type === 'deploy_position') || null,
		images: Object.fromEntries(imgs.map((img) => [img.type, img.fileS3Key || null]))
	};
}

// Get all interceptors with their relations
export async function getAllInterceptors(): Promise<InterceptorWithRelations[]> {
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

	return interceptors.map((inc) => composeInterceptorWithRelations(inc, positions, images));
}

// Get interceptor by ID with relations
export async function getInterceptorById(id: string): Promise<InterceptorWithRelations | null> {
	const [inc] = await db.select().from(interceptor).where(eq(interceptor.id, id));
	if (!inc) return null;

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

	return composeInterceptorWithRelations(inc, positions, images);
}

// Create new interceptor
export async function createInterceptor(data: CreateInterceptorData): Promise<string> {
	const id = data.id || randomUUID();
	const now = new Date();

	await db.insert(interceptor).values({
		id,
		map: data.map,
		name: data.name,
		side: data.side,
		roundStart: data.roundStart,
		video: data.video,
		jump: data.jump,
		createdAt: now,
		updatedAt: now
	});

	// Insert positions
	if (data.position) {
		await db.insert(interceptorPosition).values({
			id: randomUUID(),
			interceptorId: id,
			type: 'position',
			x: data.position.x,
			y: data.position.y
		});
	}

	if (data.deploy_position) {
		await db.insert(interceptorPosition).values({
			id: randomUUID(),
			interceptorId: id,
			type: 'deploy_position',
			x: data.deploy_position.x,
			y: data.deploy_position.y
		});
	}

	// Insert images
	if (data.images) {
		for (const type of ['deploy', 'overview', 'end'] as const) {
			if (data.images[type]) {
				await db.insert(interceptorImage).values({
					id: randomUUID(),
					interceptorId: id,
					fileId: data.images[type],
					type
				});
			}
		}
	}

	return id;
}

// Update interceptor
export async function updateInterceptor(id: string, data: UpdateInterceptorData): Promise<boolean> {
	const [existing] = await db.select().from(interceptor).where(eq(interceptor.id, id));
	if (!existing) return false;

	const now = new Date();
	const updateData: any = { updatedAt: now };

	if (data.map !== undefined) updateData.map = data.map;
	if (data.name !== undefined) updateData.name = data.name;
	if (data.side !== undefined) updateData.side = data.side;
	if (data.roundStart !== undefined) updateData.roundStart = data.roundStart;
	if (data.video !== undefined) updateData.video = data.video;
	if (data.jump !== undefined) updateData.jump = data.jump;

	await db.update(interceptor).set(updateData).where(eq(interceptor.id, id));

	// Update positions: delete old, insert new
	if (data.position !== undefined || data.deploy_position !== undefined) {
		await db.delete(interceptorPosition).where(eq(interceptorPosition.interceptorId, id));

		if (data.position) {
			await db.insert(interceptorPosition).values({
				id: randomUUID(),
				interceptorId: id,
				type: 'position',
				x: data.position.x,
				y: data.position.y
			});
		}

		if (data.deploy_position) {
			await db.insert(interceptorPosition).values({
				id: randomUUID(),
				interceptorId: id,
				type: 'deploy_position',
				x: data.deploy_position.x,
				y: data.deploy_position.y
			});
		}
	}

	// Update images: delete old, insert new
	if (data.images !== undefined) {
		await db.delete(interceptorImage).where(eq(interceptorImage.interceptorId, id));

		for (const type of ['deploy', 'overview', 'end'] as const) {
			if (data.images[type]) {
				await db.insert(interceptorImage).values({
					id: randomUUID(),
					interceptorId: id,
					fileId: data.images[type],
					type
				});
			}
		}
	}

	return true;
}

// Delete interceptor
export async function deleteInterceptor(id: string): Promise<boolean> {
	const [existing] = await db.select().from(interceptor).where(eq(interceptor.id, id));
	if (!existing) return false;

	// Delete related records (cascade delete would handle this, but explicit for clarity)
	await db.delete(interceptorPosition).where(eq(interceptorPosition.interceptorId, id));
	await db.delete(interceptorImage).where(eq(interceptorImage.interceptorId, id));
	await db.delete(interceptor).where(eq(interceptor.id, id));

	return true;
}

// Get interceptors as a map (for page server load)
export async function getInterceptorsMap(): Promise<Record<string, InterceptorWithRelations>> {
	const interceptors = await getAllInterceptors();
	return Object.fromEntries(interceptors.map((inc) => [inc.id, inc]));
}
