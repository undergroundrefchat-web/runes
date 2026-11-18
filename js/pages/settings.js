import { settings, saveSettings } from '../core.js';

// Новая настройка = новая строка здесь + значение по умолчанию в core.js (settings).
const OPTIONS = [
  { key: 'meanings', title: 'Толкования', note: 'Описание руны в листе «i» и в истории. У карт таро описаний нет.' },
  { key: 'reversed', title: 'Перевёрнутые', note: 'Руна или карта может выпасть вверх ногами. У девяти симметричных рун так не бывает.' },
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
      '<p class="about">Руна или карта выбирается честным случаем (crypto.getRandomValues), внутри одного расклада без повторов. Всё хранится только на этом устройстве и работает без интернета.</p><p class="about">Таро Уэйта–Смит: рисунки Памелы Колман Смит, издание 1909 года, общественное достояние. Сканы — Wikimedia Commons.</p>';
    el.onchange = e => {
      const k = e.target.dataset.key;
      if (!k) return;
      settings[k] = e.target.checked;
      saveSettings();
      document.dispatchEvent(new CustomEvent('settings-changed', { detail: k }));
    };
  },
};
