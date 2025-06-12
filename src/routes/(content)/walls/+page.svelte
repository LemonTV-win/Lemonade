<script lang="ts">
	const MAP_SIZE = {
		x: 500,
		y: 500
	};

	interface Point {
		x: number;
		y: number;
	}

	interface Position {
		start: Point; // starting point of the wall in percentage 0-100
		angle: number; // angle of the wall in radians
	}

	interface Wall {
		name: string;
		position: Position;
		deploy_position: Point;
		images: {
			deploy: string;
			overview: string;
			end?: string;
		};
		video?: string;
		jump: 'none' | 'once' | 'twice'; // stand, single jump, double jump
	}

	let WALLS: Record<string, Wall> = {
		A_SITE_PLANT: {
			name: 'A Site Plant',
			position: {
				start: { x: 59.95, y: 56 },
				angle: -50 * (Math.PI / 180)
			},
			deploy_position: {
				x: 59,
				y: 56
			},
			images: {
				deploy: '/walls/wall_1_deploy.jpg',
				overview: '/walls/wall_1_overview.jpg'
			},
			jump: 'none'
		},
		MID_TO_A: {
			name: 'Mid to A',
			position: {
				start: { x: 44.25, y: 55.5 },
				angle: -62 * (Math.PI / 180)
			},
			deploy_position: {
				x: 41.53,
				y: 59.72
			},
			images: {
				deploy: '/walls/wall_2_deploy.jpg',
				overview: '/walls/wall_2_overview.jpg',
				end: '/walls/wall_2_end.jpg'
			},
			video: '/walls/wall_2_video.mp4',
			jump: 'none'
		},
		A_SITE_ATTACK: {
			name: 'A Site Attack',
			position: {
				start: { x: 60.5, y: 52.5 },
				angle: -58 * (Math.PI / 180)
			},
			deploy_position: {
				x: 59,
				y: 56
			},
			images: {
				deploy: '/walls/wall_3_deploy.jpg',
				overview: '/walls/wall_3_overview.jpg',
				end: '/walls/wall_3_end.jpg'
			},
			jump: 'twice'
		}
	};

	const LENGTH = 24.25;
	function getPoints(start: Point, angle: number): [Point, Point] {
		const x = start.x + LENGTH * Math.cos(angle);
		const y = start.y + LENGTH * Math.sin(angle);
		return [
			{ x: start.x, y: start.y },
			{ x, y }
		];
	}

	let selectedWall: string | null = $state(Object.keys(WALLS)[0]);
	let mousePosition: Point = $state({ x: 0, y: 0 });

	function handleMouseMove(event: MouseEvent) {
		const svg = event.currentTarget as SVGElement;
		const rect = svg.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 100;
		const y = ((event.clientY - rect.top) / rect.height) * 100;
		mousePosition = { x, y };
	}
</script>

<main class="my-auto grid grid-cols-2 gap-4 p-4">
	<div class="relative h-[500px]">
		<svg
			class="h-full w-full"
			viewBox={`0 0 ${MAP_SIZE.x} ${MAP_SIZE.y}`}
			onmousemove={handleMouseMove}
			role="presentation"
		>
			<image
				xlink:href="/minimaps/ocarnus.png"
				x="0"
				y="0"
				width={MAP_SIZE.x}
				height={MAP_SIZE.y}
			/>
			{#each Object.entries(WALLS).sort((a, b) => a[1].position.start.x - b[1].position.start.x) as [key, wall]}
				{@const points = getPoints(wall.position.start, wall.position.angle)}

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
					stroke-width="20"
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
					<h2>{wall.name}</h2>
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
