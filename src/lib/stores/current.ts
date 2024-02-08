import { get, writable } from 'svelte/store';
import type { Answer, Options, Question } from '../types';
import { settings } from './settings';
import { v4 as uuid } from 'uuid';

export type ChatState = {
	id: string;
	messages: (Question | Answer)[];
	options: Options;
};

export function defaultOptions(): Options {
	return {
		model: 'mistral-small',
		temperature: get(settings).temperature,
		topP: 1,
		maxTokens: undefined,
		safePrompt: false,
		randomSeed: get(settings).seed,
		system: ''
	};
}

export function resetCurrent() {
	return current.set({
		id: uuid(),
		messages: [],
		options: defaultOptions()
	});
}

export const current = writable<ChatState>({
	id: uuid(),
	messages: [],
	options: defaultOptions()
});
