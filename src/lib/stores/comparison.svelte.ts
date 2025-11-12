import type { ChatOptions } from '../types';
import { chat, createCurrent } from './chat.svelte';

export type ComparisonState = {
	syncOptions?: boolean;
};

export function createComparison() {
	const chatA = createCurrent();
	const chatB = createCurrent();

	const state: ComparisonState = $state({
		syncOptions: true
	});

	function setup() {
		// Copy state from the existing chat -- if it was empty it will copy nothing
		chatA.setFromEntry(JSON.parse(JSON.stringify(chat.state)));
		chatA.asNewChat();
		chatB.setFromEntry(JSON.parse(JSON.stringify(chat.state)));
		chatB.asNewChat();
	}

	function syncOptions() {
		if (!state.syncOptions) {
			return;
		}

		// Sync all options except model
		const optionsToSync = Object.keys(chatA.state.options).filter((key) => key !== 'model') as (keyof ChatOptions)[];
		for (const key of optionsToSync) {
			if (chatA.state.options[key] !== chatB.state.options[key]) {
				// Sync from A to B (A is the source of truth)
				(chatB.state.options as any)[key] = chatA.state.options[key];
			}
		}
	}

	function reset() {
		chatA.reset();
		chatB.reset();
	}

	return {
		state,
		chatA,
		chatB,
		setup,
		reset,
		syncOptions
	};
}

export const comparison = createComparison();
