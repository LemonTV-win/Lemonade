export const MAPS = [
	// 'base_404',
	// 'area_88',
	// 'port_euler',
	'windy_town',
	// 'space_lab',
	// 'cauchy_district',
	// 'cosmite',
	'ocarnus'
] as const;
export type GameMap = (typeof MAPS)[number];
