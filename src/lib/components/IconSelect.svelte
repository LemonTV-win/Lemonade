<script lang="ts">
	import { Select, createListCollection, type SelectValueChangeDetails } from '@ark-ui/svelte';
	import type { Snippet } from 'svelte';

	export type IconSelectItem = { value: string; label: string; group?: string };

	let {
		name,
		value = '',
		items,
		onChange,
		placeholder = 'Select…',
		icon,
		clearable = false,
		clearLabel = 'Unset',
		required = false,
		disabled = false,
		id
	}: {
		name: string;
		value?: string;
		items: IconSelectItem[];
		onChange?: (value: string) => void;
		placeholder?: string;
		/** Renders an icon for a given item value (in the trigger and the list). */
		icon?: Snippet<[string]>;
		clearable?: boolean;
		clearLabel?: string;
		required?: boolean;
		disabled?: boolean;
		id?: string;
	} = $props();

	// Prepend an explicit clear entry when the field is optional.
	const allItems = $derived(
		clearable ? [{ value: '', label: clearLabel } as IconSelectItem, ...items] : items
	);
	const collection = $derived(createListCollection({ items: allItems }));
	const selectedItem = $derived(items.find((item) => item.value === value) ?? null);

	const groups = $derived.by(() => {
		const map = new Map<string, IconSelectItem[]>();
		for (const item of allItems) {
			const group = item.group ?? '';
			if (!map.has(group)) map.set(group, []);
			map.get(group)!.push(item);
		}
		return [...map.entries()];
	});

	function handleChange(details: SelectValueChangeDetails) {
		onChange?.(details.value[0] ?? '');
	}
</script>

{#snippet renderItem(item: IconSelectItem)}
	<Select.Item
		{item}
		class="flex cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-sm text-white data-[highlighted]:bg-amber-400/20 data-[state=checked]:text-amber-300"
	>
		<span class="flex min-w-0 items-center gap-2">
			{#if icon && item.value}
				<span class="flex h-5 w-8 shrink-0 items-center justify-center"
					>{@render icon(item.value)}</span
				>
			{/if}
			<Select.ItemText class="truncate">{item.label}</Select.ItemText>
		</span>
		<Select.ItemIndicator class="text-amber-400">✓</Select.ItemIndicator>
	</Select.Item>
{/snippet}

<Select.Root
	{collection}
	{name}
	{id}
	{required}
	{disabled}
	value={value ? [value] : []}
	onValueChange={handleChange}
	positioning={{ sameWidth: true }}
	class="mt-1 mb-4 w-full"
>
	<Select.Control>
		<Select.Trigger
			class="flex w-full items-center justify-between gap-2 rounded border border-amber-300/30 bg-zinc-900 px-3 py-2 text-left text-white focus:border-amber-400 focus:outline-none data-[disabled]:opacity-50"
		>
			{#if selectedItem}
				<span class="flex min-w-0 items-center gap-2">
					{#if icon}
						<span class="flex h-5 w-8 shrink-0 items-center justify-center">
							{@render icon(selectedItem.value)}
						</span>
					{/if}
					<span class="truncate">{selectedItem.label}</span>
				</span>
			{:else}
				<span class="truncate text-amber-200/40">{placeholder}</span>
			{/if}
			<span class="shrink-0 text-amber-300/70">▾</span>
		</Select.Trigger>
	</Select.Control>
	<Select.Positioner>
		<Select.Content
			class="z-[100] max-h-72 overflow-y-auto rounded-md border border-amber-300/30 bg-zinc-950/98 p-1 shadow-2xl backdrop-blur-sm focus:outline-none"
		>
			{#each groups as [group, groupItems] (group)}
				{#if group}
					<Select.ItemGroup class="py-1">
						<Select.ItemGroupLabel
							class="px-3 py-1 text-xs font-semibold tracking-wide text-amber-300/70 uppercase"
						>
							{group}
						</Select.ItemGroupLabel>
						{#each groupItems as item (item.value)}
							{@render renderItem(item)}
						{/each}
					</Select.ItemGroup>
				{:else}
					{#each groupItems as item (item.value)}
						{@render renderItem(item)}
					{/each}
				{/if}
			{/each}
		</Select.Content>
	</Select.Positioner>
	<Select.HiddenSelect />
</Select.Root>
