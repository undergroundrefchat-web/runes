// Офлайн: сначала сеть (свежая версия), без сети — из кэша.
// Добавил файл в приложение — допиши его в FILES и подними номер версии CACHE.
const CACHE = 'runes-v7';
const FILES = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest',
  'js/app.js', 'js/core.js', 'js/ui.js', 'js/history.js',
  'js/data/runes.js', 'js/data/spreads.js',
  'js/pages/index.js', 'js/pages/history.js', 'js/pages/runes.js', 'js/pages/settings.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })
      .then(hit => hit || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
