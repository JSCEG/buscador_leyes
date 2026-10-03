import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const packageData = JSON.parse(readFileSync(new URL('../incorporacion-convocatorias-2026-09-17/CONV-ESTRATEGICOS-M2-carga.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
let raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
const expected = new Map(packageData.articulos
    .filter(article => !article.identificador.startsWith('Nota editorial'))
    .map(article => [article.id, article]));
const ids = Object.keys(map.articles);
const expectedUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/10-07-2026/Matutina/328425';
const expectedSha = '69f4f71a5bbf216f3b6b0249aa75c285dda23f197734d073ce13be80f2a52437';

if (packageData.ley.id !== '29886758-c194-5db4-86eb-8c96347f7aba'
    || map.source.originalUrl !== expectedUrl
    || map.source.sha256 !== expectedSha || map.source.pageCount !== 324
    || expected.size !== 27 || ids.length !== expected.size || ids.some(id => !expected.has(id))
    || audit.fragmentosOficiales !== 27 || audit.paginasImpresasDelAcuerdo.join(',') !== '11,20'
    || audit.notasEditorialesExcluidas.length !== 1) {
    throw new Error('El mapa no cubre exactamente los 27 fragmentos oficiales cotejados.');
}

for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (entry.sourceId !== map.source.id || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length) {
        throw new Error(`No coincide el mapa de ${article.identificador}.`);
    }
    for (const anchor of entry.anchors) {
        const page = map.source.pages.find(item => item.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)
            || !entry.pageNumbers.includes(anchor.page)) {
            throw new Error(`Coordenada fuera del cotejo: ${article.identificador}`);
        }
    }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const oldSource = manifest.sources[map.source.id];
if (oldSource && !same(oldSource, map.source)) throw new Error('La fuente existe con otra huella.');
const existing = Object.fromEntries(Object.entries(manifest.articles).filter(([, entry]) => entry.sourceId === map.source.id));
if (Object.keys(existing).length && !same(existing, map.articles)) {
    throw new Error('La fuente ya tiene mapas parciales o diferentes; revisar manualmente.');
}
for (const [id, entry] of Object.entries(map.articles)) {
    if (manifest.articles[id] && !same(manifest.articles[id], entry)) {
        throw new Error(`El fragmento ${id} ya tiene otro mapa.`);
    }
}

const addSource = oldSource ? {} : { [map.source.id]: map.source };
const addArticles = Object.fromEntries(Object.entries(map.articles).filter(([id]) => !manifest.articles[id]));
if (!Object.keys(addSource).length && !Object.keys(addArticles).length) {
    console.log(`Ya están publicados los ${expected.size} mapas; sin cambios.`);
} else {
    const indent = value => JSON.stringify(value, null, 2).split('\n')
        .map((line, index) => index ? `    ${line}` : line).join('\n');
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
