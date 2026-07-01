#!/usr/bin/env bun
// Backfill map/characters/season for existing VOD rows using title-based
// detection. Only fills fields that are currently empty; never overwrites
// human-entered data. Dry-run by default; pass --apply to write.
import { createClient } from '@libsql/client';
import { existsSync, readFileSync } from 'node:fs';
import {
	detectCharactersFromTitle,
	detectMapFromTitle,
	detectSeasonForUnix
} from '../src/lib/data/detection';

function loadDotenv(path = '.env') {
	if (!existsSync(path)) return;
	for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
		if (!match) continue;
		if (process.env[match[1]]) continue;
		process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
	}
}

async function main() {
	loadDotenv();
	const apply = process.argv.includes('--apply');
	const onlyBilibili = !process.argv.includes('--all-platforms');
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing.');
	const db = createClient({
		url: process.env.DATABASE_URL,
		authToken: process.env.DATABASE_AUTH_TOKEN
	});

	const rows = (
		await db.execute(
			`select id, title, platform, map, character_first, character_second, season, published_at from vod`
		)
	).rows as unknown as Array<{
		id: string;
		title: string;
		platform: string;
		map: string | null;
		character_first: string | null;
		character_second: string | null;
		season: string | null;
		published_at: number | null;
	}>;

	let updated = 0;
	let unchanged = 0;
	for (const row of rows) {
		if (onlyBilibili && row.platform !== 'bilibili') continue;
		const updates: Record<string, string> = {};

		if (!row.map) {
			const map = detectMapFromTitle(row.title);
			if (map) updates.map = map;
		}
		if (!row.character_first || !row.character_second) {
			const { first, second } = detectCharactersFromTitle(row.title);
			if (!row.character_first && first) updates.character_first = first;
			if (
				!row.character_second &&
				second &&
				second !== (updates.character_first ?? row.character_first)
			)
				updates.character_second = second;
		}
		if (!row.season && row.published_at) {
			const season = detectSeasonForUnix(row.published_at);
			if (season) updates.season = season;
		}

		const keys = Object.keys(updates);
		if (keys.length === 0) {
			unchanged++;
			continue;
		}
		updated++;
		console.log(
			`${apply ? 'UPDATE' : 'WOULD UPDATE'} ${row.id} ${JSON.stringify(updates)} | ${row.title}`
		);
		if (apply) {
			const setClause = [...keys.map((k) => `${k} = ?`), 'updated_at = ?'].join(', ');
			await db.execute({
				sql: `update vod set ${setClause} where id = ?`,
				args: [...keys.map((k) => updates[k]), Math.floor(Date.now() / 1000), row.id]
			});
		}
	}

	console.log(
		`\n[annotate] ${apply ? 'applied' : 'dry-run'}: ${updated} rows to update, ${unchanged} unchanged.`
	);
	if (!apply) console.log('[annotate] re-run with --apply to persist.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
