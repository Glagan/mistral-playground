import wasm from 'vite-plugin-wasm';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [wasm(), sveltekit()],
	build: {
		target: 'esnext'
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
