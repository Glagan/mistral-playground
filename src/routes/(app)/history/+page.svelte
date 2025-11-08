<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/stores/db';
	import { chat, type ChatState } from '$lib/stores/chat.svelte';
	import { ocr, type OCRState } from '$lib/stores/ocr.svelte';
	import { transcribe, type TranscribeState } from '$lib/stores/transcribe.svelte';
	import { DateTime } from 'luxon';
	import { findFirstTextNode } from '$lib/message';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { getTimestamp, groupByDate, type HistoryType } from '$lib/utils/history';

	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import ScanTextIcon from '@lucide/svelte/icons/scan-text';
	import MicIcon from '@lucide/svelte/icons/mic';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	import ConfirmDialog from '$lib/components/Dialog/ConfirmDialog.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';

	// Initialize from URL params
	const urlMode = page.url.searchParams.get('mode') as HistoryType | null;
	const urlPage = parseInt(page.url.searchParams.get('page') || '1');

	let activeTab = $state<HistoryType>(urlMode && ['chat', 'ocr', 'transcribe'].includes(urlMode) ? urlMode : 'chat');
	let currentPage = $state(urlPage);
	let loading = $state(false);

	let currentIcon = $derived({
		component: activeTab == 'chat' ? MessageSquareIcon : activeTab == 'ocr' ? ScanTextIcon : MicIcon
	});

	// Update URL when state changes
	$effect(() => {
		const params = new URLSearchParams();
		params.set('mode', activeTab);
		if (currentPage > 1) {
			params.set('page', currentPage.toString());
		}

		const newUrl = `/history?${params.toString()}`;
		const currentUrl = window.location.pathname + window.location.search;

		if (newUrl !== currentUrl) {
			goto(newUrl, { replaceState: true, noScroll: true, keepFocus: true });
		}
	});

	const ITEMS_PER_PAGE = 20;

	let chatTotal = liveQuery(() => db.chat.count());
	let ocrTotal = liveQuery(() => db.ocr.count());
	let transcribeTotal = liveQuery(() => db.transcribe.count());
	let dbTotal = $derived.by(() => {
		if (activeTab === 'chat') {
			return $chatTotal;
		} else if (activeTab === 'ocr') {
			return $ocrTotal;
		}
		return $transcribeTotal;
	});
	let historyQuery = $derived.by(() => {
		const offset = (currentPage - 1) * ITEMS_PER_PAGE;

		if (activeTab === 'chat') {
			return liveQuery(() => db.chat.offset(offset).limit(ITEMS_PER_PAGE).reverse().toArray());
		} else if (activeTab === 'ocr') {
			return liveQuery(() => db.ocr.offset(offset).limit(ITEMS_PER_PAGE).reverse().toArray());
		}
		return liveQuery(() => db.transcribe.offset(offset).limit(ITEMS_PER_PAGE).reverse().toArray());
	});
	const groupedHistory = $derived(groupByDate($historyQuery));
	const totalPages = $derived(Math.ceil(dbTotal / ITEMS_PER_PAGE));

	function getEntryTitle(entry: ChatState | OCRState | TranscribeState): string {
		if ('filename' in entry) {
			return entry.filename;
		}
		return findFirstTextNode(entry.messages)?.text ?? 'Untitled';
	}

	function loadEntry(entry: ChatState | OCRState | TranscribeState) {
		if ('pages' in entry) {
			ocr.setFromEntry(entry);
			goto('/ocr');
		} else if ('text' in entry) {
			transcribe.setFromEntry(entry);
			goto('/transcribe');
		} else {
			chat.setFromEntry(entry);
			goto('/chat');
		}
	}

	async function deleteEntry(entry: ChatState | OCRState | TranscribeState) {
		loading = true;
		try {
			if ('pages' in entry) {
				await db.ocr.delete(entry.id);
			} else if ('text' in entry) {
				await db.transcribe.delete(entry.id);
			} else {
				await db.chat.delete(entry.id);
			}
			toast.success('Entry deleted');
		} catch (error) {
			console.error('Failed to delete entry:', error);
			toast.error('Failed to delete entry');
		} finally {
			loading = false;
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage += 1;
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage -= 1;
		}
	}

	// Reset page to 1 when switching tabs
	let previousTab = $state(activeTab);
	$effect(() => {
		if (activeTab !== previousTab) {
			currentPage = 1;
			previousTab = activeTab;
		}
	});
