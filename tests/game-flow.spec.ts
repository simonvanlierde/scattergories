import { expect } from "@playwright/test";
import { APP_MIN_TIMER_SECONDS, ROUND_OVER } from "../src/test/constants";
import { test } from "./fixtures";

const NO_GET_READY_BUFFER = "0";
const ROLL_MS = 3000;

test("runs a full single-round game to completion", async ({ app, page }) => {
  await page.clock.install();
  await app.setTimer(APP_MIN_TIMER_SECONDS, NO_GET_READY_BUFFER);
  await app.toggleMute();
  await app.startRound();
  await page.clock.runFor(ROLL_MS);
  await app.expectRunning();
  await page.clock.runFor(Number(APP_MIN_TIMER_SECONDS) * 1000 + 1000);

  await expect(app.roundStatus).toHaveText(ROUND_OVER);
  // The done phase keeps the hero showing the played letter; the primary button advances.
  await expect(app.currentLetter).toBeVisible();
  const nextRound = page.getByRole("button", { name: "Next round" });
  await expect(nextRound).toBeVisible();
  // The board stays up for checking answers, and the table can see which round it was.
  await expect(page.getByRole("list", { name: "Selected categories" })).toBeVisible();
  await expect(page.getByText("Round 1", { exact: true })).toBeVisible();

  await nextRound.click();
  await expect(page.getByText("Round 2", { exact: true })).toBeVisible();
});
