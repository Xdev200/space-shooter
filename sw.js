// ============================================================
// SERVICE WORKER — Cache-first offline strategy
// ============================================================

const CACHE_NAME = 'voidrift-v1';

const ASSETS = [
  './',
  './index.html',
  './core/GameEngine.js',
  './core/Renderer.js',
  './core/InputHandler.js',
  './core/ObjectPool.js',
  './entities/Player.js',
  './entities/Enemy.js',
  './entities/Bullet.js',
  './entities/Particle.js',
  './systems/CollisionSystem.js',
  './systems/SpawnSystem.js',
  './systems/ScoreSystem.js',
  './systems/AudioSystem.js',
  './storage/LocalDB.js',
  './ui/HUD.js',
  './ui/Screens.js',
  './utils/constants.js',
  './utils/helpers.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Cache-first for same-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
