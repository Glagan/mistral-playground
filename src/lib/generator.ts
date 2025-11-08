import type { Mistral } from '@mistralai/mistralai';
import type { ChatCompletionStreamRequest, TextChunk } from '@mistralai/mistralai/models/components';
import type { Message, AssistantMessage, ChatOptions, Usage } from './types';

export type GenerateChatMessageOptions = {
	client: Mistral;
	messages: Message[];
	answer: AssistantMessage;
	options: ChatOptions;
	modelInfo: {
		id: string;
		reasoning?: boolean;
	};
	abortSignal: AbortSignal;
	callbacks?: {
		/** Called after each chunk */
		onChunk?: () => void;
		/** Called after generation completes successfully */
		onComplete?: (usage: Usage) => void;
		onError?: (error: Error) => void;
	};
};

/**
 * Prepares messages for the Mistral API by converting from the internal format
 * to the API format, handling versioning, system prompts, and thinking content
 */
export function prepareMessages(
	messages: Message[],
	systemPrompt: string | undefined,
	modelInfo: { id: string; reasoning?: boolean }
): ChatCompletionStreamRequest['messages'] {
	const finalMessages: ChatCompletionStreamRequest['messages'] = messages.map((message) => {
		// Useless condition to avoid type errors
		if (message.role === 'user') {
			return {
				role: message.role,
				content: message.versions[message.index].content
			} as const;
		} else if (message.role === 'assistant') {
			const content = message.versions[message.index].content;
			if (modelInfo.reasoning && message.versions[message.index].thinking) {
				// Sadly we need to check for this model specifically to re-insert the <think> tag
				if (modelInfo.id === 'magistral-medium-2506') {
					const firstChunkText = content.find((c) => c.type === 'text');
					if (firstChunkText && firstChunkText.type === 'text') {
						firstChunkText.text = `<think>${message.versions[message.index].thinking}</think>\n${firstChunkText.text}`;
					}
				} else {
					content.unshift({
						type: 'thinking',
						thinking: [{ type: 'text', text: message.versions[message.index].thinking! }]
					} as any);
				}
			}
			return { role: message.role, content } as const;
		}
		return {
			role: message.role,
			content: message.versions[message.index].content
		} as const;
	}) as ChatCompletionStreamRequest['messages'];

	// Add system prompt at the beginning if provided
	if (systemPrompt) {
		finalMessages.unshift({ role: 'system', content: systemPrompt });
	}

	return finalMessages;
}

/**
 * Processes a stream chunk and updates the answer message accordingly
 * Handles text chunks, thinking chunks, and legacy <think> tag parsing
 */
export function processStreamChunk(
	chunk: any,
	answer: AssistantMessage,
	chunkIndex: number,
	reasoningState: {
		step: number;
		buffer: string;
	}
): void {
	if (chunk.type === 'text' && chunk.text !== undefined) {
		(answer.versions[answer.index].content[chunkIndex] as TextChunk).text += chunk.text;
	} else if (chunk.type === 'thinking' && chunk.thinking) {
		for (let j = 0; j < chunk.thinking.length; j++) {
			const block = chunk.thinking[j];
			if (block.type === 'text' && block.text !== undefined) {
				answer.versions[answer.index].thinking += block.text;
			} else {
				console.log('unsupported content in chunk', chunk, block);
			}
		}
	} else {
		console.log('unsupported chunk content', chunk);
	}
}

/**
 * Processes legacy <think> tags from magistral-medium-2506 model
 * Extracts thinking content and regular content from the streamed text
 */
