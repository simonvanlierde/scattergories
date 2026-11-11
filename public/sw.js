// Keep earlier content-hashed assets available to already-open tabs.
const CACHE = "scattergories-v1";
const PRECACHE = /* PRECACHE */ [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const responses = await Promise.all(
        PRECACHE.map(async (path) => {
          const response = await fetch(path, { cache: "reload" });
          if (!isCacheable(path, response)) {
            throw new Error(`Invalid offline response: ${path}`);
          }
          return { path, response };
        }),
      );
      // Preserve the old shell until every asset has been validated and stored.
      for (const { path, response } of responses.filter((entry) => entry.path !== "/")) {
        await cache.put(path, response);
      }
      const shell = responses.find((entry) => entry.path === "/");
      if (shell) {
        await cache.put("/", shell.response);
      }
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function isCacheable(path, response) {
  const type = response.headers.get("content-type") ?? "";
  const wrongType =
    (path.endsWith(".js") && !/^(?:text|application)\/(?:javascript|ecmascript)\b/i.test(type)) ||
    (path.endsWith(".css") && !/^text\/css\b/i.test(type));
  return response.ok && !wrongType;
}

async function store(request, response) {
  // A removed asset can return the host's HTML fallback with status 200.
  if (!isCacheable(new URL(request.url).pathname, response)) {
    return (await caches.match(request, { ignoreVary: true })) ?? response;
  }
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  } catch {
    // Runtime caching must not discard a healthy network response when storage is full.
  }
  return response;
}

// Serve the app shell network-first so a deploy is never masked by a stale
// cached index; content-hashed assets fall back to cache-first with a
// background refresh (stale-while-revalidate).
async function cachedShell(request) {
  // Every app URL renders the shell installed under the start URL.
  return (
    (await caches.match(request, { ignoreSearch: true, ignoreVary: true }).catch(() => undefined)) ??
    (await caches.match("/", { ignoreVary: true }).catch(() => undefined))
  );
}

async function networkFirst(request) {
  try {
    // Only installation can replace the offline shell after all its assets are stored.
    const response = await fetch(request);
    return response.ok ? response : ((await cachedShell(request)) ?? response);
  } catch {
    return cachedShell(request);
  }
}

// Install fetches omit Origin, while module requests can include it for these same public files.
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request, { ignoreVary: true }).catch(() => undefined);
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
