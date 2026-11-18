import { BY_ID, esc, discHTML, runeRowHTML } from '../core.js';
import { SPREADS } from '../data/spreads.js';
import { getHistory, removeHistory, clearHistory } from '../history.js';
import { openSheet } from '../ui.js';

const fmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const spreadName = id => (SPREADS.find(s => s.id === id) || {}).name || '';

export default {
  id: 'history',
  title: 'История',
  render(el) {
    const draw = () => {
      const list = getHistory();
      if (!list.length) { el.innerHTML = '<p class="empty">Здесь появятся твои расклады.</p>'; return; }
      el.innerHTML = list.map(e => `
        <div class="h-entry" data-ts="${e.ts}">
          <div class="h-head"><span>${fmt.format(new Date(e.ts))} · ${esc(spreadName(e.spread))}</span>
            <button class="h-del" data-del="${e.ts}" aria-label="Удалить">×</button></div>
          <div class="h-discs">${e.runes.map(x => discHTML(x, { name: false, cls: 'tiny' })).join('')}</div>
          <div class="h-names">${e.runes.map(x => esc(BY_ID[x.id].name)).join(' · ')}</div>
        </div>`).join('') + '<button class="link-btn" data-clear>Очистить историю</button>';
    };
    draw();
    el.onclick = e => {
      const del = e.target.closest('[data-del]');
      if (del) { removeHistory(+del.dataset.del); draw(); return; }
      if (e.target.closest('[data-clear]')) { if (confirm('Удалить всю историю?')) { clearHistory(); draw(); } return; }
      const row = e.target.closest('.h-entry');
      if (row) {
        const entry = getHistory().find(x => x.ts === +row.dataset.ts);
        if (entry) openSheet(`<h3 class="sheet-title">${esc(spreadName(entry.spread))}</h3>
          <p class="sheet-sub">${fmt.format(new Date(entry.ts))}</p>
          ${entry.runes.map((x, i) => runeRowHTML(x, { num: entry.runes.length > 1 ? i + 1 : null })).join('')}`);
      }
    };
  },
};
