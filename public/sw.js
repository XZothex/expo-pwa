const CACHE_NAME = 'expo-crud-shell-v3';
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(SHELL);
  // Expo Web injects hashed JS/CSS URLs into the exported HTML.
  // Precache these assets so a first online visit can later boot offline.
  const response = await cache.match('/');
  if (!response) return;
  const html = await response.text();
  const assetUrls = new Set();
  const pattern = /<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(pattern)) {
    const url = new URL(match[1], self.location.origin);
    if (url.origin === self.location.origin && /\.(?:js|css)(?:$|\?)/i.test(url.href)) {
      assetUrls.add(url.href);
    }
  }
  await Promise.all([...assetUrls].map(url => cache.add(url).catch(error => {
    console.warn('Unable to precache app asset', url, error);
  })));
}

self.addEventListener('install', event => {
  event.waitUntil(cacheAppShell());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('expo-crud-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(req);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('/', response.clone());
        }
        return response;
      } catch {
        return (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }
  // Cache Expo's JS/CSS as they load, including assets missed during install.
  if (req.destination === 'script' || req.destination === 'style' ||
      /\/_expo\/static\//.test(new URL(req.url).pathname)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const response = await fetch(req);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(req, response.clone());
      }
      return response;
    })());
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});
