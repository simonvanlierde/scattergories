// Keep earlier content-hashed assets available to already-open tabs.
const CACHE = "scattergories-v1";
const PRECACHE = /* PRECACHE */ [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(PRECACHE);
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function store(request, response) {
  const path = new URL(request.url).pathname;
  const type = response.headers.get("content-type") ?? "";
  const wrongType =
    (path.endsWith(".js") && !/^(?:text|application)\/(?:javascript|ecmascript)\b/i.test(type)) ||
    (path.endsWith(".css") && !/^text\/css\b/i.test(type));
  // A removed asset can return the host's HTML fallback with status 200.
  if (wrongType) {
    return (await caches.match(request, { ignoreVary: true })) ?? response;
  }
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

// Serve the app shell network-first so a deploy is never masked by a stale
// cached index; content-hashed assets fall back to cache-first with a
// background refresh (stale-while-revalidate).
async function networkFirst(request) {
  try {
    return await store(request, await fetch(request));
  } catch {
    // Any URL of this single-page app renders the same shell. It is cached under
    // "/" (the start URL): the host redirects /index.html there, so that key never fills.
    return (
      (await caches.match(request, { ignoreSearch: true, ignoreVary: true })) ??
      (await caches.match("/", { ignoreVary: true }))
    );
  }
}

// Install fetches omit Origin, while module requests can include it for these same public files.
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request, { ignoreVary: true });
  const network = fetch(request)
    .then((response) => store(request, response))
    .catch(() => cached);
  return cached ?? network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  event.respondWith(request.mode === "navigate" ? networkFirst(request) : staleWhileRevalidate(request));
});
