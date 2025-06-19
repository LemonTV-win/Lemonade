import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		metadata: {
			title: 'Reiichi Walls',
			description: 'Strinova Reiichi Wall Lineups'
		}
	};
};
