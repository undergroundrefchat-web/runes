// Общее для всего приложения: данные рун, хранилище, случай, отрисовка диска.
import { RUNES, BLANK_RUNE } from './data/runes.js';

export const ALL_RUNES = [...RUNES, BLANK_RUNE];
export const BY_ID = Object.fromEntries(ALL_RUNES.map(r => [r.id, r]));

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

/** Тянет руну из пула (пул изменяется). */
export function drawFrom(pool) {
  const id = pool.splice(randInt(pool.length), 1)[0];
  return { id, reversed: settings.reversed && canReverse(BY_ID[id]) && randInt(2) === 1 };
}
export function fullPool(exclude = []) {
  const out = new Set(exclude);
  const ids = RUNES.map(r => r.id).filter(id => !out.has(id));
  if (settings.blank && !out.has(BLANK_RUNE.id)) ids.push(BLANK_RUNE.id);
  return ids;
}

export const canReverse = r => r.rev !== false && !!r.down;
export const haptic = p => { if (settings.haptics && navigator.vibrate) try { navigator.vibrate(p); } catch { } };

// ── Диск ──
export function glyphSVG(r) {
  return `<svg viewBox="0 0 60 100" aria-hidden="true">${r.path ? `<path d="${r.path}"/>` : ''}</svg>`;
}

/** Овальный диск с руной. item = { id, reversed } */
export function discHTML(item, { idx = null, name = true, cls = '' } = {}) {
  const r = BY_ID[item.id], rev = item.reversed && canReverse(r);
  return `<div class="disc${rev ? ' reversed' : ''}${cls ? ' ' + cls : ''}"${idx != null ? ` data-i="${idx}"` : ''} role="button" tabindex="0" aria-label="${esc(r.name)}${rev ? ', перевёрнута' : ''}">
    <div class="disc-face">${glyphSVG(r)}</div>
    ${name ? `<div class="disc-name">${esc(r.name)}${rev ? '<small>перевёрнута</small>' : ''}</div>` : ''}
  </div>`;
}

/** Строка руны для листа «i», истории и справочника. */
export function runeRowHTML(item, { num = null, reference = false } = {}) {
  const r = BY_ID[item.id], rev = item.reversed && canReverse(r);
  let text = '';
  if (settings.meanings) {
    text = `<p class="row-text">${esc(rev ? r.down : r.up)}</p>`;
    if (reference && canReverse(r)) text += `<p class="row-text muted">Перевёрнутая: ${esc(r.down)}</p>`;
  }
  return `<div class="rune-row">
    ${discHTML(item, { name: false, cls: 'mini' })}
    <div class="row-body">
      <div class="row-title">${num != null ? `<span class="row-num">${num}</span>` : ''}${esc(r.name)}${rev ? '<small>перевёрнута</small>' : ''}</div>
      <div class="row-sub">${esc(r.latin)} · «${esc(r.gloss)}»${r.sound !== '—' ? ` · звук ${esc(r.sound)}` : ''}</div>
      ${text}
    </div>
  </div>`;
}
