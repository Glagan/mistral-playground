import { join } from 'path';
import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import { skeleton } from '@skeletonlabs/tw-plugin';

const config = {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
	],
	theme: {
		extend: {
			colors: {
				// 'bali-hai': {
				// 	'50': '#f4f8f9',
				// 	'100': '#eaf4f5',
				// 	'200': '#d9e9ec',
				// 	'300': '#c1d9e0',
				// 	'400': '#a8c4d1',
				// 	'500': '#91b1c3',
				// 	'600': '#83a0b7',
				// 	'700': '#67839b',
				// 	'800': '#556b7e',
				// 	'900': '#495a66',
				// 	'950': '#2b343b'
				// },
				// 'lucky-point': {
				// 	'50': '#f4f6fe',
				// 	'100': '#ebeefc',
				// 	'200': '#d9dffb',
				// 	'300': '#bac3f8',
				// 	'400': '#939df2',
				// 	'500': '#686eea',
				// 	'600': '#4b48df',
				// 	'700': '#3b35cc',
				// 	'800': '#312cab',
				// 	'900': '#2a268c',
				// 	'950': '#181865'
				// }
			}
		}
	},
	plugins: [
		forms,
		skeleton({
			themes: { preset: ['vintage'] }
		})
	]
} satisfies Config;

export default config;
