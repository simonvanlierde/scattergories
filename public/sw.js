// Each build gets its own cache; the previous one stays so already-open tabs keep their hashed assets.
const BUILD = /* BUILD */ 0;
const CACHE = `scattergories-${BUILD}`;
// Shell, English and fonts for Latin text. Everything else is fetched on use and cached then.
const PRECACHE = /* PRECACHE */ [];
// Other languages, font subsets and store screenshots: the only extra paths the runtime cache accepts.
const LAZY = /* LAZY */ [];
const NAVIGATION_TIMEOUT_MS = 3500;

// Languages whose letters are not in the Latin fonts that every visitor gets.
const FONT_SUBSETS = { el: "greek", pl: "latin-ext" };

// The page's own language is not cached by a worker that is not yet in control, so install
// fetches its messages and, where it needs one, its font subset.
const wantedLazy = () => {
  const codes = (self.navigator?.languages ?? []).map((tag) => tag.toLowerCase().split("-")[0]);
  const subsets = codes.map((code) => FONT_SUBSETS[code]).filter(Boolean);
  return LAZY.filter(
    (path) =>
      codes.some((code) => path.startsWith(`/assets/${code}-`)) ||
      (path.endsWith(".woff2") && subsets.some((subset) => path.includes(`-${subset}-`))),
  );
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        const responses = await Promise.all(
          [...PRECACHE, ...wantedLazy()].map(async (path) => {
            const response = await fetch(path, { cache: "reload" });
            if (!isCacheable(path, response)) {
              throw new Error(`Invalid offline response: ${path}`);
            }
            return { path, response };
          }),
        );
        // Store the shell last, after every asset it needs.
        for (const { path, response } of responses.filter((entry) => entry.path !== "/")) {
          await cache.put(path, response);
        }
        const shell = responses.find((entry) => entry.path === "/");
        if (shell) {
          await cache.put("/", shell.response);
        }
        await self.skipWaiting();
      })
      .catch(async (error) => {
        // A half-filled cache must never count as the last complete build.
        await caches.delete(CACHE);
        throw error;
      }),
  );
});

// This build's cache first, so a rolled-back older build still serves and keeps its own files;
// the others follow, newest first (their names carry the build time).
async function buildCaches() {
  const found = (await caches.keys()).filter((name) => /^scattergories-\d+$/.test(name));
  const others = found.filter((name) => name !== CACHE).sort((a, b) => Number(b.slice(14)) - Number(a.slice(14)));
  return found.includes(CACHE) ? [CACHE, ...others] : others;
}

// caches.match would search the oldest cache first and serve a stale shell.
async function lookup(request, options) {
  for (const name of await buildCaches()) {
    const hit = await (await caches.open(name)).match(request, { ...options, ignoreVary: true });
    if (hit) {
      return hit;
    }
  }
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Keep this build and the newest other one for tabs that still run it.
      const keep = (await buildCaches()).slice(0, 2);
      const stale = (await caches.keys()).filter((name) => name.startsWith("scattergories-") && !keep.includes(name));
      await Promise.all(stale.map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

function isCacheable(path, response) {
  const type = response.headers.get("content-type") ?? "";
  // A removed asset can come back as the host's HTML fallback with status 200.
  const html = /^text\/html\b/i.test(type);
  const wrongType =
    (path === "/" ? !html : html) ||
    (path.endsWith(".js") && !/^(?:text|application)\/(?:javascript|ecmascript)\b/i.test(type)) ||
    (path.endsWith(".css") && !/^text\/css\b/i.test(type)) ||
    (path.endsWith(".woff2") && !/^(?:font\/woff2|application\/(?:font-woff2|octet-stream))\b/i.test(type));
  return response.ok && !wrongType;
}

async function store(request, response) {
  if (!isCacheable(new URL(request.url).pathname, response)) {
    return (await lookup(request)) ?? response;
  }
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  } catch {
    // Runtime caching must not discard a healthy network response when storage is full.
  }
  return response;
}

// Every app URL renders the shell installed under the start URL.
async function cachedShell(request) {
  return (
    (await lookup(request, { ignoreSearch: true }).catch(() => undefined)) ?? (await lookup("/").catch(() => undefined))
  );
}

// The shell is served network-first so a deploy is never masked by a stale index.
async function networkFirst(request) {
  try {
    // Only installation can replace the offline shell after all its assets are stored.
    // A hung connection must not block a shell that is already stored.
    const response = await fetch(request, { signal: AbortSignal.timeout(NAVIGATION_TIMEOUT_MS) });
    return response.ok ? response : ((await cachedShell(request)) ?? response);
  } catch {
    return cachedShell(request);
  }
}

// Hashed files never change, so a stored copy needs no refresh. Files without a hash (icons, manifest)
// are refreshed in the background. Install fetches omit Origin, while module requests can include
// it for these same public files, hence ignoreVary in lookup.
async function assetResponse(request) {
  const path = new URL(request.url).pathname;
  const cached = await lookup(request).catch(() => undefined);
  if (cached && path.startsWith("/assets/")) {
    return cached;
  }
  const network = fetch(request)
    .then((response) => store(request, response))
    .catch(() => cached);
  return cached ?? network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const { origin, pathname } = new URL(request.url);
  if (request.method !== "GET" || origin !== self.location.origin) {
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  } else if (PRECACHE.includes(pathname) || LAZY.includes(pathname)) {
    // Paths outside the build's own lists go to the network untouched, so the cache stays bounded.
    event.respondWith(assetResponse(request));
  }
});
