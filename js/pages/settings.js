import { settings, saveSettings } from '../core.js';

// Новая настройка = новая строка здесь + значение по умолчанию в core.js (settings).
const OPTIONS = [
  { key: 'meanings', title: 'Толкования', note: 'Показывать описание руны в листе «i» и в истории.' },
  { key: 'reversed', title: 'Перевёрнутые руны', note: 'Руна может выпасть вверх ногами. У девяти симметричных рун так не бывает.' },
  { key: 'blank', title: 'Пустая руна', note: '25-й диск без знака. Современное дополнение, в древнем футарке его нет.' },
  { key: 'haptics', title: 'Вибрация', note: 'Только Android: iPhone не даёт сайтам вибрировать.' },
];

export default {
  id: 'settings',
  title: 'Настройки',
  render(el) {
    el.innerHTML = OPTIONS.map(o => `
      <label class="toggle"><span><b>${o.title}</b><small>${o.note}</small></span>
        <input type="checkbox" data-key="${o.key}" ${settings[o.key] ? 'checked' : ''}></label>`).join('') +
      '<p class="about">Руна выбирается честным случаем (crypto.getRandomValues). Внутри одного расклада руны не повторяются. Всё хранится только на этом устройстве и работает без интернета.</p>';
    el.onchange = e => {
      const k = e.target.dataset.key;
      if (!k) return;
      settings[k] = e.target.checked;
      saveSettings();
      document.dispatchEvent(new CustomEvent('settings-changed', { detail: k }));
    };
  },
};
