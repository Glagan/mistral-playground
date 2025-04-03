import { get } from 'svelte/store';
import type { ChatOptions, Usage, Message } from '../types';
import { settings } from './settings';
import { v4 as uuid } from 'uuid';

export type ChatState = {
	id: string;
	messages: Message[];
	usage?: Usage;
	options: ChatOptions;
};

function defaultOptions(): ChatOptions {
	const seed = get(settings).seed;
	return {
		model: get(settings).model ?? 'mistral-small-latest',
		temperature: get(settings).temperature,
		topP: 1,
		maxTokens: undefined,
		json: false,
		safePrompt: false,
		randomSeed: isNaN(Number(seed)) ? undefined : Number(seed)
	};
}

export function createCurrent() {
	const state: ChatState = $state({ id: uuid(), messages: [], options: defaultOptions() });

	function reset() {
		state.id = uuid();
		state.options = defaultOptions();
		state.usage = undefined;
		state.messages = [];
	}

	function setFromEntry(entry: ChatState) {
		state.id = entry.id;
		state.options = entry.options;
		state.usage = entry.usage;
		state.messages = entry.messages;
	}

	return { state, defaultOptions, setFromEntry, reset };
}

export const chat = createCurrent();
