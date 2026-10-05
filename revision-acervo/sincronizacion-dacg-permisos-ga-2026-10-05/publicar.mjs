import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const rows = JSON.parse(readFileSync(new URL('articulos-verificados.json', dir), 'utf8'));
const source = JSON.parse(readFileSync(new URL('source.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
const manifestFile = fileURLToPath(manifestPath);
let raw = readFileSync(manifestPath, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const manifest = JSON.parse(raw);
const instrumentId = '37c89350-82df-5021-8dbe-94e8e31e1d3e';
const indexId = '35bac1e8-52b3-50aa-bf28-4209291bfe09';
const sourceId = 'dof-matutina-2025-10-23-0314af26eb12';
const expectedSha = '0314af26eb12f95ba3de3f838b7bf8821f5a1900f5ad76fd11e42d2e7bc66a7d';
const expected = new Map(rows.filter(row => row.id !== indexId).map(row => [row.id, row]));
if (rows.length !== 86 || expected.size !== 85 || Object.keys(map.articles).length !== 85
    || audit.fragmentosMapeados !== 85 || source.id !== sourceId || source.sha256 !== expectedSha
    || source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/23-10-2025/Matutina/323704'
    || source.pageCount !== 364) throw new Error('El mapa no cubre los 85 fragmentos con texto oficial cotejable.');
for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (!article || article.ley_id !== instrumentId || entry.sourceId !== sourceId
        || entry.label !== article.identificador || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.pageNumbers.length || entry.pageNumbers.some(page => page < 13 || page > 69) || !entry.anchors.length) {
        throw new Error(`No coincide el mapa de ${article?.identificador ?? id}.`);
    }
    for (const anchor of entry.anchors) {
        const page = source.pages.find(row => row.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)
            || !entry.pageNumbers.includes(anchor.page) || anchor.page < 13 || anchor.page > 69) {
            throw new Error(`Coordenada fuera de la edición revisada: ${entry.label}`);
        }
    }
}
if (map.articles[indexId]) throw new Error('El índice sintético no debe afirmarse como texto del PDF.');
if (manifest.sources[sourceId] && JSON.stringify(manifest.sources[sourceId]) !== JSON.stringify(source)) throw new Error('La fuente ya existe con metadatos distintos.');
for (const [id, entry] of Object.entries(map.articles)) {
    if (manifest.articles[id] && JSON.stringify(manifest.articles[id]) !== JSON.stringify(entry)) throw new Error(`El fragmento ${id} ya tiene otro mapa.`);
}
const additions = Object.entries(map.articles).filter(([id]) => !manifest.articles[id]);
let changed = false;
if (!manifest.sources[sourceId]) {
    const articlesMarker = raw.indexOf(`${eol}  "articles": {`);
    const sourcesClose = raw.lastIndexOf(`${eol}  },`, articlesMarker);
    if (articlesMarker < 0 || sourcesClose < 0) throw new Error('No se encontró el cierre de sources.');
    const encoded = JSON.stringify(source, null, 2).split('\n').map((line, index) => index ? `    ${line}` : line).join(eol);
    raw = raw.slice(0, sourcesClose) + `,${eol}    ${JSON.stringify(sourceId)}: ${encoded}` + raw.slice(sourcesClose);
    changed = true;
}
if (additions.length) {
    const boundary = /\r?\n  }\r?\n}$/;
    if (!boundary.test(raw)) throw new Error('No se encontró el cierre de articles.');
    const indent = value => JSON.stringify(value, null, 2).split('\n').map((line, index) => index ? `  ${line}` : line).join(eol);
    const articleRows = additions.map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(`,${eol}`);
    raw = raw.replace(boundary, `,${eol}${articleRows}${eol}  }${eol}}`);
    changed = true;
}
if (!changed) console.log('Los 85 fragmentos ya están publicados; sin cambios.');
else {
    raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${manifest.revision + 1}`);
    raw = raw.replace(/("verifiedAt":\s*)"[^"]+"/, (_, prefix) => `${prefix}${JSON.stringify(new Date().toISOString())}`);
    const updated = JSON.parse(raw);
    if (updated.revision !== manifest.revision + 1 || updated.sources[sourceId]?.sha256 !== expectedSha
        || additions.some(([id]) => !updated.articles[id])) throw new Error('La validación posterior al cambio falló.');
    const temporary = `${manifestFile}.tmp`;
    writeFileSync(temporary, raw, 'utf8');
    renameSync(temporary, manifestFile);
    console.log(`Manifiesto ${manifest.revision} → ${updated.revision}; ${additions.length} fragmentos añadidos.`);
}
