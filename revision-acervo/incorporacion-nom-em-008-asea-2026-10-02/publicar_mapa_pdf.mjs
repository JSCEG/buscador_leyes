import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const packageData = JSON.parse(readFileSync(new URL('NOM-EM-008-ASEA-2026-carga.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
const original = readFileSync(manifestPath, 'utf8');
let raw = original;
const manifest = JSON.parse(raw);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const expected = new Map(packageData.articulos.filter(item => item.tipo_articulo !== 'nota')
    .map(item => [item.id, item]));
const ids = Object.keys(map.articles);

if (packageData.ley.id !== '864ee23b-19ea-5c44-9b01-bd77e0320b11'
    || map.source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/02-10-2026/Matutina/329985'
    || map.source.pageCount !== 224
    || map.source.sha256 !== 'e6d17b1ecd3713cd74ab2b7f3921aafa884373526fb3a63604471e7a6abf3bef'
    || expected.size !== 147 || ids.length !== expected.size || ids.some(id => !expected.has(id))) {
    throw new Error('El mapa no cubre exactamente los fragmentos oficiales cotejados.');
}

for (const [id, entry] of Object.entries(map.articles)) {
    const item = expected.get(id);
    if (entry.sourceId !== map.source.id || entry.label !== item.identificador
        || entry.type !== item.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(item.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || JSON.stringify(entry.pageNumbers) !== JSON.stringify([...new Set(entry.pageNumbers)].sort((a, b) => a - b))) {
        throw new Error(`No coincide el ancla de ${item.identificador}.`);
    }
    for (const anchor of entry.anchors) {
        const page = map.source.pages.find(value => value.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)
            || !entry.pageNumbers.includes(anchor.page) || anchor.page < 26 || anchor.page > 61) {
            throw new Error(`Coordenada fuera del cotejo: ${item.identificador}.`);
        }
    }
    for (const pageNumber of entry.pageNumbers) {
        if (!entry.anchors.some(anchor => anchor.page === pageNumber)) {
            throw new Error(`La página ${pageNumber} carece de ancla: ${item.identificador}.`);
        }
    }
}

const oldSource = manifest.sources[map.source.id];
if (oldSource && !same(oldSource, map.source)) throw new Error('La fuente existe con otra huella.');
const oldMaps = Object.fromEntries(Object.entries(manifest.articles)
    .filter(([, entry]) => entry.sourceId === map.source.id));
if (Object.keys(oldMaps).length && !same(oldMaps, map.articles)) {
    throw new Error('La fuente ya tiene mapas parciales o distintos; revisar manualmente.');
}
for (const [id, entry] of Object.entries(map.articles)) {
    if (manifest.articles[id] && !same(manifest.articles[id], entry)) {
        throw new Error(`El fragmento ${id} ya tiene un mapa distinto.`);
    }
}

const indent = value => JSON.stringify(value, null, 2).split('\n')
    .map((line, index) => index ? `  ${line}` : line).join('\n');
const addSource = !oldSource;
const additions = Object.entries(map.articles).filter(([id]) => !manifest.articles[id]);
if (!addSource && !additions.length) {
    console.log(`Los ${expected.size} mapas de la NOM ya están publicados; sin cambios.`);
} else {
    if (addSource) {
        const boundary = '\n  },\n  "articles": {';
        if (!raw.includes(boundary)) throw new Error('No se encontró el cierre de sources.');
        raw = raw.replace(boundary, `,\n    ${JSON.stringify(map.source.id)}: ${indent(map.source)}\n  },\n  "articles": {`);
    }
    if (additions.length) {
        const boundary = /\n  }\n}\n?$/;
        if (!boundary.test(raw)) throw new Error('No se encontró el cierre de articles.');
        const rows = additions.map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(',\n');
        raw = raw.replace(boundary, `,\n${rows}\n  }\n}`);
    }
    raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${manifest.revision + 1}`);
    raw = raw.replace(/("verifiedAt":\s*)"[^"]+"/,
        (_, prefix) => prefix + JSON.stringify(new Date().toISOString()));
    const updated = JSON.parse(raw);
    if (!updated.sources[map.source.id] || ids.some(id => !updated.articles[id])) {
        throw new Error('Falló la comprobación posterior del manifiesto.');
    }
    writeFileSync(manifestPath, raw, 'utf8');
    console.log(`Agregada fuente DOF y ${additions.length} mapas NOM; revisión ${updated.revision}.`);
}
