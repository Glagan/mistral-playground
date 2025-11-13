import type { OCROptions } from '../types';
import { v7 as uuid } from 'uuid';
import type { OCRPageObject, OCRUsageInfo } from '@mistralai/mistralai/models/components';
import { models } from './models.svelte';
import { extractTimestampFromUUIDv7 } from '$lib/utils/uuid';

export type OCRState = {
	id: string;
	favorite?: boolean;
	filename: string;
	pages: OCRPageObject[];
	usage?: OCRUsageInfo;
	options: OCROptions;
	createdAtTimestamp?: number;
};

function defaultOptions(): OCROptions {
	// return { model: get(settings).model ?? 'mistral-ocr-latest' };
	return { model: 'mistral-ocr-latest', imageLimit: undefined, minSize: undefined };
}

export function createCurrent() {
	const state: OCRState = $state({
		id: uuid(),
		favorite: false,
		filename: '',
		pages: [],
		options: defaultOptions(),
		createdAtTimestamp: Date.now()
	});

	function reset() {
		resetResult();
		state.options = defaultOptions();
	}

	function resetResult() {
		state.id = uuid();
		state.favorite = false;
		state.filename = '';
		state.usage = undefined;
		state.pages = [];
	}

	function setFromEntry(entry: OCRState) {
		state.id = entry.id;
		state.favorite = entry.favorite;
		state.filename = entry.filename;
		state.options = entry.options;
		state.usage = entry.usage;
		state.pages = entry.pages;
		state.createdAtTimestamp = entry.createdAtTimestamp ?? extractTimestampFromUUIDv7(entry.id);
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

export const ocr = createCurrent();
