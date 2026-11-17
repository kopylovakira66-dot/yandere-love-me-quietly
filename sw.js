const CACHE_NAME = 'ylmq-pwa-v3';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './manifest.webmanifest',
  './sw.js',
  './assets/favicon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/title_art.png',
  './assets/scene_school.jpg',
  './assets/scene_cafe.jpg',
  './assets/scene_hall.jpg',
  './assets/scene_room.jpg',
  './assets/cg_school_friends.jpg',
  './assets/cg_cafe_friends.jpg',
  './assets/cg_alice_hall.jpg',
  './assets/cg_alice_rain.jpg',
  './assets/alice_expressions.png',
  './assets/alice_warm.jpg',
  './assets/alice_vulnerable.jpg',
  './assets/alice_cold.jpg',
  './assets/mia_happy.jpg',
  './assets/mia_worried.jpg',
  './assets/mia_serious.jpg',
  './assets/cg_sakura_duo.jpg',
  './assets/cg_cafe_duo.jpg',
  './assets/cg_stair_tension.jpg',
  './assets/cg_mia_aftermath.jpg',
  './assets/ost_bright.wav',
  './assets/ost_mia.wav',
  './assets/ost_tension.wav',
  './assets/ost_aftermath.wav',
  './assets/ost_dusty.wav',
  './assets/ost_ending.wav',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
