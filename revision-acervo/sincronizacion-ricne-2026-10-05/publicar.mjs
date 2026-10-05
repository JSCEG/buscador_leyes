import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const packageData = JSON.parse(readFileSync(new URL('../incorporacion-7-2026-09-17/RICNE-carga.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
let raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
const expected = new Map(packageData.articulos.map(article => [article.id, article]));
const ids = Object.keys(map.articles);
const expectedSha = 'a6e9c6b9467274ba697a031f1e7b38736707f1107a9ae1a4e3b5d02349f08d43';

if (packageData.ley.id !== 'ca974945-9edf-5386-822a-c2755e66afc4'
    || map.source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/08-05-2025/Matutina/320943'
    || map.source.id !== `dof-matutina-2025-05-08-${expectedSha.slice(0, 12)}`
    || map.source.pageCount !== 244 || map.source.sha256 !== expectedSha
    || expected.size !== 48 || ids.length !== expected.size || ids.some(id => !expected.has(id))
    || audit.fragmentosOficiales !== 48 || audit.paginasImpresasDelAcuerdo.join(',') !== '4,27') {
    throw new Error('El mapa no cubre exactamente los 48 fragmentos oficiales cotejados.');
}

for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (entry.sourceId !== map.source.id || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || entry.pageNumbers.some(number => number < 4 || number > 27)) {
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
        if (!raw.includes(boundary)) throw new Error('No se encontró el cierre de sources.');
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
