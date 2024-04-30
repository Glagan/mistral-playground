import { get, writable } from 'svelte/store';
import type { Message, Options, Usage } from '../types';
import { settings } from './settings';
import { v4 as uuid } from 'uuid';

export type ChatState = {
	id: string;
	messages: Message[];
	usage?: Usage;
	options: Options;
};

export function createCurrent() {
	function defaultOptions(): Options {
		return {
			model: get(settings).model ?? 'open-mixtral-8x22b',
			temperature: get(settings).temperature,
			topP: 1,
			maxTokens: undefined,
			safePrompt: false,
			randomSeed: get(settings).seed
		};
	}

	let state = $state<ChatState>({
		id: uuid(),
		messages: [],
		options: defaultOptions()
	});

	function reset() {
		state = {
			id: uuid(),
			messages: [],
			options: defaultOptions()
		};
	}

	function setFromEntry(entry: ChatState) {
		state = entry;
	}

	return {
		get state() {
			return state;
		},
		defaultOptions,
		setFromEntry,
		reset
	};
}

export const current = writable<{
	readonly state: ChatState;
	defaultOptions: () => Options;
	setFromEntry: (entry: ChatState) => void;
	reset: () => void;
}>(createCurrent());
