const CACHE_NAME = 'homes-with-lewy-shell-v1';
const APP_SHELL = ['/', '/assets/site.webmanifest', '/assets/icon-192.svg', '/assets/icon-512.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('homes-with-lewy-') && key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('/', response.clone()));
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match('/'))));
    return;
  }

  event.respondWith(fetch(request).then(response => {
    if (response.ok && url.pathname.startsWith('/assets/')) {
      caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    }
    return response;
  }).catch(async () => (await caches.match(request)) || Response.error()));
});
