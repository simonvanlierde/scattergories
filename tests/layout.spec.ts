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
