import { db } from '$lib/server/db';
import { vod } from '$lib/server/db/schemas/vod';
import type { NewVod } from '$lib/server/db/schemas/vod';
import { eq } from 'drizzle-orm';

export async function getVODs() {
	const vods = await db.query.vod.findMany({
		orderBy: (vod, { desc }) => [desc(vod.publishedAt)]
	});
	return vods;
}

export async function addVOD(vodData: NewVod) {
	console.info(`[server/data/vods] addVOD`, vodData);
	const vods = await db.insert(vod).values(vodData);
	return vods;
}

export async function updateVOD(vodData: NewVod) {
	console.info(`[server/data/vods] updateVOD`, vodData);
	const vods = await db.update(vod).set(vodData).where(eq(vod.id, vodData.id));
	return vods;
}
