import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const rows = JSON.parse(readFileSync(new URL('articulos-verificados.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
const manifestFile = fileURLToPath(manifestPath);
let raw = readFileSync(manifestPath, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const manifest = JSON.parse(raw);
const instrumentId = 'd5562ad3-7682-4add-8cc9-7ee5994fdc1c';
const sourceId = 'dacg-cogeneracion-aa23e284c9c9';
const source = manifest.sources[sourceId];
const expected = new Map(rows.map(row => [row.id, row]));

if (!source || map.sourceId !== sourceId || source.sha256 !== 'aa23e284c9c97542a96c8db5278f4694f38d0ad1f07b2081b6f0db268a93cba4'
    || source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/16-04-2026/Matutina/326685'
    || source.pageCount !== 304 || expected.size !== 154 || Object.keys(map.articles).length !== 154
    || audit.fragmentosOficiales !== 154 || audit.anclasGeometricas < 154) {
    throw new Error('El cotejo no cubre los 154 fragmentos esperados en la edición oficial revisada.');
}
for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (!article || article.ley_id !== instrumentId || entry.sourceId !== sourceId
        || entry.label !== article.identificador || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.pageNumbers.length || entry.pageNumbers.some(page => page < 35 || page > 57) || !entry.anchors.length) {
        throw new Error(`No coincide el mapa de ${article?.identificador ?? id}.`);
    }
    for (const anchor of entry.anchors) {
        const page = source.pages.find(row => row.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)
            || !entry.pageNumbers.includes(anchor.page) || anchor.page < 35 || anchor.page > 57) {
            throw new Error(`Coordenada fuera de la edición revisada: ${entry.label}`);
        }
    }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const oldMaps = Object.fromEntries(Object.entries(manifest.articles).filter(([, row]) => row.sourceId === sourceId));
for (const [id, entry] of Object.entries(map.articles)) {
    if (manifest.articles[id] && !same(manifest.articles[id], entry)) throw new Error(`El fragmento ${id} ya tiene otro mapa.`);
}
if (Object.keys(oldMaps).length > 154) throw new Error('El origen tiene más mapas que los cotejados para este instrumento.');

let changed = false;
const sourceKey = `"${sourceId}": {`;
const sourceStart = raw.indexOf(sourceKey);
if (sourceStart < 0) throw new Error('No se ubicó la fuente compartida en el manifiesto.');
const titleMarker = `"title": ${JSON.stringify(source.title)},`;
const titleIndex = raw.indexOf(titleMarker, sourceStart);
if (titleIndex < 0) throw new Error('No se ubicó el título de la fuente compartida.');
const sourceTitle = 'Edición matutina del Diario Oficial de la Federación · 16 de abril de 2026';
if (source.title !== sourceTitle) {
    raw = raw.slice(0, titleIndex) + `"title": ${JSON.stringify(sourceTitle)},` + raw.slice(titleIndex + titleMarker.length);
    source.title = sourceTitle;
    changed = true;
}
if (!(source.instrumentIds || []).includes(instrumentId)) {
    const lawLine = `"lawId": ${JSON.stringify(source.lawId)},`;
    const lawIndex = raw.indexOf(lawLine, sourceStart);
    if (lawIndex < 0) throw new Error('No se ubicó la referencia institucional heredada.');
    const ids = [...new Set([...(source.instrumentIds || (source.lawId ? [source.lawId] : [])), instrumentId])];
    const replacement = `${lawLine}${eol}      "instrumentIds": ${JSON.stringify(ids)},`;
    raw = raw.slice(0, lawIndex) + replacement + raw.slice(lawIndex + lawLine.length);
    source.instrumentIds = ids;
    changed = true;
}

const additions = Object.entries(map.articles).filter(([id]) => !manifest.articles[id]);
if (additions.length) {
    const boundary = /\r?\n  }\r?\n}\r?$/;
    if (!boundary.test(raw)) throw new Error('No se encontró el cierre de articles.');
    const indent = value => JSON.stringify(value, null, 2).split('\n').map((line, index) => index ? `  ${line}` : line).join(eol);
    const articleRows = additions.map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(`,${eol}`);
    raw = raw.replace(boundary, `,${eol}${articleRows}${eol}  }${eol}}`);
    changed = true;
}

if (!changed) {
    console.log('Los 154 fragmentos ya están publicados; sin cambios.');
} else {
    raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${manifest.revision + 1}`);
    raw = raw.replace(/("verifiedAt":\s*)"[^"]+"/, (_, prefix) => `${prefix}${JSON.stringify(new Date().toISOString())}`);
    const updated = JSON.parse(raw);
    const updatedSource = updated.sources[sourceId];
    if (updated.revision !== manifest.revision + 1 || !updatedSource.instrumentIds.includes(instrumentId)
        || additions.some(([id]) => !updated.articles[id])) throw new Error('La validación posterior al cambio falló.');
    const temporary = `${manifestFile}.tmp`;
    writeFileSync(temporary, raw, 'utf8');
    renameSync(temporary, manifestFile);
    console.log(`Manifiesto ${manifest.revision} → ${updated.revision}; ${additions.length} fragmentos sincronizados; fuente oficial compartida.`);
}
