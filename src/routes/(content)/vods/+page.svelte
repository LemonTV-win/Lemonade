<script lang="ts">
	import type { PageProps } from './$types';
	import type { NewVod } from '$lib/server/db/schemas/vod';
	import VodCard from './VodCard.svelte';
	import VodDialog from './VodEdit.svelte';
	import VodFilters from './VodFilters.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: PageProps = $props();

	let selectedPlatforms: string[] = $state([]);
	let selectedMaps: string[] = $state([]);
	let selectedServers: string[] = $state([]);
	let selectedCharacters: string[] = $state([]);
	let selectedSeasons: string[] = $state([]);
	let selectedPlayers: string[] = $state([]);
	let selectedRanks: string[] = $state([]);

	let filteredVods = $derived(
		data.vods.filter(
			(vod: NewVod) =>
				(selectedPlatforms.length ? selectedPlatforms.includes(String(vod.platform)) : true) &&
				(selectedMaps.length ? selectedMaps.includes(String(vod.map)) : true) &&
				(selectedServers.length ? selectedServers.includes(String(vod.server)) : true) &&
				(selectedCharacters.length
					? selectedCharacters.includes(String(vod.character_first)) ||
						selectedCharacters.includes(String(vod.character_second))
					: true) &&
				(selectedSeasons.length ? selectedSeasons.includes(String(vod.season)) : true) &&
				(selectedPlayers.length ? selectedPlayers.includes(String(vod.player)) : true) &&
				(selectedRanks.length
					? selectedRanks.some((group) => vod.rank && String(vod.rank).startsWith(group))
					: true)
		)
	);

	function isString(val: unknown): val is string {
		return typeof val === 'string';
	}

	let openVodDialog = $state(false);
	let vodToEdit: NewVod | undefined = $state(undefined);

	function openAddVodDialog() {
		vodToEdit = undefined;
		openVodDialog = true;
	}

	function openEditVodDialog(vod: NewVod) {
		vodToEdit = vod;
		openVodDialog = true;
	}
</script>

<main class="p-4">
	<VodFilters
		platforms={data.platforms}
		maps={data.maps}
		servers={data.servers}
		characters={data.characters}
		seasons={data.seasons}
		players={data.players}
		ranks={data.ranks}
		onChange={({ detail }) => {
			selectedPlatforms = detail.selectedPlatforms;
			selectedMaps = detail.selectedMaps;
			selectedServers = detail.selectedServers;
			selectedCharacters = detail.selectedCharacters;
			selectedSeasons = detail.selectedSeasons;
			selectedPlayers = detail.selectedPlayers;
			selectedRanks = detail.selectedRanks;
		}}
	/>

	<div class="grid grid-cols-4 gap-4">
		{#each filteredVods as vod}
			<div
				class="vod-card flex flex-col gap-2 overflow-hidden rounded-md border border-amber-200/20 bg-black/80 shadow-lg transition-transform duration-200 hover:scale-105 hover:border-amber-300"
			>
				<VodCard {vod} onEdit={openEditVodDialog} />
			</div>
		{/each}
		<!-- Add VOD pseudo card -->
		<button
			class="vod-card group relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-md border-2 border-dashed border-amber-400/30 bg-gradient-to-br from-black/80 to-black/60 shadow-lg transition-all duration-300 hover:scale-105 hover:border-amber-400/60 hover:from-black/90 hover:to-black/70 hover:shadow-amber-400/20"
			onclick={openAddVodDialog}
		>
			<div class="flex flex-col items-center gap-2">
				<span
					class="text-5xl text-amber-400/80 transition-colors duration-300 group-hover:text-amber-300"
					>+</span
				>
				<span
					class="text-lg font-semibold text-amber-300/80 transition-colors duration-300 group-hover:text-amber-200"
					>Add VOD</span
				>
			</div>
			<div
				class="absolute inset-0 bg-gradient-to-t from-amber-400/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
			></div>
		</button>
	</div>
</main>

<VodDialog
	open={openVodDialog}
	{vodToEdit}
	onSubmit={async () => {
		openVodDialog = false;
		await invalidateAll();
	}}
	onClose={() => (openVodDialog = false)}
/>
