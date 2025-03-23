import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';
import type { ChatState } from './chat.svelte';

export type HistoryState = { chat: ChatState[] };

export const history: Writable<HistoryState> = localStorageStore(
	'history',
	{ chat: [] },
	{
		serializer: {
			parse: (value: string) => {
				const history = JSON.parse(value);
				if (Array.isArray(history)) {
					return { chat: history };
				}
				return history;
			},
			stringify: (value: HistoryState) => JSON.stringify(value)
		}
	}
);
