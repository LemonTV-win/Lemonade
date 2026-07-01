<script lang="ts">
	import type { NewVod } from '$lib/server/db/schemas/vod';
	import CharacterIcon from '$lib/components/CharacterIcon.svelte';
	import MapIcon from '$lib/components/MapIcon.svelte';
	import PlatformIcon from '$lib/components/PlatformIcon.svelte';
	import RankIcon from '$lib/components/RankIcon.svelte';

	import { CHARACTER_NAMES, getSeasonName, MAP_NAMES, type Season } from '$lib/data/game';
	import { GAME_VERSIONS_LABELS, VOD_FORMATS_LABELS } from '$lib/data/vod';
	import { getLocale } from '$lib/paraglide/runtime';

	let { vod, onEdit }: { vod: NewVod; onEdit: (vod: NewVod) => void } = $props();

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
				loading="lazy"
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
		{#if vod.character_first}
			<div class="flex items-center gap-2">
				<CharacterIcon character={vod.character_first} class="h-6 w-6" />
				<span class="text-xs text-amber-100">{CHARACTER_NAMES[vod.character_first]()}</span>
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<CharacterIcon character={null} class="h-6 w-6" />
				<span class="text-xs text-amber-400/60 italic">Unannotated</span>
			</div>
		{/if}
		{#if vod.character_second}
			<div class="flex items-center gap-2">
				<CharacterIcon character={vod.character_second} class="h-6 w-6" />
				<span class="text-xs text-amber-100">{CHARACTER_NAMES[vod.character_second]()}</span>
			</div>
		{:else}
			<div></div>
		{/if}
		{#if vod.map}
			<div class="flex items-center gap-2">
				<span class="inline-block h-6 w-10 align-middle"><MapIcon map={vod.map} /></span>
				<span class="text-xs text-amber-100">{MAP_NAMES[vod.map]()}</span>
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<span
					class="inline-flex h-6 w-10 items-center justify-center rounded bg-gray-700 align-middle text-[10px] text-gray-400"
					>?</span
				>
				<span class="text-xs text-amber-400/60 italic">No map</span>
			</div>
		{/if}
	</div>
	<div class="flex items-center gap-2 px-2 pb-2">
		<PlatformIcon platform={vod.platform} />
		<span>
			{vod.player}
		</span>
		<span class="rounded bg-amber-300/10 px-1.5 py-0.5 text-[10px] text-amber-200/80">
			{VOD_FORMATS_LABELS[vod.format ?? 'player_pov']}
		</span>
		{#if vod.gameVersion && vod.gameVersion !== 'pc'}
			<span class="rounded bg-sky-300/10 px-1.5 py-0.5 text-[10px] text-sky-200/80">
				{GAME_VERSIONS_LABELS[vod.gameVersion]}
			</span>
		{/if}
		{#if vod.season}
			<span class="text-xs text-amber-300">{getSeasonName(vod.season as Season)}</span>
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
