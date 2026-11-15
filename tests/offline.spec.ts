import { expect, type Page, test } from "@playwright/test";

// spell-checker: ignore Paramètres

async function firstVisit(page: Page) {
  await page.addInitScript(() => localStorage.setItem("scattergories.onboarded.v1", "1"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Roll a letter", exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }),
      );
    }
  });
}

for (const [path, heading] of [
  ["/?source=homescreen", "Scattergories"],
  ["/privacy", "Privacy statement"],
  ["/accessibility", "Accessibility statement"],
]) {
  test(`@smoke ${path} opens offline after the first load without an online reload`, async ({ context, page }) => {
    await firstVisit(page);
    await context.setOffline(true);
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();
    if (path.startsWith("/?")) {
      await expect(page.getByRole("button", { name: "Roll a letter", exact: true })).toBeEnabled();
    }
  });
}

test("@smoke a language chosen online after the first load is available offline after a reload", async ({
  context,
  page,
}) => {
  await firstVisit(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("select.settings-select").selectOption("fr");
  await expect(page.getByRole("heading", { name: "Paramètres", exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Paramètres", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Paramètres", exact: true })).toBeVisible();
});

test("the first install caches the shell and the language in use, not every locale or screenshot", async ({ page }) => {
  await firstVisit(page);
  const paths = await page.evaluate(async () => {
    const names = await caches.keys();
    const cache = await caches.open(names[0] as string);
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  });
  expect(paths.filter((path) => /^\/assets\/(?:de|es|fr|it|nl|pl|pt|el)-/.test(path))).toEqual([]);
  expect(paths.filter((path) => path.startsWith("/screenshots/"))).toEqual([]);
});

test("a hashed asset path that returns the HTML fallback is not stored", async ({ page }) => {
  await firstVisit(page);
  await page.evaluate(() => fetch("/assets/removed-0000.js"));
  const stored = await page.evaluate(async () => {
    const names = await caches.keys();
    return (
      await Promise.all(names.map((name) => caches.open(name).then((cache) => cache.match("/assets/removed-0000.js"))))
    ).some(Boolean);
  });
  expect(stored).toBe(false);
});
