import { expect } from "@playwright/test";
import { test } from "../fixtures";

for (const [name, viewport] of [
  ["phone", { width: 390, height: 844 }],
  ["desktop", { width: 1280, height: 800 }],
] as const) {
  for (const colorScheme of ["light", "dark"] as const) {
    test.describe(`README ${name} ${colorScheme}`, () => {
      test.use({ viewport, colorScheme });

      test("captures a running round", async ({ app, page }) => {
        await page.addInitScript(() => {
          let seed = 42;
          Math.random = () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
          };
        });
        await page.clock.install();
        await page.reload();
        await app.waitUntilReady();
        await page.evaluate(() => document.fonts.ready);
        await page.locator(".category-checklist__chip").first().click();
        await app.startRound();
        await page.clock.runFor(5500);
        await app.expectRunning();
        await expect(page.locator(".playmat__round")).toContainText("Round 1");
        await page.screenshot({ path: `docs/screenshots/${name}-${colorScheme}.png`, animations: "disabled" });
      });
    });
  }
}
