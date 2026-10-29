import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

/**
 * docs/privacy.md says the app sets no cookies, stores nothing before the user
 * acts and loads nothing from other sites, so it needs no cookie banner. These
 * prove it on a first visit to every route.
 */

// Origins a page may request besides its own. A visitor counter on another origin
// goes here by name, with a line in docs/privacy.md and its origin in public/_headers.
const OTHER_ORIGINS: string[] = [];
// How long a page may sit idle before the checks. Storage or a request made later
// than this, or only after the user acts, is not seen.
const SETTLE_MS = 3_000;
// What the app itself keeps on a first visit, named so that anything new fails here:
// the offline shell (a service worker and its cache) and the saved settings.
// docs/privacy.md has to say the same.
// The service worker may not have filled its cache yet, so each list is an upper bound.
const OWN_STORAGE = { localStorage: ["scattergories.settings.v1"], caches: ["scattergories-v1"] };

for (const path of ROUTES) {
  test(`${path} sets no cookies, stores nothing and loads only its own files`, async ({ page, context }) => {
    const origins = new Set<string>();
    // On the context, so requests from workers and service workers count too.
    context.on("request", (request) => {
      if (request.url().startsWith("http")) origins.add(new URL(request.url()).origin);
    });
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.getByRole("main")).toBeVisible();
    await page.waitForTimeout(SETTLE_MS);

    expect(await context.cookies()).toEqual([]);
    const stored = await page.evaluate(async () => ({
      localStorage: Object.keys(localStorage).sort(),
      sessionStorage: sessionStorage.length,
      indexedDB: (await indexedDB.databases()).map((db) => db.name),
      caches: await caches.keys(),
      serviceWorkers: (await navigator.serviceWorker.getRegistrations()).length,
    }));
    expect(stored.localStorage.filter((key) => !OWN_STORAGE.localStorage.includes(key))).toEqual([]);
    expect(stored.caches.filter((name) => !OWN_STORAGE.caches.includes(name))).toEqual([]);
    expect(stored.serviceWorkers).toBeLessThanOrEqual(1);
    expect({ sessionStorage: stored.sessionStorage, indexedDB: stored.indexedDB }).toEqual({
      sessionStorage: 0,
      indexedDB: [],
    });
    const own = new URL(page.url()).origin;
    // The page's own files must show up, or the capture saw nothing and proves nothing.
    expect([...origins]).toContain(own);
    expect([...origins].filter((origin) => origin !== own && !OTHER_ORIGINS.includes(origin))).toEqual([]);
  });
}
