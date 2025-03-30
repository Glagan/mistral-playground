import { get } from 'svelte/store';
import { apiKey } from './apiKey';
import { settings } from './settings';
import { getClientForRequest } from '$lib/mistral';
import type { BaseModelCard, FTModelCard, ModelList } from '@mistralai/mistralai/models/components';

export const models: {
	loading: boolean;
	loaded: boolean;
	error: { title: string; message: string } | null;
	list: (BaseModelCard | FTModelCard)[];
	chat: (BaseModelCard | FTModelCard)[];
	chatGroups: Record<string, (BaseModelCard | FTModelCard)[]>;
	vision: (BaseModelCard | FTModelCard)[];
	visionGroups: Record<string, (BaseModelCard | FTModelCard)[]>;
	ocr: (BaseModelCard | FTModelCard)[];
	ocrGroups: Record<string, (BaseModelCard | FTModelCard)[]>;
} = $state({
	loading: false,
	loaded: false,
	error: null,
	list: [],
	chat: [],
	chatGroups: {},
	ocr: [],
	ocrGroups: {},
	vision: [],
	visionGroups: {}
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

export async function loadModels() {
	try {
		models.loading = true;
		const client = getClientForRequest({ apiKey: get(apiKey), endpoint: get(settings).endpoint });
		const response = await client.models.list();
		models.list = response.data?.filter((model) => model.id !== 'mistral-embed') ?? [];
		models.chat = models.list.filter((model) => model.capabilities.completionChat && !model.id.includes('ocr'));
		models.chatGroups = groupModels(models.chat);
		models.vision = models.chat.filter(
			(model) => model.capabilities.completionChat && model.capabilities.vision && !model.id.includes('ocr')
		);
		models.visionGroups = groupModels(models.vision);
		models.ocr = models.list.filter((model) => model.id.includes('ocr'));
		models.ocrGroups = groupModels(models.ocr);
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
