import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), wasm(), enhancedImages(), sveltekit()],
	build: { target: 'esnext' }
});
