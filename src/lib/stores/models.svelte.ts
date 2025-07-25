import { get } from 'svelte/store';
import { apiKey } from './apiKey';
import { settings } from './settings';
import { getClientForRequest } from '$lib/mistral';
import type { BaseModelCard, FTModelCard } from '@mistralai/mistralai/models/components';

export type MergedModel = (BaseModelCard | FTModelCard) & {
	reasoning?: boolean;
	transcribe?: boolean;
};

export const models: {
	loading: boolean;
	loaded: boolean;
	error: { title: string; message: string } | null;
	list: MergedModel[];
	byName: Record<string, MergedModel>;
	chat: MergedModel[];
	chatGroups: Record<string, MergedModel[]>;
	vision: MergedModel[];
	visionGroups: Record<string, MergedModel[]>;
	ocr: MergedModel[];
	ocrGroups: Record<string, MergedModel[]>;
	embed: MergedModel[];
	embedGroups: Record<string, MergedModel[]>;
} = $state({
	loading: false,
	loaded: false,
	error: null,
	list: [],
	byName: {},
	chat: [],
	chatGroups: {},
	vision: [],
	visionGroups: {},
	ocr: [],
	ocrGroups: {},
	embed: [],
	embedGroups: {}
});

function groupModels(models: (BaseModelCard | FTModelCard)[]): Record<string, (BaseModelCard | FTModelCard)[]> {
	const groups: Record<string, (BaseModelCard | FTModelCard)[]> = {};
	for (let index = 0; index < models.length; index++) {
		const model = models[index];
		const modelName = model.id.match(/^(.+?)-(latest|[\dxb]+(?:-rc\d+)?)$/)?.[1];
		if (!modelName) {
			if (!groups[model.id]) {
				groups[model.id] = [];
			}
			groups[model.id].push(model);
		} else {
			if (!groups[modelName]) {
				groups[modelName] = [];
			}
			groups[modelName].push(model);
		}
	}
	return groups;
}

// There is no prices in the API, so we need to hardcode them for each models (when they give the information)
export const prices: Record<string, { input: number; output: number }> = {
	'mistral-medium-latest': { input: 0.4, output: 2 },
	'magistral-medium-latest': { input: 2, output: 5 },
	'mistral-large-latest': { input: 2, output: 6 },
	'devstral-medium-2507': { input: 0.4, output: 2 },
	'codestral-latest': { input: 0.3, output: 0.9 },
	'mistral-small-latest': { input: 0.1, output: 0.3 },
	'magistral-small-latest': { input: 0.5, output: 1.5 },
	'devstral-small-2507': { input: 0.1, output: 0.3 },
	'voxtral-small-latest': { input: 0.1, output: 0.3 },
	'voxtral-mini-latest': { input: 0.04, output: 0.04 },
	'pixtral-large-latest': { input: 2, output: 6 },
	'pixtral-12b': { input: 0.15, output: 0.15 },
	'mistral-nemo': { input: 0.15, output: 0.15 },
	'mistral-saba-latest': { input: 0.25, output: 0.25 },
	'open-mistral-7b': { input: 0.2, output: 0.6 },
	'open-mixtral-8x7b': { input: 0.7, output: 0.7 },
	'open-mixtral-8x22b': { input: 2, output: 6 },
	'ministral-8b-latest': { input: 0.1, output: 1 },
	'ministral-3b-latest': { input: 0.04, output: 0.04 }
};

export function priceForModel(model: MergedModel) {
	if (prices[model.id]) {
		return prices[model.id];
	}
	if (model.aliases) {
		const fromAlias = model.aliases.find((alias) => prices[alias]);
		if (fromAlias) {
			return prices[fromAlias];
		}
	}
	return null;
}

export async function loadModels() {
	try {
		models.loading = true;
		const client = getClientForRequest({ apiKey: get(apiKey), endpoint: get(settings).endpoint });
		const response = await client.models.list();
		models.list = response.data ?? [];
		models.byName = {};
		for (let index = 0; index < models.list.length; index++) {
			const model = models.list[index];
			models.byName[model.id] = model;
			// No flags, so we add our own
			if (model.id.includes('magistral')) {
				model.reasoning = true;
			}
			if (model.id.includes('voxtral')) {
				model.transcribe = true;
			}
		}
		models.chat = models.list.filter((model) => model.capabilities?.completionChat && !model.id.includes('ocr'));
		models.chatGroups = groupModels(models.chat);
		models.vision = models.chat.filter(
			(model) => model.capabilities?.completionChat && model.capabilities?.vision && !model.id.includes('ocr')
		);
		models.visionGroups = groupModels(models.vision);
		models.ocr = models.list.filter((model) => model.id.includes('ocr'));
		models.ocrGroups = groupModels(models.ocr);
		models.embed = models.list.filter((model) => model.id.includes('embed'));
		models.embedGroups = groupModels(models.embed);
		models.loaded = true;
		models.error = null;
	} catch (_error) {
		const error = _error as Error;
		const status = error.message.match(/status: (\d+)/)?.[1];
		console.error('Failed to load models:', status, error);
		if (status === '401' || status === '403') {
			models.error = { title: 'Failed to load models', message: 'Unauthorized, invalid or expired API key.' };
		} else if (status === '404') {
			models.error = { title: 'Failed to load models', message: 'Not found, check if your endpoint is correctly set.' };
		} else {
			models.error = {
				title: 'Failed to load models',
				message: 'The Mistral API is down or there is a problem with your API key.'
			};
		}
	} finally {
		models.loading = false;
	}
}
