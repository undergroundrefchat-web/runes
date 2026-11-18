// История раскладов: каждый расклад сохраняется сам, последние 300.
import { store } from './core.js';

const KEY = 'runes.history', MAX = 300;
export const getHistory = () => store.get(KEY, []);

/** Записать или обновить расклад с меткой ts. */
export function upsertHistory(entry) {
  const list = getHistory().filter(e => e.ts !== entry.ts);
  list.unshift(entry);
  store.set(KEY, list.slice(0, MAX));
}
export function removeHistory(ts) { store.set(KEY, getHistory().filter(e => e.ts !== ts)); }
export function clearHistory() { store.set(KEY, []); }
