const CACHE_NAME = 'expo-crud-shell-v1';
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['/','/manifest.webmanifest','/icon.svg']))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => { const req = event.request; if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return; if (req.mode === 'navigate') { event.respondWith(fetch(req).catch(() => caches.match('/'))); return; } event.respondWith(caches.match(req).then(cached => cached || fetch(req))); });
