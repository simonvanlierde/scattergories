import { test } from "../fixtures";

// The live dial of the social card (docs/og-card.html), captured at 3x in both themes so the thin
// ring and the readout stay sharp. `just og-card-capture` writes docs/og-card/dial-<scheme>.png.
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`social card dial, ${colorScheme}`, () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme });

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
      // The readout hangs below the hero box, so the clip extends past it.
      const readoutHang = 12;
      await page.screenshot({
        path: `docs/og-card/dial-${colorScheme}.png`,
        animations: "disabled",
        clip: { x: box.x, y: box.y, width: box.width, height: box.height + readoutHang },
      });
    });
  });
}
