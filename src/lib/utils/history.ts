import { DateTime } from 'luxon';
import { extractTimestampFromUUIDv7 } from './uuid';
import type { ChatState } from '$lib/stores/chat.svelte';
import type { OCRState } from '$lib/stores/ocr.svelte';
import type { TranscribeState } from '$lib/stores/transcribe.svelte';
import { SvelteMap } from 'svelte/reactivity';

export type HistoryType = 'chat' | 'ocr' | 'transcribe';

export type GroupedItems = {
	label: string;
	dateKey: string;
	items: (OCRState | ChatState | TranscribeState)[];
};

export function getTimestamp(item: ChatState | OCRState | TranscribeState): number {
	return item.createdAtTimestamp ?? extractTimestampFromUUIDv7(item.id);
}

export function getDateKey(timestamp: number): string {
	return DateTime.fromMillis(timestamp).toISODate() ?? '';
}

export function formatDateLabel(dateKey: string): string {
	const date = DateTime.fromISO(dateKey);
	const today = DateTime.now().startOf('day');
	const yesterday = today.minus({ days: 1 });

	if (date.hasSame(today, 'day')) {
		return 'Today';
	}
	if (date.hasSame(yesterday, 'day')) {
		return 'Yesterday';
	}
	return date.toFormat('LLL d, yyyy');
}

export function groupByDate(items: (ChatState | OCRState | TranscribeState)[] | undefined): GroupedItems[] {
	if (!items) {
		return [];
	}

	const groups = new SvelteMap<string, (ChatState | OCRState | TranscribeState)[]>();

	for (const item of items) {
		const timestamp = getTimestamp(item);
		const dateKey = getDateKey(timestamp);

		if (!groups.has(dateKey)) {
			groups.set(dateKey, []);
		}
		groups.get(dateKey)!.push(item);
	}

	return Array.from(groups.entries())
		.sort((a, b) => b[0].localeCompare(a[0]))
		.map(([dateKey, items]) => ({
			label: formatDateLabel(dateKey),
			dateKey,
			items: items.sort((a, b) => getTimestamp(b) - getTimestamp(a))
		}));
}
