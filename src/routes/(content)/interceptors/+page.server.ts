import type { PageServerLoad } from './$types';
import { getInterceptorsMap } from '$lib/server/data/interceptors';

export const load: PageServerLoad = async () => {
	const interceptors = await getInterceptorsMap();

	return {
		interceptors
	};
};
