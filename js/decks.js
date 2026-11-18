// Колоды. Новая колода = новый объект в DECKS (данные — в js/data/).
//   kind    — 'disc' (овальный диск с рисовкой) или 'card' (карта с картинкой)
//   word    — слова для подсказок: «вытянуть руну», «все руны уже вытянуты»
//   spreads — расклады колоды: count — сколько тянуть разом (↻), free — по одной (+)
//   groups  — разбивка для раздела «Все руны / Все карты»
import { RUNES, BLANK_RUNE, AETT } from './data/runes.js';
import { WAITE, SUITS } from './data/waite.js';
import { store, settings } from './core.js';

const runes = {
  id: 'runes', name: 'Руны', kind: 'disc',
  word: { one: 'руну', many: 'руны', all: 'Все руны' },
  spreads: [
    { id: 'free', name: 'Свободно', free: true },
    { id: 'one', name: 'Одна руна', count: 1 },
    { id: 'three', name: 'Три руны', count: 3 },
  ],
  items: [...RUNES, BLANK_RUNE],
  pool() { return [...RUNES.map(r => r.id), ...(settings.blank ? [BLANK_RUNE.id] : [])]; },
  canReverse: r => r.rev !== false && !!r.down,
  groups: () => [1, 2, 3].map(a => ({ title: AETT[a], ids: RUNES.filter(r => r.aett === a).map(r => r.id) }))
    .concat({ title: 'Дополнение', ids: [BLANK_RUNE.id] }),
  sub: r => `${r.latin} · «${r.gloss}»${r.sound !== '—' ? ` · звук ${r.sound}` : ''}`,
  meaning: (r, rev) => (settings.meanings ? (rev ? r.down : r.up) : null),
  reference: r => (settings.meanings && runes.canReverse(r) ? `Перевёрнутая: ${r.down}` : null),
};

const waite = {
  id: 'waite', name: 'Таро Уэйта', kind: 'card',
  word: { one: 'карту', many: 'карты', all: 'Все карты' },
  spreads: [
    { id: 'free', name: 'Свободно', free: true },
    { id: 'one', name: 'Одна карта', count: 1 },
    { id: 'three', name: 'Три карты', count: 3 },
  ],
  items: WAITE,
  img: c => `img/waite/${c.id}.webp`,
  pool() { return WAITE.map(c => c.id); },
  canReverse: () => true,
  groups: () => [{ title: 'Старшие арканы', ids: WAITE.filter(c => !c.suit).map(c => c.id) },
    ...SUITS.map(s => ({ title: s.name, ids: WAITE.filter(c => c.suit === s.id).map(c => c.id) }))],
  sub: c => (c.suit ? `Младший аркан · ${SUITS.find(s => s.id === c.suit).name}` : `Старший аркан · ${c.num}`),
  meaning: () => null,
  reference: () => null,
};

export const DECKS = [runes, waite];
for (const d of DECKS) d.byId = Object.fromEntries(d.items.map(x => [x.id, x]));
export const DECK_BY_ID = Object.fromEntries(DECKS.map(d => [d.id, d]));

// ── Выбранная колода ──
let current = DECK_BY_ID[store.get('app.deck', 'runes')] || DECKS[0];
export const deck = () => current;
export function setDeck(id) { if (DECK_BY_ID[id]) { current = DECK_BY_ID[id]; store.set('app.deck', id); } }

/** Ключ, под которым хранится расклад на столе для колоды (у рун — старый ключ). */
export const tableKey = id => (id === 'runes' ? 'runes.current' : `${id}.current`);
