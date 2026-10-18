import { expect, type Locator } from "@playwright/test";
import { test } from "./fixtures";

// The rest of the suite seeds the "already onboarded" flag to land on the board; this
// suite opts out to exercise the first run that every other test skips past. On first
// run the rules dialog doubles as the welcome, so it carries a "Roll a letter" CTA.
test.use({ onboarded: false });

test("@smoke shows the rules on first run and starts a round from them", async ({ app, page }) => {
  const welcome = page.getByRole("dialog", { name: /How to play/i });
  await expect(welcome).toBeVisible();

  await welcome.getByRole("button", { name: "Roll a letter" }).click();

  await expect(welcome).toBeHidden();
  await app.expectRunning();
});

// The part of `el` that the sheet shows, so clipped or scrolled-off content reads as hidden.
function visibleIn(dialog: Locator, selector: string) {
  return dialog.evaluate((root, sel) => {
    const el = root.querySelector(sel);
    if (!el) {
      throw new Error(`missing ${sel}`);
    }
    const box = el.getBoundingClientRect();
    const frame = root.getBoundingClientRect();
    return box.top >= frame.top && box.bottom <= frame.bottom;
  }, selector);
}

test.describe("on a small phone", () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test("shows the start button without scrolling the rules", async ({ app: _app, page }) => {
    const welcome = page.getByRole("dialog", { name: /How to play/i });
    await expect(welcome).toBeVisible();
    await welcome.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));

    expect(await visibleIn(welcome, ".howto__lead")).toBe(true);
    expect(await visibleIn(welcome, ".howto__start")).toBe(true);
  });
});

test.describe("on a tablet", () => {
  test.use({ viewport: { width: 820, height: 1180 } });

  test("scrolls the open rules to their last line", async ({ app: _app, page }) => {
    const welcome = page.getByRole("dialog", { name: /How to play/i });
    await expect(welcome).toBeVisible();
    for (const summary of await welcome.locator("summary").all()) {
      await summary.click();
    }
    await welcome.locator(".ds-sheet__body").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    expect(await visibleIn(welcome, ".modal-version")).toBe(true);
  });
});

test("@smoke does not show the first-run rules again once dismissed", async ({ app, page }) => {
  const welcome = page.getByRole("dialog", { name: /How to play/i });
  await expect(welcome).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(welcome).toBeHidden();

  // Dismissal is persisted, so a returning player lands straight on the board.
  await page.reload();
  await app.waitUntilReady();
  await expect(welcome).toBeHidden();
});
