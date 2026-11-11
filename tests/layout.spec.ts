import { expect, type Locator, type Page } from "@playwright/test";
import { test } from "./fixtures";

interface Layout {
  glyphPx: number;
  playmatBottom: number;
  categoriesTop: number;
  horizontalOverflow: number;
  listFits: boolean;
}

function measureLayout(page: Page): Promise<Layout> {
  return page.evaluate(() => {
    const box = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) {
        throw new Error(`missing ${selector}`);
      }
      return el.getBoundingClientRect();
    };
    const drawn = document.querySelector(".drawn-categories");
    const glyph = document.querySelector(".letter-hero__glyph");
    return {
      glyphPx: glyph ? Number.parseFloat(getComputedStyle(glyph).fontSize) : 0,
      playmatBottom: box(".playmat").bottom,
      categoriesTop: box(".categories-card").top,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      listFits: drawn ? drawn.scrollHeight <= drawn.clientHeight : false,
    };
  });
}

// Phone portrait sizes, small to large, plus a portrait tablet. The letter takes
// the height the categories leave free, so it must grow where there is room,
// stay put between idle and running, and never push anything off screen.
const viewports = [
  // Two narrow columns keep the 360px list short; the ring never drops below
  // min(36vw, 9rem), and the letter is half the ring.
  { width: 360, height: 740, minGlyphPx: 64 },
  { width: 390, height: 844, minGlyphPx: 96 },
  { width: 820, height: 1180, minGlyphPx: 160 },
];

for (const { width, height, minGlyphPx } of viewports) {
  test.describe(`${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test("sizes the letter from the free height without overflow", async ({ app, page }) => {
      await app.toggleMute();
      const idle = await measureLayout(page);
      await app.startRound();
      await app.expectRunning();
      const running = await measureLayout(page);

      expect(running.glyphPx).toBeGreaterThanOrEqual(minGlyphPx);
      expect(running.glyphPx).toBe(idle.glyphPx);
      expect(running.horizontalOverflow).toBe(0);
      expect(running.playmatBottom).toBeLessThanOrEqual(running.categoriesTop);
      // Twelve fit from 390px up; at 360px a board of long, wrapped names may scroll.
      if (width >= 390) {
        expect(running.listFits).toBe(true);
      }
    });
  });
}

// A phone on its side: the ring sits beside the controls, so the whole playmat
// fits on screen and the play grid has nothing to scroll.
test.describe("844x390 landscape", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("fits the ring and controls without scrolling", async ({ app, page }) => {
    await app.toggleMute();
    await app.startRound();
    await app.expectRunning();
    const fit = await page.evaluate(() => {
      const grid = document.querySelector(".play-grid") as HTMLElement;
      const hero = (document.querySelector(".playmat__hero") as HTMLElement).getBoundingClientRect();
      return {
        gridScrolls: grid.scrollHeight > grid.clientHeight,
        heroTop: hero.top,
        heroBottom: hero.bottom,
        gridBottom: grid.getBoundingClientRect().bottom,
      };
    });
    expect(fit.gridScrolls).toBe(false);
    expect(fit.heroTop).toBeGreaterThanOrEqual(0);
    expect(fit.heroBottom).toBeLessThanOrEqual(fit.gridBottom);
  });
});

// Controls shorter than the 44px touch-target floor, by name and height.
function shortControls(dialog: Locator) {
  return dialog.evaluate((root) =>
    [...root.querySelectorAll("button, select, input:not([type=checkbox]):not([type=radio])")]
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => ({
        name: el.getAttribute("aria-label") || el.textContent?.trim() || el.id,
        height: Math.round(el.getBoundingClientRect().height),
      }))
      .filter(({ height }) => height < 44),
  );
}

test.describe("touch targets", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("keeps every control in the settings and deck sheets at least 44px tall", async ({ app, page }) => {
    await app.openSettings();
    expect(await shortControls(app.settingsSheet)).toEqual([]);
    await app.closeSettings();

    const deck = page.getByRole("dialog", { name: "Customize deck" });
    await page.getByRole("button", { name: "Customize deck" }).click();
    await expect(deck.locator(".deck-bulk-action").first()).toBeVisible();
    // The sheet scales in from 0.96, so measure after it settles.
    await deck.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    expect(await shortControls(deck)).toEqual([]);
  });
});

for (const viewport of [
  { width: 1024, height: 768 },
  { width: 1133, height: 744 },
]) {
  test.describe(`${viewport.width}x${viewport.height} tablet landscape`, () => {
    test.use({ viewport });

    test("shows all twelve categories without scrolling", async ({ app: _app, page }) => {
      await page.evaluate(() => document.fonts.ready);
      const layout = await measureLayout(page);
      expect(layout.horizontalOverflow).toBe(0);
      expect(layout.listFits).toBe(true);
      await expect(page.locator(".category-checklist__chip")).toHaveCount(12);
    });
  });
}

test("names the secondary round actions visibly", async ({ app: _app, page }) => {
  const controls = page.getByRole("group", { name: "Round controls" });
  await expect(controls.getByRole("button", { name: "New letter", exact: true })).toHaveText("New letter");
  await expect(controls.getByRole("button", { name: "Next round", exact: true })).toHaveText("Next round");
});

for (const locale of ["de", "el", "fr"]) {
  test.describe(`320px ${locale} controls`, () => {
    test.use({ viewport: { width: 320, height: 640 } });

    test("keeps round controls and deck actions inside their panels", async ({ app: _app, page }) => {
      await page.evaluate((language) => localStorage.setItem("scattergories.language", language), locale);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await page.evaluate(() => document.fonts.ready);
      const overflow = (root: Locator) =>
        root.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return [...element.querySelectorAll("button")]
            .filter((button) => {
              const rect = button.getBoundingClientRect();
              return (
                rect.width > 0 &&
                (rect.left < bounds.left - 1 ||
                  rect.right > bounds.right + 1 ||
                  button.scrollWidth > button.clientWidth + 1)
              );
            })
            .map((button) => button.textContent?.trim());
        });
      expect(await overflow(page.locator(".action-bar"))).toEqual([]);
      await page.locator(".categories-card__header-actions > button").last().click();
      const body = page.getByRole("dialog").locator(".ds-sheet__body");
      await expect(body).toBeVisible();
      await body.evaluate((element) =>
        Promise.all(
          element
            .closest("dialog")
            ?.getAnimations()
            .map((animation) => animation.finished) ?? [],
        ),
      );
      expect(await body.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      expect(await overflow(body)).toEqual([]);
    });
  });
}

test.describe("wrapped sheet heading", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("can scroll the final deck action fully into view", async ({ app: _app, page }) => {
    await page.getByRole("button", { name: "Customize deck", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Customize deck" });
    await dialog.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
    const bottom = await dialog.evaluate((element) => {
      const body = element.querySelector(".ds-sheet__body") as HTMLElement;
      body.scrollTop = body.scrollHeight;
      const action = body.querySelector(".deck-bulk-action:last-child") as HTMLElement;
      return { action: action.getBoundingClientRect().bottom, dialog: element.getBoundingClientRect().bottom };
    });
    expect(bottom.action).toBeLessThanOrEqual(bottom.dialog);
  });
});
