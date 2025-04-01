import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { chatShareTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [chat] = await db.select().from(chatShareTable).where(eq(chatShareTable.id, params.uuid)).limit(1);
		if (!chat) {
			throw new Error('Invalid chat');
		}
		await db
			.update(chatShareTable)
			.set({ views: chat.views + 1, lastViewedAt: new Date() })
			.where(eq(chatShareTable.id, params.uuid));
		return {
			chat: {
				id: chat.id,
				data: chat.data,
				createdAt: chat.createdAt
			}
		};
	} catch (error) {
		// console.error(error);
		return { chat: null };
	}
};
