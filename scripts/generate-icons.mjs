// biome-ignore-all lint/correctness/noNodejsModules: this Node script intentionally uses built-in modules.
// Regenerates every icon in public/ from assets/brand/mark.svg.
// Renders with the Chromium that Playwright already installs — no image dependency.
//
//   pnpm icons

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const FIELD = "oklch(34% 0.11 260)"; // --accent-primary (ink navy)
const ROOT = new URL("..", import.meta.url);

/** Icon field + mark, scaled so the mark occupies `scale` of a `size`-wide canvas. */
function compose(art, { scale, radius, size = 24 }) {
  const inset = ((24 * (1 - scale)) / 2).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" role="img">
  <title>Scattergories</title>
  <rect width="24" height="24" rx="${radius}" fill="${FIELD}" />
  <g transform="translate(${inset} ${inset}) scale(${scale})">${art}</g>
</svg>`;
}

const OUTPUTS = [
  // Maskable art needs the mark inside the 80% safe zone; the square field
  // survives whatever shape the launcher masks it into.
  { file: "icons/icon-512-maskable.png", size: 512, scale: 0.6, radius: 0 },
  { file: "icons/icon-512.png", size: 512, scale: 0.78, radius: 5 },
  { file: "icons/icon-192.png", size: 192, scale: 0.78, radius: 5 },
  // iOS masks the corners itself, so ship it square.
  { file: "icons/apple-touch-icon.png", size: 180, scale: 0.78, radius: 0 },
  { file: "icons/favicon-32.png", size: 32, scale: 0.86, radius: 4 },
];

const source = await readFile(new URL("assets/brand/mark.svg", ROOT), "utf8");
const mark = source.slice(
  source.indexOf(">", source.indexOf("<svg")) + 1,
  source.lastIndexOf("</svg>"),
);

/** The side-face glyphs only survive at icon sizes where they stay legible. */
const GLYPH_FLOOR = 64;
const plain = mark.slice(0, mark.indexOf('<g id="glyphs"'));

await writeFile(
  new URL("public/favicon.svg", ROOT),
  `${compose(plain, { scale: 0.86, radius: 4 })}\n`,
);

const browser = await chromium.launch();
for (const { file, size, scale, radius } of OUTPUTS) {
  const art = size >= GLYPH_FLOOR ? mark : plain;
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0">${compose(art, { scale, radius, size })}</body>`);
  const target = fileURLToPath(new URL(`public/${file}`, ROOT));
  await mkdir(dirname(target), { recursive: true });
  await page.screenshot({ path: target, omitBackground: true });
  await page.close();
  process.stdout.write(`wrote public/${file}\n`);
}
await browser.close();
process.stdout.write("wrote public/favicon.svg\n");
