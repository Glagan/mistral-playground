import { get } from 'svelte/store';
import { apiKey } from './apiKey';
import { settings } from './settings';
import { getClientForRequest } from '$lib/mistral';

export const models: {
	loading: boolean;
	loaded: boolean;
	error: { title: string; message: string } | null;
	list: {
		id: string;
		object: 'model';
		created: number;
	}[];
} = $state({
	loading: false,
	loaded: false,
	error: null,
	list: []
});

export async function loadModels() {
	try {
		models.loading = true;
		models.error = null;
		const client = getClientForRequest({ apiKey: get(apiKey), endpoint: get(settings).endpoint });
		const response = await client.listModels();
		models.list = response.data.filter((model) => model.id !== 'mistral-embed');
		models.loading = false;
		models.loaded = true;
	} catch (_error) {
		const error = _error as Error;
		console.error('Failed to load models:', error);
		if (error.message.indexOf('Unauthorized')) {
			models.error = {
				title: 'Failed to load models',
				message: 'Unauthorized, invalid or expired API key.'
			};
		} else {
			models.error = {
				title: 'Failed to load models',
				message: 'The Mistral API is down or there is a problem with your API key.'
			};
		}
	}
}
