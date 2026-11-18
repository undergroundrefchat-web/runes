// Разделы бокового меню (≡). Новый раздел = новый файл в этой папке + строка здесь.
// Раздел — объект { id, title, render(el) }: render рисует содержимое в el.
import history from './history.js';
import runes from './runes.js';
import settings from './settings.js';

export const PAGES = [history, runes, settings];
