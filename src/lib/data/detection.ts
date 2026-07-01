// Shared, paraglide-free detection data + helpers.
// Safe to import from both the SvelteKit app ($lib/data/detection) and from
// standalone scripts (relative import), because it only imports *types* from
// ./game (which are erased at runtime).
import type { Character, GameMap, Season } from './game';

/**
 * Character alias database for title-based discovery.
 * Includes official Chinese names, common nicknames, and English names.
 * Ambiguous single-character aliases are listed in WEAK_ALIASES below and are
 * only accepted when a usage-context word is nearby.
 */
export const CHARACTER_ALIASES: Record<Character, string[]> = {
	Yvette: ['伊薇特', '小熊', '雪怪', 'Yvette'],
	Nobunaga: ['信长', '信長', '信', 'Nobunaga'],
	Kokona: ['心夏', 'Kokona', '大狙'],
	Michele: ['米雪儿', '米雪', '哈基咪', 'Michele'],
	Flavia: ['芙拉薇娅', '芙拉维亚', '蝴蝶', 'Flavia'],
	Yugiri: ['忧雾', '憂霧', '蜗牛', '悠莉', 'Yugiri'],
	Leona: ['蕾欧娜', '蕾歐娜', '土木姐', 'Leona'],
	Chiyo: ['千代', '御天织', 'Chiyo'],
	Reiichi: ['令一', '令', 'Reiichi'],
	Lawine: ['拉薇', 'Lawine'],
	Ming: ['牢明', '明', 'Ming'],
	Meredith: ['梅瑞狄斯', '梅瑞迪斯', '沙猫', 'Meredith'],
	Eika: ['艾卡', '炎帝', '最强女高中生', 'Eika'],
	Kanami: ['香奈美', '大狙', '小美', 'Kanami'],
	Fragrans: ['珐格兰丝', '珐格蘭絲', '调香师', '花', 'Fragrans'],
	Mara: ['玛拉', '瑪拉', 'Mara'],
	Nora: ['诺诺', '諾諾', 'Nora'],
	Audrey: ['奥黛丽', '奧黛莉', '大黄', 'Audrey'],
	Celestia: ['星绘', '星繪', '星理恵', '小绘', 'Celestia'],
	Maddelena: ['玛德蕾娜', '瑪德蕾娜', '小画家', '泡泡', 'Maddelena'],
	'Bai Mo': ['白墨', '墨墨', 'Bai Mo'],
	Fuchsia: ['绯莎', '緋莎', '绯鲨', '鲨鱼', '鲨鲨', 'Fuchsia'],
	Galatea: ['加拉蒂亚', '加拉蒂亞', '大画家', '卡牌', 'Galatea'],
	Cielle: ['汐', 'Cielle']
};

/** Map alias database, including common typo variants (e.g. 科斯米特). */
export const MAP_ALIASES: Record<GameMap, string[]> = {
	base_404: ['404基地', '基地404', '404', 'Base 404', 'base404'],
	area_88: ['88区', '88區', 'Area 88', 'area88'],
	port_euler: ['欧拉港口', '歐拉港口', '欧拉港', '港口', 'Port Euler'],
	windy_town: ['风曳镇', '風曳鎮', '风曳', 'Windy Town'],
	space_lab: ['空间实验室', '空間實驗室', '空间站', '空间', 'Space Lab'],
	cauchy_district: ['柯西街区', '柯西街區', '柯西', 'Cauchy'],
	cosmite: ['科斯迷特', '科斯米特', '科斯', 'Cosmite'],
	ocarnus: ['奥卡努斯', '奧卡努斯', 'Ocarnus']
};

/** Aliases too short/ambiguous to trust without nearby usage context. */
const WEAK_ALIASES = new Set(['信', '令', '明', '花', '大狙']);

/** Words that indicate the player is actually using this character. */
const USE_CONTEXT =
	/(玩|只玩|专精|秒锁|选择|反手选择|掏出|拿出|使用|用|新版|实战|思路|教学|觉醒|一觉|二觉|三觉|全场|半场|奇点局|超弦局|排位)/;

/** Contexts where a character name refers to someone else (enemy/teammate/object). */
const NON_USER_CONTEXT = /(白墨信标|对面|敌方|队友|遇到|偷袭|打白墨|打令|打明)/;

/** Separators that suggest a "character A & character B" pairing. */
const PAIR_SEPARATORS = /[&＆+＋和与/、]/;

export function detectMapFromTitle(title: string): GameMap | null {
	for (const [map, aliases] of Object.entries(MAP_ALIASES) as [GameMap, string[]][]) {
		if (aliases.some((alias) => title.includes(alias))) return map;
	}
	return null;
}

type CharacterHit = { character: Character; index: number };

/**
 * Detect up to two characters that the uploader is using, based on the title.
 * Conservative: weak single-character aliases require nearby usage context,
 * and enemy/teammate/object contexts are excluded.
 */
export function detectCharactersFromTitle(title: string): {
	first: Character | null;
	second: Character | null;
} {
	const hits: CharacterHit[] = [];
	for (const [character, aliases] of Object.entries(CHARACTER_ALIASES) as [Character, string[]][]) {
		let bestIndex = -1;
		for (const alias of aliases) {
			const index = title.indexOf(alias);
			if (index === -1) continue;
			const context = title.slice(Math.max(0, index - 8), index + alias.length + 8);
			if (NON_USER_CONTEXT.test(context)) continue;
			if (WEAK_ALIASES.has(alias) && !USE_CONTEXT.test(context)) continue;
			if (bestIndex === -1 || index < bestIndex) bestIndex = index;
		}
		if (bestIndex !== -1) hits.push({ character, index: bestIndex });
	}
	hits.sort((a, b) => a.index - b.index);
	return { first: hits[0]?.character ?? null, second: hits[1]?.character ?? null };
}

export function titleHasCharacterPair(title: string): boolean {
	return PAIR_SEPARATORS.test(title);
}

/**
 * CN (CalabiYau) season boundaries, newest naming last. Only recent seasons are
 * listed because older CN start dates are not needed for fresh ingestion.
 */
export const CN_SEASON_STARTS: { season: Season; start: string }[] = [
	{ season: 'C12', start: '2025-08-26' },
	{ season: 'C13', start: '2025-10-21' },
	{ season: '26SP1', start: '2025-12-18' },
	{ season: '26SP2', start: '2026-03-10' },
	{ season: '26SP3', start: '2026-05-19' }
];

function toCnUnix(date: string): number {
	return Math.floor(new Date(`${date}T00:00:00+08:00`).getTime() / 1000);
}

/**
 * Map a publish time (unix seconds) to the CN season it falls into.
 * Returns undefined for dates before the earliest known start.
 */
export function detectSeasonForUnix(pubUnix: number): Season | undefined {
	let current: Season | undefined;
	for (const { season, start } of CN_SEASON_STARTS) {
		if (pubUnix >= toCnUnix(start)) current = season;
	}
	return current;
}
