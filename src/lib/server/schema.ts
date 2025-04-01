import type { ChatState } from '$lib/stores/chat.svelte';
import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const chatShareTable = pgTable('chat_share', {
	id: uuid().defaultRandom().primaryKey(),
	data: jsonb('data').$type<ChatState>().notNull(),
	deletionKey: text('deletion_key').notNull(),
	views: integer('views').notNull().default(0),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	lastViewedAt: timestamp('last_viewed_at')
});

export type InsertChatShare = typeof chatShareTable.$inferInsert;
export type SelectChatShare = typeof chatShareTable.$inferSelect;
