/* HealthPassport Pro service worker.
 * - Precaches the offline fallback + icons.
 * - Navigations: network-first, falling back to /offline when offline.
 * - Static assets (/_next/static, icons): stale-while-revalidate.
 * - NEVER caches API responses or any PHI — /api/* is always passed through to
 *   the network (docs/SECURITY_CHECKLIST.md, docs/PRIVACY_MODEL.md).
 */
const VERSION = 'v1';
const STATIC_CACHE = `hp-static-${VERSION}`;
const PRECACHE = ['/offline', '/icon.svg', '/icon-maskable.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static') ||
    url.pathname === '/icon.svg' ||
    url.pathname === '/icon-maskable.svg' ||
    url.pathname === '/favicon.ico'
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never touch API / PHI responses — always go to the network.
  if (url.pathname.startsWith('/api/')) return;

  // App navigations: network-first with an offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/offline')),
      ),
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
