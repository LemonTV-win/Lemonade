<script lang="ts">
	import type { NewVod } from '$lib/server/db/schemas/vod';
	import {
		CHARACTER_NAMES,
		getSeasonName,
		MAP_NAMES,
		MAPS,
		PUS_CHARACTERS,
		RANKS,
		SCISORS_CHARACTERS,
		SEASONS,
		URBINO_CHARACTERS,
		type Season
	} from '$lib/data/game';
	import { enhance } from '$app/forms';

	let {
		vodToEdit,
		open = $bindable(false),
		onSubmit,
		onClose
	} = $props<{
		vodToEdit?: NewVod;
		open?: boolean;
		onSubmit?: () => void;
		onClose?: () => void;
	}>();

	function getEmptyVod(): Partial<NewVod> {
		return {
			id: '',
			url: '',
			title: '',
			thumbnail: '',
			platform: 'youtube',
			player: '',
			server: 'CN',
			map: undefined,
			character_first: undefined,
			character_second: undefined,
			season: '',
			publishedAt: undefined
		};
	}

	let editingVod: Partial<NewVod> = $state(getEmptyVod());

	// Helper to convert timestamp to yyyy-MM-dd for input
	function toDateInputValue(date: Date | undefined) {
		if (!date) return '';
		return date.toISOString().slice(0, 10);
	}
	// Helper to convert yyyy-MM-dd to timestamp (ms)
	function fromDateInputValue(val: string | undefined) {
		if (!val) return undefined;
		return new Date(val + 'T00:00:00.000Z').getTime();
	}

	// publishedAt as Date|undefined in editingVod
	let publishedAtDateInput = $state('');
	let publishedAtTimeInput = $state('');

	function toTimeInputValue(date: Date | undefined) {
		if (!date) return '';
		return date.toISOString().slice(11, 16); // 'HH:mm'
	}
	function combineDateTime(dateStr: string, timeStr: string): Date | undefined {
		if (!dateStr) return undefined;
		const time = timeStr || '00:00';
		return new Date(`${dateStr}T${time}:00.000Z`);
	}

	// On open or when editingVod.publishedAt changes, update the input states
	$effect(() => {
		const val = editingVod.publishedAt;
		let dateObj: Date | undefined = undefined;
		if (val) {
			if ((val as any) instanceof Date) {
				dateObj = val as Date;
			} else if (typeof val === 'string') {
				dateObj = new Date(val);
			}
		}
		publishedAtDateInput = toDateInputValue(dateObj);
		publishedAtTimeInput = toTimeInputValue(dateObj);
	});

	// When either input changes, update editingVod.publishedAt
	$effect(() => {
		if (publishedAtDateInput) {
			editingVod.publishedAt = combineDateTime(publishedAtDateInput, publishedAtTimeInput);
		} else {
			editingVod.publishedAt = undefined;
		}
	});

	function handlePublishedAtDateInput(e: Event) {
		publishedAtDateInput = (e.target as HTMLInputElement).value;
	}
	function handlePublishedAtTimeInput(e: Event) {
		publishedAtTimeInput = (e.target as HTMLInputElement).value;
	}

	$effect(() => {
		if (open) {
			if (vodToEdit) {
				const { publishedAt, ...rest } = vodToEdit;
				editingVod = {
					...rest,
					publishedAt:
						publishedAt && typeof publishedAt === 'number'
							? publishedAt
							: publishedAt
								? new Date(publishedAt).getTime()
								: undefined
				};
			} else {
				editingVod = getEmptyVod();
			}
		}
	});

	let dialogEl: HTMLDialogElement;
	let closeListener: (() => void) | null = null;

	$effect(() => {
		if (dialogEl) {
			if (open && !dialogEl.open) dialogEl.showModal();
			if (!open && dialogEl.open) dialogEl.close();

			if (!closeListener) {
				closeListener = () => {
					onClose?.();
				};
				dialogEl.addEventListener('close', closeListener);
			}
		}
	});

	function handleClose() {
		open = false;
		onClose?.();
	}

	async function getVideoInfo(url: string) {
		const res = await fetch(`/api/video-info?url=${encodeURIComponent(url)}`);
		if (!res.ok) return;
		const data = await res.json();
		return data;
	}

	$effect(() => {
		if (
			editingVod.url &&
			(editingVod.url.startsWith('https://www.bilibili.com/video/') ||
				editingVod.url.startsWith('https://www.youtube.com/watch?v=') ||
				editingVod.url.startsWith('https://youtu.be/') ||
				editingVod.url.startsWith('https://www.twitch.tv/videos/'))
		) {
			// cleanup searchParams except t for bilibili
			if (editingVod.url.startsWith('https://www.bilibili.com/video/')) {
				const url = new URL(editingVod.url);
				url.searchParams.forEach((value, key) => {
					if (key !== 't') {
						url.searchParams.delete(key);
					}
				});
				editingVod.url = url.toString();
			}
			getVideoInfo(editingVod.url).then((info) => {
				console.log('[video-info]', info);
				if (info) {
					editingVod.platform = info.platform;
					if (info.title && !editingVod.title) editingVod.title = info.title;
					if (info.thumbnail && !editingVod.thumbnail) editingVod.thumbnail = info.thumbnail;
					if (info.player && !editingVod.player) editingVod.player = info.player;
					if (info.publishedAt && !editingVod.publishedAt)
						editingVod.publishedAt = info.publishedAt;
				}
			});
		} else {
			editingVod.platform = undefined;
		}
	});
