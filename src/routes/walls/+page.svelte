<script lang="ts">
	const MAP_SIZE = {
		x: 500,
		y: 500
	};

	let WALLS = {
		WALL_1: {
			images: {
				deploy: '/walls/wall_1_deploy.jpg',
				overview: '/walls/wall_1_overview.jpg'
			}
		}
	};
</script>

<main>
	<svg width={MAP_SIZE.x} height={MAP_SIZE.y}>
		<image xlink:href="/minimaps/ocarnus.png" x="0" y="0" width={MAP_SIZE.x} height={MAP_SIZE.y} />
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
