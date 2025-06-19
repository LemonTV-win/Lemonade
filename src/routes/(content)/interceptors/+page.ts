import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data }) => {
	return {
		...data,
		metadata: {
			title: 'Interceptors',
			description: 'Strinova Interceptors Lineups'
		}
	};
};
