<script lang="ts">
	export let type: 'tip' | 'note' | 'warning' | 'danger' = 'tip';
	export let title: string = '';
	export let icon: string | null = null;

	const palette: Record<string, { ring: string; bg: string; text: string }> = {
		tip: {
			ring: 'ring-emerald-400/30',
			bg: 'bg-emerald-500/10',
			text: 'text-emerald-200'
		},
		note: {
			ring: 'ring-sky-400/30',
			bg: 'bg-sky-500/10',
			text: 'text-sky-200'
		},
		warning: {
			ring: 'ring-amber-400/30',
			bg: 'bg-amber-500/10',
			text: 'text-amber-200'
		},
		danger: {
			ring: 'ring-rose-400/30',
			bg: 'bg-rose-500/10',
			text: 'text-rose-200'
		}
	};

	$: colors = palette[type] ?? palette.tip;
</script>

<div class={`my-6 rounded-xl border border-white/5 p-4 ring-1 ${colors.ring} ${colors.bg}`}>
	<div class="mb-2 flex items-center gap-2">
		{#if icon}
			<span class={`inline-flex h-5 w-5 items-center justify-center ${colors.text}`}>{icon}</span>
		{/if}
		{#if title}
			<h4 class={`text-sm font-semibold ${colors.text}`}>{title}</h4>
		{/if}
	</div>
	<div class="prose prose-invert max-w-none text-sm text-gray-200">
		<slot />
	</div>
</div>
