const CACHE_NAME = 'mgc-v3';
const ASSETS = [
  '.',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/dino.js',
  'js/flappy.js',
  'js/cave.js',
  'js/tetris.js',
  'js/firebase-config.js',
  'js/firebase-db.js',
  'js/snake.js',
  'js/breakout.js',
  'js/game2048.js',
  'manifest.json',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
  );
  self.clients.claim();
});

// ネットワーク優先、失敗したらキャッシュ
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
