import { decompress } from '$lib/compress';
import { parse } from 'devalue';
import type { PageLoad } from './$types'; import type { SharedChatState } from '$lib/stores/chat.svelte';

export const load: PageLoad = async ({ params }) => {
    const content = params.content;
    try {
        const parsedChat: SharedChatState = parse(await decompress(atob(content.replaceAll('-', '/'))));
        if (!parsedChat || typeof parsedChat !== 'object' || !Array.isArray(parsedChat.m) || parsedChat.m.find((m) => (m.t !== 1 && m.t !== 2 && m.t !== undefined) || !m.c) || typeof parsedChat.o !== 'object') {
            throw new Error('Invalid chat');
        }
        return { chat: parsedChat };
    } catch (error) {
        // console.error(error);
        return { chat: null };
    }
};
