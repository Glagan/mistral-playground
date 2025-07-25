import type { EmbeddingsOptions } from '../types';
import { v7 as uuid } from 'uuid';
import { models } from './models.svelte';

export type EmbeddingsState = {
	id: string;
	promptText: string;
	result: number[];
	options: EmbeddingsOptions;
};

function defaultOptions(): EmbeddingsOptions {
	// return { model: get(settings).model ?? 'mistral-ocr-latest' };
	return { model: 'mistral-embed', outputDimension: undefined, outputDtype: undefined };
}

export function createCurrent() {
	const state: EmbeddingsState = $state({ id: uuid(), promptText: '', result: [], options: defaultOptions() });

	function reset() {
		state.id = uuid();
		state.promptText = '';
		state.result = [];
		state.options = defaultOptions();
	}

	function setFromEntry(entry: EmbeddingsState) {
		state.id = entry.id;
		state.promptText = entry.promptText;
		state.result = entry.result;
		state.options = entry.options;
	}

	return {
		state,
		defaultOptions,
		setFromEntry,
		reset,
		get model() {
			return models.byName[state.options.model];
		}
	};
}

export const embeddings = createCurrent();
