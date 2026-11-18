// Общее для всего приложения: хранилище, настройки, случай, отрисовка диска и карты.
// Колоды — в decks.js; функции отрисовки получают колоду аргументом.

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── Хранилище: только это устройство ──
export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* приватный режим */ } },
};

export const settings = Object.assign(
  { reversed: false, blank: false, meanings: false, haptics: true },
  store.get('runes.settings', {}));
export const saveSettings = () => store.set('runes.settings', settings);

// ── Случай: криптографический генератор без перекоса ──
export function randInt(n) {
  const buf = new Uint32Array(1), lim = Math.floor(0x100000000 / n) * n;
  let x;
  do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= lim);
  return x % n;
}

/** Тянет из пула (пул изменяется). */
export function drawFrom(deck, pool) {
  const id = pool.splice(randInt(pool.length), 1)[0];
  return { id, reversed: settings.reversed && deck.canReverse(deck.byId[id]) && randInt(2) === 1 };
}
/** Всё, что можно вытянуть, кроме уже лежащего на столе. */
export function fullPool(deck, exclude = []) {
  const out = new Set(exclude);
  return deck.pool().filter(id => !out.has(id));
}

export const haptic = p => { if (settings.haptics && navigator.vibrate) try { navigator.vibrate(p); } catch { } };

// ── Диск и карта ──
const isRev = (deck, item) => !!item.reversed && deck.canReverse(deck.byId[item.id]);

function faceHTML(deck, x) {
  if (deck.kind === 'card') return `<img src="${deck.img(x)}" alt="" decoding="async" draggable="false">`;
  return `<svg viewBox="0 0 60 100" aria-hidden="true">${x.path ? `<path d="${x.path}"/>` : ''}</svg>`;
}

/** Руна или карта. item = { id, reversed } */
export function pieceHTML(deck, item, { idx = null, name = true, cls = '' } = {}) {
  const x = deck.byId[item.id], rev = isRev(deck, item);
  const c = ['disc', deck.kind === 'card' && 'card', rev && 'reversed', cls].filter(Boolean).join(' ');
  return `<div class="${c}"${idx != null ? ` data-i="${idx}" role="button" tabindex="0"` : ''} aria-label="${esc(x.name)}${rev ? ', перевёрнута' : ''}">
    <div class="disc-face">${faceHTML(deck, x)}</div>
    ${name ? `<div class="disc-name">${esc(x.name)}${rev ? '<small>перевёрнута</small>' : ''}</div>` : ''}
  </div>`;
}

/** Строка для листа «i», истории и справочника. */
export function rowHTML(deck, item, { num = null, reference = false } = {}) {
  const x = deck.byId[item.id], rev = isRev(deck, item);
  let text = '';
  const m = deck.meaning(x, rev);
  if (m) text = `<p class="row-text">${esc(m)}</p>`;
  const ref = reference && deck.reference(x);
  if (ref) text += `<p class="row-text muted">${esc(ref)}</p>`;
  return `<div class="rune-row${deck.kind === 'card' ? ' card-row' : ''}">
    ${pieceHTML(deck, item, { name: false, cls: 'mini' })}
    <div class="row-body">
      <div class="row-title">${num != null ? `<span class="row-num">${num}</span>` : ''}${esc(x.name)}${rev ? '<small>перевёрнута</small>' : ''}</div>
      <div class="row-sub">${esc(deck.sub(x))}</div>
      ${text}
    </div>
  </div>`;
}

/** Одна руна или карта крупно — по нажатию. Карту показываем большой картинкой. */
export function detailHTML(deck, item, { num = null, reference = false } = {}) {
  if (deck.kind !== 'card') return rowHTML(deck, item, { num, reference });
  const x = deck.byId[item.id], rev = isRev(deck, item);
  return `<div class="detail">
    ${pieceHTML(deck, item, { name: false, cls: 'big' })}
    <div class="row-title">${num != null ? `<span class="row-num">${num}</span>` : ''}${esc(x.name)}${rev ? '<small>перевёрнута</small>' : ''}</div>
    <div class="row-sub">${esc(deck.sub(x))}</div>
  </div>`;
}
