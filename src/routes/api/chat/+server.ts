import type { Usage } from '$lib/types';
import type { RequestHandler } from './$types';
import MistralClient from '@mistralai/mistralai';
import { z } from 'zod';

export const POST: RequestHandler = async ({ url, request }) => {
	const rawBody = await request.text();
	const unparsedBody = JSON.parse(rawBody);

	const parsingResponse = z
		.object({
			apiKey: z.string(),
			prompt: z.string(),
			history: z
				.array(
					z.object({
						type: z.enum(['question', 'answer']),
						content: z.string()
					})
				)
				.optional(),
			options: z
				.object({
					model: z.enum(['mistral-tiny', 'mistral-small', 'mistral-medium']),
					maxTokens: z.coerce.number().optional().default(0),
					randomSeed: z.coerce.number().optional().default(0),
					safePrompt: z.coerce.boolean().optional().default(false),
					temperature: z.coerce.number().optional().default(0.7),
					topP: z.coerce.number().optional().default(1),
					system: z.string().optional().default('')
				})
				.optional()
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

	try {
		const client = new MistralClient(body.apiKey);
		const { maxTokens, randomSeed, safePrompt, temperature, topP } = body.options ?? {};

		const history = (body.history ?? []).map(({ type, content }) => ({
			role: type === 'question' ? 'user' : 'assistant',
			content
		}));
		const chatStreamResponse = client.chatStream({
			model: body.options?.model ? body.options?.model : 'mistral-small',
			messages: [
				...(body.options?.system ? [{ role: 'system', content: body.options.system }] : []),
				...history,
				{ role: 'user', content: body.prompt }
			],
			maxTokens: maxTokens ? maxTokens : undefined,
			randomSeed: randomSeed ? randomSeed : undefined,
			safePrompt,
			temperature,
			topP
		});

		let controller: ReadableStreamDefaultController<any>;
		let cancelled = false;
		const stream = new ReadableStream({
			start(_controller) {
				controller = _controller;
			},
			cancel() {
				cancelled = true;
			}
		});
		const response = new Response(stream, {
			headers: {
				'Cache-Control': 'no-store',
				'Content-Type': 'text/event-stream',
				Connection: 'keep-alive',
				'Content-Encoding': 'none',
				'Access-Control-Allow-Origin': '*'
			}
		});

		(async () => {
			try {
				let usage: Usage | null = null;
				for await (const chunk of chatStreamResponse) {
					if (chunk.choices[0].delta.content !== undefined) {
						const streamText = chunk.choices[0].delta.content;
						controller!.enqueue(streamText);
					}
					const _usage = (chunk as unknown as { usage: Usage | null }).usage;
					if (_usage) {
						usage = _usage;
					}
				}
				if (usage) {
					controller!.enqueue(`#${JSON.stringify(usage)}`);
				}
				if (!stream.locked) {
					await stream.cancel();
				}
			} catch (_error) {
				const error = _error as Error;
				if (error.message !== 'Invalid state: Controller is already closed') {
					console.error(error);
				}
				if (!stream.locked) {
					await stream.cancel();
				}
			}
		})();

		return response;
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Invalid API key', code: 'ERR_API_KEY' }), {
			headers: {
				'Content-Type': 'application/json'
			},
			status: 400
		});
	}
};
