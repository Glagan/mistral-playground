import type { EmbeddingsOptions } from '../types';
import { v7 as uuid } from 'uuid';
import { models } from './models.svelte';
import { extractTimestampFromUUIDv7 } from '$lib/utils/uuid';

export type EmbeddingsState = {
	id: string;
	promptText: string;
	result: number[];
	options: EmbeddingsOptions;
	createdAtTimestamp?: number;
};

function defaultOptions(): EmbeddingsOptions {
	// return { model: get(settings).model ?? 'mistral-ocr-latest' };
	return { model: 'mistral-embed', outputDimension: undefined, outputDtype: 'float' };
}

export function createCurrent() {
	const state: EmbeddingsState = $state({
		id: uuid(),
		promptText: '',
		result: [],
		options: defaultOptions(),
		createdAtTimestamp: Date.now()
	});

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
		state.createdAtTimestamp = entry.createdAtTimestamp ?? extractTimestampFromUUIDv7(entry.id);
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
