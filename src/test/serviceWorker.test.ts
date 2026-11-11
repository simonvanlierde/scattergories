/// <reference types="node" />
// @vitest-environment node
// biome-ignore lint/correctness/noNodejsModules: executes the real worker source in a Node test sandbox.
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import workerSource from "../../public/sw.js?raw";

function workerStore(cached?: Response) {
  const put = vi.fn();
  const store = runInNewContext(`${workerSource}\nstore`, {
    URL,
    self: { addEventListener: vi.fn() },
    caches: {
      match: vi.fn().mockResolvedValue(cached),
      open: vi.fn().mockResolvedValue({ put }),
    },
  }) as (request: Request, response: Response) => Promise<Response>;
  return { store, put };
}

describe("service worker asset caching", () => {
  it.each(["js", "css"])("preserves cached %s when the host returns HTML", async (extension) => {
    const cached = new Response("previous asset");
    const { store, put } = workerStore(cached);
    const result = await store(
      new Request(`https://example.test/assets/previous.${extension}`),
      new Response("<!doctype html>", { headers: { "content-type": "text/html" } }),
    );
    expect(result).toBe(cached);
    expect(put).not.toHaveBeenCalled();
  });

  it("stores valid JavaScript responses", async () => {
    const { store, put } = workerStore();
    const request = new Request("https://example.test/assets/current.js");
    const response = new Response("export const value = 1;", { headers: { "content-type": "text/javascript" } });
    expect(await store(request, response)).toBe(response);
    expect(put).toHaveBeenCalledWith(request, expect.any(Response));
  });
});

