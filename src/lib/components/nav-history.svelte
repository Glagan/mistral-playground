<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { apiKey } from '$lib/stores/apiKey';
	import { ocr, type OCRState } from '$lib/stores/ocr.svelte';
	import { chat, type ChatState } from '$lib/stores/chat.svelte';
	import { findFirstTextNode } from '$lib/message';
	import type { Observable } from 'dexie';
	import Button from '$lib/components/ui/button/button.svelte';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let {
		items,
		onLoad,
		onDestroy
	}: {
		items: Observable<OCRState[] | ChatState[]>;
		onLoad: (item: OCRState | ChatState) => void;
		onDestroy: (item: OCRState | ChatState) => void;
	} = $props();

	const sidebar = Sidebar.useSidebar();
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>History</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each $items as mainItem (mainItem.id)}
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
									onclick={() => {
										onLoad(mainItem);
										sidebar.toggleOnMedium();
									}}
								>
									<span class="min-w-6 shrink grow cursor-pointer truncate">{title}</span>
									<Button
										variant="ghost"
										class="shrink cursor-pointer"
										onclick={(event) => {
											event.preventDefault();
											event.stopPropagation();
											onDestroy(mainItem);
										}}
									>
										<Trash2Icon size={12} class="text-red-400" />
									</Button>
								</div>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/snippet}
			</Collapsible.Root>
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
	</Sidebar.Menu>
</Sidebar.Group>
