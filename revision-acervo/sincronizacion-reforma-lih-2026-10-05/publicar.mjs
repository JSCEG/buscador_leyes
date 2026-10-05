import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('.', import.meta.url);
const readJson = name => JSON.parse(readFileSync(new URL(name, dir), 'utf8').replace(/^\uFEFF/, ''));
const map = readJson('map.json');
const pack = readJson('articulos-verificados.json');
const audit = readJson('cotejo.json');
const manifestUrl = new URL('../../public/reader-sources/manifest.v1.json', dir);
let raw = readFileSync(manifestUrl, 'utf8');
const manifest = JSON.parse(raw);
const articleById = new Map(pack.articulos.map(article => [article.id, article]));
const expectedId = '6e4c2d90-0ad2-5c47-a0e0-ed132f09415c';
const expectedSource = 'dof-vespertina-2025-03-18-ed57fbef06b4';
const expectedUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/18-03-2025/Vespertina/320062';
const expectedSha = 'ed57fbef06b46f37d53ca1caea856f4eb3b0d2d316c6e7bb7e837daa001708a3';

if (pack.ley.id !== expectedId || pack.articulos.length !== 41
    || map.source.id !== expectedSource || map.source.originalUrl !== expectedUrl
    || map.source.sha256 !== expectedSha || map.source.pageCount !== 270
    || !map.source.instrumentIds.includes(expectedId)
    || Object.keys(map.articles).length !== 41
    || audit.paginasImpresasDelInstrumento.join(',') !== '260,268') {
    throw new Error('El cotejo no cubre los 41 fragmentos oficiales de REFORMA-LIH.');
}

for (const [id, entry] of Object.entries(map.articles)) {
    const article = articleById.get(id);
    if (!article || entry.sourceId !== expectedSource || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || entry.pageNumbers.some(page => page < 260 || page > 268)) {
        throw new Error(`Cotejo incompleto: ${article?.identificador ?? id}`);
    }
    for (const anchor of entry.anchors) {
        const page = map.source.pages.find(value => value.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)) {
            throw new Error(`Coordenada inválida: ${entry.label}`);
        }
    }
}

const oldSource = manifest.sources[expectedSource];
if (!oldSource || oldSource.sha256 !== expectedSha || oldSource.originalUrl !== expectedUrl) {
    throw new Error('La fuente oficial existente no coincide con el PDF cotejado.');
}
const comparable = value => ({ ...value, instrumentIds: [] });
if (JSON.stringify(comparable(oldSource)) !== JSON.stringify(comparable(map.source))) {
    throw new Error('Los metadatos de la edición difieren de la fuente ya publicada.');
}
const additions = Object.fromEntries(Object.entries(map.articles).filter(([id]) => !manifest.articles[id]));
for (const [id, entry] of Object.entries(map.articles)) {
    if (manifest.articles[id] && JSON.stringify(manifest.articles[id]) !== JSON.stringify(entry)) {
        throw new Error(`Ya existe un mapa distinto para ${id}.`);
    }
}

const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const indent = value => JSON.stringify(value, null, 2).split('\n').map((line, index) => index ? `  ${line}` : line).join(eol);
const updatedSource = { ...oldSource, instrumentIds: [...new Set([...oldSource.instrumentIds, expectedId])] };
const sourceKey = `    ${JSON.stringify(expectedSource)}: ${indent(oldSource)}`;
const addInstrumentToSource = !oldSource.instrumentIds.includes(expectedId);
if (addInstrumentToSource) {
    if (!raw.includes(sourceKey)) throw new Error('No se encontró la fuente existente dentro del manifiesto.');
    raw = raw.replace(sourceKey, `    ${JSON.stringify(expectedSource)}: ${indent(updatedSource)}`);
}
if (Object.keys(additions).length) {
    const close = /\r?\n  }\r?\n}\r?\n?$/;
    if (!close.test(raw)) throw new Error('No se encontró el cierre del mapa de artículos.');
    const rows = Object.entries(additions).map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(`,${eol}`);
    raw = raw.replace(close, `,${eol}${rows}${eol}  }${eol}}`);
}
if (addInstrumentToSource || Object.keys(additions).length) {
    raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${manifest.revision + 1}`)
        .replace(/("verifiedAt":\s*)"[^"]+"/, (_, prefix) => `${prefix}"${new Date().toISOString()}"`);
}
JSON.parse(raw);
writeFileSync(manifestUrl, raw);
console.log(addInstrumentToSource || Object.keys(additions).length
    ? `Manifiesto ${manifest.revision} → ${manifest.revision + 1}; ${Object.keys(additions).length} mapas de REFORMA-LIH agregados; edición DOF reutilizada.`
    : `Manifiesto sin cambios; los ${Object.keys(map.articles).length} mapas ya están incorporados.`);
