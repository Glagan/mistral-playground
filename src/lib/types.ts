export type Usage = { prompt_tokens: number; total_tokens: number; completion_tokens: number };

export type Message = {
	id: string;
	index: number;
	content: string[];
};

export type Question = Message & {
	type: 'user' | 'system' | 'error';
};

export type Answer = Message & {
	type: 'assistant';
	usage?: Usage;
};

export type Options = {
	model: 'mistral-tiny' | 'mistral-small' | 'mistral-medium';
	temperature: number;
	topP: number;
	maxTokens: undefined | number;
	safePrompt: boolean;
	randomSeed: undefined | number;
};
