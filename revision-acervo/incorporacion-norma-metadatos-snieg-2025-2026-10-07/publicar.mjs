import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const dir = resolve(root, 'revision-acervo/incorporacion-norma-metadatos-snieg-2025-2026-10-07');
const map = JSON.parse(readFileSync(resolve(dir, 'map.json'), 'utf8'));
const sourceId = map.source.id;
const ids = Object.keys(map.articles);
const manifestPath = resolve(root, 'public/reader-sources/manifest.v1.json');
let raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
if (manifest.sources[sourceId]) throw new Error(`La fuente ${sourceId} ya existe en el manifiesto.`);
if (ids.some(id => manifest.articles[id])) throw new Error('Uno o más fragmentos ya tienen mapa publicado.');

function endOfObject(text, start) {
    let depth = 0; let quoted = false; let escaped = false;
    for (let i = start; i < text.length; i += 1) {
        const c = text[i];
        if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
        else if (c === '"') quoted = true;
        else if (c === '{') depth += 1;
        else if (c === '}' && --depth === 0) return i;
    }
    throw new Error('No se pudo cerrar el objeto JSON del manifiesto.');
}

function addEntries(current, key, values) {
    const marker = `"${key}":`;
    const markerAt = current.indexOf(marker);
    const openAt = current.indexOf('{', markerAt);
    const closeAt = endOfObject(current, openAt);
    const obj = JSON.parse(current.slice(openAt, closeAt + 1));
    const entries = Object.entries(values);
    if (!entries.length) return current;
    const addition = entries.map(([id, value]) => `${JSON.stringify(id)}: ${JSON.stringify(value, null, 2).replace(/\n/g, '\n    ')}`).join(',\n    ');
    return `${current.slice(0, closeAt)}${Object.keys(obj).length ? ',' : ''}\n    ${addition}\n  ${current.slice(closeAt)}`;
}

raw = addEntries(raw, 'sources', { [sourceId]: map.source });
raw = addEntries(raw, 'articles', map.articles);
raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${manifest.revision + 1}`);
raw = raw.replace(/("verifiedAt":\s*)"[^"]+"/, (_, prefix) => `${prefix}${JSON.stringify(new Date().toISOString())}`);
JSON.parse(raw);

const registryPath = resolve(root, 'server/reader-pdf-sources.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
if (registry[sourceId]) throw new Error(`La fuente ${sourceId} ya existe en server/reader-pdf-sources.json.`);
registry[sourceId] = { transport: map.source.transport, originalUrl: map.source.originalUrl, sha256: map.source.sha256 };

// Write the allowlist and manifest only after all preconditions validate.
writeFileSync(registryPath, `${JSON.stringify(registry)}\n`, 'utf8');
writeFileSync(manifestPath, raw, 'utf8');
console.log(`Manifiesto ${manifest.revision} → ${manifest.revision + 1}; ${ids.length} mapas publicados para ${sourceId}.`);
