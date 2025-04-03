import { db } from '$lib/server/db';
import { chatShareTable } from '$lib/server/schema';
import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, url }) => {
	const id = params.uuid;
	const deletionKey = url.searchParams.get('key');

	if (!deletionKey) {
		error(400, 'Missing deletion key');
	}

	const chatShare = await db.query.chatShareTable.findFirst({
		where: and(eq(chatShareTable.id, id))
	});

	if (!chatShare) {
		error(404, 'Chat share not found');
	}

	if (chatShare.deletionKey !== deletionKey) {
		error(404, 'Chat share not found');
	}

	await db.delete(chatShareTable).where(eq(chatShareTable.id, id));
	return json({});
};
