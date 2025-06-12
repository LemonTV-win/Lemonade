import type { Point, Position } from '$lib/data/geometry';
import type { GameMap } from '$lib/data/game';

export interface Wall {
	map: GameMap;
	name: string;
	direction: 'vertical' | 'horizontal';
	ultimate: boolean; // iron wall
	transparent: boolean; // awaken 3
	position: Position;
	deploy_position: Point;
	images: {
		deploy: string;
		overview: string;
		end?: string;
	};
	video?: string;
	jump: 'none' | 'once' | 'twice'; // stand, single jump, double jump
}

export let WALLS: Record<string, Wall> = {
	...{
		// Ocarnus
		A_SITE_PLANT: {
			map: 'ocarnus',
			name: 'A Site Plant',
			direction: 'vertical',
			ultimate: false,
			transparent: false,
			position: {
				start: { x: 59.95, y: 56 },
				angle: -50 * (Math.PI / 180)
			},
			deploy_position: {
				x: 59,
				y: 56
			},
			images: {
				deploy: '/walls/wall_1_deploy.jpg',
				overview: '/walls/wall_1_overview.jpg'
			},
			jump: 'none'
		},
		MID_TO_A: {
			map: 'ocarnus',
			name: 'Mid to A',
			direction: 'vertical',
			ultimate: false,
			transparent: false,
			position: {
				start: { x: 44.25, y: 55.5 },
				angle: -62 * (Math.PI / 180)
			},
			deploy_position: {
				x: 41.53,
				y: 59.72
			},
			images: {
				deploy: '/walls/wall_2_deploy.jpg',
				overview: '/walls/wall_2_overview.jpg',
				end: '/walls/wall_2_end.jpg'
			},
			video: '/walls/wall_2_video.mp4',
			jump: 'none'
		},
		A_SITE_ATTACK: {
			map: 'ocarnus',
			name: 'A Site Attack',
			direction: 'vertical',
			ultimate: false,
			transparent: false,
			position: {
				start: { x: 60.5, y: 52.5 },
				angle: -58 * (Math.PI / 180)
			},
			deploy_position: {
				x: 59,
				y: 56
			},
			images: {
				deploy: '/walls/wall_3_deploy.jpg',
				overview: '/walls/wall_3_overview.jpg',
				end: '/walls/wall_3_end.jpg'
			},
			jump: 'twice'
		}
	},
	...{
		// Windy Town
		WT_A_PLANT: {
			map: 'windy_town',
			name: 'A Site Plant',
			direction: 'vertical',
			ultimate: false,
			transparent: false,
			position: {
				start: { x: 65.11, y: 44.98 },
				angle: -47 * (Math.PI / 180)
			},
			deploy_position: {
				x: 65.83,
				y: 44.58
			},
			images: {
				deploy: '/walls/wall_wt_a_plant_deploy.jpg',
				overview: '/walls/wall_wt_a_plant_overview.jpg',
				end: '/walls/wall_wt_a_plant_end.jpg'
			},
			jump: 'none'
		},
		WT_A_ULT: {
			map: 'windy_town',
			name: 'A Site Ultimate Plant',
			direction: 'vertical',
			ultimate: true,
			transparent: false,
			position: {
				start: { x: 64.88, y: 44.58 },
				angle: -34.5 * (Math.PI / 180)
			},
			deploy_position: {
				x: 65.83,
				y: 44.58
			},
			images: {
				deploy: '/walls/wall_wt_a_ult_deploy.jpg',
				overview: '/walls/wall_wt_a_ult_overview.jpg',
				end: '/walls/wall_wt_a_ult_end.jpg'
			},
			jump: 'none'
		},
		WT_B_DEFAULT: {
			map: 'windy_town',
			name: 'B Site Default',
			direction: 'vertical',
			ultimate: false,
			transparent: false,
			position: {
				start: {
					x: 24.11,
					y: 41.18
				},
				angle: -54 * (Math.PI / 180)
			},
			deploy_position: {
				x: 23.91,
				y: 41.78
			},
			images: {
				deploy: '/walls/wall_wt_b_default_deploy.jpg',
				overview: '/walls/wall_wt_b_default_overview.jpg',
				end: '/walls/wall_wt_b_default_end.jpg'
			},
			jump: 'none'
		}
	}
};
