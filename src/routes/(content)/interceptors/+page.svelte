<script lang="ts">
	import { MAPS, type GameMap } from '$lib/data/game';
	import { browser } from '$app/environment';
	const MAP_SIZE = {
		x: 500,
		y: 500
	};

	import type { Point } from '$lib/data/geometry';

	import { INTERCEPTORS, type Interceptor } from '$lib/data/interceptors';

	const MAP_NAME: Record<GameMap, string> = {
		ocarnus: 'Ocarnus',
		windy_town: 'Windy Town',
		base_404: 'Base 404',
		area_88: 'Area 88',
		port_euler: 'Port Euler',
		space_lab: 'Space Lab',
		cauchy_district: 'Cauchy District',
		cosmite: 'Cosmite'
	};

	const MAP_SCALE_FACTOR: Record<GameMap, number> = {
		ocarnus: 1,
		windy_town: 0.94,
		base_404: 1,
		area_88: 1,
		port_euler: 1,
		space_lab: 1,
		cauchy_district: 1,
		cosmite: 1
	};

	let selectedInterceptor: string | null = $state(Object.keys(INTERCEPTORS)[0]);
	let selectedMap: GameMap = $state(
		browser ? (localStorage.getItem('selectedMap') as GameMap) || 'ocarnus' : 'ocarnus'
	);
	let mousePosition: Point = $state({ x: 0, y: 0 });

	const mapInterceptorCounts = $derived(
		Object.fromEntries(
			MAPS.map((map) => [
				map,
				Object.values(INTERCEPTORS).filter((interceptor) => interceptor.map === map).length
			])
		)
	);

	const sortedMaps = $derived(
		[...MAPS].sort((a, b) => mapInterceptorCounts[b] - mapInterceptorCounts[a])
	);

	let interceptors: Map<string, Interceptor> = $derived(
		new Map(
			Object.entries(INTERCEPTORS).filter(([_, interceptor]) => interceptor.map === selectedMap)
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

	$effect(() => {
		selectedInterceptor = [...interceptors.keys()][0];
	});

	$effect(() => {
		if (browser) {
			localStorage.setItem('selectedMap', selectedMap);
		}
	});
</script>

<main class="my-auto grid grid-cols-2 gap-4 p-4">
	<div class="relative h-[500px]">
		<div class="absolute top-2 right-2 z-10 flex gap-2">
			<select
				bind:value={selectedMap}
				class="min-w-32 rounded bg-black/50 px-2 py-1 text-sm text-white"
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
			role="presentation"
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
						r="30"
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
					cursor="pointer"
					role="button"
					tabindex="0"
					onclick={() => (selectedInterceptor = key)}
					onkeydown={(e) => {
						if (e.key === 'Enter') selectedInterceptor = key;
					}}
				/>

				<circle
					cx={MAP_SIZE.x * (interceptor.position.x / 100)}
					cy={MAP_SIZE.y * (interceptor.position.y / 100)}
					r="2"
					fill={key === selectedInterceptor ? 'yellow' : 'red'}
				/>
			{/each}
		</svg>
		<div class="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-sm text-white">
			X: {mousePosition.x.toFixed(2)}%, Y: {mousePosition.y.toFixed(2)}%
		</div>
	</div>
	<div class="max-h-[500px] p-2">
		{#if selectedInterceptor}
			{@const interceptor = INTERCEPTORS[selectedInterceptor]}
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<select
						bind:value={selectedInterceptor}
						class="text-md min-w-64 rounded bg-black/50 px-2 py-1 text-white focus:ring-0 focus:outline-none"
					>
						{#each [...interceptors.entries()] as [key, interceptor]}
							<option value={key} class="bg-black">{interceptor.name}</option>
						{/each}
					</select>
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
