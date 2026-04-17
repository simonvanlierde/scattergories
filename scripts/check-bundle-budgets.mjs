// biome-ignore-all lint/correctness/noNodejsModules: this Node script intentionally uses built-in modules.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const DIST_ASSETS_DIR = fileURLToPath(new URL('../dist/assets/', import.meta.url));
const BUNDLE_BUDGET_KIB = 80;
const BYTES_PER_KIB = 1024;
const MAX_ASSET_BYTES = BUNDLE_BUDGET_KIB * BYTES_PER_KIB;
const IMAGE_ASSET_PATTERN = /\.(png|webp|avif)$/u;

const isMainEntryChunk = (name) => name.startsWith('index-') && name.endsWith('.js');
const isImageAsset = (name) => IMAGE_ASSET_PATTERN.test(name);

const assetNames = readdirSync(DIST_ASSETS_DIR);
const mainEntry = assetNames.find(isMainEntryChunk);
const imageAssets = assetNames.filter(isImageAsset);

if (!mainEntry) {
  throw new Error('Could not find the main entry chunk in dist/assets.');
}

const mainEntryGzipBytes = gzipSync(readFileSync(join(DIST_ASSETS_DIR, mainEntry))).length;

if (mainEntryGzipBytes > MAX_ASSET_BYTES) {
  throw new Error(
    `Main entry gzip budget exceeded: ${mainEntryGzipBytes} bytes > ${MAX_ASSET_BYTES} bytes.`,
  );
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
  `Bundle budgets passed. Main entry gzip: ${mainEntryGzipBytes} bytes. Checked ${imageAssets.length} image assets.\n`,
);
