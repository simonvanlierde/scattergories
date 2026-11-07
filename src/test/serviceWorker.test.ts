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
