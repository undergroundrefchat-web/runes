// Главный экран: расклад, кнопки, меню.
import { SPREADS } from './data/spreads.js';
import { BY_ID, esc, store, drawFrom, fullPool, discHTML, runeRowHTML, haptic } from './core.js';
import { upsertHistory } from './history.js';
import { openSheet, openMenu, openDrawer, closeDrawer, openPage, toast } from './ui.js';
import { PAGES } from './pages/index.js';

const $ = s => document.querySelector(s);
const ICON = {
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  redo: '<svg viewBox="0 0 24 24"><path d="M19.5 9A8 8 0 0 0 5 7.5M4.5 15A8 8 0 0 0 19 16.5"/><path d="M19.5 4v5h-5M4.5 20v-5h5"/></svg>',
};

// ── Состояние ──
const saved = store.get('runes.current', {});
const state = {
  spread: SPREADS.some(s => s.id === saved.spread) ? saved.spread : SPREADS[0].id,
  drawn: Array.isArray(saved.drawn) ? saved.drawn.filter(d => BY_ID[d.id]) : [],
  ts: saved.ts || 0,
};
const spread = () => SPREADS.find(s => s.id === state.spread);
const save = () => store.set('runes.current', state);
const record = () => { if (state.drawn.length) upsertHistory({ ts: state.ts, spread: state.spread, runes: state.drawn }); };

// ── Отрисовка ──
const table = $('#table');

function layout() {
  const s = spread();
  const gap = 18;
  const cw = Math.min(table.clientWidth || innerWidth, 620) - 32;
  const per = s.free ? 4 : Math.min(s.count, 3);
  const max = s.free ? 96 : s.count === 1 ? 190 : 150;
  const w = Math.max(56, Math.min(max, (cw - gap * (per - 1)) / per));
  table.style.setProperty('--dw', `${Math.floor(w)}px`);
  table.style.setProperty('--gap', `${gap}px`);
}

/** animateFrom: с какого индекса диски появляются с анимацией (-1 — без анимации). */
function render(animateFrom = -1) {
  const s = spread();
  $('#title').textContent = s.name;
  layout();
  const slots = s.free ? state.drawn.length : s.count;
  let html = '';
  for (let i = 0; i < slots; i++) {
    const d = state.drawn[i];
    html += d ? discHTML(d, { idx: i, cls: animateFrom >= 0 && i >= animateFrom ? 'enter' : '' })
      : '<div class="disc empty" aria-hidden="true"><div class="disc-face"></div><div class="disc-name">&nbsp;</div></div>';
  }
  table.innerHTML = html;
  // руны появляются по очереди: первая, потом вторая, потом третья
  table.querySelectorAll('.disc.enter').forEach((el, k) => { el.style.animationDelay = `${k * 220}ms`; });

  const empty = state.drawn.length === 0;
  $('#hint').hidden = !empty;
  $('#hint').textContent = s.free ? 'Нажми +, чтобы вытянуть руну' : 'Нажми ↻, чтобы вытянуть';
  $('#fab-main').innerHTML = s.free ? ICON.plus : ICON.redo;
  $('#fab-main').setAttribute('aria-label', s.free ? 'Вытянуть руну' : 'Вытянуть заново');
  $('#fab-clear').hidden = !(s.free && !empty);
}

// ── Действия ──
function deal() {
  const s = spread(), pool = fullPool();
  state.drawn = [];
  for (let i = 0; i < s.count && pool.length; i++) state.drawn.push(drawFrom(pool));
  state.ts = Date.now();
  save(); record(); render(0); haptic(12);
}

function addOne() {
  const pool = fullPool(state.drawn.map(d => d.id));
  if (!pool.length) { toast('Все руны уже вытянуты'); return; }
  if (!state.drawn.length) state.ts = Date.now();
  state.drawn.push(drawFrom(pool));
  save(); record(); render(state.drawn.length - 1); haptic(10);
  table.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function clearTable() { state.drawn = []; state.ts = 0; save(); render(); }

function switchSpread(id) {
  if (id === state.spread) return;
  state.spread = id; state.drawn = []; state.ts = 0;
  save(); render();
}

const numOf = i => (state.drawn.length > 1 ? i + 1 : null);

$('#fab-main').addEventListener('click', () => (spread().free ? addOne() : deal()));
$('#fab-clear').addEventListener('click', clearTable);
$('#fab-info').addEventListener('click', () => {
  const s = spread();
  openSheet(`<h3 class="sheet-title">${esc(s.name)}</h3>` + (state.drawn.length
    ? state.drawn.map((d, i) => runeRowHTML(d, { num: numOf(i) })).join('')
    : `<p class="sheet-sub">Пока пусто — нажми ${s.free ? '+' : '↻'}.</p>`));
});
table.addEventListener('click', e => {
  const el = e.target.closest('.disc[data-i]');
  if (!el) return;
  const i = +el.dataset.i;
  openSheet(runeRowHTML(state.drawn[i], { num: numOf(i) }));
});
table.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.disc[data-i]')) e.target.click(); });

// ── Расклады (кнопка справа в шапке) ──
$('#btn-spreads').addEventListener('click', () => {
  openMenu(SPREADS.map(s => `<button data-pick="${s.id}"${s.id === state.spread ? ' class="on"' : ''}>${esc(s.name)}</button>`).join(''), switchSpread);
});

// ── Боковое меню: расклады + разделы ──
function fillDrawer() {
  $('#drawer-list').innerHTML =
    '<div class="drawer-group">Расклады</div>' +
    SPREADS.map(s => `<button data-spread="${s.id}"${s.id === state.spread ? ' class="on"' : ''}>${esc(s.name)}</button>`).join('') +
    '<div class="drawer-sep"></div>' +
    PAGES.map(p => `<button data-page="${p.id}">${esc(p.title)}</button>`).join('');
}
$('#btn-menu').addEventListener('click', () => { fillDrawer(); openDrawer(); });
$('#drawer-list').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  closeDrawer();
  if (b.dataset.spread) switchSpread(b.dataset.spread);
  if (b.dataset.page) openPage(PAGES.find(p => p.id === b.dataset.page));
});

addEventListener('resize', layout);

// ── Старт ──
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
