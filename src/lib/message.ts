import type { Message, MessageContent, MessageRole } from './types';

export type MessageInteraction = {
	moveUp: (message: Message) => void;
	moveDown: (message: Message) => void;
	refresh: (message: Message) => void;
	previousVersion: (message: Message) => void;
	nextVersion: (message: Message) => void;
	deleteVersion: (message: Message) => void;
	updateMessage: (message: Message, role: MessageRole, content: MessageContent) => void;
	deleteMessage: (message: Message) => void;
	generate: (event: Event) => void;
};
