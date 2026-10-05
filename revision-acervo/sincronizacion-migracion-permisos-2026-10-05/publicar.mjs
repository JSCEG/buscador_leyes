import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const data = JSON.parse(readFileSync(new URL('../incorporacion-pendientes-2026-09-19/MIGRACION-PERMISOS-carga.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
let raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
const expected = new Map(data.articulos
    .filter(row => !row.identificador.startsWith('Nota editorial'))
    .map(row => [row.id, row]));

if (data.ley.id !== '91a6f28d-52a9-5f72-96e0-ac50a1991c96'
    || map.source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/18-06-2026/Matutina/327985'
    || map.source.sha256 !== '4fb0664039a940ee5f281059d741aa8bafff6b713ff969e60af49ed248331c49'
    || map.source.pageCount !== 324 || expected.size !== 77
    || Object.keys(map.articles).length !== 77 || audit.fragmentosOficiales !== 77) {
    throw new Error('El mapa no cubre exactamente los 77 fragmentos oficiales cotejados.');
}
for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (!article || entry.sourceId !== map.source.id || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.pageNumbers.length || entry.pageNumbers.some(page => page < 5 || page > 26) || !entry.anchors.length) {
        throw new Error(`No coincide el mapa de ${article?.identificador ?? id}.`);
    }
    for (const anchor of entry.anchors) {
        const page = map.source.pages.find(row => row.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)
            || !entry.pageNumbers.includes(anchor.page) || anchor.page < 5 || anchor.page > 26) {
            throw new Error(`Coordenada fuera del cotejo: ${entry.label}`);
        }
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
    console.log('Los 77 mapas ya están publicados; sin cambios.');
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
