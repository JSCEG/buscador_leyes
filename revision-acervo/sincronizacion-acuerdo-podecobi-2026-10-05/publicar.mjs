import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const rows = JSON.parse(readFileSync(new URL('articulos-verificados.json', dir), 'utf8')).articulos;
const source = map.source;
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
const manifestFile = fileURLToPath(manifestPath);
let raw = readFileSync(manifestPath, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const manifest = JSON.parse(raw);
const instrumentId = 'c05debf0-3748-4dac-9619-f1216a5fbd88';
const sourceId = 'dof-vespertina-2025-05-22-0c10b942c455';
const expectedSha = '0c10b942c45598463323464bcd2ba3fba8fb28cfd3eee2cebd31071829b6e5f4';
const expectedUrl = 'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=22052025-VES.pdf&repo=';
const labels = ['Preámbulo', ...Array.from({ length: 39 }, (_, i) => `Lineamiento ${i + 1}`), 'Transitorio Único', 'Firmas y promulgación'];
if (rows.length !== 42 || Object.keys(map.articles).length !== 42 || audit.fragmentosOficiales !== 42
    || rows.map(row => row.identificador).join('|') !== labels.join('|')
    || source.id !== sourceId || source.sha256 !== expectedSha || source.originalUrl !== expectedUrl
    || source.pageCount !== 20 || audit.paginasImpresasDelInstrumento.join(',') !== '9,20') {
    throw new Error('El cotejo no cubre los 42 fragmentos del Acuerdo PODECOBI.');
}
const expected = new Map(rows.map(row => [row.id, row]));
for (const [id, entry] of Object.entries(map.articles)) {
    const row = expected.get(id);
    if (!row || row.ley_id !== instrumentId || entry.sourceId !== sourceId
        || entry.label !== row.identificador || entry.type !== row.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(row.contenido, 'utf8').digest('hex')
        || !entry.pageNumbers.length || entry.pageNumbers.some(page => page < 9 || page > 20) || !entry.anchors.length) {
        throw new Error(`Cotejo incompleto: ${entry.label ?? id}.`);
    }
    for (const anchor of entry.anchors) {
        const page = source.pages.find(item => item.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)
            || !entry.pageNumbers.includes(anchor.page)) throw new Error(`Coordenada inválida: ${entry.label}.`);
    }
}
const indent = (value, spaces = 4) => JSON.stringify(value, null, 2).split('\n').map((line, i) => i ? `${' '.repeat(spaces)}${line}` : line).join(eol);
let changed = false;
if (manifest.sources[sourceId]) {
    const old = manifest.sources[sourceId];
    if (old.sha256 !== expectedSha || old.originalUrl !== expectedUrl || old.pageCount !== 20) {
        throw new Error('La fuente ya existe con otros metadatos.');
    }
} else {
    const articlesMarker = raw.indexOf(`${eol}  "articles": {`);
    const sourcesClose = raw.lastIndexOf(`${eol}  },`, articlesMarker);
    if (articlesMarker < 0 || sourcesClose < 0) throw new Error('No se encontró el cierre de sources.');
    const sourceRow = `    ${JSON.stringify(sourceId)}: ${indent(source, 4)}`;
    raw = raw.slice(0, sourcesClose) + `,${eol}${sourceRow}` + raw.slice(sourcesClose);
    changed = true;
}
const additions = [], replacements = [];
for (const [id, entry] of Object.entries(map.articles)) {
    const old = manifest.articles[id];
    if (!old) additions.push([id, entry]);
    else if (old.sourceId !== sourceId) throw new Error(`El fragmento ${entry.label} ya tiene otro PDF de origen.`);
    else if (JSON.stringify(old) !== JSON.stringify(entry)) replacements.push([id, old, entry]);
}
for (const [id, old, entry] of replacements) {
    const before = `    ${JSON.stringify(id)}: ${indent(old, 4)}`;
    const after = `    ${JSON.stringify(id)}: ${indent(entry, 4)}`;
    if (!raw.includes(before)) throw new Error(`No se encontró el mapa anterior de ${entry.label}.`);
    raw = raw.replace(before, after);
    changed = true;
}
if (additions.length) {
    const boundary = /\r?\n  }\r?\n}$/;
    if (!boundary.test(raw)) throw new Error('No se encontró el cierre de articles.');
    const articleRows = additions.map(([id, entry]) => `    ${JSON.stringify(id)}: ${indent(entry, 4)}`).join(`,${eol}`);
    raw = raw.replace(boundary, `,${eol}${articleRows}${eol}  }${eol}}`);
    changed = true;
}
if (changed) {
    raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${manifest.revision + 1}`);
    raw = raw.replace(/("verifiedAt":\s*)"[^"]+"/, (_, prefix) => `${prefix}${JSON.stringify(new Date().toISOString())}`);
}
const updated = JSON.parse(raw);
if (updated.revision !== manifest.revision + (changed ? 1 : 0) || updated.sources[sourceId]?.sha256 !== expectedSha
    || Object.keys(map.articles).some(id => JSON.stringify(updated.articles[id]) !== JSON.stringify(map.articles[id]))) {
    throw new Error('Validación de manifiesto posterior al cambio falló.');
}
if (changed) {
    const temporary = `${manifestFile}.tmp`;
    writeFileSync(temporary, raw, 'utf8');
    renameSync(temporary, manifestFile);
    console.log(`Manifiesto ${manifest.revision} → ${updated.revision}; ${additions.length} mapas añadidos y ${replacements.length} refinados.`);
} else console.log('Los 42 mapas ya están al día.');
