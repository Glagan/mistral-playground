import { db } from '$lib/server/db';
import { chatShareTable } from '$lib/server/schema';
import type { ChatState } from '$lib/stores/chat.svelte';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CryptoHasher, randomUUIDv7 } from 'bun';
import { z } from 'zod';

const messageDetailsSchema = z.discriminatedUnion('role', [
	z.object({
		role: z.literal('system'),
		versions: z.array(
			z.object({
				content: z.array(z.unknown()) // TextChunk[]
			})
		)
	}),
	z.object({
		role: z.literal('user'),
		versions: z.array(
			z.object({
				content: z.array(z.unknown()) // ContentChunk[]
			})
		)
	}),
	z.object({
		role: z.literal('assistant'),
		versions: z.array(
			z.object({
				content: z.array(z.unknown()) // ContentChunk[]
			})
		)
	})
]);

const messageSchema = z.intersection(
	z.object({
		id: z.string(),
		index: z.number()
	}),
	messageDetailsSchema
);

const usageSchema = z.object({
	promptTokens: z.number(),
	completionTokens: z.number(),
	totalTokens: z.number()
});

const chatOptionsSchema = z.object({
	model: z.string(),
	temperature: z.number(),
	topP: z.number(),
	maxTokens: z.union([z.number(), z.undefined()]),
	json: z.boolean(),
	safePrompt: z.boolean(),
	randomSeed: z.union([z.number(), z.undefined()])
});

const chatStateSchema = z.object({
	id: z.string(),
	messages: z.array(messageSchema),
	usage: z.union([usageSchema, z.undefined()]),
	options: chatOptionsSchema
});

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	const validated = chatStateSchema.safeParse(data);
	if (validated.error) {
		error(400, validated.error.message);
	}

	const id = randomUUIDv7('hex');
	// Select only the active versions of each messages
	for (let index = 0; index < validated.data.messages.length; index++) {
		const message = validated.data.messages[index];
		if (message.versions.length > 0) {
			message.versions = [message.versions[message.index]];
			message.index = 0;
		}
	}

	const deletionKey = new CryptoHasher('md5').update(Date.now().toString()).update(id).digest('hex');
	const [chatShare] = await db
		.insert(chatShareTable)
		.values([{ id, data: validated.data as ChatState, deletionKey }])
		.returning();
	return json({ chatShare });
};
