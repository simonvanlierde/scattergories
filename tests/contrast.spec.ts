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
