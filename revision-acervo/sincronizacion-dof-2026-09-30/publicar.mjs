import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
const rawOriginal = readFileSync(manifestPath, 'utf8');
let raw = rawOriginal;
const manifest = JSON.parse(raw);
const packages = ['UPAC-SGE', 'CNE-MOD-CARGO-TRANSMISION'];
const data = packages.map(siglas => JSON.parse(readFileSync(
    new URL(`../incorporacion-dof-2026-09-30/${siglas}-carga.json`, dir), 'utf8')));
const expected = new Map(data.flatMap(pkg => pkg.articulos
    .filter(article => !article.identificador.startsWith('Nota editorial'))
    .map(article => [article.id, article])));
const actualIds = Object.keys(map.articles);
if (expected.size !== 28 || actualIds.length !== expected.size
    || actualIds.some(id => !expected.has(id))) throw new Error('El mapa no cubre exactamente los fragmentos oficiales.');

for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (entry.sourceId !== map.source.id || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || JSON.stringify(entry.pageNumbers) !== JSON.stringify([...new Set(entry.pageNumbers)].sort((a, b) => a - b))) {
        throw new Error(`El cotejo del mapa falló: ${article.identificador}`);
    }
    for (const anchor of entry.anchors) {
        const page = map.source.pages.find(item => item.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)
            || !entry.pageNumbers.includes(anchor.page)) throw new Error(`Ancla inválida: ${article.identificador}`);
    }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const existingSource = manifest.sources[map.source.id];
if (existingSource && !same(existingSource, map.source)) throw new Error('La fuente ya existe con otra huella.');
const sourceArticles = Object.fromEntries(Object.entries(manifest.articles)
    .filter(([, value]) => value.sourceId === map.source.id));
if (Object.keys(sourceArticles).length && !same(sourceArticles, map.articles)) {
    throw new Error('Ya existen mapas parciales o diferentes para esta fuente. Revisar manualmente.');
}
for (const [id, entry] of Object.entries(map.articles)) {
    if (manifest.articles[id] && !same(manifest.articles[id], entry)) throw new Error(`Conflicto de mapa en ${id}.`);
}

const newSources = existingSource ? {} : { [map.source.id]: map.source };
const newArticles = Object.fromEntries(Object.entries(map.articles)
    .filter(([id]) => !manifest.articles[id]));
if (!Object.keys(newSources).length && !Object.keys(newArticles).length) {
    console.log(`El manifiesto ya contiene los ${expected.size} mapas; sin cambios.`);
} else {
    const newline = raw.includes('\r\n') ? '\r\n' : '\n';
    const indent = value => JSON.stringify(value, null, 2).split('\n')
        .map((line, index) => index ? `  ${line}` : line).join('\n');
    if (Object.keys(newSources).length) {
        const boundary = '\n  },\n  "articles": {';
        if (!raw.includes(boundary)) throw new Error('No se encontró el cierre de sources.');
        const rows = Object.entries(newSources).map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(',\n');
        raw = raw.replace(boundary, `,\n${rows}\n  },\n  "articles": {`);
    }
    if (Object.keys(newArticles).length) {
        const boundary = /\n  }\n}\n?$/;
        if (!boundary.test(raw)) throw new Error('No se encontró el cierre de articles.');
        const rows = Object.entries(newArticles).map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(',\n');
        raw = raw.replace(boundary, `,\n${rows}\n  }\n}`);
    }
    const revision = manifest.revision + 1;
    raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${revision}`);
    raw = raw.replace(/("verifiedAt":\s*)"[^"]+"/,
        (_, prefix) => prefix + JSON.stringify(new Date().toISOString()));
    raw = raw.replace(/\r?\n/g, newline);
    const updated = JSON.parse(raw);
    if (!updated.sources[map.source.id] || expected.size !== 28
        || actualIds.some(id => !updated.articles[id])) throw new Error('La validación posterior del manifiesto falló.');
    writeFileSync(manifestPath, raw, 'utf8');
    console.log(`Agregado origen oficial y ${Object.keys(newArticles).length} mapas; revisión ${revision}.`);
}
