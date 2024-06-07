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
		const client = getClientForRequest({ apiKey: get(apiKey), endpoint: get(settings).endpoint });
		const response = await client.listModels();
		models.list = response.data.filter((model) => model.id !== 'mistral-embed');
		models.loaded = true;
		models.error = null;
	} catch (_error) {
		const error = _error as Error;
		const status = error.message.match(/status: (\d+)/)?.[1];
		console.error('Failed to load models:', status, error);
		if (status === '401' || status === '403') {
			models.error = {
				title: 'Failed to load models',
				message: 'Unauthorized, invalid or expired API key.'
			};
		} else if (status === '404') {
			models.error = {
				title: 'Failed to load models',
				message: 'Not found, check if your endpoint is correctly set.'
			};
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
