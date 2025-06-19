<script lang="ts">
	import { MAPS, type GameMap, MAP_SIZE, MAP_SCALE_FACTOR, MAP_NAME } from '$lib/data/game';
	import { browser } from '$app/environment';
	import type { Point } from '$lib/data/geometry';
	import { INTERCEPTORS, type Interceptor } from '$lib/data/interceptors';
	import type { PageData } from './$types';

	const { data } = $props<{ data: PageData }>();

	// Merge server data with legacy data, preferring server data
	const serverInterceptors = data.interceptors || {};
	let mergedInterceptors: Record<string, Interceptor> = $state({
		...INTERCEPTORS,
		...serverInterceptors
	});

	let selectedInterceptor: string | null = $state(Object.keys(mergedInterceptors)[0] || null);
	let selectedMap: GameMap = $state(
		browser ? (localStorage.getItem('selectedMap') as GameMap) || 'ocarnus' : 'ocarnus'
	);
	let mousePosition: Point = $state({ x: 0, y: 0 });
	let isEditMode = $state(false);
	let editingInterceptor: string | null = $state(null);
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);

	const mapInterceptorCounts = $derived(
		Object.fromEntries(
			MAPS.map((map) => [
				map,
				Object.values(mergedInterceptors).filter(
					(interceptor: Interceptor) => interceptor.map === map
				).length
			])
		)
	);

	const sortedMaps = $derived(
		[...MAPS].sort((a, b) => mapInterceptorCounts[b] - mapInterceptorCounts[a])
	);

	let interceptors: Map<string, Interceptor> = $derived(
		new Map(
			Object.entries(mergedInterceptors).filter(
				([_, interceptor]: [string, Interceptor]) => interceptor.map === selectedMap
			)
		)
	);

	function handleMouseMove(event: MouseEvent) {
		const svg = event.currentTarget as SVGElement;
		const mapImage = svg.querySelector('image') as SVGImageElement;
		const rect = mapImage.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 100;
		const y = ((event.clientY - rect.top) / rect.height) * 100;
		mousePosition = { x, y };
	}

	function handleMapClick(event: MouseEvent) {
		if (!isEditMode) return;

		const svg = event.currentTarget as SVGElement;
		const mapImage = svg.querySelector('image') as SVGImageElement;
		const rect = mapImage.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 100;
		const y = ((event.clientY - rect.top) / rect.height) * 100;

		// Create new interceptor
		const newId = `NEW_${Date.now()}`;
		const newInterceptor: Interceptor = {
			map: selectedMap,
			name: `New Interceptor ${Object.keys(mergedInterceptors).length + 1}`,
			side: 'defender',
			roundStart: true,
			position: { x, y },
			deploy_position: { x, y },
			images: {
				deploy: '',
				overview: '',
				end: ''
			},
			video: '',
			jump: 'none'
		};

		// Add to merged interceptors
		mergedInterceptors[newId] = newInterceptor;
		selectedInterceptor = newId;
		editingInterceptor = newId;
		isEditMode = false;
	}

	function toggleEditMode() {
		isEditMode = !isEditMode;
		if (!isEditMode) {
			editingInterceptor = null;
		}
	}

	async function saveInterceptor() {
		if (!editingInterceptor) return;

		isSaving = true;
		saveError = null;

		try {
			const interceptor = mergedInterceptors[editingInterceptor];
			const isNew = editingInterceptor.startsWith('NEW_');

			let response: Response;

			if (isNew) {
				// Create new interceptor
				response = await fetch('/api/interceptors', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(interceptor)
				});
			} else {
				// Update existing interceptor
				response = await fetch(`/api/interceptors/${editingInterceptor}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(interceptor)
				});
			}

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to save interceptor');
			}

			// If it was a new interceptor, update the ID
			if (isNew && result.data?.id) {
				const oldId = editingInterceptor;
				mergedInterceptors[result.data.id] = mergedInterceptors[oldId];
				delete mergedInterceptors[oldId];
				selectedInterceptor = result.data.id;
				editingInterceptor = result.data.id;
			}

			editingInterceptor = null;
		} catch (error) {
			saveError = error instanceof Error ? error.message : 'Failed to save interceptor';
			console.error('Error saving interceptor:', error);
		} finally {
			isSaving = false;
		}
	}

	async function deleteInterceptor(id: string | null) {
		if (!id || !confirm('Are you sure you want to delete this interceptor?')) return;

		// Don't delete new interceptors that haven't been saved
		if (id.startsWith('NEW_')) {
			delete mergedInterceptors[id];
			if (selectedInterceptor === id) {
				selectedInterceptor = Object.keys(mergedInterceptors)[0] || null;
			}
			editingInterceptor = null;
			return;
		}

		try {
			const response = await fetch(`/api/interceptors/${id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to delete interceptor');
			}

			delete mergedInterceptors[id];
			if (selectedInterceptor === id) {
				selectedInterceptor = Object.keys(mergedInterceptors)[0] || null;
			}
			editingInterceptor = null;
		} catch (error) {
			console.error('Error deleting interceptor:', error);
			alert('Failed to delete interceptor. Please try again.');
		}
	}

	function updateInterceptorProperty(property: keyof Interceptor, value: any) {
		if (!editingInterceptor || !mergedInterceptors[editingInterceptor]) return;

		if (property === 'position' || property === 'deploy_position') {
			mergedInterceptors[editingInterceptor][property] = value;
		} else {
			(mergedInterceptors[editingInterceptor] as any)[property] = value;
		}
	}

	$effect(() => {
		// Set selected interceptor to first available for current map only if none is selected
		const availableInterceptors = [...interceptors.keys()];
		if (availableInterceptors.length > 0 && !selectedInterceptor) {
			selectedInterceptor = availableInterceptors[0];
		} else if (availableInterceptors.length === 0) {
			selectedInterceptor = null;
		}
	});

	$effect(() => {
		if (browser) {
			localStorage.setItem('selectedMap', selectedMap);
		}
	});

	const INTERCEPTOR_RADIUS = 30;
</script>

<main class="my-auto grid grid-cols-2 gap-4 p-4">
	<div class="relative h-[500px]">
		<div class="absolute top-2 right-2 z-10 flex gap-2">
			<button
				onclick={toggleEditMode}
				disabled={!!editingInterceptor}
				class={[
					'rounded border px-3 py-1 text-sm transition-all',
					{
						'border-blue-700/50 bg-blue-600/20 text-blue-300 hover:bg-blue-500/30':
							!isEditMode && !editingInterceptor,
						'border-green-700/50 bg-green-600/20 text-green-300 hover:bg-green-500/30':
							isEditMode && !editingInterceptor,
						'cursor-not-allowed border-gray-700/50 bg-gray-600/20 text-gray-400': editingInterceptor
					}
				]}
			>
				{isEditMode ? 'Exit Add Mode' : 'Add Interceptor'}
			</button>
			<select
				bind:value={selectedMap}
				disabled={!!editingInterceptor}
				class={[
					'min-w-32 rounded px-2 py-1 text-sm',
					{
						'bg-black/50 text-white': !editingInterceptor,
						'cursor-not-allowed bg-gray-600/30 text-gray-400': editingInterceptor
					}
				]}
			>
				{#each sortedMaps as map}
					<option value={map}>
						{MAP_NAME[map]} ({mapInterceptorCounts[map]})
					</option>
				{/each}
			</select>
		</div>
		<svg
			class="h-full w-full"
			viewBox={`0 0 ${MAP_SIZE.x} ${MAP_SIZE.y}`}
			onmousemove={handleMouseMove}
			onclick={handleMapClick}
			role="presentation"
			class:cursor-crosshair={isEditMode}
		>
			<image
				xlink:href="/minimaps/{selectedMap}.png"
				x="0"
				y="0"
				width={MAP_SIZE.x}
				height={MAP_SIZE.y}
			/>
			{#each [...interceptors.entries()].sort((a, b) => a[1].position.x - b[1].position.x) as [key, interceptor]}
				{#if key === selectedInterceptor}
					<image
						xlink:href={interceptor.side === 'attacker'
							? '/characters/celestia_atk.png'
							: '/characters/celestia_dfn.png'}
						x={MAP_SIZE.x * (interceptor.deploy_position.x / 100) - 7.5}
						y={MAP_SIZE.y * (interceptor.deploy_position.y / 100) - 7.5}
						width="15"
						height="15"
					/>

					<circle
						cx={MAP_SIZE.x * (interceptor.position.x / 100)}
						cy={MAP_SIZE.y * (interceptor.position.y / 100)}
						r={INTERCEPTOR_RADIUS * MAP_SCALE_FACTOR[selectedMap]}
						fill="transparent"
						stroke="yellow"
						stroke-width="1"
					/>
				{/if}

				<circle
					cx={MAP_SIZE.x * (interceptor.position.x / 100)}
					cy={MAP_SIZE.y * (interceptor.position.y / 100)}
					r="10"
					fill="transparent"
					cursor={editingInterceptor ? 'default' : 'pointer'}
					role="button"
					tabindex="0"
					onclick={() => {
						if (!editingInterceptor) {
							selectedInterceptor = key;
						}
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' && !editingInterceptor) {
							selectedInterceptor = key;
						}
					}}
				/>

				{#if key === selectedInterceptor}
					<image
						xlink:href="/icons/interceptor.png"
						x={MAP_SIZE.x * (interceptor.position.x / 100) - 10}
						y={MAP_SIZE.y * (interceptor.position.y / 100) - 10}
						width="20"
						height="20"
					/>
				{:else}
					<circle
						cx={MAP_SIZE.x * (interceptor.position.x / 100)}
						cy={MAP_SIZE.y * (interceptor.position.y / 100)}
						r="2"
						fill="red"
					/>
				{/if}
			{/each}
		</svg>
		<div class="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-sm text-white">
			X: {mousePosition.x.toFixed(2)}%, Y: {mousePosition.y.toFixed(2)}%
		</div>
	</div>
	<div class="max-h-[500px] p-2">
		{#if selectedInterceptor && mergedInterceptors[selectedInterceptor]}
			{@const interceptor = mergedInterceptors[selectedInterceptor]}
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<select
						bind:value={selectedInterceptor}
						disabled={!!editingInterceptor}
						class={[
							'text-md min-w-64 rounded px-2 py-1 text-white focus:ring-0 focus:outline-none',
							{
								'bg-black/50': !editingInterceptor,
								'cursor-not-allowed bg-gray-600/30 text-gray-400': editingInterceptor
							}
						]}
					>
						{#each [...interceptors.entries()] as [key, interceptorItem]}
							<option value={key} class="bg-black">{interceptorItem.name}</option>
						{/each}
					</select>
					<div class="flex gap-2">
						{#if editingInterceptor === selectedInterceptor}
							<button
								onclick={saveInterceptor}
								disabled={isSaving}
								class={[
									'rounded border px-2 py-1 text-sm transition-all',
									{
										'border-green-700/50 bg-green-600/20 text-green-300 hover:bg-green-500/30':
											!isSaving,
										'cursor-not-allowed border-gray-700/50 bg-gray-600/20 text-gray-400': isSaving
									}
								]}
							>
								{isSaving ? 'Saving...' : 'Save'}
							</button>
							<button
								onclick={() => (editingInterceptor = null)}
								disabled={isSaving}
								class={[
									'rounded border px-2 py-1 text-sm transition-all',
									{
										'border-gray-700/50 bg-gray-600/20 text-gray-300 hover:bg-gray-500/30':
											!isSaving,
										'cursor-not-allowed border-gray-700/50 bg-gray-600/20 text-gray-400': isSaving
									}
								]}
							>
								Cancel
							</button>
						{:else}
							<button
								onclick={() => (editingInterceptor = selectedInterceptor)}
								class="rounded border border-blue-700/50 bg-blue-600/20 px-2 py-1 text-sm text-blue-300 transition-all hover:bg-blue-500/30"
							>
								Edit
							</button>
							<button
								onclick={() => deleteInterceptor(selectedInterceptor)}
								class="rounded border border-red-700/50 bg-red-600/20 px-2 py-1 text-sm text-red-300 transition-all hover:bg-red-500/30"
							>
								Delete
							</button>
						{/if}
					</div>
				</div>

				{#if saveError}
					<div class="rounded border border-red-700/50 bg-red-600/20 p-3 text-red-300">
						<strong>Error:</strong>
						{saveError}
					</div>
				{/if}

				{#if editingInterceptor === selectedInterceptor}
					<!-- Edit Form -->
					<div class="space-y-4 rounded bg-black/20 p-4">
						<div>
							<label for="interceptor-name" class="mb-1 block text-sm text-gray-300">Name</label>
							<input
								id="interceptor-name"
								type="text"
								bind:value={interceptor.name}
								onchange={(e) =>
									updateInterceptorProperty('name', (e.target as HTMLInputElement).value)}
								class="w-full rounded border border-gray-600 bg-black/50 px-2 py-1 text-white focus:border-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="interceptor-side" class="mb-1 block text-sm text-gray-300">Side</label>
							<select
								id="interceptor-side"
								bind:value={interceptor.side}
								onchange={(e) =>
									updateInterceptorProperty('side', (e.target as HTMLSelectElement).value)}
								class="w-full rounded border border-gray-600 bg-black/50 px-2 py-1 text-white focus:border-amber-500 focus:outline-none"
							>
								<option value="defender">Defender</option>
								<option value="attacker">Attacker</option>
							</select>
						</div>
						<div>
							<label for="interceptor-jump" class="mb-1 block text-sm text-gray-300">Jump</label>
							<select
								id="interceptor-jump"
								bind:value={interceptor.jump}
								onchange={(e) =>
									updateInterceptorProperty('jump', (e.target as HTMLSelectElement).value)}
								class="w-full rounded border border-gray-600 bg-black/50 px-2 py-1 text-white focus:border-amber-500 focus:outline-none"
							>
								<option value="none">None</option>
								<option value="once">Once</option>
								<option value="twice">Twice</option>
							</select>
						</div>
						<div class="flex items-center gap-2">
							<input
								id="interceptor-round-start"
								type="checkbox"
								bind:checked={interceptor.roundStart}
								onchange={(e) =>
									updateInterceptorProperty('roundStart', (e.target as HTMLInputElement).checked)}
								class="rounded"
							/>
							<label for="interceptor-round-start" class="text-sm text-gray-300">Round Start</label>
						</div>
						<div>
							<label for="interceptor-pos-x" class="mb-1 block text-sm text-gray-300"
								>Position X: {interceptor.position.x.toFixed(1)}%</label
							>
							<input
								id="interceptor-pos-x"
								type="range"
								min="0"
								max="100"
								step="0.1"
								bind:value={interceptor.position.x}
								onchange={(e) =>
									updateInterceptorProperty('position', {
										...interceptor.position,
										x: parseFloat((e.target as HTMLInputElement).value)
									})}
								class="w-full"
							/>
						</div>
						<div>
							<label for="interceptor-pos-y" class="mb-1 block text-sm text-gray-300"
								>Position Y: {interceptor.position.y.toFixed(1)}%</label
							>
							<input
								id="interceptor-pos-y"
								type="range"
								min="0"
								max="100"
								step="0.1"
								bind:value={interceptor.position.y}
								onchange={(e) =>
									updateInterceptorProperty('position', {
										...interceptor.position,
										y: parseFloat((e.target as HTMLInputElement).value)
									})}
								class="w-full"
							/>
						</div>
						<div>
							<label for="interceptor-deploy-x" class="mb-1 block text-sm text-gray-300"
								>Deploy Position X: {interceptor.deploy_position.x.toFixed(1)}%</label
							>
							<input
								id="interceptor-deploy-x"
								type="range"
								min="0"
								max="100"
								step="0.1"
								bind:value={interceptor.deploy_position.x}
								onchange={(e) =>
									updateInterceptorProperty('deploy_position', {
										...interceptor.deploy_position,
										x: parseFloat((e.target as HTMLInputElement).value)
									})}
								class="w-full"
							/>
						</div>
						<div>
							<label for="interceptor-deploy-y" class="mb-1 block text-sm text-gray-300"
								>Deploy Position Y: {interceptor.deploy_position.y.toFixed(1)}%</label
							>
							<input
								id="interceptor-deploy-y"
								type="range"
								min="0"
								max="100"
								step="0.1"
								bind:value={interceptor.deploy_position.y}
								onchange={(e) =>
									updateInterceptorProperty('deploy_position', {
										...interceptor.deploy_position,
										y: parseFloat((e.target as HTMLInputElement).value)
									})}
								class="w-full"
							/>
						</div>
					</div>
				{:else}
					<!-- Display Mode -->
					<div
						class={[
							'text-center text-gray-400',
							{
								'text-green-400': interceptor.jump === 'none',
								'text-blue-400': interceptor.jump === 'once',
								'text-red-400': interceptor.jump === 'twice'
							}
						]}
					>
						{#if interceptor.jump === 'none'}
							Stand
						{:else if interceptor.jump === 'once'}
							Jump
						{:else if interceptor.jump === 'twice'}
							Double Jump
						{/if}
					</div>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="group relative">
							<img
								class="h-auto max-h-[300px] w-full rounded-sm object-contain shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-transform duration-300 hover:scale-105"
								src={interceptor.images.deploy}
								alt={`${selectedInterceptor} deploy`}
							/>
							<div
								class="absolute right-0 bottom-0 left-0 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100"
							>
								Deploy Position
							</div>
						</div>

						<div class="group relative">
							<img
								class="h-auto max-h-[300px] w-full rounded-sm object-contain shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-transform duration-300 hover:scale-105"
								src={interceptor.images.overview}
								alt={`${selectedInterceptor} overview`}
							/>
							<div
								class="absolute right-0 bottom-0 left-0 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100"
							>
								Overview
							</div>
						</div>

						{#if interceptor.images.end}
							<div class="group relative">
								<img
									class="h-auto max-h-[300px] w-full rounded-sm object-contain shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-transform duration-300 hover:scale-105"
									src={interceptor.images.end}
									alt={`${selectedInterceptor} end`}
								/>
								<div
									class="absolute right-0 bottom-0 left-0 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100"
								>
									End Result
								</div>
							</div>
						{/if}
						{#if interceptor.video}
							<div class="group relative">
								<!-- svelte-ignore a11y_media_has_caption -->
								<video
									class="h-auto max-h-[300px] w-full rounded-sm object-contain shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-transform duration-300 hover:scale-105"
									src={interceptor.video}
									controls
								></video>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<p class="text-center text-gray-400">Select an interceptor</p>
		{/if}
	</div>
</main>

<style>
	:global(body) {
		background-image: url('/maps/ocarnus.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		position: relative;
	}

	:global(body::before) {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(10px);
		z-index: -1;
	}
</style>
