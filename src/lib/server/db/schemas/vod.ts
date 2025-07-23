import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type { Character, GameMap, Rank, Server } from '$lib/data/game';
import type { VodPlatform } from '$lib/data/vod';
export const vod = sqliteTable('vod', {
	id: text('id').primaryKey(),
	url: text('url').notNull().unique(),
	url_second_half: text('url_second_half'),
	title: text('title').notNull(),
	thumbnail: text('thumbnail').notNull(),
	platform: text('platform').$type<VodPlatform>().notNull(),
	player: text('player').notNull(),
	server: text('server').$type<Server>().notNull(),
	map: text('map').$type<GameMap>().notNull(),
	character_first: text('character_first').$type<Character>().notNull(),
	character_second: text('character_second').$type<Character>(),
	season: text('season'), // C1, C2 .. C11; G1, G2, ... G4
	rank: text('rank').$type<Rank>(),
	publishedAt: integer('published_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export type Vod = typeof vod.$inferSelect;
export type NewVod = typeof vod.$inferInsert;
