import { get } from 'svelte/store';
import type { ChatOptions, Usage, Message } from '../types';
import { settings } from './settings';
import { v7 as uuid } from 'uuid';
import { models } from './models.svelte';

export type ChatState = {
	id: string;
	messages: Message[];
	usage?: Usage;
	options: ChatOptions;
};

export function defaultOptions(): ChatOptions {
	const seed = get(settings).seed;
	return {
		model: get(settings).model ?? 'mistral-small-latest',
		temperature: get(settings).temperature,
		topP: 1,
		maxTokens: undefined,
		json: false,
		safePrompt: false,
		seed: isNaN(Number(seed)) ? undefined : Number(seed),
		frequencyPenalty: 0,
		presencePenalty: 0
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
		// Add new options
		if (state.options.frequencyPenalty === undefined) {
			state.options.frequencyPenalty = 0;
		}
		if (state.options.presencePenalty === undefined) {
			state.options.presencePenalty = 0;
		}
		state.usage = entry.usage;
		state.messages = entry.messages;
		// Migrate system prompts from the message list to the options
		if (state.messages[0]?.role === 'system') {
			state.options.systemPrompt = state.messages[0].versions[state.messages[0].index].content[0].text as string;
			state.messages.splice(0, 1);
		}
	}

	return {
		state,
		defaultOptions,
		setFromEntry,
		reset,
		get model() {
			return models.byName[state.options.model];
		},
		get hasMultimediaContent() {
			return (
				state.messages.find((m) =>
					m.versions.find((v) =>
						v.content.find(
							(c) =>
								c.type === 'image_url' || c.type === 'input_audio' || c.type === 'document_url' || c.type === 'file'
						)
					)
				) !== undefined
			);
		}
	};
}

export const chat = createCurrent();
