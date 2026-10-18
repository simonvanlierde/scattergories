import { expect } from "@playwright/test";
import { test } from "./fixtures";

// Relative luminance + WCAG contrast from a computed `rgb()`/`oklch()` color string,
// resolved to rgb by the browser before it reaches us.
function relLuminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.039_28 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: number[], bg: number[]): number {
  const a = relLuminance(fg);
  const b = relLuminance(bg);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

test("@smoke categories heading meets AA contrast in dark mode", async ({ app, page }) => {
  await app.waitUntilReady();
  await app.switchTheme("Dark");

  const { fg, bg } = await page.evaluate(() => {
    const h2 = document.querySelector("#categories-panel-title") as HTMLElement;
    const card = h2.closest(".categories-card") as HTMLElement;
    // Use a canvas to resolve any color format (oklch, hsl, etc.) to rgb 0-255 components.
    const toRgb = (color: string): number[] => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    };
    return {
      fg: toRgb(getComputedStyle(h2).color),
      bg: toRgb(getComputedStyle(card).backgroundColor),
    };
  });

  expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
});

for (const theme of ["Light", "Dark"] as const) {
  test(`unpinned pin icon meets 3:1 non-text contrast in ${theme.toLowerCase()} mode`, async ({
    app,
    page,
  }) => {
    await app.waitUntilReady();
    await app.switchTheme(theme);

    const { fg, bg } = await page.evaluate(() => {
      const icon = document.querySelector(
        ".category-checklist__item:not(.category-checklist__item--pinned) .category-checklist__pin",
      ) as Element;
      const toRgb = (color: string): number[] => {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return [r, g, b];
      };
      // The chip is transparent: the colour behind the icon is the nearest painted ancestor.
      let backdrop: Element | null = icon;
      while (backdrop && getComputedStyle(backdrop).backgroundColor === "rgba(0, 0, 0, 0)") {
        backdrop = backdrop.parentElement;
      }
      return {
        fg: toRgb(getComputedStyle(icon).color),
        bg: toRgb(getComputedStyle(backdrop ?? document.body).backgroundColor),
      };
    });

    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
}

for (const theme of ["Light", "Dark"] as const) {
  test(`category numerals keep AA contrast during a round in ${theme.toLowerCase()} mode`, async ({
    app,
    page,
  }) => {
    await app.waitUntilReady();
    await app.switchTheme(theme);
    await app.toggleMute();
    await app.startRound();
    await app.expectRunning();

    const { fg, bg, opacity } = await page.evaluate(() => {
      const mark = document.querySelector(".category-checklist__mark") as Element;
      const chip = mark.closest(".category-checklist__chip") as Element;
      const toRgb = (color: string): number[] => {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return [r, g, b];
      };
      return {
        fg: toRgb(getComputedStyle(mark).color),
        bg: toRgb(
          getComputedStyle(document.querySelector(".app-shell") as Element).backgroundColor,
        ),
        // The chips are disabled mid-round; a faded chip would fade its numeral too.
        opacity: Number(getComputedStyle(chip).opacity),
      };
    });

    expect(opacity).toBe(1);
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
}
