import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';

export const apiKey: Writable<string> = localStorageStore('apiKey', '');