export function processLegacyThinkTags(
	content: string,
	answer: AssistantMessage,
	reasoningState: {
		step: number;
		buffer: string;
	}
): void {
	if (!content) {
		return;
	}

	reasoningState.buffer += content;
	if (reasoningState.step === 0) {
		// Looking for opening <think> tag
		const start = reasoningState.buffer.indexOf('<think>');
		if (start >= 0) {
			reasoningState.buffer = reasoningState.buffer.slice(start + 7).trim();
			reasoningState.step = 1;
			if (reasoningState.buffer.length) {
				answer.versions[answer.index].thinking = reasoningState.buffer;
			}
		}
	} else if (reasoningState.step === 1) {
		// Looking for closing </think> tag
		const end = reasoningState.buffer.indexOf('</think>');
		if (end >= 0) {
			answer.versions[answer.index].thinking += reasoningState.buffer.slice(0, end);
			answer.versions[answer.index].thinking = answer.versions[answer.index].thinking?.trim();
			reasoningState.step = 2;
			reasoningState.buffer = reasoningState.buffer.slice(end + 8).trim();
			if (reasoningState.buffer.length) {
				(answer.versions[answer.index].content[0] as TextChunk).text += reasoningState.buffer;
			}
		} else {
			answer.versions[answer.index].thinking += content;
		}
	}
}

/**
 * Formats JSON responses with proper code fence markdown
 */
export function formatJSONResponse(answer: AssistantMessage): void {
	if (answer.versions[answer.index].content[0].type === 'text') {
		const textChunk = answer.versions[answer.index].content[0] as TextChunk;
		try {
			const parsed = JSON.parse(textChunk.text);
			textChunk.text = `\`\`\`json\n${JSON.stringify(parsed, undefined, 4)}\n\`\`\``;
		} catch (error) {
			// If parsing fails, leave the text as-is
			console.error('Failed to parse JSON response:', error);
		}
	}
}

/**
 * Generates a chat message using the Mistral API with streaming support
 * Handles reasoning models, thinking content, and various streaming scenarios
 */
export async function generateChatMessage(options: GenerateChatMessageOptions): Promise<Usage | null> {
	const { client, messages, answer, options: chatOptions, modelInfo, abortSignal, callbacks } = options;

	const finalMessages = prepareMessages(messages, chatOptions.systemPrompt, modelInfo);
	const chatStreamResponse = await client.chat.stream(
		{
			model: chatOptions.model,
			messages: finalMessages,
			maxTokens: typeof chatOptions.maxTokens === 'number' ? chatOptions.maxTokens : undefined,
			randomSeed: typeof chatOptions.seed === 'number' ? chatOptions.seed : undefined,
			responseFormat: chatOptions.json ? { type: 'json_object' } : undefined,
			safePrompt: chatOptions.safePrompt,
			temperature: chatOptions.temperature,
			topP: chatOptions.topP,
			frequencyPenalty: chatOptions.frequencyPenalty,
			presencePenalty: chatOptions.presencePenalty
		},
		{ fetchOptions: { signal: abortSignal } }
	);

	// Initialize thinking content for reasoning models
	if (modelInfo.reasoning) {
		answer.versions[answer.index].thinking = '';
	}

	// State for handling legacy <think> tags (magistral-medium-2506)
	let reasoningStep = modelInfo.id === 'magistral-medium-2506' ? 0 : 2;
	const reasoningState = {
		step: reasoningStep,
		buffer: ''
	};

	let usage: Usage | null = null;

	// Process the stream
	for await (const message of chatStreamResponse) {
		const data = message.data;
		if (data.choices[0].delta.content !== undefined) {
			const content = data.choices[0].delta.content;
			if (Array.isArray(content)) {
				// Handle structured content (standard format)
				for (let index = 0; index < content.length; index++) {
					const entry = content[index];
					processStreamChunk(entry, answer, index, reasoningState);
				}
			} else {
				// Handle string content (legacy or simple format)
				// If the model is reasoning (in the old way with <think> blocks), use special logic
				if (modelInfo.reasoning && reasoningState.step < 2) {
					processLegacyThinkTags(content ?? '', answer, reasoningState);
				} else {
					(answer.versions[answer.index].content[0] as TextChunk).text += content ?? '';
				}
			}
		}

		// Update usage statistics when available
		if (data.usage) {
			usage = {
				promptTokens: data.usage.promptTokens ?? 0,
				completionTokens: data.usage.completionTokens ?? 0,
				totalTokens: data.usage.totalTokens ?? 0
			};
		}

		// Trigger chunk callback
		callbacks?.onChunk?.();
	}

	if (!abortSignal.aborted && chatOptions.json) {
		formatJSONResponse(answer);
	}
	if (usage) {
		callbacks?.onComplete?.(usage);
	}
	return usage;
}
