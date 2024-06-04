import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';
import { z } from 'zod';

export const defaultModel = 'open-mixtral-8x22b';
export const defaultCodeModel = 'codestral-latest';
export const defaultTemperature = 0.7;

export const settingsSchema = z.object({
	model: z.string().min(1).default(defaultModel),
	codeModel: z.string().min(1).default(defaultModel),
	temperature: z.coerce.number().min(0).max(1).default(defaultTemperature),
	seed: z.union([z.coerce.number().int().min(0), z.string().length(0)]).optional(),
	endpoint: z.union([z.string().url(), z.string().length(0)]).optional()
});

export type Settings = z.infer<typeof settingsSchema>;

export const settings: Writable<Settings> = localStorageStore('settings', {
	model: defaultModel,
	codeModel: defaultCodeModel,
	temperature: defaultTemperature,
	seed: undefined,
	endpoint: undefined
}, {
	serializer: {
		parse(text) {
			const settings = JSON.parse(text);
			const model = settings.model ?? defaultModel;
			const codeModel = settings.codeModel ?? defaultCodeModel;
			const temperature = Number(settings.temperature);
			const seed = settings.seed ? Number(settings.seed) : undefined;
			let endpoint: string | undefined = undefined;
			try {
				new URL(settings.endpoint);
				endpoint = settings.endpoint;
			} catch (error) {
				// Invalid URL
			}
			return {
				model,
				codeModel,
				temperature: isNaN(temperature) || temperature < 0 || temperature > 1 ? defaultTemperature : temperature,
				seed: seed === undefined || isNaN(seed) || seed < 0 ? undefined : seed,
				endpoint
			};
		},
		stringify(object) {
			return JSON.stringify(object);
		}
	}
});
