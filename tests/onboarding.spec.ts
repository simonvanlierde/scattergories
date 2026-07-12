import { expect } from "@playwright/test";
import { test } from "./fixtures";

// The rest of the suite seeds the "already onboarded" flag to land on the board; this
// suite opts out to exercise the first-run welcome that every other test skips past.
test.use({ onboarded: false });

test("@smoke shows the welcome overlay on first run and starts a round from it", async ({
  app,
  page,
}) => {
  const welcome = page.locator("dialog.welcome");
  await expect(welcome).toBeVisible();

  await welcome.getByRole("button", { name: "Roll a letter" }).click();

  await expect(welcome).toBeHidden();
  await app.expectRunning();
});

test("@smoke does not show the welcome overlay again once dismissed", async ({ app, page }) => {
  const welcome = page.locator("dialog.welcome");
  await expect(welcome).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(welcome).toBeHidden();

  // Dismissal is persisted, so a returning player lands straight on the board.
  await page.reload();
  await app.waitUntilReady();
  await expect(welcome).toBeHidden();
});
