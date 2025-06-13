<script lang="ts">
	let {
		selectedFilters = $bindable({})
	}: {
		selectedFilters: {
			direction?: ('vertical' | 'horizontal')[];
			ultimate?: boolean[];
			transparent?: boolean[];
			jump?: ('none' | 'once' | 'twice')[];
		};
	} = $props();

	let showModal = $state(false);
	let dialog: HTMLDialogElement;

	type FilterValue = 'vertical' | 'horizontal' | boolean | 'none' | 'once' | 'twice';
	type FilterType = keyof typeof selectedFilters;

	function toggleModal() {
		showModal = !showModal;
		if (showModal) {
			dialog.showModal();
		} else {
			dialog.close();
		}
	}

	function handleFilterChange(filterType: FilterType, value: FilterValue) {
		const currentValues = (selectedFilters[filterType] || []) as FilterValue[];
		const newValues = currentValues.includes(value)
			? currentValues.filter((v) => v !== value)
			: [...currentValues, value];

		selectedFilters = {
			...selectedFilters,
			[filterType]: newValues.length > 0 ? newValues : undefined
		};
	}

	function clearFilters() {
		selectedFilters = {};
	}
</script>

<div class="relative">
	<button
		class="flex h-8 items-center gap-2 rounded border border-amber-700/50 bg-amber-600/20 px-4 text-sm text-amber-300 backdrop-blur-sm transition-all hover:scale-105 hover:bg-amber-500/30"
		onclick={toggleModal}
	>
		<span>Filter Walls</span>
		{#if Object.keys(selectedFilters).length > 0}
			<span class="rounded-full bg-amber-500/50 px-2 py-0.5 text-xs text-amber-300">
				{Object.keys(selectedFilters).length}
			</span>
		{/if}
	</button>

	<dialog
		class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent p-0 backdrop:bg-black/75 backdrop:backdrop-blur-sm"
		onclick={(e) => e.target === dialog && toggleModal()}
		onkeydown={(e) => e.key === 'Escape' && toggleModal()}
		bind:this={dialog}
	>
		<div
			class="max-h-[90vh] w-[90%] max-w-md overflow-y-auto rounded-lg border border-amber-700/50 bg-black/70 p-6 backdrop-blur-md"
		>
			<h2
				class="mb-4 bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-xl font-semibold text-transparent"
			>
				Filter Walls
			</h2>

			<div class="mb-6">
				<h3 class="mb-3 text-sm font-medium text-amber-300">Direction</h3>
				<div class="flex flex-wrap gap-2">
					<button
						class="h-8 rounded-full border px-4 text-sm transition-all hover:scale-105 {selectedFilters.direction?.includes(
							'vertical'
						)
							? 'border-amber-400 bg-amber-400/30 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]'
							: 'border-amber-700/30 bg-black/30 text-amber-300/80 hover:border-amber-600/50 hover:bg-amber-950/50'}"
						onclick={() => handleFilterChange('direction', 'vertical')}
					>
						Vertical
					</button>
					<button
						class="h-8 rounded-full border px-4 text-sm transition-all hover:scale-105 {selectedFilters.direction?.includes(
							'horizontal'
						)
							? 'border-amber-400 bg-amber-400/30 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]'
							: 'border-amber-700/30 bg-black/30 text-amber-300/80 hover:border-amber-600/50 hover:bg-amber-950/50'}"
						onclick={() => handleFilterChange('direction', 'horizontal')}
					>
						Horizontal
					</button>
				</div>
			</div>

			<div class="mb-6">
				<h3 class="mb-3 text-sm font-medium text-amber-300">Wall Type</h3>
				<div class="flex flex-wrap gap-2">
					<button
						class="h-8 rounded-full border px-4 text-sm transition-all hover:scale-105 {selectedFilters.ultimate?.includes(
							true
						)
							? 'border-amber-400 bg-amber-400/30 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]'
							: 'border-amber-700/30 bg-black/30 text-amber-300/80 hover:border-amber-600/50 hover:bg-amber-950/50'}"
						onclick={() => handleFilterChange('ultimate', true)}
					>
						Ultimate
					</button>
					<button
						class="h-8 rounded-full border px-4 text-sm transition-all hover:scale-105 {selectedFilters.ultimate?.includes(
							false
						)
							? 'border-amber-400 bg-amber-400/30 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]'
							: 'border-amber-700/30 bg-black/30 text-amber-300/80 hover:border-amber-600/50 hover:bg-amber-950/50'}"
						onclick={() => handleFilterChange('ultimate', false)}
					>
						Regular
					</button>
				</div>
			</div>

			<div class="mb-6">
				<h3 class="mb-3 text-sm font-medium text-amber-300">Transparency</h3>
				<div class="flex flex-wrap gap-2">
					<button
						class="h-8 rounded-full border px-4 text-sm transition-all hover:scale-105 {selectedFilters.transparent?.includes(
							true
						)
							? 'border-amber-400 bg-amber-400/30 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]'
							: 'border-amber-700/30 bg-black/30 text-amber-300/80 hover:border-amber-600/50 hover:bg-amber-950/50'}"
						onclick={() => handleFilterChange('transparent', true)}
					>
						Transparent
					</button>
					<button
						class="h-8 rounded-full border px-4 text-sm transition-all hover:scale-105 {selectedFilters.transparent?.includes(
							false
						)
							? 'border-amber-400 bg-amber-400/30 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]'
							: 'border-amber-700/30 bg-black/30 text-amber-300/80 hover:border-amber-600/50 hover:bg-amber-950/50'}"
						onclick={() => handleFilterChange('transparent', false)}
					>
						Opaque
					</button>
				</div>
			</div>

			<div class="mb-6">
				<h3 class="mb-3 text-sm font-medium text-amber-300">Jump Type</h3>
				<div class="flex flex-wrap gap-2">
					<button
						class="h-8 rounded-full border px-4 text-sm transition-all hover:scale-105 {selectedFilters.jump?.includes(
							'none'
						)
							? 'border-amber-400 bg-amber-400/30 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]'
							: 'border-amber-700/30 bg-black/30 text-amber-300/80 hover:border-amber-600/50 hover:bg-amber-950/50'}"
						onclick={() => handleFilterChange('jump', 'none')}
					>
						No Jump
					</button>
					<button
						class="h-8 rounded-full border px-4 text-sm transition-all hover:scale-105 {selectedFilters.jump?.includes(
							'once'
						)
							? 'border-amber-400 bg-amber-400/30 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]'
							: 'border-amber-700/30 bg-black/30 text-amber-300/80 hover:border-amber-600/50 hover:bg-amber-950/50'}"
						onclick={() => handleFilterChange('jump', 'once')}
					>
						Single Jump
					</button>
					<button
						class="h-8 rounded-full border px-4 text-sm transition-all hover:scale-105 {selectedFilters.jump?.includes(
							'twice'
						)
							? 'border-amber-400 bg-amber-400/30 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]'
							: 'border-amber-700/30 bg-black/30 text-amber-300/80 hover:border-amber-600/50 hover:bg-amber-950/50'}"
						onclick={() => handleFilterChange('jump', 'twice')}
					>
						Double Jump
					</button>
				</div>
			</div>

			<div class="flex justify-end gap-4">
				<button
					class="h-8 rounded border border-amber-700/50 bg-amber-600/20 px-4 text-sm text-amber-300 backdrop-blur-sm transition-all hover:scale-105 hover:bg-amber-500/30"
					onclick={clearFilters}
				>
					Clear Filters
				</button>
				<button
					class="h-8 rounded border border-amber-700/50 bg-amber-600/20 px-4 text-sm text-amber-300 backdrop-blur-sm transition-all hover:scale-105 hover:bg-amber-500/30"
					onclick={toggleModal}
				>
					Close
				</button>
			</div>
		</div>
	</dialog>
</div>
