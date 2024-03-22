import { writable } from 'svelte/store';

export const modelError = writable<{
    title: string;
    message: string;
} | null>(null);