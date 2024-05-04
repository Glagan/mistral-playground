import type { RequestHandler } from './$types';
import { z } from 'zod';
import { getClientForRequest } from '$lib/server/getClient';

export const POST: RequestHandler = async ({ request }) => {
	const rawBody = await request.text();
	const unparsedBody = JSON.parse(rawBody);

	const parsingResponse = z
		.object({
			apiKey: z.string(),
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
	const client = getClientForRequest(body);

	try {
		const models = await client.listModels();
		return new Response(JSON.stringify(models.data), {
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
