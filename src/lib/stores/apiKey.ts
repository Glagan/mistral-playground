import { writable, type Writable } from 'svelte/store';

export const apiKey: Writable<string> = writable('');
