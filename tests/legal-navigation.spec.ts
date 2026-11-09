import { expect } from "@playwright/test";
import { test } from "./fixtures";

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test.describe(`${viewport.width}px document navigation`, () => {
    test.use({ viewport });

    test("keeps the game in one screen and opens documents from How to play", async ({ app, page }) => {
      const height = await page.evaluate(() => ({
        page: document.documentElement.scrollHeight,
        viewport: innerHeight,
      }));
      expect(height.page).toBeLessThanOrEqual(height.viewport);
      await app.openHelp();
      await page.getByText("About", { exact: true }).click();
      await page.getByRole("link", { name: "Privacy (English)", exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy statement");
      await expect(page.getByRole("main")).toBeFocused();
      await page.getByRole("link", { name: "Accessibility statement", exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Accessibility statement");
      await page.getByRole("link", { name: "Back to the game", exact: true }).click();
      await app.waitUntilReady();
    });
  });
}
