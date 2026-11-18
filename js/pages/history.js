import { DECK_BY_ID } from '../decks.js';
import { esc, pieceHTML, rowHTML } from '../core.js';
import { getHistory, removeHistory, clearHistory } from '../history.js';
import { openSheet } from '../ui.js';

const fmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

// Старые записи (до колод таро) — это руны и лежат в поле runes.
function view(e) {
  const deck = DECK_BY_ID[e.deck || 'runes'];
  if (!deck) return null;
  const items = (e.items || e.runes || []).filter(x => deck.byId[x.id]);
  const spread = (deck.spreads.find(s => s.id === e.spread) || {}).name || '';
  return { deck, items, title: `${deck.name} · ${spread}` };
}

export default {
  id: 'history',
  title: 'История',
  render(el) {
    const draw = () => {
      const list = getHistory().map(e => ({ e, v: view(e) })).filter(x => x.v && x.v.items.length);
      if (!list.length) { el.innerHTML = '<p class="empty">Здесь появятся твои расклады.</p>'; return; }
      el.innerHTML = list.map(({ e, v }) => `
        <div class="h-entry" data-ts="${e.ts}">
          <div class="h-head"><span>${fmt.format(new Date(e.ts))} · ${esc(v.title)}</span>
            <button class="h-del" data-del="${e.ts}" aria-label="Удалить">×</button></div>
          <div class="h-discs">${v.items.map(x => pieceHTML(v.deck, x, { name: false, cls: 'tiny' })).join('')}</div>
          <div class="h-names">${v.items.map(x => esc(v.deck.byId[x.id].name)).join(' · ')}</div>
        </div>`).join('') + '<button class="link-btn" data-clear>Очистить историю</button>';
    };
    draw();
    el.onclick = e => {
      const del = e.target.closest('[data-del]');
      if (del) { removeHistory(+del.dataset.del); draw(); return; }
      if (e.target.closest('[data-clear]')) { if (confirm('Удалить всю историю?')) { clearHistory(); draw(); } return; }
      const row = e.target.closest('.h-entry');
      if (!row) return;
      const entry = getHistory().find(x => x.ts === +row.dataset.ts), v = entry && view(entry);
      if (v) openSheet(`<h3 class="sheet-title">${esc(v.title)}</h3>
        <p class="sheet-sub">${fmt.format(new Date(entry.ts))}</p>
        ${v.items.map((x, i) => rowHTML(v.deck, x, { num: v.items.length > 1 ? i + 1 : null })).join('')}`);
    };
  },
};
