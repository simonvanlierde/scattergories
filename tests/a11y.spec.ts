import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { APP_MIN_TIMER_SECONDS, ROUND_MESSAGE_TIMEOUT_MS, ROUND_OVER } from "../src/test/constants";
import { test } from "./fixtures";

const MINUTE_TO_MS = 60_000;
test.setTimeout(MINUTE_TO_MS);

test("@smoke has no detectable accessibility violations on the idle screen", async ({ app, page }) => {
  await expect(app.readyHeading).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("@smoke has no detectable accessibility violations during an active round", async ({ app, page }) => {
  await app.toggleMute();
  await app.startRound();
  await app.expectRunning();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has no detectable accessibility violations when time is up", async ({ app, page }) => {
  await app.setTimer(APP_MIN_TIMER_SECONDS, "0");
  await app.toggleMute();
  await app.startRound();
  await expect(app.roundStatus).toHaveText(ROUND_OVER, { timeout: ROUND_MESSAGE_TIMEOUT_MS });
  // "Time's up" fades in as it stamps down; let it land before axe samples contrast.
  await app.roundClock.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("@smoke has no detectable accessibility violations with the prompt deck collapsed", async ({ app, page }) => {
  await app.collapseCategories();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("@smoke has no detectable accessibility violations with the settings sheet open", async ({ app, page }) => {
  await app.openSettings();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("@smoke has no detectable accessibility violations with the how-to-play modal open", async ({ app, page }) => {
  await app.openHelp();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("@smoke has no detectable accessibility violations with the letter odds open", async ({ app, page }) => {
  await app.openHelp();
  const help = page.getByRole("dialog", { name: /How to play/i });
  await help.locator("summary", { hasText: "Letter odds" }).click();

  const odds = help.getByRole("table", { name: "Letter odds" });
  await expect(odds).toBeVisible();
  await expect(odds.getByRole("rowheader")).toHaveCount(26);

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("@smoke syncs the document language to the selected locale", async ({ app, page }) => {
  await app.switchLanguage("es");

  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});
