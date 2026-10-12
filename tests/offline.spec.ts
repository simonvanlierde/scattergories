import { expect, test } from "@playwright/test";

test("reopens offline after one visit, even with a query string", async ({ context, page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The second load runs under the worker, which caches the shell and its assets.
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await context.setOffline(true);
  await page.goto("/?source=homescreen");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
