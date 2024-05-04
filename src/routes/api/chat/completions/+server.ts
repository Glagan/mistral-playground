import type { Usage } from '$lib/types';
import type { RequestHandler } from './$types';
import { type ChatCompletionResponseChunk } from '@mistralai/mistralai';
import { z } from 'zod';
import { performance } from 'perf_hooks';
import { getClientForRequest } from '$lib/server/getClient';

export const POST: RequestHandler = async ({ request }) => {
	const rawBody = await request.text();
	const unparsedBody = JSON.parse(rawBody);

	const parsingResponse = z
		.object({
			apiKey: z.string(),
			messages: z
				.array(
					z.object({
						type: z.enum(['user', 'assistant', 'system']),
						content: z.string()
					})
				)
				.min(0),
			options: z
				.object({
					// 'open-mistral-7b' | 'mistral-tiny-2312' | 'mistral-tiny' | 'open-mixtral-8x7b' | 'mistral-small-2312' | 'mistral-small' | 'mistral-small-2402' | 'mistral-small-latest' | 'mistral-medium-latest' | 'mistral-medium-2312' | 'mistral-medium' | 'mistral-large-latest' | 'mistral-large-2402' | 'mistral-embed'
					model: z.string(),
					maxTokens: z.coerce.number().optional().default(0),
					randomSeed: z.coerce.number().optional().default(0),
					safePrompt: z.coerce.boolean().optional().default(false),
					temperature: z.coerce.number().optional().default(0.7),
					topP: z.coerce.number().optional().default(1)
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
	const client = getClientForRequest(body);
	const { maxTokens, randomSeed, safePrompt, temperature, topP } = body.options ?? {};

	const chatStreamResponse = client.chatStream({
		model: body.options?.model ? body.options?.model : 'open-mixtral-8x22b',
		messages: body.messages.map((message) => ({
			role: message.type,
			content: message.content
		})),
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
			'Cache-Control': 'no-cache',
			'Content-Type': 'text/event-stream',
			Connection: 'keep-alive',
			'Content-Encoding': 'none',
			'Access-Control-Allow-Origin': '*',
			'X-Accel-Buffering': 'no'
		}
	});

	let usage: Usage | null = null;
	const startedAt = performance.now();

	function handleChunk(chunk: ChatCompletionResponseChunk) {
		if (chunk.choices[0].delta.content !== undefined) {
			const streamText = chunk.choices[0].delta.content;
			controller!.enqueue(streamText);
		}
		const _usage = (chunk as unknown as { usage: Usage | null }).usage;
		if (_usage) {
			usage = _usage;
		}
	}

	// Check the first chunk first to handle API errors
	try {
		const firstChunk = (await chatStreamResponse.next()).value;
		if (firstChunk !== undefined) {
			handleChunk(firstChunk);
			if (usage) {
				controller!.enqueue(`#${JSON.stringify(usage)}`);
			}
		} else {
			throw new Error('Invalid state: First chunk is undefined');
		}
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
				message: (error as any).message.replace(/.+?Response:\s+(.+)/i, '$1'),
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

	(async () => {
		try {
			for await (const chunk of chatStreamResponse) {
				handleChunk(chunk);
			}
			if (usage) {
				const completionTime = performance.now() - startedAt;
				(usage as Usage).tps = Math.round(Number((usage as Usage).completion_tokens / (completionTime / 1000)));
				controller!.enqueue(`#${JSON.stringify(usage)}`);
			}
		} catch (_error) {
			console.error(_error);
		} finally {
			if (!cancelled) {
				controller!.close();
			}
		}
	})();

	return response;
};
