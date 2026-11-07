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

for (const path of ["/?source=homescreen", "/privacy", "/accessibility"]) {
  test(`${path} opens offline after the first load without an online reload`, async ({ context, page }) => {
    await firstVisit(page);
    await context.setOffline(true);
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("an unused language is available offline after the first load", async ({ context, page }) => {
  await firstVisit(page);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("select.settings-select").selectOption("fr");
  await expect(page.getByRole("heading", { name: "Paramètres", exact: true })).toBeVisible();
});
