<script lang="ts">
	import { VOD_PLATFORMS_LABELS, type VodPlatform } from '$lib/data/vod';

	let { platform, class: className = '' }: { platform: VodPlatform; class?: string } = $props();

	const title = $derived(VOD_PLATFORMS_LABELS[platform] ?? platform);
</script>

<span
	class={[
		'inline-flex h-5 w-5 items-center justify-center rounded-sm align-middle',
		platform === 'youtube' && 'bg-red-600 text-white',
		platform === 'bilibili' && 'bg-sky-400 text-white',
		platform === 'twitch' && 'bg-purple-600 text-white',
		className
	]}
	{title}
	aria-label={title}
>
	{#if platform === 'youtube'}
		<svg viewBox="0 0 24 24" class="h-3.5 w-3.5" aria-hidden="true">
			<path fill="currentColor" d="M10 15.5v-7l6 3.5-6 3.5Z" />
		</svg>
	{:else if platform === 'bilibili'}
		<span class="text-[10px] leading-none font-bold">b</span>
	{:else if platform === 'twitch'}
		<span class="text-[10px] leading-none font-bold">t</span>
	{:else}
		<span class="text-[10px] leading-none font-bold">?</span>
	{/if}
</span>
