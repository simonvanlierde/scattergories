import { expect } from "@playwright/test";
import { APP_MIN_TIMER_SECONDS, ROUND_MESSAGE_TIMEOUT_MS, ROUND_OVER } from "../src/test/constants";
import { test } from "./fixtures";

// This test waits out a real round, so its floor is wall-clock: the 10s minimum round
// (durationMin) plus the letter roll. Skipping the get-ready buffer trims 3s; the rest
// is the app's own minimum and can't be compressed. Deadline, not a target — keep slack.
const SINGLE_ROUND_TIMEOUT_MS = 25_000;
const NO_GET_READY_BUFFER = "0";

test("runs a full single-round game to completion", async ({ app, page }) => {
  test.setTimeout(SINGLE_ROUND_TIMEOUT_MS);

  await app.setTimer(APP_MIN_TIMER_SECONDS, NO_GET_READY_BUFFER);
  await app.toggleMute();
  await app.startRound();

  await expect(app.roundStatus).toHaveText(ROUND_OVER, { timeout: ROUND_MESSAGE_TIMEOUT_MS });
  // The done phase keeps the hero showing the played letter; the primary button advances.
  await expect(app.currentLetter).toBeVisible();
  // Scope to the primary CTA; the secondary "Next round" icon button shares the name.
  const nextRound = page.getByRole("button", { name: "Next round" }).and(page.locator(".action-bar__primary"));
  await expect(nextRound).toBeVisible();
  // The board stays up for checking answers, and the table can see which round it was.
  await expect(page.getByRole("list", { name: "Selected categories" })).toBeVisible();
  await expect(page.getByText("Round 1", { exact: true })).toBeVisible();

  await nextRound.click();
  await expect(page.getByText("Round 2", { exact: true })).toBeVisible();
});
