export type Usage = { prompt_tokens: number; total_tokens: number; completion_tokens: number };

export type Question = {
	type: 'question' | 'system';
	content: string;
};

export type Answer = {
	type: 'answer';
	content: string;
	usage?: Usage;
};

export type Options = {
	model: 'mistral-tiny' | 'mistral-small' | 'mistral-medium';
	temperature: number;
	topP: number;
	maxTokens: undefined | number;
	safePrompt: boolean;
	randomSeed: undefined | number;
	system: string;
};
