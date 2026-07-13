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

/** Wraps a PNG in a single-image ICO container — the format allows a raw PNG payload per entry. */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0); // width (0 means 256, unused at our sizes)
  entry.writeUInt8(size, 1); // height
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // image data size
  entry.writeUInt32LE(header.length + entry.length, 12); // offset to image data

  return Buffer.concat([header, entry, png]);
}

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

// Legacy fallback: some browsers/bots/scanners request /favicon.ico directly,
// ignoring <link rel="icon">. Reuse the 32px PNG already generated above.
const favicon32 = await readFile(fileURLToPath(new URL("public/icons/favicon-32.png", ROOT)));
await writeFile(new URL("public/favicon.ico", ROOT), pngToIco(favicon32, 32));
process.stdout.write("wrote public/favicon.ico\n");
