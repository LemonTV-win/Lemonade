<script lang="ts">
	import { enhance } from '$app/forms';
	import { SERVERS, SEASONS, getSeasonFullName, type Season } from '$lib/data/game';
	import {
		VOD_TYPES,
		VOD_TYPES_LABELS,
		VOD_FORMATS,
		VOD_FORMATS_LABELS,
		GAME_VERSIONS,
		GAME_VERSIONS_LABELS
	} from '$lib/data/vod';

	let {
		open = $bindable(false),
		onSubmit,
		onClose
	} = $props<{
		open?: boolean;
		onSubmit?: () => void;
		onClose?: () => void;
	}>();

	let urls = $state('');
	let server = $state<'CN' | 'APAC' | 'NA' | 'EU'>('CN');
	let type = $state('ranked');
	let season = $state('');
	let player = $state('');
	let formatOverride = $state('');
	let gameVersionOverride = $state('');
	let submitting = $state(false);

	type BatchResult = {
		success?: boolean;
		message?: string;
		requested?: number;
		inserted?: number;
		skippedExisting?: number;
		failed?: { url: string; reason: string }[];
	};
	let result = $state<BatchResult | null>(null);

	let dialogEl: HTMLDialogElement;
	let closeListener: (() => void) | null = null;

	$effect(() => {
		if (dialogEl) {
			if (open && !dialogEl.open) dialogEl.showModal();
			if (!open && dialogEl.open) dialogEl.close();
			if (!closeListener) {
				closeListener = () => onClose?.();
				dialogEl.addEventListener('close', closeListener);
			}
		}
	});

	let urlCount = $derived(urls.split(/[\s,]+/).filter(Boolean).length);

	function handleClose() {
		open = false;
		onClose?.();
	}
</script>

<dialog
	bind:this={dialogEl}
	class="w-[min(90vw,640px)] rounded-lg border border-amber-300/30 bg-black/95 p-8 text-amber-200 shadow-2xl backdrop-blur-sm"
>
	<h2 class="mb-1 text-lg font-semibold text-amber-300">Batch add VODs</h2>
	<p class="mb-4 text-xs text-amber-200/70">
		Paste one or more video URLs (YouTube / Bilibili / Twitch), one per line. Title, thumbnail,
		uploader and publish date are fetched automatically. Map and characters are left empty so they
		can be annotated later.
	</p>

	<form
		method="post"
		action="?/addVodsBatch"
		use:enhance={() => {
			submitting = true;
			return async ({ result: actionResult, update }) => {
				submitting = false;
				const data = (actionResult as { data?: { batch?: BatchResult } })?.data;
				result = data?.batch ?? null;
				await update({ reset: false });
				if (result?.inserted) onSubmit?.();
			};
		}}
	>
		<label class="mb-2 block text-sm text-amber-300">
			URLs <span class="text-amber-200/60">({urlCount})</span>
			<textarea
				name="urls"
				bind:value={urls}
				rows="8"
				placeholder="https://www.bilibili.com/video/BV...&#10;https://youtu.be/..."
				class="mt-1 mb-3 w-full resize-y rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 font-mono text-xs text-white focus:border-amber-400 focus:outline-none"
			></textarea>
		</label>

		<div class="grid grid-cols-2 gap-3">
			<label class="block text-sm text-amber-300">
				Server
				<select
					name="server"
					bind:value={server}
					class="mt-1 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
				>
					{#each SERVERS as s}
						<option value={s}>{s}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm text-amber-300">
				Type
				<select
					name="type"
					bind:value={type}
					class="mt-1 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
				>
					{#each VOD_TYPES as t}
						<option value={t}>{VOD_TYPES_LABELS[t]()}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm text-amber-300">
				Season (optional)
				<select
					name="season"
					bind:value={season}
					class="mt-1 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
				>
					<option value="">Unset</option>
					{#each SEASONS as s}
						<option value={s}>{getSeasonFullName(s as Season)}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm text-amber-300">
				Player override (optional)
				<input
					type="text"
					name="player"
					bind:value={player}
					placeholder="Leave empty to use uploader"
					class="mt-1 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
				/>
			</label>
			<label class="block text-sm text-amber-300">
				Format override
				<select
					name="format"
					bind:value={formatOverride}
					class="mt-1 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
				>
					<option value="">Auto from title</option>
					{#each VOD_FORMATS as f}
						<option value={f}>{VOD_FORMATS_LABELS[f]}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm text-amber-300">
				Version override
				<select
					name="gameVersion"
					bind:value={gameVersionOverride}
					class="mt-1 w-full rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
				>
					<option value="">Auto from title</option>
					{#each GAME_VERSIONS as version}
						<option value={version}>{GAME_VERSIONS_LABELS[version]}</option>
					{/each}
				</select>
			</label>
		</div>

		{#if result}
			<div class="mt-4 rounded border border-amber-300/20 bg-zinc-900/60 p-3 text-xs">
				{#if result.message}
					<p class="text-red-300">{result.message}</p>
				{:else}
					<p class="text-amber-200">
						Added <span class="font-semibold text-green-300">{result.inserted}</span>, skipped
						<span class="font-semibold">{result.skippedExisting}</span> existing, of
						<span class="font-semibold">{result.requested}</span> URLs.
					</p>
					{#if result.failed && result.failed.length}
						<p class="mt-2 text-amber-300">Failed ({result.failed.length}):</p>
						<ul class="mt-1 max-h-28 list-disc overflow-y-auto pl-5 text-amber-200/70">
							{#each result.failed as f}
								<li class="break-all">{f.url} — {f.reason}</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</div>
		{/if}

		<div class="mt-5 flex gap-4">
			<button
				type="submit"
				disabled={submitting || urlCount === 0}
				class="rounded bg-gradient-to-r from-yellow-300 to-amber-500 px-6 py-2 font-semibold text-black shadow hover:from-yellow-200 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{submitting ? 'Importing…' : `Import ${urlCount || ''}`}
			</button>
			<button
				type="button"
				onclick={handleClose}
				class="rounded border border-amber-300/30 bg-black px-6 py-2 font-semibold text-amber-300 hover:bg-amber-300 hover:text-black"
			>
				Close
			</button>
		</div>
	</form>
</dialog>
