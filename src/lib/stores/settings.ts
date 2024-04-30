import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';

export type Settings = {
	model: string;
	temperature: number;
	seed: number | undefined;
	endpoint: string;
};

export const settings: Writable<Settings> = localStorageStore('settings', {
	model: 'open-mixtral-8x22b',
	temperature: 0.7,
	seed: undefined,
	endpoint: ''
});
