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
const expectedId = '7bbbf2d1-24cd-557e-bd1e-d4b4f23ba210';
const expectedSource = 'dof-vespertina-2025-10-03-70701a5e439e';
const expectedUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/03-10-2025/Vespertina/323363';
const expectedSha = '70701a5e439eb90fd61b55250c5802c26a6f695cfd81b1b4da2719ba2478907b';

if (pack.ley.id !== expectedId || pack.articulos.length !== 30
    || map.source.id !== expectedSource || map.source.originalUrl !== expectedUrl
    || map.source.sha256 !== expectedSha || map.source.pageCount !== 334
    || !map.source.instrumentIds.includes(expectedId)
    || Object.keys(map.articles).length !== 30
    || audit.paginasImpresasDelInstrumento.join(',') !== '232,235') {
    throw new Error('El cotejo no cubre los 30 fragmentos oficiales de REFORMA-RLIH.');
}

for (const [id, entry] of Object.entries(map.articles)) {
    const article = articleById.get(id);
    if (!article || entry.sourceId !== expectedSource || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || entry.pageNumbers.some(page => page < 232 || page > 235)) {
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
for (const [id, entry] of Object.entries(map.articles)) {
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
console.log(`Manifiesto ${manifest.revision} → ${manifest.revision + 1}; ${Object.keys(map.articles).length} mapas de REFORMA-RLIH agregados.`);
