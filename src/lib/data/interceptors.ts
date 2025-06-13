import type { Point, Position } from '$lib/data/geometry';
import type { GameMap } from '$lib/data/game';

export interface Interceptor {
	map: GameMap;
	name: string;
	side: 'attacker' | 'defender';
	roundStart: boolean;
	position: Point;
	deploy_position: Point;
	images: {
		deploy: string;
		overview: string;
		end?: string;
	};
	video?: string;
	jump: 'none' | 'once' | 'twice'; // stand, single jump, double jump
}

export let INTERCEPTORS: Record<string, Interceptor> = {
	...{
		// Windy Town
		WT_MID_CT_DEFAULT: {
			map: 'windy_town',
			name: 'Mid Defender Default',
			side: 'defender',
			roundStart: true,
			position: { x: 38.8, y: 42.78 },
			deploy_position: {
				x: 40.2,
				y: 41.18
			},
			images: {
				deploy: '/interceptors/incep_wt_end_mid_ct_deploy.jpg',
				overview: '/interceptors/incep_wt_end_mid_ct_overview.jpg',
				end: '/interceptors/incep_wt_end_mid_ct_end.jpg'
			},
			jump: 'none'
		},
		WT_MID_CT_HIGH: {
			map: 'windy_town',
			name: 'Mid Defender Above',
			side: 'defender',
			roundStart: true,
			position: { x: 34, y: 47.38 },
			deploy_position: {
				x: 38.8,
				y: 38.58
			},
			images: {
				deploy: '/interceptors/incep_wt_end_mid_ct_high_deploy.jpg',
				overview: '/interceptors/incep_wt_end_mid_ct_high_overview.jpg',
				end: '/interceptors/incep_wt_end_mid_ct_high_end.jpg'
			},
			jump: 'none'
		}
	}
};
