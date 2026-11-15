import { expect } from "@playwright/test";
import { CUSTOM_CATEGORY } from "../src/test/constants";
import { test } from "./fixtures";

// spell-checker: ignore Sortear, Letra

const SECONDARY_NEXT_ROUND = { name: "Next round" } as const;

test("pausing freezes the clock and resuming runs the round out", async ({ app, page }) => {
  await page.clock.install();
  await app.setTimer("10", "0");
  await app.toggleMute();
  await app.startRound();
  await page.clock.runFor(2000);
  await app.expectRunning();

  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(app.roundClock).toHaveText("Paused");
  await page.clock.runFor(30_000);
  // Still paused: a pause that leaked a timer would have ended the round by now.
  await expect(app.roundClock).toHaveText("Paused");
  await expect(app.roundStatus).not.toHaveText(/round over/i);

  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(app.roundClock).not.toHaveText("Paused");
  await page.clock.runFor(11_000);
  await expect(app.roundClock).toHaveText("Time's up!");
});

test("skipping a live round asks for a second tap, a paused one does not", async ({ app, page }) => {
  await page.clock.install();
  await app.setTimer("10", "0");
  await app.toggleMute();
  await app.startRound();
  await page.clock.runFor(2000);
  await app.expectRunning();
  await expect(page.getByText("Round 1", { exact: true })).toBeVisible();

  const skip = page.getByRole("button", SECONDARY_NEXT_ROUND);
  await skip.click();
  await expect(page.getByText("Tap again to skip this round")).toBeVisible();
  await expect(page.getByText("Round 1", { exact: true })).toBeVisible();
  await skip.click();
  await expect(page.getByText("Round 2", { exact: true })).toBeVisible();

  await page.clock.runFor(5000);
  await app.expectRunning();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await skip.click();
  await expect(page.getByText("Round 3", { exact: true })).toBeVisible();
});

test("a custom category survives a reload", async ({ app, page }) => {
  await page.getByRole("button", { name: "Customize deck" }).click();
  const deck = page.getByRole("dialog", { name: "Customize deck" });
  await deck.getByRole("textbox", { name: "Add custom category" }).fill(CUSTOM_CATEGORY);
  await deck.getByRole("button", { name: "Add", exact: true }).click();
  const deckList = deck.getByRole("list", { name: "Category deck" });
  await expect(deckList.getByText(CUSTOM_CATEGORY)).toBeVisible();

  await page.reload();
  await app.waitUntilReady();
  await page.getByRole("button", { name: "Customize deck" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Customize deck" })
      .getByRole("list", { name: "Category deck" })
      .getByText(CUSTOM_CATEGORY),
  ).toBeVisible();
});

test("switching language mid-roll does not leave the game spinning", async ({ app, page }) => {
  await page.clock.install();
  await app.setTimer("10", "0");
  await app.toggleMute();
  // Freeze time before the roll so the language switch lands while it is spinning,
  // however slow the runner is.
  await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 100));
  await app.startRound();
  await expect(page.getByRole("button", { name: "Spinning…" })).toBeVisible();

  await app.switchLanguage("es");
  await page.clock.runFor(15_000);

  await expect(page.getByRole("button", { name: "Spinning…" })).toHaveCount(0);
  await expect(app.currentLetter).toBeVisible();
  await expect(app.roundClock).not.toHaveText("");
});
