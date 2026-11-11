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

// The social card's visual (docs/screenshots/og-dial.png): the whole letter dial, ring and
// timer, at 3x so the thin ring and the readout stay sharp when the card is shown small.
test.describe("README social card dial", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: "light" });

  test("captures the dial of a running round", async ({ app, page }) => {
    await page.addInitScript(() => {
      let seed = 7;
      Math.random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
    });
    await page.clock.install();
    await page.reload();
    await app.waitUntilReady();
    await page.evaluate(() => document.fonts.ready);
    await app.startRound();
    await page.clock.runFor(6500);
    await app.expectRunning();
    const box = await page.locator(".playmat__hero").boundingBox();
    if (!box) {
      throw new Error("the dial is not on the page");
    }
    // The readout hangs below the hero box: extend the capture so it fits, with no other margin so the
    // ring fills the card's narrow panel.
    const readoutHang = 12;
    await page.screenshot({
      path: "docs/screenshots/og-dial.png",
      animations: "disabled",
      clip: { x: box.x, y: box.y, width: box.width, height: box.height + readoutHang },
    });
  });
});
