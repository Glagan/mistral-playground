export type Usage = {
	prompt_tokens: number;
	total_tokens: number;
	completion_tokens: number;
	tps?: number;
};

export type Message = {
	type: 'user' | 'assistant' | 'system';
	id: string;
	index: number;
	content: string[];
};

export type ChatOptions = {
	model: string;
	temperature: number;
	topP: number;
	maxTokens: undefined | number;
	json?: boolean;
	safePrompt: boolean;
	randomSeed: undefined | number;
};

export type CodeOptions = {
	model: string;
	temperature: number;
	topP: number;
	minTokens: undefined | number;
	maxTokens: undefined | number;
	randomSeed: undefined | number;
};
