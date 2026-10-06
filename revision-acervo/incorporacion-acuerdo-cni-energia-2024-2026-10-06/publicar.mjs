import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('.', import.meta.url);
const data = JSON.parse(readFileSync(new URL('CNI-ENERGIA-2024-carga.json', dir), 'utf8'));
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const expectedSha = 'fd0f00ae1f140ae00bca0e33184f51904b2522221f7d27e82219a9b952c942e8';
const lawId = '6140ced6-da1b-5e8f-9124-9db9a94bb4c5';
const sourceId = 'dof-matutina-2024-04-08-fd0f00ae1f14';
const source = manifest.sources[sourceId];
if (!source || source.sha256 !== expectedSha || source.pageCount !== 202
    || source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/08-04-2024/Matutina/312601'
    || data.ley.id !== lawId || map.source.id !== sourceId
    || audit.instrumentId !== lawId || audit.fragmentosOficiales !== 4
    || audit.paginasImpresasDelAcuerdo.join(',') !== '146,147'
    || audit.tablasPreservadas !== 1 || audit.filasDeDatosEnTabla !== 2) {
    throw new Error('La edición fuente, la paginación o el cotejo no corresponde al acuerdo CNI 2024.');
}

const expected = new Map(data.articulos.map((article) => [article.id, article]));
const ids = Object.keys(map.articles);
if (ids.length !== 4 || ids.some((id) => !expected.has(id))) {
    throw new Error('El mapa no cubre exactamente los cuatro fragmentos del acuerdo.');
}
for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    const contentHash = createHash('sha256').update(article.contenido, 'utf8').digest('hex');
    if (entry.sourceId !== sourceId || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo || entry.contentSha256 !== contentHash
        || !entry.anchors.length || !entry.pageNumbers.length
        || entry.pageNumbers.some((page) => ![146, 147].includes(page))) {
        throw new Error(`No coincide el cotejo de ${article.identificador}.`);
    }
    for (const anchor of entry.anchors) {
        const page = source.pages.find((item) => item.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)) {
            throw new Error(`Coordenada fuera de página en ${article.identificador}.`);
        }
    }
}

if (source.instrumentIds.includes(lawId) || ids.some((id) => manifest.articles[id])) {
    throw new Error('El instrumento o sus fragmentos ya están publicados en el manifiesto.');
}

// Make small, structural edits to the large manifest so existing PDF anchors
// retain their byte-for-byte formatting and float precision.
let raw = readFileSync(manifestPath, 'utf8');
function objectEnd(text, start) {
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (let index = start; index < text.length; index += 1) {
        const char = text[index];
        if (quoted) {
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === '"') quoted = false;
        } else if (char === '"') quoted = true;
        else if (char === '{') depth += 1;
        else if (char === '}') {
            depth -= 1;
            if (depth === 0) return index;
        }
    }
    throw new Error('No se pudo ubicar el cierre de un objeto JSON.');
}

const sourceKey = `"${sourceId}": {`;
const sourceStart = raw.indexOf(sourceKey);
const sourceOpen = raw.indexOf('{', sourceStart);
const sourceClose = objectEnd(raw, sourceOpen);
let sourceText = raw.slice(sourceStart, sourceClose + 1);
const instrumentMatch = sourceText.match(/"instrumentIds"\s*:\s*\[([\s\S]*?)\]/);
if (!instrumentMatch) throw new Error('No se encontró la lista de instrumentos de la edición.');
const sourceInstrumentIds = JSON.parse(`[${instrumentMatch[1]}]`);
if (sourceInstrumentIds.includes(lawId)) throw new Error('El instrumento ya está vinculado a esta edición.');
const instrumentArray = `"instrumentIds": [\n${[...sourceInstrumentIds, lawId]
    .map((id) => `      ${JSON.stringify(id)}`).join(',\n')}\n    ]`;
sourceText = sourceText.replace(instrumentMatch[0], instrumentArray);
raw = raw.slice(0, sourceStart) + sourceText + raw.slice(sourceClose + 1);

const articlesKey = '"articles":';
const articlesStart = raw.indexOf(articlesKey);
const articlesOpen = raw.indexOf('{', articlesStart);
const articlesClose = objectEnd(raw, articlesOpen);
const lastEntryClose = raw.lastIndexOf('\n    }', articlesClose);
if (lastEntryClose < 0) throw new Error('No se encontró el último mapa existente.');
const additions = ids.map((id) => {
    const value = JSON.stringify(map.articles[id], null, 2).replace(/\n/g, '\n    ');
    return `    ${JSON.stringify(id)}: ${value}`;
}).join(',\n');
const insertion = lastEntryClose + '\n    }'.length;
raw = `${raw.slice(0, insertion)},\n${additions}${raw.slice(insertion)}`;
JSON.parse(raw);
writeFileSync(manifestPath, raw, 'utf8');
console.log(`Mapa CNI incorporado: ${ids.length} fragmentos, páginas 146–147 de la edición DOF cotejada.`);
