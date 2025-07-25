import type { TranscribeOptions } from '../types';
import { v7 as uuid } from 'uuid';
import { models } from './models.svelte';
import type { TranscriptionSegmentChunk, UsageInfo } from '@mistralai/mistralai/models/components';

export type TranscribeState = {
	id: string;
	filename: string;
	text: string;
	language: string | null;
	segments: TranscriptionSegmentChunk[];
	usage?: UsageInfo;
	options: TranscribeOptions;
};

function defaultOptions(): TranscribeOptions {
	return { model: 'voxtral-mini-latest', temperature: 0.3, language: undefined, timestampGranularities: false };
}

export function createCurrent() {
	const state: TranscribeState = $state({
		id: uuid(),
		filename: '',
		text: '',
		language: null,
		segments: [],
		options: defaultOptions()
	});

	function reset() {
		resetResult();
		state.options = defaultOptions();
	}

	function resetResult() {
		state.id = uuid();
		state.filename = '';
		state.text = '';
		state.language = null;
		state.segments = [];
		state.usage = undefined;
	}

	function setFromEntry(entry: TranscribeState) {
		state.id = entry.id;
		state.filename = entry.filename;
		state.text = entry.text;
		state.language = entry.language;
		state.segments = entry.segments;
		state.usage = entry.usage;
		state.options = entry.options;
	}

	return {
		state,
		defaultOptions,
		setFromEntry,
		reset,
		resetResult,
		get model() {
			return models.byName[state.options.model];
		}
	};
}

export const transcribe = createCurrent();
