import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';
import type { ChatState } from './chat.svelte';
import type { OCRState } from './ocr.svelte';

export type HistoryState = { chat: ChatState[]; ocr: OCRState[] };

export const history: Writable<HistoryState> = localStorageStore(
	'history',
	{ chat: [], ocr: [] },
	{
		serializer: {
			parse: (value: string) => {
				const history = JSON.parse(value);
				if (Array.isArray(history)) {
					return { chat: history, ocr: [] };
				}
				if (!history.ocr?.length) {
					history.ocr = [];
				}
				if (history.code) {
					delete history.code;
				}
				return history;
			},
			stringify: (value: HistoryState) => JSON.stringify(value)
		}
	}
);
