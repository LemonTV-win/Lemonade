import * as m from '$lib/paraglide/messages';

// #region Characters
export const PUS_CHARACTERS = [
	'Yvette',
	'Nobunaga',
	'Kokona',
	'Michele',
	'Flavia',
	'Yugiri',
	'Leona',
	'Chiyo'
] as const;

export const SCISORS_CHARACTERS = [
	'Reiichi',
	'Lawine',
	'Ming',
	'Meredith',
	'Eika',
	'Kanami',
	'Fragrans',
	'Mara'
] as const;

export const URBINO_CHARACTERS = [
	'Audrey',
	'Celestia',
	'Maddelena',
	'Bai Mo',
	'Fuschia',
	'Galatea'
] as const;

export type PUSCharacter = (typeof PUS_CHARACTERS)[number];
export type ScissorsCharacter = (typeof SCISORS_CHARACTERS)[number];
export type UrbinoCharacter = (typeof URBINO_CHARACTERS)[number];

export type Character = PUSCharacter | ScissorsCharacter | UrbinoCharacter;

export const CHARACTER_NAMES: Record<Character, () => string> = {
	Yvette: m.Yvette,
	Nobunaga: m.Nobunaga,
	Kokona: m.Kokona,
	Michele: m.Michele,
	Flavia: m.Flavia,
	Yugiri: m.Yugiri,
	Leona: m.Leona,
	Chiyo: m.Chiyo,
	Reiichi: m.Reiichi,
	Lawine: m.Lawine,
	Ming: m.Ming,
	Meredith: m.Meredith,
	Eika: m.Eika,
	Kanami: m.Kanami,
	Fragrans: m.Fragrans,
	Mara: m.Mara,
	Audrey: m.Audrey,
	Maddelena: m.Maddelena,
	'Bai Mo': m['Bai Mo'],
	Fuschia: m.Fuschia,
	Galatea: m.Galatea,
	Celestia: m.Celestia
};

// #endregion

// #region Maps
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

export const MAP_NAMES: Record<GameMap, () => string> = {
	base_404: m.base_404,
	area_88: m.area_88,
	port_euler: m.port_euler,
	space_lab: m.space_lab,
	windy_town: m.windy_town,
	cauchy_district: m.cauchy_district,
	cosmite: m.cosmite,
	ocarnus: m.ocarnus
};
// #endregion
// #endregion
