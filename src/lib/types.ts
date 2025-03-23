export type Usage = { promptTokens: number; completionTokens: number; totalTokens: number; tps?: number };

export type Message = { type: 'user' | 'assistant' | 'system'; id: string; index: number; content: string[] };

export type ChatOptions = {
	model: string;
	temperature: number;
	topP: number;
	maxTokens: undefined | number;
	json?: boolean;
	safePrompt: boolean;
	randomSeed: undefined | number;
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

export type OCROptions = { model: string };
