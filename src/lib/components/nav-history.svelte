<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { ocr, type OCRState } from '$lib/stores/ocr.svelte';
	import { chat, type ChatState } from '$lib/stores/chat.svelte';
	import { findFirstTextNode } from '$lib/message';
	import type { Observable } from 'dexie';
	import Button from '$lib/components/ui/button/button.svelte';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import type { TranscribeState } from '$lib/stores/transcribe.svelte';

	let {
		items,
		onLoad,
		onDestroy
	}: {
		items: Observable<OCRState[] | ChatState[] | TranscribeState[]>;
		onLoad: (item: OCRState | ChatState | TranscribeState) => void;
		onDestroy: (item: OCRState | ChatState | TranscribeState) => void;
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
									class={['group/row', props.class ?? '']}
									onclick={() => {
										onLoad(mainItem);
										sidebar.closeOnMedium();
									}}
								>
									<span class="min-w-6 shrink grow cursor-pointer truncate">{title}</span>
									<div class="w-8 shrink transition-all group-hover/row:w-8 group-[[data-active=true]]/row:w-8 xl:w-0">
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
