import type { Usage } from '$lib/types';
import type { RequestHandler } from './$types';
import MistralClient, { type ChatCompletionResponseChunk } from '@mistralai/mistralai';
import { z } from 'zod';
import { normalizeURL } from 'ufo';

export const POST: RequestHandler = async ({ request }) => {
	const rawBody = await request.text();
	const unparsedBody = JSON.parse(rawBody);

	const parsingResponse = z
		.object({
			apiKey: z.string(),
			input: z.array(z.string()).min(1),
			options: z
				.object({
					model: z.enum(['mistral-embed'])
					// encodingFormat: z.enum(['float']),
				})
				.optional(),
			endpoint: z.string().optional()
		})
		.safeParse(unparsedBody);
	if (!parsingResponse.success) {
		return new Response(JSON.stringify({ error: parsingResponse.error, code: 'ERR_PARSING' }), {
			headers: {
				'Content-Type': 'application/json'
			},
			status: 400
		});
	}
	const body = parsingResponse.data;

	const useEndpoint = body.endpoint?.length ? body.endpoint : undefined;
	const cleanEndpoint = useEndpoint ? normalizeURL(useEndpoint).replace(/\/+$/, '') : undefined;
	const client = new MistralClient(body.apiKey, cleanEndpoint);

	try {
		const embeddingResponse = await client.embeddings({
			model: body.options?.model ? body.options?.model : 'mistral-embed',
			input: body.input
		});
		return new Response(JSON.stringify(embeddingResponse), {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		if ((error as any).message.includes('Unauthorized')) {
			return new Response(
				JSON.stringify({
					error: 'Invalid API key',
					message: (error as any).message.replace(/.+?Response:\s+(.+)/i, '$1'),
					code: 'ERR_API_KEY'
				}),
				{
					headers: {
						'Content-Type': 'application/json'
					},
					status: 400
				}
			);
		}
		return new Response(
			JSON.stringify({
				error: 'Invalid Request',
				message: (error as any).message ?? error,
				code: 'ERR_API_REQ'
			}),
			{
				headers: {
					'Content-Type': 'application/json'
				},
				status: 400
			}
		);
	}
};
