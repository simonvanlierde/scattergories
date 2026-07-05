// ponytail: hand-rolled precache-less service worker; upgrade path is
// vite-plugin-pwa if precise precaching/versioned offline manifests are needed.
const CACHE = 'scattergories-v1';

self.addEventListener('activate', (event) => {
  event.waitUntil(dropOldCaches());
  self.clients.claim();
});

async function dropOldCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
}

async function store(request, response) {
  const cache = await caches.open(CACHE);
  await cache.put(request, response.clone());
  return response;
}

// Serve the app shell network-first so a deploy is never masked by a stale
// cached index; content-hashed assets fall back to cache-first with a
// background refresh (stale-while-revalidate).
async function networkFirst(request) {
  try {
    return await store(request, await fetch(request));
  } catch {
    return (await caches.match(request)) ?? (await caches.match('/index.html'));
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => store(request, response))
    .catch(() => cached);
  return cached ?? network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    request.mode === 'navigate' ? networkFirst(request) : staleWhileRevalidate(request),
  );
});
