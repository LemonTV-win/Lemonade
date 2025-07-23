<script lang="ts">
	import type { NewVod } from '$lib/server/db/schemas/vod';
	import CharacterIcon from '$lib/components/CharacterIcon.svelte';
	import MapIcon from '$lib/components/MapIcon.svelte';
	import RankIcon from '$lib/components/RankIcon.svelte';

	import { CHARACTER_NAMES, MAP_NAMES } from '$lib/data/game';
	import { getLocale } from '$lib/paraglide/runtime';

	let { vod, onEdit }: { vod: NewVod; onEdit: (vod: NewVod) => void } = $props();

	function getSeasonName(season: string): string {
		return season.replace('C', 'CalabiYau S').replace('G', 'Strinova S');
	}

	function formatPublishedAt(date: string | number | Date | undefined): string {
		if (!date) return '';
		try {
			return new Intl.DateTimeFormat(getLocale(), {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
				// , second: '2-digit' // (optional)
			}).format(new Date(date));
		} catch {
			return '';
		}
	}
</script>

<div
	class="flex flex-col gap-1 overflow-hidden rounded-md border border-amber-200/20 bg-black/80 shadow-md transition-transform duration-200 hover:scale-105 hover:border-amber-300"
>
	<a href={vod.url} target="_blank" class="contents">
		<div class="aspect-[16/9] w-full overflow-hidden bg-black">
			<img
				src={`/api/thumbnail-proxy?url=${encodeURIComponent(vod.thumbnail)}`}
				alt="Thumbnail"
				class="h-full w-full object-cover"
			/>
		</div>
	</a>
	<div class="px-2 pt-1 pb-0">
		<div class="truncate text-xs font-medium text-amber-100/90" title={vod.title}>
			{vod.title}
		</div>
		{#if vod.publishedAt}
			<time class="text-xs text-amber-400" datetime={vod.publishedAt.toString()}>
				{formatPublishedAt(vod.publishedAt)}
			</time>
		{/if}
	</div>
	<div class="grid grid-cols-[auto_auto_1fr] items-center gap-4 px-2 py-1">
		<div class="flex items-center gap-2">
			<CharacterIcon character={vod.character_first} class="h-6 w-6" />
			<span class="text-xs text-amber-100">{CHARACTER_NAMES[vod.character_first]()}</span>
		</div>
		{#if vod.character_second}
			<div class="flex items-center gap-2">
				<CharacterIcon character={vod.character_second} class="h-6 w-6" />
				<span class="text-xs text-amber-100">{CHARACTER_NAMES[vod.character_second]()}</span>
			</div>
		{:else}
			<div></div>
		{/if}
		<div class="flex items-center gap-2">
			<span class="inline-block h-6 w-10 align-middle"><MapIcon map={vod.map} /></span>
			<span class="text-xs text-amber-100">{MAP_NAMES[vod.map]()}</span>
		</div>
	</div>
	<div class="flex items-center gap-2 px-2 pb-2">
		<span class="text-xs text-amber-100">
			{vod.platform === 'youtube' ? 'Youtube' : 'Bilibili'}
		</span>
		<span>
			{vod.player}
		</span>
		{#if vod.season}
			<span class="text-xs text-amber-300">{getSeasonName(vod.season)}</span>
		{/if}
		{#if vod.rank}
			<RankIcon rank={vod.rank} />
			<span class="text-xs text-amber-100">{vod.rank}</span>
		{/if}
	</div>
	<button
		onclick={() => onEdit(vod)}
		class="mx-2 mt-1 mb-2 rounded border border-amber-700/50 bg-black/60 px-2 py-1 text-xs text-amber-300 transition hover:bg-amber-500/20"
		>Edit</button
	>
</div>
