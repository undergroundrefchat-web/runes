// Офлайн: код — сначала сеть (свежая версия), без сети — из кэша.
// Картинки колод не меняются — отдаём из своего кэша, он переживает обновления кода.
// Добавил файл в приложение — допиши его в FILES и подними номер версии CACHE.
// Поменял картинки колоды — подними номер IMG_CACHE.
const CACHE = 'runes-v8';
const IMG_CACHE = 'deck-img-v1';
const FILES = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest',
  'js/app.js', 'js/core.js', 'js/decks.js', 'js/ui.js', 'js/history.js',
  'js/data/runes.js', 'js/data/waite.js',
  'js/pages/index.js', 'js/pages/history.js', 'js/pages/deck.js', 'js/pages/settings.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

const pad = n => String(n).padStart(2, '0');
const WAITE = [...Array.from({ length: 22 }, (_, n) => `m${pad(n)}`),
  ...['wands', 'cups', 'swords', 'pentacles'].flatMap(s => Array.from({ length: 14 }, (_, k) => `${s}${pad(k + 1)}`))]
  .map(id => `img/waite/${id}.webp`);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    await (await caches.open(CACHE)).addAll(FILES);
    // колоду докачиваем без спешки: если что-то не скачалось, приложение всё равно встанет
    const img = await caches.open(IMG_CACHE);
    await Promise.all(WAITE.map(u => img.match(u).then(hit => hit || img.add(u)).catch(() => { })));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/img/')) {
    e.respondWith(caches.open(IMG_CACHE).then(c => c.match(e.request).then(hit => hit ||
      fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; }))));
    return;
  }
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })
      .then(hit => hit || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
