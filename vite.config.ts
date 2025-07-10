import { sentrySvelteKit } from '@sentry/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: 'glagan-xz',
				project: 'mistral-playground'
			}
		}),
		tailwindcss(),
		wasm(),
		enhancedImages(),
		sveltekit()
	],
	build: { target: 'esnext' }
});