</script>

<div class="flex max-h-[calc(100svh-88px)] shrink grow flex-col items-stretch gap-4 lg:max-h-screen">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">History</h1>

	<div class="flex flex-row items-center gap-2">
		<Button
			href="/history?mode=chat"
			variant={activeTab === 'chat' ? 'default' : 'outline'}
			onclick={() => (activeTab = 'chat')}
		>
			<MessageSquareIcon class="mr-2" size={16} />
			Chat ({$chatTotal ?? 0})
		</Button>
		<Button
			href="/history?mode=ocr"
			variant={activeTab === 'ocr' ? 'default' : 'outline'}
			onclick={() => (activeTab = 'ocr')}
		>
			<ScanTextIcon class="mr-2" size={16} />
			OCR ({$ocrTotal ?? 0})
		</Button>
		<Button
			href="/history?mode=transcribe"
			variant={activeTab === 'transcribe' ? 'default' : 'outline'}
			onclick={() => (activeTab = 'transcribe')}
		>
			<MicIcon class="mr-2" size={16} />
			Transcribe ({$transcribeTotal ?? 0})
		</Button>
	</div>

	<div class="my-4">
		{#if groupedHistory.length > 0}
			<div class="space-y-6">
				{#each groupedHistory as group (group.dateKey)}
					<div class="space-y-3">
						<h2 class="text-muted-foreground text-lg font-semibold">{group.label}</h2>
						<div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 xl:grid-cols-4">
							{#each group.items as entry (entry.id)}
								<Card.Root class="w-full">
									<Card.Header>
										<Card.Title class="flex items-center gap-2 truncate">
											<currentIcon.component size={18} class="shrink-0" />
											<span class="truncate">{getEntryTitle(entry)}</span>
										</Card.Title>
										<Card.Description>
											{DateTime.fromMillis(getTimestamp(entry)).toLocaleString(DateTime.DATETIME_SHORT)}
										</Card.Description>
									</Card.Header>
									<Card.Footer class="flex flex-row justify-end gap-2">
										<Button onclick={() => loadEntry(entry)}>
											<FileTextIcon size={16} />
											<span>Open</span>
										</Button>
										<ConfirmDialog
											title="Confirm deletion"
											description="Do you really want to delete this entry? This action cannot be undone."
											onConfirm={() => deleteEntry(entry)}
										>
											{#snippet trigger()}
												<Button variant="destructive" disabled={loading}>
													<Trash2Icon size={16} />
												</Button>
											{/snippet}
										</ConfirmDialog>
									</Card.Footer>
								</Card.Root>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex shrink grow flex-col items-center justify-center gap-3 py-12 text-center">
				<currentIcon.component size={52} />
				<h3 class="text-2xl font-semibold tracking-tight">No history</h3>
				<p class="text-muted-foreground leading-7">Your entries will appear here.</p>
			</div>
		{/if}
	</div>

	{#if totalPages > 1}
		<div class="flex items-center justify-center gap-2 pb-4">
			<Button variant="outline" size="icon" disabled={currentPage === 1} onclick={prevPage}>
				<ChevronLeftIcon size={20} />
			</Button>
			<span class="text-muted-foreground text-sm">
				Page {currentPage} of {totalPages}
			</span>
			<Button variant="outline" size="icon" disabled={currentPage >= totalPages} onclick={nextPage}>
				<ChevronRightIcon size={20} />
			</Button>
		</div>
	{/if}
</div>
