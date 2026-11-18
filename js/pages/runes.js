import { RUNES, BLANK_RUNE, AETT } from '../data/runes.js';
import { esc, discHTML, runeRowHTML } from '../core.js';
import { openSheet } from '../ui.js';

export default {
  id: 'runes',
  title: 'Все руны',
  render(el) {
    let html = '';
    for (const a of [1, 2, 3]) {
      html += `<div class="group-title">${AETT[a]}</div><div class="rune-grid">` +
        RUNES.filter(r => r.aett === a).map(r => `<div class="cell" data-id="${r.id}">${discHTML({ id: r.id })}</div>`).join('') + '</div>';
    }
    html += `<div class="group-title">Дополнение</div><div class="rune-grid"><div class="cell" data-id="${BLANK_RUNE.id}">${discHTML({ id: BLANK_RUNE.id })}</div></div>`;
    el.innerHTML = html;
    el.onclick = e => {
      const c = e.target.closest('[data-id]');
      if (c) openSheet(runeRowHTML({ id: c.dataset.id }, { reference: true }));
    };
  },
};
