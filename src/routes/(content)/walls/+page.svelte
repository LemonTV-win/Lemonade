<script lang="ts">
	import { MAPS, type GameMap } from '$lib/data/game';
	import { browser } from '$app/environment';
	const MAP_SIZE = {
		x: 500,
		y: 500
	};

	import type { Point, Position } from '$lib/data/geometry';

	import { WALLS, type Wall } from '$lib/data/walls';

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

	const mapWallCounts = $derived(
		Object.fromEntries(
			MAPS.map((map) => [map, Object.values(WALLS).filter((wall) => wall.map === map).length])
		)
	);

	const sortedMaps = $derived([...MAPS].sort((a, b) => mapWallCounts[b] - mapWallCounts[a]));

	const LENGTH = 24.25;
	function getPoints(start: Point, angle: number, scale: number = 1): [Point, Point] {
		const x = start.x + LENGTH * Math.cos(angle) * scale;
		const y = start.y + LENGTH * Math.sin(angle) * scale;
		return [
			{ x: start.x, y: start.y },
			{ x, y }
		];
	}

	let selectedWall: string | null = $state(Object.keys(WALLS)[0]);
	let selectedMap: GameMap = $state(
		browser ? (localStorage.getItem('selectedMap') as GameMap) || 'ocarnus' : 'ocarnus'
	);
	let mousePosition: Point = $state({ x: 0, y: 0 });

	let walls: Map<string, Wall> = $derived(
		new Map(Object.entries(WALLS).filter(([_, wall]) => wall.map === selectedMap))
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
		selectedWall = [...walls.keys()][0];
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
					<option value={map}>{MAP_NAME[map]} ({mapWallCounts[map]})</option>
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
			{#each [...walls.entries()].sort((a, b) => a[1].position.start.x - b[1].position.start.x) as [key, wall]}
				{@const points = getPoints(
					wall.position.start,
					wall.position.angle,
					MAP_SCALE_FACTOR[selectedMap]
				)}

				{#if key === selectedWall}
					<image
						xlink:href="/characters/reiichi.png"
						x={MAP_SIZE.x * (wall.deploy_position.x / 100) - 7.5}
						y={MAP_SIZE.y * (wall.deploy_position.y / 100) - 7.5}
						width="15"
						height="15"
					/>
				{/if}

				<line
					x1={MAP_SIZE.x * (points[0].x / 100)}
					y1={MAP_SIZE.y * (points[0].y / 100)}
					x2={MAP_SIZE.x * (points[1].x / 100)}
					y2={MAP_SIZE.y * (points[1].y / 100)}
					stroke="transparent"
					stroke-width="15"
					cursor="pointer"
					role="button"
					tabindex="0"
					onclick={() => (selectedWall = key)}
					onkeydown={(e) => {
						if (e.key === 'Enter') selectedWall = key;
					}}
				/>

				<!-- Visible wall line -->
				<line
					x1={MAP_SIZE.x * (points[0].x / 100)}
					y1={MAP_SIZE.y * (points[0].y / 100)}
					x2={MAP_SIZE.x * (points[1].x / 100)}
					y2={MAP_SIZE.y * (points[1].y / 100)}
					stroke={key === selectedWall ? 'yellow' : 'red'}
					stroke-width={2}
				/>
			{/each}
		</svg>
		<div class="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-sm text-white">
			X: {mousePosition.x.toFixed(2)}%, Y: {mousePosition.y.toFixed(2)}%
		</div>
	</div>
	<div class="max-h-[500px] p-4">
		{#if selectedWall}
			{@const wall = WALLS[selectedWall]}
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<select
						bind:value={selectedWall}
						class="text-md min-w-64 rounded bg-black/50 px-2 py-1 text-white focus:ring-0 focus:outline-none"
					>
						{#each [...walls.entries()] as [key, wall]}
							<option value={key} class="bg-black">{wall.name}</option>
						{/each}
					</select>
					<div
						class={[
							'text-center text-gray-400',
							{
								'text-green-400': wall.jump === 'none',
								'text-blue-400': wall.jump === 'once',
								'text-red-400': wall.jump === 'twice'
							}
						]}
					>
						{#if wall.jump === 'none'}
							Stand
						{:else if wall.jump === 'once'}
							Jump
						{:else if wall.jump === 'twice'}
							Double Jump
						{/if}
					</div>
				</div>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="group relative">
						<img
							class="h-auto max-h-[300px] w-full rounded-sm object-contain shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-transform duration-300 hover:scale-105"
							src={wall.images.deploy}
							alt={`${selectedWall} deploy`}
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
							src={wall.images.overview}
							alt={`${selectedWall} overview`}
						/>
						<div
							class="absolute right-0 bottom-0 left-0 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100"
						>
							Overview
						</div>
					</div>

					{#if wall.images.end}
						<div class="group relative">
							<img
								class="h-auto max-h-[300px] w-full rounded-sm object-contain shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-transform duration-300 hover:scale-105"
								src={wall.images.end}
								alt={`${selectedWall} end`}
							/>
							<div
								class="absolute right-0 bottom-0 left-0 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100"
							>
								End Result
							</div>
						</div>
					{/if}
					{#if wall.video}
						<div class="group relative">
							<!-- svelte-ignore a11y_media_has_caption -->
							<video
								class="h-auto max-h-[300px] w-full rounded-sm object-contain shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-transform duration-300 hover:scale-105"
								src={wall.video}
								controls
							></video>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<p class="text-center text-gray-400">Select a wall</p>
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
