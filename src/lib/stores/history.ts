import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';
import type { ChatState } from './chat.svelte';
import type { CodeState } from './code.svelte';

export type HistoryState = {
    chat: ChatState[];
    code: CodeState[];
};

export const history: Writable<HistoryState> = localStorageStore('history', {
    chat: [],
    code: []
}, {
    serializer: {
        parse: (value: string) => {
            const history = JSON.parse(value);
            if (Array.isArray(history)) {
                return { chat: history, code: [] };
            }
            return history;
        },
        stringify: (value: HistoryState) => JSON.stringify(value)
    }
});
