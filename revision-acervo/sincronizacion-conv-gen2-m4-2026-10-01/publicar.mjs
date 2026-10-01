import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const packageData = JSON.parse(readFileSync(new URL('../incorporacion-convocatorias-2026-09-17/CONV-GEN-2-M4-carga.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
let raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
const expected = new Map(packageData.articulos
    .filter(article => !article.identificador.startsWith('Nota editorial'))
    .map(article => [article.id, article]));
const ids = Object.keys(map.articles);

if (packageData.ley.id !== '8db24d0b-34a8-53dc-8cd3-1498d478e568'
    || map.source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/10-09-2026/Matutina/329565'
    || map.source.pageCount !== 274
    || map.source.sha256 !== 'c0d21b4ac958faa59adff00f420b8c5f613c70884d25a9760c39954e4ef5ea7b'
    || expected.size !== 4 || ids.length !== expected.size || ids.some(id => !expected.has(id))
    || audit.fragmentosOficiales !== 4) {
    throw new Error('El mapa no cubre exactamente los cuatro fragmentos oficiales cotejados.');
}

for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (entry.sourceId !== map.source.id || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || JSON.stringify(entry.pageNumbers) !== JSON.stringify([...new Set(entry.pageNumbers)].sort((a, b) => a - b))) {
        throw new Error(`No coincide el ancla de ${article.identificador}.`);
    }
    for (const anchor of entry.anchors) {
        const page = map.source.pages.find(item => item.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)
            || !entry.pageNumbers.includes(anchor.page) || anchor.page < 13 || anchor.page > 14) {
            throw new Error(`Coordenada fuera del cotejo: ${article.identificador}.`);
        }
    }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const oldSource = manifest.sources[map.source.id];
if (oldSource && !same(oldSource, map.source)) throw new Error('La fuente existe con otra huella.');
const oldMaps = Object.fromEntries(Object.entries(manifest.articles)
    .filter(([, entry]) => entry.sourceId === map.source.id));
if (Object.keys(oldMaps).length && !same(oldMaps, map.articles)) {
    throw new Error('La fuente ya tiene mapas parciales o distintos; revisar manualmente.');
}
for (const [id, entry] of Object.entries(map.articles)) {
    if (manifest.articles[id] && !same(manifest.articles[id], entry)) {
        throw new Error(`El artículo ${id} ya tiene un mapa distinto.`);
    }
}

const addSource = oldSource ? {} : { [map.source.id]: map.source };
const addArticles = Object.fromEntries(Object.entries(map.articles)
    .filter(([id]) => !manifest.articles[id]));
if (!Object.keys(addSource).length && !Object.keys(addArticles).length) {
    console.log(`Ya están publicados los ${expected.size} mapas; sin cambios.`);
} else {
    const indent = value => JSON.stringify(value, null, 2).split('\n')
        .map((line, index) => index ? `  ${line}` : line).join('\n');
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
    raw = raw.replace(/("verifiedAt":\s*)"[^"]+"/,
        (_, prefix) => `${prefix}"${new Date().toISOString()}"`);
    JSON.parse(raw);
    writeFileSync(manifestPath, raw);
    console.log(`Manifiesto ${manifest.revision} → ${manifest.revision + 1}; ${Object.keys(addArticles).length} mapas agregados.`);
}
