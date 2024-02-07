import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';

export type Settings = {
	temperature: number;
};

export const settings: Writable<Settings> = localStorageStore('settings', { temperature: 0.7 });
