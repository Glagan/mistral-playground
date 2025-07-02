import { EmbeddingDtype, type ContentChunk, type TextChunk } from '@mistralai/mistralai/models/components';

export type Usage = { promptTokens: number; completionTokens: number; totalTokens: number; tps?: number };

export type MessageRole = 'system' | 'user' | 'assistant';
export type MessageBase = { id: string; index: number };

export type SystemMessageDetails = {
	role: 'system';
	versions: { content: TextChunk[] }[];
};
export type UserMessageDetails = {
	role: 'user';
	versions: { content: ContentChunk[] }[];
};
export type AssistantMessageDetails = {
	role: 'assistant';
	versions: { content: ContentChunk[] }[];
};
export type AssistantMessage = MessageBase & AssistantMessageDetails;

export type MessageDetails = SystemMessageDetails | UserMessageDetails | AssistantMessageDetails;
export type Message = MessageBase & MessageDetails;
export type MessageContent = TextChunk[] | ContentChunk[];

export type ChatOptions = {
	model: string;
	temperature: number;
	topP: number;
	presencePenalty: number | undefined;
	frequencyPenalty: number | undefined;
	maxTokens: number | undefined;
	json?: boolean;
	safePrompt: boolean;
	seed?: number | undefined;
	systemPrompt?: string | undefined;
};

export type Page = {
	index: number;
	markdown: string;
	images: {
		id: string;
		top_left_x: number;
		top_left_y: number;
		bottom_right_x: number;
		bottom_right_y: number;
		image_base64: string;
	}[];
	dimensions: { dpi: number; height: number; width: number };
};

export type OCROptions = { model: string; minSize: number | undefined; imageLimit: number | undefined };

export const embeddingTypes = ['float', 'int8', 'uint8', 'binary', 'ubinary'] as const;
export type EmbeddingType = (typeof embeddingTypes)[number];