</script>

<dialog
	bind:this={dialogEl}
	class="rounded-lg border border-amber-300/30 bg-black/95 p-8 text-amber-200 shadow-2xl"
>
	<form
		method="post"
		action={editingVod.id ? '?/updateVod' : '?/addVod'}
		use:enhance={() => {
			console.log('submitting');
			return async () => {
				console.log('submitted');
				onSubmit?.();
			};
		}}
	>
		{#if editingVod.id}
			<input type="hidden" name="id" value={editingVod.id} />
		{/if}
		<label class="mb-2 block text-amber-300">
			URL
			<input
				type="text"
				name="url"
				bind:value={editingVod.url}
				required
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			/>
		</label>
		<label class="mb-2 block text-amber-300">
			Title
			<input
				type="text"
				name="title"
				bind:value={editingVod.title}
				required
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			/>
		</label>
		<label class="mb-2 block text-amber-300">
			Thumbnail URL
			<input
				type="text"
				name="thumbnail"
				bind:value={editingVod.thumbnail}
				required
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			/>
		</label>
		<label class="mb-2 block text-amber-300">
			Platform
			<select
				name="platform"
				bind:value={editingVod.platform}
				required
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			>
				<option value="youtube">YouTube</option>
				<option value="bilibili">Bilibili</option>
			</select>
		</label>
		<label class="mb-2 block text-amber-300">
			Player
			<input
				type="text"
				name="player"
				bind:value={editingVod.player}
				required
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			/>
		</label>
		<label class="mb-2 block text-amber-300">
			Server
			<select
				name="server"
				bind:value={editingVod.server}
				required
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			>
				<option value="CN">CN</option>
				<option value="APAC">APAC</option>
				<option value="NA">NA</option>
				<option value="EU">EU</option>
			</select>
		</label>
		<label class="mb-2 block text-amber-300">
			Map
			<select
				name="map"
				bind:value={editingVod.map}
				required
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			>
				<option value="">All</option>
				{#each MAPS as map}
					<option value={map}>{MAP_NAMES[map]()}</option>
				{/each}
			</select>
		</label>
		{#snippet characterOptions()}
			<optgroup label="P.U.S">
				{#each PUS_CHARACTERS as character}
					<option value={character}>{CHARACTER_NAMES[character]()}</option>
				{/each}
			</optgroup>
			<optgroup label="The Scissors">
				{#each SCISORS_CHARACTERS as character}
					<option value={character}>{CHARACTER_NAMES[character]()}</option>
				{/each}
			</optgroup>
			<optgroup label="Urbino">
				{#each URBINO_CHARACTERS as character}
					<option value={character}>{CHARACTER_NAMES[character]()}</option>
				{/each}
			</optgroup>
		{/snippet}
		<label class="mb-2 block text-amber-300">
			First Character
			<select
				name="character_first"
				bind:value={editingVod.character_first}
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			>
				{@render characterOptions()}
			</select>
		</label>
		<label class="mb-2 block text-amber-300">
			Second Character (optional)
			<!-- <input
				type="text"
				name="character_second"
				bind:value={editingVod.character_second}
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			/> -->
			<select
				name="character_second"
				bind:value={editingVod.character_second}
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			>
				<option value="">None</option>
				{@render characterOptions()}
			</select>
		</label>
		<label class="mb-2 block text-amber-300">
			Season (optional)
			<!-- <input
				type="text"
				name="season"
				bind:value={editingVod.season}
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			/> -->
			<select
				name="season"
				bind:value={editingVod.season}
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			>
				{#each SEASONS as season}
					<option value={season}>{getSeasonName(season as Season)}</option>
				{/each}
			</select>
		</label>
		<label class="mb-2 block text-amber-300">
			Published At (optional)
			<div class="flex gap-2">
				<input
					type="date"
					name="publishedAtDate"
					bind:value={publishedAtDateInput}
					oninput={handlePublishedAtDateInput}
					class="w-1/2 rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
				/>
				<input
					type="time"
					name="publishedAtTime"
					bind:value={publishedAtTimeInput}
					oninput={handlePublishedAtTimeInput}
					class="w-1/2 rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
				/>
				<input type="hidden" name="publishedAt" value={editingVod.publishedAt} />
			</div>
		</label>
		<label class="mb-2 block text-amber-300">
			Rank (optional)
			<select
				name="rank"
				bind:value={editingVod.rank}
				class="mt-1 mb-4 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
			>
				<option value="">No Rank</option>
				{#each RANKS as rank}
					<option value={rank}>{rank}</option>
				{/each}
			</select>
		</label>
		<div class="mt-4 flex gap-4">
			<button
				type="submit"
				class="rounded bg-gradient-to-r from-yellow-300 to-amber-500 px-6 py-2 font-semibold text-black shadow hover:from-yellow-200 hover:to-amber-400"
				>{editingVod.id ? 'Update VOD' : 'Add VOD'}</button
			>
			<button
				type="button"
				onclick={handleClose}
				class="rounded border border-amber-300/30 bg-black px-6 py-2 font-semibold text-amber-300 hover:bg-amber-300 hover:text-black"
				>Close</button
			>
		</div>
	</form>
</dialog>
