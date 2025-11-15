import Dexie, { type EntityTable } from 'dexie';
import type { ChatState } from './chat.svelte';
import type { OCRState } from './ocr.svelte';
import type { TranscribeState } from './transcribe.svelte';

export type ChatShareState = {
	id: string;
	title: string;
	deletionKey: string;
	createdAt: Date;
};

export const db = new Dexie('MistralPlayground') as Dexie & {
	chat: EntityTable<ChatState, 'id'>;
	ocr: EntityTable<OCRState, 'id'>;
	transcribe: EntityTable<TranscribeState, 'id'>;
	share: EntityTable<ChatShareState, 'id'>;
};

// Schema declaration:
db.version(1).stores({
	chat: '++id, favorite, messages, usage, options, createdAt',
	ocr: '++id, favorite, filename, pages, usage, options, createdAt',
	transcribe: '++id, favorite, filename, text, language, segments, usage, options, createdAt',
	share: '++id, title, deletionKey, createdAt'
});
