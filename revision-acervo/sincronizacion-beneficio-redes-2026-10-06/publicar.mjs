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
const expectedId = 'a25595c8-cdb8-57de-8200-7551ca27ac9c';
const expectedSource = 'dof-matutina-2024-01-18-f19d73064218';
const expectedUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/18-01-2024/Matutina/311042';
const expectedSha = 'f19d7306421896e2fb023a6d97b156233714ffb65876177c9849330f13bd1abe';
const editorial = 'Nota editorial · alcance de la publicación';
const official = pack.articulos.filter(article => article.identificador !== editorial);
if (pack.ley.id !== expectedId || pack.articulos.length !== 26 || official.length !== 25
    || map.source.id !== expectedSource || map.source.originalUrl !== expectedUrl
    || map.source.sha256 !== expectedSha || map.source.pageCount !== 646
    || map.source.lawId !== expectedId || Object.keys(map.articles).length !== 25
    || audit.fragmentosOficiales !== 25 || audit.paginasPdfInstrumento.join(',') !== '517,547') {
    throw new Error('El cotejo no cubre los 25 fragmentos oficiales de BENEFICIO-REDES.');
}
for (const article of official) {
    const entry = map.articles[article.id];
    if (!entry || entry.sourceId !== expectedSource || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || entry.pageNumbers.some(page => page < 517 || page > 547)) {
        throw new Error(`Cotejo incompleto: ${article.identificador}`);
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
    console.log('Manifiesto sin cambios; los 25 mapas ya están incorporados.');
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
    console.log(`Manifiesto → revisión ${manifest.revision + 1}; 25 mapas agregados; fuente oficial remota.`);
}
