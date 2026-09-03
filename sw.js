/* ─── Service Worker v1.0 ─── */

const CACHE_NAME = 'wotd-svenska-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/finnish_words.json',
  '/sv_words.json',
];

/* ─── Install ─── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Activate immediately without waiting for page reload
  self.skipWaiting();
});

/* ─── Activate ─── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all open pages immediately
  self.clients.claim();
});

/* ─── Fetch — Cache First ─── */
self.addEventListener('fetch', (event) => {
  // Only handle GET requests from our own origin
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Don't cache API calls (MyMemory)
  if (url.hostname === 'api.mymemory.translated.net') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached if available, otherwise fetch and cache
      return (
        cached ||
        fetch(event.request).then((response) => {
          // Only cache if it's a valid response from our origin
          if (
            response &&
            response.status === 200 &&
            response.type === 'basic'
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
      );
    })
  );
});