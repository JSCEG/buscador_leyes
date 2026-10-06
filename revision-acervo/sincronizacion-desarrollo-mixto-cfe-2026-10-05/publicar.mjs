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
const expectedId = 'd4b231b0-6b12-5dbe-b003-a6986814c000';
const expectedSource = 'dof-matutina-2026-01-28-b76dbe009e39';
const expectedUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/28-01-2026/Matutina/325425';
const expectedSha = 'b76dbe009e39723956037613bbfa882de1370c54e968bd45b97ba5a8fabd212c';
const tableCount = pack.articulos.reduce((sum, article) => sum + (article.contenido.match(/<table\b/gi) ?? []).length, 0);
const cellCount = pack.articulos.reduce((sum, article) => sum + (article.contenido.match(/<(?:td|th)\b/gi) ?? []).length, 0);

if (pack.ley.id !== expectedId || pack.articulos.length !== 30
    || map.source.id !== expectedSource || map.source.originalUrl !== expectedUrl
    || map.source.sha256 !== expectedSha || map.source.pageCount !== 342
    || !map.source.instrumentIds.includes(expectedId)
    || Object.keys(map.articles).length !== 30
    || audit.paginasImpresasDelInstrumento.join(',') !== '65,84'
    || audit.fragmentosOficiales !== 30 || tableCount !== 3 || cellCount !== 216
    || audit.tablasVerificadas !== 3 || audit.celdasVerificadas !== 216) {
    throw new Error('El cotejo no cubre los 30 fragmentos y las tres tablas de DESARROLLO-MIXTO-CFE.');
}

for (const [id, entry] of Object.entries(map.articles)) {
    const article = articleById.get(id);
    if (!article || entry.sourceId !== expectedSource || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || entry.pageNumbers.some(page => page < 65 || page > 84)) {
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

if (manifest.sources[expectedSource]) throw new Error('La fuente ya existe; se requiere cotejo manual de la edición.');
for (const id of Object.keys(map.articles)) {
    if (manifest.articles[id]) throw new Error(`El fragmento ${id} ya tiene un mapa.`);
}

const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const indent = value => JSON.stringify(value, null, 2).split('\n').map((line, index) => index ? `  ${line}` : line).join(eol);
const articlesMarker = raw.indexOf(`${eol}  "articles": {`);
const sourcesClose = raw.lastIndexOf(`${eol}  },`, articlesMarker);
if (articlesMarker < 0 || sourcesClose < 0) throw new Error('No se encontró el cierre de sources.');
const sourceEntry = `    ${JSON.stringify(expectedSource)}: ${indent(map.source)}`;
raw = `${raw.slice(0, sourcesClose)},${eol}${sourceEntry}${eol}${raw.slice(sourcesClose + eol.length)}`;
const endMarker = /\r?\n  }\r?\n}\r?\n?$/;
if (!endMarker.test(raw)) throw new Error('No se encontró el cierre de articles.');
const articleEntries = Object.entries(map.articles)
    .map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(`,${eol}`);
raw = raw.replace(endMarker, `,${eol}${articleEntries}${eol}  }${eol}}`);
raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${manifest.revision + 1}`)
    .replace(/("verifiedAt":\s*)"[^"]+"/, (_, prefix) => `${prefix}"${new Date().toISOString()}"`);
JSON.parse(raw);
writeFileSync(manifestUrl, raw);
console.log(`Manifiesto ${manifest.revision} → ${manifest.revision + 1}; ${Object.keys(map.articles).length} mapas agregados; tres tablas y 216 celdas preservadas.`);
