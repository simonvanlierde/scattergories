import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("plays a complete simple round and preserves the saved category board @smoke", async ({ app, page }) => {
  await page.clock.install();
  await app.setTimer("10", "0");
  const board = page.getByRole("radio", { name: "Category board" });
  const simple = page.getByRole("radio", { name: "Letter + timer" });
  const originalDeck = await page.evaluate(
    () => JSON.parse(localStorage.getItem("scattergories.settings.v1") ?? "{}").deckBuiltins,
  );
  await simple.check();
  await expect(page.getByRole("region", { name: "Categories" })).toHaveCount(0);
  await page.keyboard.press("c");
  await page.reload();
  await expect(simple).toBeChecked();
  await app.startRound();
  await expect(board).toBeDisabled();
  await page.clock.runFor(2000);
  await app.expectRunning();
  await page.clock.runFor(5000);
  await expect(app.roundClock).toHaveClass(/timer-ring--critical/);
  expect(
    await app.roundClock.locator(".timer-ring__readout").evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(board).toBeDisabled();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(11000);
  await expect(app.roundClock).toHaveText("Time's up!");
  await expect(board).toBeEnabled();
  await board.check();
  await expect(page.locator(".category-checklist__chip")).toHaveCount(12);
  const savedDeck = await page.evaluate(
    () => JSON.parse(localStorage.getItem("scattergories.settings.v1") ?? "{}").deckBuiltins,
  );
  expect(savedDeck).toEqual(originalDeck);
});

for (const [initial, next] of [
  ["Category board", "Letter + timer"],
  ["Letter + timer", "Category board"],
] as const) {
  test(`holds active ${initial} when another tab selects ${next}`, async ({ app, page }) => {
    await page.clock.install();
    await app.setTimer("10", "0");
    await page.getByRole("radio", { name: initial }).check();
    await app.startRound();
    await page.clock.runFor(2000);
    await app.expectRunning();
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    const other = await page.context().newPage();
    await other.goto("/");
    await other.getByRole("radio", { name: next }).check();
    const expected = next === "Category board" ? "board" : "simple";
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("scattergories.settings.v1") ?? "{}").playStyle))
      .toBe(expected);
    await expect(page.getByRole("radio", { name: initial })).toBeChecked();
    await expect(page.getByRole("region", { name: "Categories" })).toHaveCount(initial === "Category board" ? 1 : 0);
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await expect(page.getByRole("radio", { name: initial })).toBeChecked();
    await page.clock.runFor(11000);
    await expect(page.getByRole("radio", { name: next })).toBeChecked();
    await other.close();
  });
}

for (const viewport of [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
]) {
  test.describe(`simple mode ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    test("keeps the letter, timer and controls in view", async ({ app: _app, page }) => {
      await page.getByRole("radio", { name: "Letter + timer" }).check();
      await page.evaluate(() => document.fonts.ready);
      const fit = await page.locator(".play-grid").evaluate((grid) => ({
        horizontalOverflow: grid.scrollWidth - grid.clientWidth,
        verticalOverflow: grid.scrollHeight - grid.clientHeight,
      }));
      expect(fit.horizontalOverflow).toBeLessThanOrEqual(1);
      expect(fit.verticalOverflow).toBeLessThanOrEqual(1);
      await expect(page.getByRole("button", { name: "Roll a letter" })).toBeInViewport();
    });
  });
}

test("supports keyboard mode selection and both themes without accessibility violations", async ({ app, page }) => {
  await page.getByRole("radio", { name: "Category board" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Letter + timer" })).toBeChecked();
  for (const theme of ["Light", "Dark"] as const) {
    await app.switchTheme(theme);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});
