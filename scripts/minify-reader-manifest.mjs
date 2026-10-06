import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestPath = resolve('dist/reader-sources/manifest.v1.json');
const maxAssetBytes = 25 * 1024 * 1024;

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (error) {
  throw new Error(`Cloudflare reader manifest is missing or invalid: ${error.message}`);
}

if (manifest?.schemaVersion !== 1 || !manifest.sources || !manifest.articles) {
  throw new Error('Cloudflare reader manifest has an unsupported schema.');
}

writeFileSync(manifestPath, JSON.stringify(manifest));
const assetBytes = statSync(manifestPath).size;
if (assetBytes > maxAssetBytes) {
  throw new Error(`Reader manifest is ${(assetBytes / 1024 / 1024).toFixed(2)} MiB; Cloudflare Pages allows at most 25 MiB per asset.`);
}

console.log(`Reader manifest compacted for Cloudflare Pages: ${(assetBytes / 1024 / 1024).toFixed(2)} MiB.`);
