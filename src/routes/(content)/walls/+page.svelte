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
		position: Position;
		deploy_position: Point;
		images: {
			deploy: string;
			overview: string;
			end?: string;
		};
		jump: 'none' | 'once' | 'twice'; // stand, single jump, double jump
	}

	let WALLS: Record<string, Wall> = {
		A_SITE_PLANT: {
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
		MID: {
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
			jump: 'none'
		},
		A_SITE_ATTACK: {
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
	<div class="relative">
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
	<div>
		{#if selectedWall}
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<h2>{selectedWall}</h2>
					<div
						class={[
							'text-center text-gray-400',
							{
								'text-green-400': WALLS[selectedWall].jump === 'none',
								'text-blue-400': WALLS[selectedWall].jump === 'once',
								'text-red-400': WALLS[selectedWall].jump === 'twice'
							}
						]}
					>
						{#if WALLS[selectedWall].jump === 'none'}
							Stand
						{:else if WALLS[selectedWall].jump === 'once'}
							Jump
						{:else if WALLS[selectedWall].jump === 'twice'}
							Double Jump
						{/if}
					</div>
				</div>
				<img
					class="rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.2)]"
					src={WALLS[selectedWall].images.deploy}
					alt={`${selectedWall} deploy`}
					width={500}
				/>

				<img
					class="rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.2)]"
					src={WALLS[selectedWall].images.overview}
					alt={`${selectedWall} overview`}
					width={500}
				/>

				{#if WALLS[selectedWall].images.end}
					<img
						class="rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.2)]"
						src={WALLS[selectedWall].images.end}
						alt={`${selectedWall} end`}
					/>
				{/if}
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
