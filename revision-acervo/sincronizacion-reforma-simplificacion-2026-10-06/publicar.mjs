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
const expectedId = '6c8a912f-6ebb-5638-8d95-b53e5c4b596c';
const expectedSource = 'dof-vespertina-2024-12-20-878e180516f1';
const expectedUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/20-12-2024/Vespertina/318281';
const expectedSha = '878e180516f11559603f1c361026978b42ec475e50d0a3628cfae4ec61de9ee6';
const official = pack.articulos.filter(article => article.identificador !== 'Nota editorial · documentos relacionados');
if (pack.ley.id !== expectedId || pack.articulos.length !== 30 || official.length !== 29
    || map.source.id !== expectedSource || map.source.originalUrl !== expectedUrl
    || map.source.sha256 !== expectedSha || map.source.pageCount !== 168
    || !map.source.instrumentIds.includes(expectedId) || Object.keys(map.articles).length !== 29
    || audit.paginasImpresasDelInstrumento.join(',') !== '2,10') {
    throw new Error('El cotejo no cubre los 29 fragmentos oficiales de REFORMA-SIMPLIFICACION.');
}
for (const [id, entry] of Object.entries(map.articles)) {
    const article = official.find(value => value.id === id);
    if (!article || entry.sourceId !== expectedSource || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || entry.pageNumbers.some(page => page < 2 || page > 10)) {
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
if (oldSource) {
    if (JSON.stringify(oldSource) !== JSON.stringify(map.source)) throw new Error('La fuente existente difiere del cotejo.');
    for (const [id, entry] of Object.entries(map.articles)) {
        if (JSON.stringify(manifest.articles[id]) !== JSON.stringify(entry)) throw new Error(`El mapa existente difiere para ${id}.`);
    }
    console.log('Manifiesto sin cambios; los 29 mapas ya están incorporados.');
} else {
    if (official.some(article => manifest.articles[article.id])) throw new Error('Ya existe un mapa para un fragmento del instrumento.');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const indent = value => JSON.stringify(value, null, 2).split('\n').map((line, index) => index ? `  ${line}` : line).join(eol);
    const articlesMarker = raw.indexOf(`${eol}  "articles": {`);
    const sourcesClose = raw.lastIndexOf(`${eol}  },`, articlesMarker);
    if (articlesMarker < 0 || sourcesClose < 0) throw new Error('No se encontró el cierre de sources.');
    const sourceEntry = `    ${JSON.stringify(expectedSource)}: ${indent(map.source)}`;
    raw = `${raw.slice(0, sourcesClose)},${eol}${sourceEntry}${eol}${raw.slice(sourcesClose + eol.length)}`;
    const endMarker = /\r?\n  }\r?\n}\r?\n?$/;
    if (!endMarker.test(raw)) throw new Error('No se encontró el cierre de articles.');
    const rows = Object.entries(map.articles).map(([id, entry]) => `    ${JSON.stringify(id)}: ${indent(entry)}`).join(`,${eol}`);
    raw = raw.replace(endMarker, `,${eol}${rows}${eol}  }${eol}}`);
    raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${manifest.revision + 1}`)
        .replace(/("verifiedAt":\s*)"[^"]+"/, (_, prefix) => `${prefix}"${new Date().toISOString()}"`);
    JSON.parse(raw);
    writeFileSync(manifestUrl, raw);
    console.log(`Manifiesto → revisión ${manifest.revision + 1}; 29 mapas agregados; fuente oficial remota.`);
}
