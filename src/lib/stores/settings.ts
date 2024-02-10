import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';

export type Settings = {
	temperature: number;
	seed: number | undefined;
	endpoint: string;
};

export const settings: Writable<Settings> = localStorageStore('settings', {
	temperature: 0.7,
	seed: undefined,
	endpoint: 'https://api.mistral.ai/v1'
});
