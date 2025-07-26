export function extractErrorContent(error: Error) {
	const responseBody = error.message.match(/([\s\S]+?)({[\s\S]+?})/is);
	if (responseBody) {
		try {
			const body = JSON.parse(responseBody[2].trim());
			return { text: `Failed to generate: ${responseBody[1].trim()}`, body };
		} catch (jsonError) {
			return { text: `Failed to generate: ${error.message}` };
		}
	}
	return { text: `Failed to generate: ${error.message}` };
}
