import { expect, type Page } from "@playwright/test";
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
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      listFits: drawn ? drawn.scrollHeight <= drawn.clientHeight : false,
    };
  });
}

// Phone portrait sizes, small to large, plus a portrait tablet. The letter takes
// the height the categories leave free, so it must grow where there is room,
// stay put between idle and running, and never push anything off screen.
const viewports = [
  { width: 360, height: 740, minGlyphPx: 48 },
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
      // Two columns of twelve fit from 390px up; the 360px single column scrolls.
      if (width >= 390) {
        expect(running.listFits).toBe(true);
      }
    });
  });
}
