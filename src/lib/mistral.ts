import MistralClient from '@mistralai/mistralai';
import { normalizeURL } from 'ufo';

const defaultEndpoint = 'https://api.mistral.ai';

export function getClientForRequest(params: { apiKey: string; endpoint?: string }) {
    const useEndpoint = params.endpoint?.length ? params.endpoint : defaultEndpoint;
    const cleanEndpoint = useEndpoint ? normalizeURL(useEndpoint).replace(/\/+$/, '') : defaultEndpoint;
    return new MistralClient(params.apiKey, cleanEndpoint);
}

