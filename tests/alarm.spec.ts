import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures";

// The round's end sets `.alarm` on the shell for the whole alarm window
// (ALARM_DURATION_MS); the brick wash must be a single brief flash inside it.
// Setting the class directly tests the CSS without waiting out a round.
// Returns the wash's animations at the moment the class lands, its opacity then, and its
// opacity once they have all finished.
function ringAlarm(page: Page) {
  return page.evaluate(async () => {
    const shell = document.querySelector(".app-shell") as Element;
    const opacity = () => Number(getComputedStyle(shell, "::after").opacity);
    shell.classList.add("alarm");
    const animations = document.getAnimations().filter((a) => (a.effect as KeyframeEffect).target === shell);
    const flashes = animations.length;
    const during = opacity();
    await Promise.all(animations.map((a) => a.finished));
    return { flashes, during, after: opacity() };
  });
}

test("the alarm wash flashes once and clears", async ({ app: _app, page }) => {
  const wash = await ringAlarm(page);
  expect(wash.flashes).toBe(1);
  expect(wash.after).toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the alarm wash shows a brief still cue, then clears", async ({ app: _app, page }) => {
    const wash = await ringAlarm(page);
    expect(wash.flashes).toBe(1);
    expect(wash.during).toBeGreaterThan(0);
    expect(wash.after).toBe(0);
  });
});
