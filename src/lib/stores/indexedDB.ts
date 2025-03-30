import { browser } from '$app/environment';
import type { Writable } from 'svelte/store';
import type { HistoryState } from './history';

const DB_NAME = 'mistral-playground' as const;
const STORE_NAME = 'history' as const;
const DB_VERSION = 1 as const;

class IndexedDBStore implements Writable<HistoryState> {
	#db: IDBDatabase | null = null;
	#subscribers: ((value: HistoryState) => void)[] = [];
	#value: HistoryState = { chat: [], ocr: [] };

	constructor() {
		if (browser) {
			this.#initialize();
		}
	}

	async #initialize() {
		return new Promise<void>((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				this.#db = request.result;
				this.#load();
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME);
				}
			};
		});
	}

	async #load() {
		if (!this.#db) {
			return;
		}

		const transaction = this.#db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get('data');

		request.onsuccess = () => {
			const data = request.result;
			if (data) {
				this.#value = data;
				this.#notifySubscribers();
			}
		};
	}

	async #save() {
		if (!this.#db) {
			return;
		}

		const transaction = this.#db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		return store.put(this.#value, 'data');
	}

	#notifySubscribers() {
		this.#subscribers.forEach((subscriber) => subscriber(this.#value));
	}

	subscribe(run: (value: HistoryState) => void, invalidate?: (value?: HistoryState) => void) {
		this.#subscribers.push(run);
		run(this.#value);

		return () => {
			const index = this.#subscribers.indexOf(run);
			if (index > -1) {
				this.#subscribers.splice(index, 1);
			}
		};
	}

	set(value: HistoryState) {
		this.#value = value;
		this.#save();
		this.#notifySubscribers();
	}

	update(updater: (value: HistoryState) => HistoryState) {
		this.#value = updater(this.#value);
		this.#save();
		this.#notifySubscribers();
	}
}

export const createIndexedDBStore = () => new IndexedDBStore();
