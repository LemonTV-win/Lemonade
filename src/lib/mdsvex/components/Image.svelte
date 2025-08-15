<script lang="ts">
	export let src: string;
	export let alt: string = '';
	export let title: string = '';
	export let width: number | string | undefined = undefined;
	export let height: number | string | undefined = undefined;
	// Collect any additional attributes passed to <img>
	export let loading: 'eager' | 'lazy' | undefined = 'lazy';
	export let decoding: 'sync' | 'async' | 'auto' | undefined = 'async';
	let caption: string = title || alt;
</script>

<figure class="my-6">
	<img
		{src}
		{alt}
		{width}
		{height}
		{loading}
		{decoding}
		class="w-full rounded-xl border border-amber-400/20 object-contain shadow-lg"
	/>
	{#if caption}
		<figcaption class="mt-2 text-center text-sm text-gray-400">{caption}</figcaption>
	{/if}
</figure>
