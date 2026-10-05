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
const instrumentId = '3b9afd47-4363-5938-acce-300432d8575a';
const sourceId = 'dof-matutina-2026-04-27-1036c19a6f74';
const expectedSha = '1036c19a6f74f6bd1a5a5abc9fb1a4468f823c8e1d45c6a164317e8805067852';
const expected = new Map(rows.map(row => [row.id, row]));
if (rows.length !== 77 || Object.keys(map.articles).length !== 77 || audit.fragmentosMapeados !== 77
    || source.id !== sourceId || source.sha256 !== expectedSha
    || source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/27-04-2026/Matutina/326905'
    || source.pageCount !== 456) throw new Error('El mapa no cubre los 77 fragmentos del manual revisado.');
for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (!article || article.ley_id !== instrumentId || entry.sourceId !== sourceId
        || entry.label !== article.identificador || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.pageNumbers.length || entry.pageNumbers.some(page => page < 191 || page > 332) || !entry.anchors.length) {
        throw new Error(`No coincide el mapa de ${article?.identificador ?? id}.`);
    }
    for (const anchor of entry.anchors) {
        const page = source.pages.find(row => row.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)
            || !entry.pageNumbers.includes(anchor.page) || anchor.page < 191 || anchor.page > 332) {
            throw new Error(`Coordenada fuera de la edición revisada: ${entry.label}`);
        }
    }
}
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
if (!changed) console.log('Los 77 fragmentos ya están publicados; sin cambios.');
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
