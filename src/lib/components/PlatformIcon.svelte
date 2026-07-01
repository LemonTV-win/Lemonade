<script lang="ts">
	import { VOD_PLATFORMS_LABELS, type VodPlatform } from '$lib/data/vod';

	let { platform, class: className = '' }: { platform: VodPlatform; class?: string } = $props();

	const title = $derived(VOD_PLATFORMS_LABELS[platform] ?? platform);
	const sizeClass = $derived(className || 'h-4 w-4');
</script>

{#if platform === 'bilibili'}
	<svg viewBox="0 0 24 24" class={['text-[#00AEEC]', sizeClass]} role="img" fill="currentColor">
		<title>{title}</title>
		<path
			d="M18.223 3.086a1.25 1.25 0 0 1 0 1.768L17.08 6h1.17A3.75 3.75 0 0 1 22 9.75v7.5A3.75 3.75 0 0 1 18.25 21H5.75A3.75 3.75 0 0 1 2 17.25v-7.5A3.75 3.75 0 0 1 5.75 6h1.17L5.777 4.854a1.25 1.25 0 1 1 1.768-1.768L9.771 5.31c.176.176.313.371.409.577h3.64c.096-.206.233-.401.409-.577l2.226-2.224a1.25 1.25 0 0 1 1.768 0zM5.75 8.5a1.25 1.25 0 0 0-1.25 1.25v7.5c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25v-7.5c0-.69-.56-1.25-1.25-1.25H5.75zM8 11.5a1 1 0 0 1 1 1V14a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1zm8 0a1 1 0 0 1 1 1V14a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1z"
		/>
	</svg>
{:else if platform === 'youtube'}
	<svg viewBox="0 0 24 24" class={['text-[#FF0000]', sizeClass]} role="img" fill="currentColor">
		<title>{title}</title>
		<path
			d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
		/>
	</svg>
{:else if platform === 'twitch'}
	<svg viewBox="0 0 24 24" class={['text-[#9146FF]', sizeClass]} role="img" fill="currentColor">
		<title>{title}</title>
		<path
			d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"
		/>
	</svg>
{/if}
