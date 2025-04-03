import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	// Load the apiKey from cookies to be able to render the page in SSR and avoid layout shift
	return {
		apiKey: cookies.get('apiKey')
	};
};
