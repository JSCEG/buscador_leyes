import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const data = JSON.parse(readFileSync(new URL('../incorporacion-pendientes-2026-09-19/MIGRACION-ACLARACION-carga.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
let raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
const expected = new Map(data.articulos
    .filter(row => row.id !== '3e5d22a1-8b7f-5637-8532-d25e7069cf82')
    .map(row => [row.id, row]));

if (data.ley.id !== '5fd6bd12-5c8b-553c-bdb5-7b0b9bfcc524'
    || map.source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/26-06-2026/Matutina/328125'
    || map.source.sha256 !== '2d99cb2a77fdc34e7f8f39187ab4d00b105f9b33466b07c66fb7df7e69e53470'
    || map.source.pageCount !== 274 || expected.size !== 3
    || Object.keys(map.articles).length !== 3 || audit.fragmentosMapeados.length !== 3) {
    throw new Error('El mapa no corresponde exactamente a los tres fragmentos oficiales cotejados.');
}
for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (!article || entry.sourceId !== map.source.id || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || entry.pageNumbers.length !== 1 || entry.pageNumbers[0] !== 107 || !entry.anchors.length) {
        throw new Error(`No coincide el mapa de ${article?.identificador ?? id}.`);
    }
    for (const anchor of entry.anchors) {
        const page = map.source.pages.find(row => row.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (anchor.page !== 107 || !page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)
            || y0 < 70 || y1 > 605) throw new Error(`Ancla fuera de la nota: ${entry.label}`);
    }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const oldSource = manifest.sources[map.source.id];
if (oldSource && !same(oldSource, map.source)) throw new Error('La fuente ya existe con otra huella.');
const oldMaps = Object.fromEntries(Object.entries(manifest.articles).filter(([, row]) => row.sourceId === map.source.id));
if (Object.keys(oldMaps).length && !same(oldMaps, map.articles)) throw new Error('La fuente ya tiene mapas parciales o distintos.');
for (const [id, entry] of Object.entries(map.articles)) {
    if (manifest.articles[id] && !same(manifest.articles[id], entry)) throw new Error(`El fragmento ${id} ya tiene otro mapa.`);
}

const addSource = oldSource ? {} : { [map.source.id]: map.source };
const addArticles = Object.fromEntries(Object.entries(map.articles).filter(([id]) => !manifest.articles[id]));
if (!Object.keys(addSource).length && !Object.keys(addArticles).length) {
    console.log('Los tres mapas ya están publicados; sin cambios.');
} else {
    const indent = value => JSON.stringify(value, null, 2).split('\n').map((line, index) => index ? `  ${line}` : line).join('\n');
    if (Object.keys(addSource).length) {
        const boundary = '\n  },\n  "articles": {';
        if (!raw.includes(boundary)) throw new Error('No se encontró el cierre de sources.');
        const rows = Object.entries(addSource).map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(',\n');
        raw = raw.replace(boundary, `,\n${rows}\n  },\n  "articles": {`);
    }
    if (Object.keys(addArticles).length) {
        const boundary = /\n  }\n}\n?$/;
        if (!boundary.test(raw)) throw new Error('No se encontró el cierre de articles.');
        const rows = Object.entries(addArticles).map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(',\n');
        raw = raw.replace(boundary, `,\n${rows}\n  }\n}`);
    }
    raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${manifest.revision + 1}`);
    raw = raw.replace(/("verifiedAt":\s*)"[^"]+"/, (_, prefix) => `${prefix}"${new Date().toISOString()}"`);
    JSON.parse(raw);
    writeFileSync(manifestPath, raw);
    console.log(`Manifiesto ${manifest.revision} → ${manifest.revision + 1}; ${Object.keys(addArticles).length} fragmentos añadidos.`);
}
