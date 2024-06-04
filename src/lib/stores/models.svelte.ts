import { get } from 'svelte/store';
import { apiKey } from './apiKey';
import { settings } from './settings';

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
		const response = await fetch('/api/models', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				apiKey: get(apiKey),
				endpoint: get(settings).endpoint
			})
		});
		if (!response.ok) {
			const rawBody = await response.text();
			const body = JSON.parse(rawBody) as {
				error: any;
				message?: string;
				code: 'ERR_API_KEY' | 'ERR_API_REQ';
			};
			if (body.code === 'ERR_API_KEY') {
				models.error = {
					title: 'Failed to load models',
					message: 'Your API key is invalid.'
				};
			} else if (body.code === 'ERR_API_REQ') {
				models.error = {
					title: 'Failed to load models',
					message: 'The Mistral API is down or there is a problem with your API key.'
				};
			}
			return;
		}
		const body: {
			id: string;
			object: 'model';
			created: number;
		}[] = await response.json();
		models.list = body.filter((model) => model.id !== 'mistral-embed');
		models.loading = false;
		models.loaded = true;
	} catch (error) {
		console.error('Failed to load models:', error);
		models.error = {
			title: 'Failed to load models',
			message: 'The Mistral API is down or there is a problem with your API key.'
		};
	}
}
