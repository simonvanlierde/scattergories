import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures";

// The round's end sets `.alarm` on the shell for the whole alarm window
// (ALARM_DURATION_MS); the brick wash must be a single brief flash inside it.
// Setting the class directly tests the CSS without waiting out a round.
function ringAlarm(page: Page) {
  return page.evaluate(() => document.querySelector(".app-shell")?.classList.add("alarm"));
}

function washOpacity(page: Page) {
  return page.evaluate(() => {
    const shell = document.querySelector(".app-shell") as Element;
    return Number(getComputedStyle(shell, "::after").opacity);
  });
}

test("the alarm wash flashes once and clears", async ({ app: _app, page }) => {
  await ringAlarm(page);
  await page.waitForTimeout(900);
  expect(await washOpacity(page)).toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the alarm wash shows a brief still cue, then clears", async ({ app: _app, page }) => {
    await ringAlarm(page);
    expect(await washOpacity(page)).toBeGreaterThan(0);
    await page.waitForTimeout(900);
    expect(await washOpacity(page)).toBe(0);
  });
});
