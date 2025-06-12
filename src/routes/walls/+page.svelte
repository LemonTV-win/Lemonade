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
		images: {
			deploy: string;
			overview: string;
		};
	}

	let WALLS: Record<string, Wall> = {
		WALL_1: {
			position: {
				start: { x: 59.95, y: 56 },
				angle: -50 * (Math.PI / 180)
			},
			images: {
				deploy: '/walls/wall_1_deploy.jpg',
				overview: '/walls/wall_1_overview.jpg'
			}
		}
	};

	const LENGTH = 24.5;
	function getPoints(start: Point, angle: number): [Point, Point] {
		const x = start.x + LENGTH * Math.cos(angle);
		const y = start.y + LENGTH * Math.sin(angle);
		return [
			{ x: start.x, y: start.y },
			{ x, y }
		];
	}
</script>

<main>
	<svg width={MAP_SIZE.x} height={MAP_SIZE.y}>
		<image xlink:href="/minimaps/ocarnus.png" x="0" y="0" width={MAP_SIZE.x} height={MAP_SIZE.y} />
		{#each Object.entries(WALLS) as [key, wall]}
			{@const points = getPoints(wall.position.start, wall.position.angle)}
			<line
				x1={MAP_SIZE.x * (points[0].x / 100)}
				y1={MAP_SIZE.y * (points[0].y / 100)}
				x2={MAP_SIZE.x * (points[1].x / 100)}
				y2={MAP_SIZE.y * (points[1].y / 100)}
				stroke="red"
			/>
		{/each}
	</svg>
	<div>
		{#each Object.entries(WALLS) as [key, wall]}
			<div>
				<h2>{key}</h2>

				<img src={wall.images.deploy} alt={`${key} deploy`} width={500} />

				<img src={wall.images.overview} alt={`${key} overview`} width={500} />
			</div>
		{/each}
	</div>
</main>
