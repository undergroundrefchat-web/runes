// Главный экран: расклад, кнопки, меню.
import { DECKS, deck, setDeck, tableKey } from './decks.js';
import { esc, store, drawFrom, fullPool, pieceHTML, rowHTML, detailHTML, haptic } from './core.js';
import { upsertHistory } from './history.js';
import { openSheet, openMenu, openDrawer, closeDrawer, openPage, toast } from './ui.js';
import { PAGES } from './pages/index.js';

const $ = s => document.querySelector(s);
const ICON = {
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  redo: '<svg viewBox="0 0 24 24"><path d="M19.5 9A8 8 0 0 0 5 7.5M4.5 15A8 8 0 0 0 19 16.5"/><path d="M19.5 4v5h-5M4.5 20v-5h5"/></svg>',
};

// ── Состояние: у каждой колоды свой стол ──
const state = { spread: '', drawn: [], ts: 0 };
function load() {
  const d = deck(), saved = store.get(tableKey(d.id), {});
  state.spread = d.spreads.some(s => s.id === saved.spread) ? saved.spread : d.spreads[0].id;
  state.drawn = Array.isArray(saved.drawn) ? saved.drawn.filter(x => d.byId[x.id]) : [];
  state.ts = saved.ts || 0;
}
const spread = () => deck().spreads.find(s => s.id === state.spread);
const save = () => store.set(tableKey(deck().id), state);
const record = () => {
  if (state.drawn.length) upsertHistory({ ts: state.ts, deck: deck().id, spread: state.spread, items: state.drawn });
};

// ── Отрисовка ──
const table = $('#table');

function layout() {
  const s = spread(), card = deck().kind === 'card';
  const gap = 18;
  const cw = Math.min(table.clientWidth || innerWidth, 620) - 32;
  const per = s.free ? 4 : Math.min(s.count, 3);
  const max = s.free ? 96 : s.count === 1 ? (card ? 220 : 190) : 150;
  let w = (cw - gap * (per - 1)) / per;
  // карта высокая: в раскладе на одну-три она должна целиком помещаться по высоте
  if (!s.free) w = Math.min(w, (innerHeight - 56 - 190) * (card ? 0.577 : 0.714));
  w = Math.max(56, Math.min(max, w));
  table.style.setProperty('--dw', `${Math.floor(w)}px`);
  table.style.setProperty('--gap', `${gap}px`);
}

/** animateFrom: с какого индекса появляются с анимацией (-1 — без анимации). */
function render(animateFrom = -1) {
  const d = deck(), s = spread();
  $('#title').textContent = s.name;
  document.body.dataset.deck = d.id;
  layout();
  const slots = s.free ? state.drawn.length : s.count;
  let html = '';
  for (let i = 0; i < slots; i++) {
    const x = state.drawn[i];
    html += x ? pieceHTML(d, x, { idx: i, cls: animateFrom >= 0 && i >= animateFrom ? 'enter' : '' })
      : `<div class="disc empty${d.kind === 'card' ? ' card' : ''}" aria-hidden="true"><div class="disc-face"></div><div class="disc-name">&nbsp;</div></div>`;
  }
  table.innerHTML = html;
  // появляются по очереди: первая, потом вторая, потом третья
  table.querySelectorAll('.disc.enter').forEach((el, k) => { el.style.animationDelay = `${k * 220}ms`; });

  const empty = state.drawn.length === 0;
  $('#hint').hidden = !empty;
  $('#hint').textContent = s.free ? `Нажми +, чтобы вытянуть ${d.word.one}` : 'Нажми ↻, чтобы вытянуть';
  $('#fab-main').innerHTML = s.free ? ICON.plus : ICON.redo;
  $('#fab-main').setAttribute('aria-label', s.free ? `Вытянуть ${d.word.one}` : 'Вытянуть заново');
  $('#fab-info').setAttribute('aria-label', `${d.word.many[0].toUpperCase()}${d.word.many.slice(1)} расклада`);
  $('#fab-clear').setAttribute('aria-label', `Убрать все ${d.word.many}`);
  $('#fab-clear').hidden = !(s.free && !empty);
}

// ── Действия ──
function deal() {
  const d = deck(), s = spread(), pool = fullPool(d);
  state.drawn = [];
  for (let i = 0; i < s.count && pool.length; i++) state.drawn.push(drawFrom(d, pool));
  state.ts = Date.now();
  save(); record(); render(0); haptic(12);
}

function addOne() {
  const d = deck(), pool = fullPool(d, state.drawn.map(x => x.id));
  if (!pool.length) { toast(`Все ${d.word.many} уже вытянуты`); return; }
  if (!state.drawn.length) state.ts = Date.now();
  state.drawn.push(drawFrom(d, pool));
  save(); record(); render(state.drawn.length - 1); haptic(10);
  table.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function clearTable() { state.drawn = []; state.ts = 0; save(); render(); }

function switchSpread(id) {
  if (id === state.spread) return;
  state.spread = id; state.drawn = []; state.ts = 0;
  save(); render();
}

function switchDeck(id) {
  if (id === deck().id) return;
  setDeck(id); load(); render();
}

const numOf = i => (state.drawn.length > 1 ? i + 1 : null);

$('#fab-main').addEventListener('click', () => (spread().free ? addOne() : deal()));
$('#fab-clear').addEventListener('click', clearTable);
$('#fab-info').addEventListener('click', () => {
  const d = deck(), s = spread();
  openSheet(`<h3 class="sheet-title">${esc(s.name)}</h3>` + (state.drawn.length
    ? state.drawn.map((x, i) => rowHTML(d, x, { num: numOf(i) })).join('')
    : `<p class="sheet-sub">Пока пусто — нажми ${s.free ? '+' : '↻'}.</p>`));
});
table.addEventListener('click', e => {
  const el = e.target.closest('.disc[data-i]');
  if (!el) return;
  const i = +el.dataset.i;
  openSheet(detailHTML(deck(), state.drawn[i], { num: numOf(i) }));
});
table.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.disc[data-i]')) e.target.click(); });

// ── Расклады (кнопка справа в шапке) ──
$('#btn-spreads').addEventListener('click', () => {
  openMenu(deck().spreads.map(s => `<button data-pick="${s.id}"${s.id === state.spread ? ' class="on"' : ''}>${esc(s.name)}</button>`).join(''), switchSpread);
});

// ── Боковое меню: колода, расклады, разделы ──
function fillDrawer() {
  const d = deck();
  $('#drawer-head').textContent = d.name;
  $('#drawer-list').innerHTML =
    '<div class="drawer-group">Колода</div>' +
    DECKS.map(x => `<button data-deck="${x.id}"${x.id === d.id ? ' class="on"' : ''}>${esc(x.name)}</button>`).join('') +
    '<div class="drawer-sep"></div><div class="drawer-group">Расклады</div>' +
    d.spreads.map(s => `<button data-spread="${s.id}"${s.id === state.spread ? ' class="on"' : ''}>${esc(s.name)}</button>`).join('') +
    '<div class="drawer-sep"></div>' +
    PAGES.map(p => `<button data-page="${p.id}">${esc(p.title)}</button>`).join('');
}
$('#btn-menu').addEventListener('click', () => { fillDrawer(); openDrawer(); });
$('#drawer-list').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  closeDrawer();
  if (b.dataset.deck) switchDeck(b.dataset.deck);
  if (b.dataset.spread) switchSpread(b.dataset.spread);
  if (b.dataset.page) openPage(PAGES.find(p => p.id === b.dataset.page));
});

addEventListener('resize', layout);

// ── Старт ──
load();
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
