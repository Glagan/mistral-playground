import { MediaQuery } from 'svelte/reactivity';

const DEFAULT_XL_BREAKPOINT = 1280;

export class IsXl extends MediaQuery {
	constructor(breakpoint: number = DEFAULT_XL_BREAKPOINT) {
		super(`max-width: ${breakpoint - 1}px`);
	}
}
