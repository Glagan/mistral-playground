<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { ocr, type OCRState } from '$lib/stores/ocr.svelte';
	import { chat, type ChatState } from '$lib/stores/chat.svelte';
	import { findFirstTextNode } from '$lib/message';
	import type { Observable } from 'dexie';
	import Button from '$lib/components/ui/button/button.svelte';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import HistoryIcon from '@lucide/svelte/icons/history';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { TranscribeState } from '$lib/stores/transcribe.svelte';
	import { groupByDate, type HistoryType } from '$lib/utils/history';

	let {
		mode,
		items,
		total,
		onLoad,
		onDestroy
	}: {
		mode: HistoryType;
		items: Observable<OCRState[] | ChatState[] | TranscribeState[]>;
		total: Observable<number>;
		onLoad: (item: OCRState | ChatState | TranscribeState) => void;
		onDestroy: (item: OCRState | ChatState | TranscribeState) => void;
	} = $props();

	const sidebar = Sidebar.useSidebar();

	const groupedItems = $derived(groupByDate($items));
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>History</Sidebar.GroupLabel>
	{#each groupedItems as group (group.dateKey)}
		<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
		{#each group.items as mainItem (mainItem.id)}
			{@const title = 'filename' in mainItem ? mainItem.filename : (findFirstTextNode(mainItem.messages)?.text ?? '')}
			<Collapsible.Root open>
				{#snippet child({ props })}
					<Sidebar.MenuItem {...props}>
						<Sidebar.MenuButton
							tooltipContent={title}
							isActive={mainItem.id === chat.state.id || mainItem.id === ocr.state.id}
						>
							{#snippet child({ props })}
								<div
									{...props}
									class={['group/row', props.class ?? '']}
									onclick={() => {
										onLoad(mainItem);
										sidebar.closeOnMedium();
									}}
								>
									<span class="min-w-6 shrink grow cursor-pointer truncate">{title}</span>
									<div class="w-8 shrink transition-all group-hover/row:w-8 group-data-[active=true]/row:w-8 xl:w-0">
										<Button
											variant="ghost"
											class="cursor-pointer"
											onclick={(event) => {
												event.preventDefault();
												event.stopPropagation();
												onDestroy(mainItem);
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
