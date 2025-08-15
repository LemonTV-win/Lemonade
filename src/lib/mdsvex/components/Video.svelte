<script lang="ts">
	export let src: string;
	export let caption: string = '';
	export let poster: string = '';
	export let controls: boolean = true;
	export let preload: 'none' | 'metadata' | 'auto' | undefined = 'metadata';
	export let playsinline: boolean = true;
	export let loop: boolean = false;
	export let muted: boolean = false;
</script>

<figure class="my-6">
	<video
		{src}
		{poster}
		{preload}
		{playsinline}
		{loop}
		{muted}
		class="aspect-video w-full overflow-hidden rounded-xl border border-amber-400/20 bg-black shadow-lg"
		{controls}
	></video>
	{#if caption}
		<figcaption class="mt-2 text-center text-sm text-gray-400">{caption}</figcaption>
	{/if}
</figure>
