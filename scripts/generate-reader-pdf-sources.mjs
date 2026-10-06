import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestPath = resolve('public/reader-sources/manifest.v1.json');
const outputPath = resolve('server/reader-pdf-sources.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

if (manifest?.schemaVersion !== 1 || !manifest.sources || typeof manifest.sources !== 'object') {
  throw new Error('Reader manifest is missing or has an unsupported schema.');
}

const sources = Object.fromEntries(
  Object.entries(manifest.sources)
    .filter(([, source]) => source.transport === 'remote-pdf')
    .map(([id, source]) => [id, {
      transport: source.transport,
      originalUrl: source.originalUrl,
      sha256: source.sha256,
    }]),
);

if (!Object.keys(sources).length) throw new Error('Reader manifest contains no remote PDF sources.');
writeFileSync(outputPath, `${JSON.stringify(sources)}\n`);
console.log(`Generated ${Object.keys(sources).length} compact reader PDF source records.`);