describe("service worker runtime storage failures", () => {
  it.each([500, 503])("uses the installed shell when navigation returns %s", async (status) => {
    const cached = new Response("installed shell");
    const response = new Response("temporarily unavailable", { status });
    const match = vi.fn().mockResolvedValue(cached);
    const networkFirst = runInNewContext(`${workerSource}\nnetworkFirst`, {
      URL,
      self: { addEventListener: vi.fn() },
      fetch: vi.fn().mockResolvedValue(response),
      caches: { match },
    }) as (request: Request) => Promise<Response>;
    expect(await networkFirst(new Request("https://example.test/"))).toBe(cached);
    match.mockResolvedValue(undefined);
    expect(await networkFirst(new Request("https://example.test/"))).toBe(response);
  });

  it("fetches assets when cache reads fail", async () => {
    const script = new Response("export {};", { headers: { "content-type": "text/javascript" } });
    const fetch = vi.fn().mockResolvedValue(script);
    const worker = runInNewContext(`${workerSource}\nstaleWhileRevalidate`, {
      URL,
      self: { addEventListener: vi.fn() },
      fetch,
      caches: {
        match: vi.fn().mockRejectedValue(new Error("CacheStorage read failed")),
        open: vi.fn().mockResolvedValue({ put: vi.fn() }),
      },
    }) as (request: Request) => Promise<Response>;
    expect(await worker(new Request("https://example.test/assets/new.js"))).toBe(script);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("keeps the installed shell when a new build cannot be cached", async () => {
    const saved = new Map([
      ["https://example.test/", "old shell"],
      ["https://example.test/assets/old.js", "old script"],
    ]);
    let online = true;
    const worker = runInNewContext(`${workerSource}\n({ networkFirst, staleWhileRevalidate })`, {
      URL,
      self: { addEventListener: vi.fn() },
      fetch: (request: Request) => {
        if (!online) {
          return Promise.reject(new Error("offline"));
        }
        return Promise.resolve(
          request.url.endsWith(".js")
            ? new Response("new script", { headers: { "content-type": "text/javascript" } })
            : new Response("new shell"),
        );
      },
      caches: {
        match: (request: Request | string) => {
          const body = saved.get(
            typeof request === "string" ? new URL(request, "https://example.test").href : request.url,
          );
          return Promise.resolve(body === undefined ? undefined : new Response(body));
        },
        open: async () => ({
          put: async (request: Request, response: Response) => {
            if (request.url.endsWith(".js")) {
              throw new Error("quota exceeded");
            }
            saved.set(request.url, await response.text());
          },
        }),
      },
    }) as {
      networkFirst: (request: Request) => Promise<Response>;
      staleWhileRevalidate: (request: Request) => Promise<Response>;
    };
    const navigation = new Request("https://example.test/");
    expect(await (await worker.networkFirst(navigation)).text()).toBe("new shell");
    expect(await (await worker.staleWhileRevalidate(new Request("https://example.test/assets/new.js"))).text()).toBe(
      "new script",
    );
    online = false;
    expect(await (await worker.networkFirst(navigation)).text()).toBe("old shell");
    expect(await (await worker.staleWhileRevalidate(new Request("https://example.test/assets/old.js"))).text()).toBe(
      "old script",
    );
  });

  it.each(["open", "put"])("keeps healthy network responses when cache %s fails", async (failure) => {
    const shell = new Response("new shell");
    const script = new Response("export {};", { headers: { "content-type": "text/javascript" } });
    const fail = () => Promise.reject(new Error("QuotaExceededError"));
    const worker = runInNewContext(`${workerSource}\n({ networkFirst, staleWhileRevalidate })`, {
      URL,
      self: { addEventListener: vi.fn() },
      fetch: async (request: Request) => (request.url.endsWith(".js") ? script : shell),
      caches: {
        match: async (request: Request | string) => (request === "/" ? new Response("old shell") : undefined),
        open: failure === "open" ? fail : async () => ({ put: fail }),
      },
    }) as {
      networkFirst: (request: Request) => Promise<Response>;
      staleWhileRevalidate: (request: Request) => Promise<Response>;
    };

    expect(await (await worker.networkFirst(new Request("https://example.test/"))).text()).toBe("new shell");
    expect(await worker.staleWhileRevalidate(new Request("https://example.test/assets/new.js"))).toBe(script);
  });
});

function workerInstall(response: Response) {
  const listeners = new Map<string, (event: { waitUntil: (promise: Promise<void>) => void }) => void>();
  const put = vi.fn().mockResolvedValue(undefined);
  const fetch = vi.fn(async (path: string) => (path === "/" ? new Response("new shell") : response));
  const skipWaiting = vi.fn();
  runInNewContext(workerSource.replace("/* PRECACHE */ []", JSON.stringify(["/", "/assets/previous.js"])), {
    URL,
    fetch,
    self: {
      addEventListener: (name: string, listener: (event: { waitUntil: (promise: Promise<void>) => void }) => void) =>
        listeners.set(name, listener),
      skipWaiting,
    },
    caches: {
      open: vi.fn().mockResolvedValue({
        put,
        addAll: vi.fn(() => (response.ok ? Promise.resolve() : Promise.reject(new Error("Invalid response")))),
      }),
    },
  });
  const install = () =>
    new Promise<void>((resolve, reject) =>
      listeners.get("install")?.({
        waitUntil: (promise) => {
          promise.then(resolve, reject);
        },
      }),
    );
  return { install, put, skipWaiting };
}

describe("service worker installation", () => {
  it.each([
    new Response("<!doctype html>", { headers: { "content-type": "text/html" } }),
    new Response("missing", { status: 404 }),
  ])("rejects invalid assets before writing or activating", async (response) => {
    const { install, put, skipWaiting } = workerInstall(response);
    await expect(install()).rejects.toThrow();
    expect(put).not.toHaveBeenCalled();
    expect(skipWaiting).not.toHaveBeenCalled();
  });

  it("writes assets before replacing the old shell", async () => {
    const { install, put, skipWaiting } = workerInstall(
      new Response("export {};", { headers: { "content-type": "text/javascript" } }),
    );
    await install();
    expect(put.mock.calls.map(([path]) => path)).toEqual(["/assets/previous.js", "/"]);
    expect(skipWaiting).toHaveBeenCalledOnce();
  });

  it("leaves the old shell active if an asset write fails", async () => {
    const { install, put, skipWaiting } = workerInstall(
      new Response("export {};", { headers: { "content-type": "text/javascript" } }),
    );
    put.mockRejectedValueOnce(new Error("quota exceeded"));
    await expect(install()).rejects.toThrow("quota exceeded");
    expect(put.mock.calls.map(([path]) => path)).toEqual(["/assets/previous.js"]);
    expect(skipWaiting).not.toHaveBeenCalled();
  });
});
