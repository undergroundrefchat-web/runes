// «Все руны» / «Все карты» — справочник выбранной колоды.
import { deck } from '../decks.js';
import { pieceHTML, detailHTML, rowHTML } from '../core.js';
import { openSheet } from '../ui.js';

export default {
  id: 'deck',
  get title() { return deck().word.all; },
  render(el) {
    const d = deck();
    el.innerHTML = d.groups().map(g => `<div class="group-title">${g.title}</div>
      <div class="rune-grid${d.kind === 'card' ? ' card-grid' : ''}">${g.ids.map(id =>
        `<div class="cell" data-id="${id}">${pieceHTML(d, { id })}</div>`).join('')}</div>`).join('');
    el.onclick = e => {
      const c = e.target.closest('[data-id]');
      if (c) openSheet(d.kind === 'card' ? detailHTML(d, { id: c.dataset.id }) : rowHTML(d, { id: c.dataset.id }, { reference: true }));
    };
  },
};
