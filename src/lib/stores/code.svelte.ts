import { get } from 'svelte/store';
import type { Usage, CodeOptions } from '../types';
import { settings } from './settings';
import { v4 as uuid } from 'uuid';

export type CodeState = {
    id: string;
    prompt: string;
    suffix?: string;
    stop: string[];
    response: string;
    usage?: Usage;
    options: CodeOptions;
};

function defaultOptions(): CodeOptions {
    const seed = get(settings).seed;
    return {
        model: get(settings).codeModel ?? 'codestral-latest',
        temperature: get(settings).temperature,
        topP: 1,
        minTokens: undefined,
        maxTokens: undefined,
        randomSeed: isNaN(Number(seed)) ? undefined : Number(seed)
    };
}

export function createCurrent() {
    const state: CodeState = $state({
        id: uuid(),
        prompt: '',
        suffix: undefined,
        stop: ['\n\n'],
        response: '',
        usage: undefined,
        options: defaultOptions()
    });

    function reset() {
        state.options = defaultOptions();
        state.id = uuid();
        state.prompt = '';
        state.suffix = undefined;
        state.response = '';
        state.usage = undefined;
        state.stop = ['\n\n'];
    }

    function setFromEntry(entry: CodeState) {
        state.id = entry.id;
        state.options = entry.options;
        state.usage = entry.usage;
        state.prompt = entry.prompt;
        state.suffix = entry.suffix;
        state.response = entry.response;
        state.usage = entry.usage;
        state.stop = entry.stop;
    }

    return {
        state,
        defaultOptions,
        setFromEntry,
        reset
    };
}

export const code = createCurrent();
