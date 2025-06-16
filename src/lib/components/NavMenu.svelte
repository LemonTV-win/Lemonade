<script lang="ts">
	import { page } from '$app/state';

	let { class: className = '', ...restProps }: { class?: string } = $props();

	let currentPath = $derived(page.url.pathname);
</script>

<nav class={['flex justify-center gap-4', className]} {...restProps}>
	<a
		href="/walls"
		class="flex items-center gap-2 rounded-lg border px-6 py-3 text-amber-300 backdrop-blur-sm transition-all hover:scale-105 {currentPath ===
		'/walls'
			? 'border-amber-500 bg-amber-500/30'
			: 'border-amber-700/50 bg-amber-600/20 hover:bg-amber-500/30'}"
	>
		<img src="/icons/reiichi_skill_1.webp" alt="Reiichi" class="h-5 w-5 object-contain" />
		Reiichi Walls
	</a>
	<a
		href="/interceptors"
		class="flex items-center gap-2 rounded-lg border px-6 py-3 text-amber-300 backdrop-blur-sm transition-all hover:scale-105 {currentPath ===
		'/interceptors'
			? 'border-amber-500 bg-amber-500/30'
			: 'border-amber-700/50 bg-amber-600/20 hover:bg-amber-500/30'}"
	>
		<img src="/icons/interceptor.png" alt="Interceptor" class="h-5 w-5" />
		Interceptors
	</a>
</nav>
