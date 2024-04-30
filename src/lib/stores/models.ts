import { get, writable, type Writable } from 'svelte/store';
import { apiKey } from './apiKey';
import { settings } from './settings';

export const loadingModels: Writable<boolean> = writable(false);
export const loadedModels: Writable<boolean> = writable(false);
export const modelError: Writable<{ title: string; message: string } | null> = writable(null);
export const models: Writable<
	{
		id: string;
		object: 'model';
		created: number;
	}[]
> = writable([]);

export async function loadModels() {
	try {
		loadingModels.set(true);
		modelError.set(null);
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
				modelError.set({
					title: 'Failed to load models',
					message: 'Your API key is invalid.'
				});
			} else if (body.code === 'ERR_API_REQ') {
				modelError.set({
					title: 'Failed to load models',
					message: 'The Mistral API is down or there is a problem with your API key.'
				});
			}
			return;
		}
		const body: {
			id: string;
			object: 'model';
			created: number;
		}[] = await response.json();
		models.set(body.filter((model) => model.id !== 'mistral-embed'));
		loadingModels.set(false);
		loadedModels.set(true);
	} catch (error) {
		console.error('Failed to load models:', error);
		modelError.set({
			title: 'Failed to load models',
			message: 'The Mistral API is down or there is a problem with your API key.'
		});
	}
}
