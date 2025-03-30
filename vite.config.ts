import wasm from 'vite-plugin-wasm';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [wasm(), enhancedImages(), sveltekit()],
	build: {
		target: 'esnext'
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
