// Workout Tracker service worker.
//
// Strategy:
//  - App's own HTML/JS/CSS/manifest → NETWORK-FIRST, so updates appear as soon
//    as the device is online; falls back to cache when offline.
//  - Big, rarely-changing assets (Three.js, the 3D model, icons) → CACHE-FIRST
//    for speed and offline use.
// Bump CACHE_VERSION whenever the precached shell list changes.
const CACHE_VERSION = 'wt-shell-v12';

const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/exercises.js',
  './js/routines.js',
  './js/storage.js',
  './js/panel.js',
  './js/history.js',
  './js/session.js',
  './js/body3d.js',
  './js/nav.js',
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

function putInCache(request, response) {
  const copy = response.clone();
  caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // App shell = our own HTML/JS/CSS/manifest (but NOT the large vendored libs).
  const isShell = sameOrigin
    && !url.pathname.includes('/vendor/')
    && (req.mode === 'navigate'
        || url.pathname.endsWith('/')
        || /\.(?:html|js|css|webmanifest)$/.test(url.pathname));

  if (isShell) {
    // Network-first: fresh when online, cached when offline.
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.ok) putInCache(req, response);
          return response;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for everything else (Three.js, model, icons).
  event.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((response) => {
        if (response && response.ok && sameOrigin) putInCache(req, response);
        return response;
      })
    )
  );
});
