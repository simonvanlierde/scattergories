// biome-ignore-all lint/correctness/noNodejsModules: this Node script intentionally uses built-in modules.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const DIST_ASSETS_DIR = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const BUNDLE_BUDGET_KIB = 80;
const BYTES_PER_KIB = 1024;
const MAX_ASSET_BYTES = BUNDLE_BUDGET_KIB * BYTES_PER_KIB;
const IMAGE_ASSET_PATTERN = /\.(png|webp|avif)$/u;

// Always-loaded chunks (referenced from index.html directly), budgeted individually with
// ~15% headroom over their measured gzip size at the time this budget was set.
const ALWAYS_LOADED_CHUNK_BUDGETS_KIB = [
  { pattern: /^react-.*\.js$/u, label: "react vendor chunk", budgetKib: 64 },
  { pattern: /^i18n-.*\.js$/u, label: "i18n vendor chunk", budgetKib: 24 },
];

const isMainEntryChunk = (name) => name.startsWith("index-") && name.endsWith(".js");
const isImageAsset = (name) => IMAGE_ASSET_PATTERN.test(name);

const assetNames = readdirSync(DIST_ASSETS_DIR);
const mainEntry = assetNames.find(isMainEntryChunk);
const imageAssets = assetNames.filter(isImageAsset);

if (!mainEntry) {
  throw new Error("Could not find the main entry chunk in dist/assets.");
}

const mainEntryGzipBytes = gzipSync(readFileSync(join(DIST_ASSETS_DIR, mainEntry))).length;

if (mainEntryGzipBytes > MAX_ASSET_BYTES) {
  throw new Error(
    `Main entry gzip budget exceeded: ${mainEntryGzipBytes} bytes > ${MAX_ASSET_BYTES} bytes.`,
  );
}

for (const { pattern, label, budgetKib } of ALWAYS_LOADED_CHUNK_BUDGETS_KIB) {
  const asset = assetNames.find((name) => pattern.test(name));
  if (!asset) {
    throw new Error(`Could not find the ${label} in dist/assets.`);
  }

  const maxBytes = budgetKib * BYTES_PER_KIB;
  const gzipBytes = gzipSync(readFileSync(join(DIST_ASSETS_DIR, asset))).length;

  if (gzipBytes > maxBytes) {
    throw new Error(`${label} gzip budget exceeded: ${gzipBytes} bytes > ${maxBytes} bytes.`);
  }
}

for (const asset of imageAssets) {
  const size = statSync(join(DIST_ASSETS_DIR, asset)).size;

  if (size > MAX_ASSET_BYTES) {
    throw new Error(
      `Image budget exceeded for ${asset}: ${size} bytes > ${MAX_ASSET_BYTES} bytes.`,
    );
  }
}

process.stdout.write(
  `Bundle budgets passed. Main entry gzip: ${mainEntryGzipBytes} bytes. Checked ${ALWAYS_LOADED_CHUNK_BUDGETS_KIB.length} always-loaded chunks and ${imageAssets.length} image assets.\n`,
);
