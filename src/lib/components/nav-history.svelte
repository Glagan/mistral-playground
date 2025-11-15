<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { ocr, type OCRState } from '$lib/stores/ocr.svelte';
	import { chat, type ChatState } from '$lib/stores/chat.svelte';
	import { findFirstTextNode } from '$lib/message';
	import type { Observable } from 'dexie';
	import Button from '$lib/components/ui/button/button.svelte';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import StarIcon from '@lucide/svelte/icons/star';
	import HistoryIcon from '@lucide/svelte/icons/history';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { TranscribeState } from '$lib/stores/transcribe.svelte';
	import { groupByDate, type HistoryType } from '$lib/utils/history';

	let {
		mode,
		items,
		total,
		onLoad,
		onFavorite,
		onDestroy
	}: {
		mode: HistoryType;
		items: Observable<OCRState[] | ChatState[] | TranscribeState[]>;
		total: Observable<number>;
		onLoad: (item: OCRState | ChatState | TranscribeState) => void;
		onFavorite: (item: OCRState | ChatState | TranscribeState) => void;
		onDestroy: (item: OCRState | ChatState | TranscribeState) => void;
	} = $props();

	const sidebar = Sidebar.useSidebar();

	const favorites = $derived($items?.filter((item) => item.favorite) ?? []);
	const groupedItems = $derived(groupByDate($items));
</script>

{#snippet itemComponent(item: OCRState | ChatState | TranscribeState, props: Record<string, unknown>)}
	{@const title = 'filename' in item ? item.filename : (findFirstTextNode(item.messages)?.text ?? '')}
	<Sidebar.MenuItem {...props}>
		<Sidebar.MenuButton tooltipContent={title} isActive={item.id === chat.state.id || item.id === ocr.state.id}>
			{#snippet child({ props })}
				<div
					{...props}
					class={['group/row', props.class ?? '']}
					onclick={() => {
						onLoad(item);
						sidebar.closeOnMedium();
					}}
				>
					<span class="min-w-6 shrink grow cursor-pointer truncate">{title}</span>
					<div
						class="flex w-10 shrink-0 flex-row gap-2 overflow-hidden transition-all group-hover/row:w-10 group-data-[active=true]/row:w-10 xl:w-0"
					>
						<Button
							variant="ghost"
							class="cursor-pointer p-0 px-0!"
							onclick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								onFavorite(item);
							}}
						>
							<StarIcon size={12} class="text-yellow-400 {item.favorite ? 'fill-yellow-400' : ''}" />
						</Button>
						<Button
							variant="ghost"
							class="cursor-pointer p-0 px-0!"
							onclick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								onDestroy(item);
							}}
						>
							<Trash2Icon size={12} class="text-red-400" />
						</Button>
					</div>
				</div>
			{/snippet}
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
{/snippet}

<Sidebar.Group>
	{#if favorites.length}
		<Sidebar.GroupLabel>Favorites</Sidebar.GroupLabel>
		{#each favorites as item (item.id)}
			<Collapsible.Root open>
				{#snippet child({ props })}
					{@render itemComponent(item, props)}
				{/snippet}
			</Collapsible.Root>
		{/each}
		<div class="mb-4"></div>
	{/if}
	<Sidebar.GroupLabel>History</Sidebar.GroupLabel>
	{#each groupedItems as group (group.dateKey)}
		<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
		{#each group.items as item (item.id)}
			<Collapsible.Root open>
				{#snippet child({ props })}
					{@render itemComponent(item, props)}
				{/snippet}
			</Collapsible.Root>
		{/each}
		<span class="h-3" class:last-of-type:hidden={$total < 20}></span>
	{:else}
		<Collapsible.Root open={false}>
			{#snippet child({ props })}
				<Sidebar.MenuItem {...props} class="pointer-events-none opacity-50">
					<Sidebar.MenuButton>
						{#snippet child()}
							<span class="p-2 text-sm text-muted-foreground">No entries yet...</span>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/snippet}
		</Collapsible.Root>
	{/each}
	{#if $total > 20}
		<Sidebar.MenuItem>
			<Sidebar.MenuButton tooltipContent="View all history">
				{#snippet child({ props })}
					<a href="/history?mode={mode}" {...props} onclick={() => sidebar.closeOnMedium()}>
						<HistoryIcon />
						<span class="grow">Show more</span>
						<ChevronRightIcon />
					</a>
				{/snippet}
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	{/if}
</Sidebar.Group>
