import { Mistral } from '@mistralai/mistralai';
import { normalizeURL } from 'ufo';

const defaultEndpoint = 'https://api.mistral.ai';

export function getClientForRequest(params: { apiKey: string; endpoint?: string }) {
	const useEndpoint = params.endpoint?.length ? params.endpoint : defaultEndpoint;
	const cleanEndpoint = useEndpoint ? normalizeURL(useEndpoint).replace(/\/+$/, '') : defaultEndpoint;
	return new Mistral({ apiKey: params.apiKey, serverURL: cleanEndpoint });
}
