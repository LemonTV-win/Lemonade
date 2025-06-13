export const MAPS = [
	'base_404',
	'area_88',
	'port_euler',
	'windy_town',
	'space_lab',
	'cauchy_district',
	'cosmite',
	'ocarnus'
] as const;
export type GameMap = (typeof MAPS)[number];

export const MAP_SIZE = {
	x: 500,
	y: 500
};

export const MAP_SCALE_FACTOR: Record<GameMap, number> = {
	ocarnus: 1,
	windy_town: 0.94,
	base_404: 1,
	area_88: 1,
	port_euler: 1,
	space_lab: 1,
	cauchy_district: 1,
	cosmite: 1
};

export const MAP_NAME: Record<GameMap, string> = {
	ocarnus: 'Ocarnus',
	windy_town: 'Windy Town',
	base_404: 'Base 404',
	area_88: 'Area 88',
	port_euler: 'Port Euler',
	space_lab: 'Space Lab',
	cauchy_district: 'Cauchy District',
	cosmite: 'Cosmite'
};
