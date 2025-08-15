<script lang="ts">
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(body) {
		background-image:
			radial-gradient(circle at center, #1a1a1ad5, #000000d5), url('/maps/area_88.jpg');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-attachment: fixed;
		position: relative;
	}
</style>
