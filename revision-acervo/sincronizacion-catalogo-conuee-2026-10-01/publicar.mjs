import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const packageData = JSON.parse(readFileSync(new URL('../incorporacion-complementos-2026-09-19/CATALOGO-CONUEE-carga.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
const original = readFileSync(manifestPath, 'utf8');
let raw = original;
const manifest = JSON.parse(raw);
const expected = new Map(packageData.articulos
    .filter(article => !article.identificador.startsWith('Nota editorial'))
    .map(article => [article.id, article]));
const ids = Object.keys(map.articles);

if (packageData.ley.id !== 'd9667c21-b2e6-5ecd-9b3f-f66bb053ef27'
    || map.source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/11-09-2026/Matutina/329588'
    || map.source.pageCount !== 160 || map.source.sha256 !== 'cc69670d9b9bf822c80a37180326f88a794b74b698133fafaa379b515769a8e9'
    || expected.size !== 31 || ids.length !== expected.size || ids.some(id => !expected.has(id))
    || audit.fragmentos_con_formulario_imagen !== 6) {
    throw new Error('El mapa no cubre exactamente los fragmentos oficiales cotejados.');
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
    const form = /^Formato ([1-6])\./.exec(article.identificador);
    if (form && (entry.pageNumbers.length !== 1 || entry.pageNumbers[0] !== 32 + Number(form[1]))) {
        throw new Error(`Página incorrecta del ${article.identificador}.`);
    }
    for (const anchor of entry.anchors) {
        const page = map.source.pages.find(item => item.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)
            || !entry.pageNumbers.includes(anchor.page) || anchor.page < 26 || anchor.page > 38) {
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
        (_, prefix) => prefix + JSON.stringify(new Date().toISOString()));
    const newline = original.includes('\r\n') ? '\r\n' : '\n';
    raw = raw.replace(/\r?\n/g, newline);
    const updated = JSON.parse(raw);
    if (!updated.sources[map.source.id] || ids.some(id => !updated.articles[id])) {
        throw new Error('Falló la comprobación posterior del manifiesto.');
    }
    writeFileSync(manifestPath, raw, 'utf8');
    console.log(`Agregada fuente oficial y ${Object.keys(addArticles).length} anclas; revisión ${updated.revision}.`);
}
