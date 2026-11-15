import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

// The app saves preferences and caches its own files for offline play.

// Origins a page may request besides its own. A visitor counter on another origin
// goes here by name, with a line in docs/privacy.md and its origin in public/_headers.
const OTHER_ORIGINS: string[] = [];

for (const path of ROUTES) {
  test(`${path} sets no cookies, keeps only app data and loads only its own files`, async ({ page, context }) => {
    const origins = new Set<string>();
    // On the context, so requests from workers and service workers count too.
    context.on("request", (request) => {
      if (request.url().startsWith("http")) origins.add(new URL(request.url()).origin);
    });
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.getByRole("main")).toBeVisible();
    // The service worker's install and precache are the last startup work; wait for
    // them to finish instead of sleeping. Storage or requests made only after the
    // user acts are not seen.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.waitForLoadState("networkidle");

    expect(await context.cookies()).toEqual([]);
    const stored = await page.evaluate(async () => ({
      localStorage: Object.keys(localStorage),
      sessionStorage: sessionStorage.length,
      indexedDB: (await indexedDB.databases()).map((db) => db.name),
      caches: await caches.keys(),
      serviceWorkers: (await navigator.serviceWorker.getRegistrations()).map((worker) => worker.scope),
    }));
    const own = new URL(page.url()).origin;
    expect(
      stored.localStorage.filter((key) => !["scattergories.settings.v1", "scattergories.language"].includes(key)),
    ).toEqual([]);
    expect(stored.sessionStorage).toBe(0);
    expect(stored.indexedDB).toEqual([]);
    expect(stored.caches.filter((name) => !/^scattergories-\d+$/.test(name))).toEqual([]);
    expect(stored.serviceWorkers.filter((scope) => scope !== `${own}/`)).toEqual([]);
    // The page's own files must show up, or the capture saw nothing and proves nothing.
    expect([...origins]).toContain(own);
    expect([...origins].filter((origin) => origin !== own && !OTHER_ORIGINS.includes(origin))).toEqual([]);
  });
}
