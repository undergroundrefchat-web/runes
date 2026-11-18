// Разделы бокового меню (≡). Новый раздел = новый файл в этой папке + строка здесь.
// Раздел — объект { id, title, render(el) }: render рисует содержимое в el.
import history from './history.js';
import deck from './deck.js';
import settings from './settings.js';

export const PAGES = [history, deck, settings];
