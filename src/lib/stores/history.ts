import type { Writable } from 'svelte/store';
import type { ChatState } from './chat.svelte';
import type { OCRState } from './ocr.svelte';
import { createIndexedDBStore } from './indexedDB';

export type HistoryState = { chat: ChatState[]; ocr: OCRState[] };

export const history: Writable<HistoryState> = createIndexedDBStore();
