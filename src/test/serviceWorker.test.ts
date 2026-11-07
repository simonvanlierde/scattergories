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
