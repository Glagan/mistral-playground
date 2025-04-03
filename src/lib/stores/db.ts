import Dexie, { type EntityTable } from 'dexie';
import type { ChatState } from './chat.svelte';
import type { OCRState } from './ocr.svelte';

export type ChatShareState = {
	id: string;
	title: string;
	deletionKey: string;
	createdAt: Date;
};

export const db = new Dexie('MistralPlayground') as Dexie & {
	chat: EntityTable<ChatState, 'id'>;
	ocr: EntityTable<OCRState, 'id'>;
	share: EntityTable<ChatShareState, 'id'>;
};

// Schema declaration:
db.version(1).stores({
	chat: '++id, messages, usage, options',
	ocr: '++id, filename, pages, usage, options',
	share: '++id, title, deletionKey, createdAt'
});
