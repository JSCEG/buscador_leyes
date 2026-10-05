import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const packageData = JSON.parse(readFileSync(new URL('../incorporacion-manuales-2026-09-22/MOG-CNE-carga.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
let raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
const expected = new Map(packageData.articulos.map(article => [article.id, article]));
const ids = Object.keys(map.articles);
const expectedSha = 'bc50921ecb6b6c7df79d6715d3c10eeb460ab7904667c2fcf4c4799c37258a1e';

if (packageData.ley.id !== 'b872a637-08eb-55ed-a529-9822185c86f2'
    || map.source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/29-05-2026/Matutina/327605'
    || map.source.id !== `dof-matutina-2026-05-29-${expectedSha.slice(0, 12)}`
    || map.source.pageCount !== 292 || map.source.sha256 !== expectedSha
    || expected.size !== 41 || ids.length !== expected.size || ids.some(id => !expected.has(id))
    || audit.fragmentosOficiales !== 41 || audit.paginasImpresasDelInstrumento.join(',') !== '86,135') {
    throw new Error('El mapa no cubre exactamente los 41 fragmentos cotejados del manual.');
}

for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (entry.sourceId !== map.source.id || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || entry.pageNumbers.some(number => number < 86 || number > 135)) {
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

const organigram = [...expected.values()].find(article => article.identificador.startsWith('8. ORGANIGRAMA'));
if (organigram) {
    const mapped = map.articles[organigram.id];
    if (mapped.pageNumbers.join(',') !== '96' || mapped.anchors[0]?.kind !== 'graphic') {
        throw new Error('El organigrama rasterizado no quedó anclado únicamente a su página.');
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
