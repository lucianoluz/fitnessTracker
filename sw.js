// Workout Tracker service worker — cache-first app shell for offline use.
// Bump CACHE_VERSION whenever the shell files change so clients pick up updates.
const CACHE_VERSION = 'wt-shell-v3';

const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/exercises.js',
  './js/panel.js',
  './js/body3d.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // 3D model + vendored Three.js (so the viewer works offline)
  './assets/male-base-mesh.glb',
  './vendor/three/three.module.js',
  './vendor/three/jsm/loaders/GLTFLoader.js',
  './vendor/three/jsm/controls/OrbitControls.js',
  './vendor/three/jsm/utils/BufferGeometryUtils.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle same-origin GET requests; let everything else hit the network.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // Cache successful same-origin responses for next time.
          if (
            response.ok &&
            new URL(event.request.url).origin === self.location.origin
          ) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
