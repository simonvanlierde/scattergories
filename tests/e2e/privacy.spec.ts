import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

<<<<<<< before updating
// The app saves preferences and caches its own files for offline play.
=======
/**
 * docs/privacy.md says the app sets no cookies, keeps on the device only what it lists
 * and loads nothing from other sites, so it needs no cookie banner. These prove it on
 * a first visit to every route.
 */
>>>>>>> after updating

// Origins a page may request besides its own. A visitor counter on another origin
// goes here by name, with a line in docs/privacy.md and its origin in public/_headers.
const OTHER_ORIGINS: string[] = [];
<<<<<<< before updating

for (const path of ROUTES) {
  test(`${path} sets no cookies, keeps only app data and loads only its own files`, async ({ page, context }) => {
=======
// What a first visit may keep in the browser, by name, each with a line in docs/privacy.md:
// a settings key, say, or the cache and service worker scope ("/") of an app that works
// offline. Anything else fails.
const ALLOWED = {
  localStorage: [] as string[],
  sessionStorage: [] as string[],
  indexedDB: [] as string[],
  caches: [] as string[],
  serviceWorkers: [] as string[],
};
// How long a page may sit idle before the checks. Storage or a request made later
// than this, or only after the user acts, is not seen.
const SETTLE_MS = 3_000;

for (const path of ROUTES) {
  test(`${path} sets no cookies, keeps only listed data and loads only its own files`, async ({ page, context }) => {
>>>>>>> after updating
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
<<<<<<< before updating
      sessionStorage: sessionStorage.length,
      indexedDB: (await indexedDB.databases()).map((db) => db.name),
      caches: await caches.keys(),
      serviceWorkers: (await navigator.serviceWorker.getRegistrations()).map((worker) => worker.scope),
    }));
=======
      sessionStorage: Object.keys(sessionStorage),
      indexedDB: (await indexedDB.databases()).map((db) => db.name ?? ""),
      caches: await caches.keys(),
      serviceWorkers: (await navigator.serviceWorker.getRegistrations()).map((sw) => new URL(sw.scope).pathname),
    }));
    for (const [kind, names] of Object.entries(stored) as [keyof typeof ALLOWED, string[]][]) {
      const unlisted = names.filter((name) => !ALLOWED[kind].includes(name));
      expect(unlisted, kind).toEqual([]);
    }
>>>>>>> after updating
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
