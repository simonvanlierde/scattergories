// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Listener = (event: Record<string, unknown>) => void;

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8")
  .replace("/* BUILD */ 0", "200")
  .replace("/* PRECACHE */ []", JSON.stringify(["/", "/assets/app-1.js"]))
  .replace("/* LAZY */ []", JSON.stringify(["/assets/fr-1.js"]));

const js = (body = "x") => new Response(body, { headers: { "content-type": "text/javascript" } });
const html = () => new Response("<!doctype html>", { headers: { "content-type": "text/html" } });

function boot(
  stored: Record<string, Record<string, Response>> = {},
  fetcher: (url: string, signal?: AbortSignal) => Promise<Response>,
) {
  const listeners: Record<string, Listener> = {};
  const key = (r: RequestInfo) => new URL(typeof r === "string" ? r : (r as Request).url, "https://x.test").pathname;
  const open = async (name: string) => {
    stored[name] ??= {};
    const entries = stored[name];
    return {
      put: async (r: RequestInfo, res: Response) => {
        entries[key(r)] = res;
      },
      match: async (r: RequestInfo) => entries[key(r)]?.clone(),
    };
  };
  const caches = {
    open,
    keys: async () => Object.keys(stored),
    delete: async (name: string) => Reflect.deleteProperty(stored, name),
  };
  const self = {
    location: { origin: "https://x.test" },
    navigator: { languages: ["fr-FR"] },
    clients: { claim: async () => undefined },
    skipWaiting: async () => undefined,
    addEventListener: (type: string, fn: Listener) => {
      listeners[type] = fn;
    },
  };
  new Function("self", "caches", "fetch", source)(self, caches, (r: RequestInfo, init?: RequestInit) =>
    fetcher(typeof r === "string" ? r : (r as Request).url, init?.signal ?? undefined),
  );
  const run = async (type: string, event: Record<string, unknown>) => {
    let work: Promise<unknown> = Promise.resolve();
    listeners[type]?.({
      ...event,
      waitUntil: (p: Promise<unknown>) => {
        work = p;
      },
      respondWith: (p: Promise<unknown>) => {
        work = p;
      },
    });
    return work;
  };
  return { stored, run };
}

const request = (path: string, mode = "cors") => ({ method: "GET", url: `https://x.test${path}`, mode });

describe("service worker", () => {
  it("installs the shell and the visitor's language, not other languages", async () => {
    const { stored, run } = boot({}, async (url) => {
      return new URL(url, "https://x.test").pathname === "/" ? html() : js();
    });
    await run("install", {});
    expect(Object.keys(stored["scattergories-200"] ?? {}).sort()).toEqual(["/", "/assets/app-1.js", "/assets/fr-1.js"]);
  });

  it("drops a half-filled cache when install fails", async () => {
    const { stored, run } = boot({}, async () => html());
    await expect(run("install", {})).rejects.toThrow();
    expect(stored["scattergories-200"]).toBeUndefined();
  });

  it("keeps only the two newest builds on activate", async () => {
    const { stored, run } = boot(
      { "scattergories-1": {}, "scattergories-100": {}, "scattergories-200": {}, other: {} },
      async () => js(),
    );
    await run("activate", {});
    expect(Object.keys(stored).sort()).toEqual(["other", "scattergories-100", "scattergories-200"]);
  });

  it("does not cache an HTML fallback served as a script, nor unknown paths", async () => {
    const { stored, run } = boot({}, async () => html());
    await run("fetch", { request: request("/assets/app-1.js") });
    await run("fetch", { request: request("/assets/unknown.js") });
    expect(stored["scattergories-200"] ?? {}).toEqual({});
  });

  it("serves a stored hashed asset without asking the network", async () => {
    let calls = 0;
    const { run } = boot({ "scattergories-200": { "/assets/app-1.js": js("cached") } }, async () => {
      calls++;
      return js("network");
    });
    const res = (await run("fetch", { request: request("/assets/app-1.js") })) as Response;
    expect(await res.text()).toBe("cached");
    expect(calls).toBe(0);
  });

  it("falls back to the stored shell when a navigation hangs", async () => {
    const hang = (_url: string, signal?: AbortSignal) =>
      new Promise<Response>((_resolve, reject) => signal?.addEventListener("abort", () => reject(signal.reason)));
    const { run } = boot({ "scattergories-200": { "/": html() } }, hang);
    const res = (await run("fetch", { request: request("/privacy", "navigate") })) as Response;
    expect(await res.text()).toBe("<!doctype html>");
  }, 10_000);
});
