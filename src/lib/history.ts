import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';
import type { Answer, Options, Question } from './types';

export type HistoryEntry = {
	id: string;
	messages: (Question | Answer)[];
	options: Options;
};

export const history: Writable<HistoryEntry[]> = localStorageStore('history', []);
