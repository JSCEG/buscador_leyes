import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const packageData = JSON.parse(readFileSync(new URL('../incorporacion-convocatorias-2026-09-17/CONV-ESTRATEGICOS-carga.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
let raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
const excludedLabels = new Set(['Nota editorial · versiones relacionadas', 'Índice de la publicación']);
const expected = new Map(packageData.articulos.filter(article => !excludedLabels.has(article.identificador))
    .map(article => [article.id, article]));
const ids = Object.keys(map.articles);
const expectedSha = 'c06daf5c3f72e1b170cbe01cf1e213f2eab4804a6c1a1db05c7950f2be736ff7';

if (packageData.ley.id !== '24110e92-4d4c-5434-b02a-6a1794ee65ff'
    || map.source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/15-05-2026/Vespertina/327345'
    || map.source.id !== `dof-vespertina-2026-05-15-${expectedSha.slice(0, 12)}`
    || map.source.pageCount !== 38 || map.source.sha256 !== expectedSha
    || expected.size !== 56 || ids.length !== expected.size || ids.some(id => !expected.has(id))
    || audit.fragmentosOficiales !== 56 || audit.paginasImpresasDelAcuerdo.join(',') !== '20,38') {
    throw new Error('El mapa no cubre exactamente los 56 fragmentos oficiales cotejados.');
}

for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (entry.sourceId !== map.source.id || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || entry.pageNumbers.some(number => number < 20 || number > 38)) {
        throw new Error(`No coincide el cotejo del fragmento ${article.identificador}.`);
    }
    for (const anchor of entry.anchors) {
        const page = map.source.pages.find(item => item.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)) {
            throw new Error(`Coordenada fuera del cotejo: ${article.identificador}`);
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
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const indent = value => JSON.stringify(value, null, 2).split('\n')
        .map((line, index) => index ? `  ${line}` : line).join(eol);
    if (Object.keys(addSource).length) {
        const boundary = `${eol}  },${eol}  "articles": {`;
        if (!raw.includes(boundary)) throw new Error(`No se encontró el cierre de sources en ${manifestPath.pathname}.`);
        const rows = Object.entries(addSource).map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(`,${eol}`);
        raw = raw.replace(boundary, `,${eol}${rows}${eol}  },${eol}  "articles": {`);
    }
    if (Object.keys(addArticles).length) {
        const boundary = /\r?\n  }\r?\n}\r?\n?$/;
        if (!boundary.test(raw)) throw new Error('No se encontró el cierre de articles.');
        const rows = Object.entries(addArticles).map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(`,${eol}`);
        raw = raw.replace(boundary, `,${eol}${rows}${eol}  }${eol}}`);
    }
    raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${manifest.revision + 1}`);
    raw = raw.replace(/("verifiedAt":\s*)"[^"]+"/,
        (_, prefix) => `${prefix}"${new Date().toISOString()}"`);
    JSON.parse(raw);
    writeFileSync(manifestPath, raw);
    console.log(`Manifiesto ${manifest.revision} → ${manifest.revision + 1}; ${Object.keys(addArticles).length} mapas agregados.`);
}
