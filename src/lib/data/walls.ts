import type { Point, Position } from '$lib/data/geometry';

export interface Wall {
	name: string;
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
	A_SITE_PLANT: {
		name: 'A Site Plant',
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
		name: 'Mid to A',
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
		name: 'A Site Attack',
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
};
