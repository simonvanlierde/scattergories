import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("plays with categories folded and reopens the saved board @smoke", async ({ app, page }) => {
  await page.clock.install();
  await app.setTimer("10", "0");
  const originalDeck = await page.evaluate(
    () => JSON.parse(localStorage.getItem("scattergories.settings.v1") ?? "{}").deckBuiltins,
  );
  await app.collapseCategories();
  await page.reload();
  await expect(app.promptToggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("group", { name: "Play style" })).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Selected categories" })).toHaveCount(0);
  await app.startRound();
  await page.clock.runFor(2000);
  await app.expectRunning();
  await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
  const remaining = await app.roundClock.textContent();
  const letter = await app.currentLetter.textContent();
  await page.keyboard.press("c");
  await expect(page.locator(".category-checklist__chip")).toHaveCount(12);
  await expect(app.roundClock).toHaveText(remaining ?? "");
  const board = await page.locator(".category-checklist__label").allTextContents();
  await expect(app.currentLetter).toHaveText(letter ?? "");
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  for (const input of ["chevron", "keyboard"] as const) {
    if (input === "chevron") {
      await app.collapseCategories();
      await app.promptToggle.click();
    } else {
      await page.keyboard.press("c");
      await page.keyboard.press("c");
    }
    await expect(page.locator(".category-checklist__label")).toHaveText(board);
    await expect(app.roundClock).toHaveText(remaining ?? "");
    await expect(app.currentLetter).toHaveText(letter ?? "");
  }
  await app.collapseCategories();
  await page.clock.runFor(5000);
  await expect(app.roundClock).toHaveClass(/timer-ring--critical/);
  expect(
    await app.roundClock.locator(".timer-ring__readout").evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(app.roundClock).toHaveText("Paused");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(11000);
  await expect(app.roundClock).toHaveText("Time's up!");
  await page.keyboard.press("c");
  await expect(page.locator(".category-checklist__chip")).toHaveCount(12);
  const savedDeck = await page.evaluate(
    () => JSON.parse(localStorage.getItem("scattergories.settings.v1") ?? "{}").deckBuiltins,
  );
  expect(savedDeck).toEqual(originalDeck);
});

for (const viewport of [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
]) {
  test.describe(`folded categories ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    test("keeps the letter, timer and controls in view", async ({ app, page }) => {
      await app.collapseCategories();
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

test("keeps the folded board accessible in both themes", async ({ app, page }) => {
  await app.collapseCategories();
  for (const theme of ["Light", "Dark"] as const) {
    await app.switchTheme(theme);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});
