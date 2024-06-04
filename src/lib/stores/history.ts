import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';
import type { ChatState } from './chat.svelte';

export const history: Writable<ChatState[]> = localStorageStore('history', []);
