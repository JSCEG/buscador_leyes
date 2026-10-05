import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const pack = JSON.parse(readFileSync(new URL('articulos-verificados.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
let raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
const instrumentId = '59bbb2ee-8d9e-5de1-a3c9-ca087286c5c9';
const officialUrl = 'https://www.cenace.gob.mx/Docs/16_MARCOREGULATORIO/SENyMEM/%28DOF%202026-04-03%20SENER%29%20DACG%20Criterios%20para%20aplicaci%C3%B3n%20Mecanismos_Competitivos_Confiabilidad%20SEN.pdf';
const expectedSha = 'd48705b079e9742cd38b920870a45d2100ebffa043b30bcff78432b54f40191e';
const expected = new Map(pack.articulos.map(article => [article.id, article]));
const ids = Object.keys(map.articles);
if (pack.ley.id !== instrumentId || pack.ley.siglas !== 'DACG-MECANISMOS-CENACE'
    || map.source.originalUrl !== officialUrl || map.source.id !== `cenace-dacg-mecanismos-2026-04-03-${expectedSha.slice(0, 12)}`
    || map.source.sha256 !== expectedSha || map.source.pageCount !== 26 || map.source.pages.length !== 26
    || expected.size !== 40 || ids.length !== expected.size || ids.some(id => !expected.has(id))
    || audit.fragmentosOficiales !== 40 || audit.paginasImpresasDelInstrumento.join(',') !== '54,79') {
    throw new Error('El mapa no cubre exactamente los 40 fragmentos oficiales cotejados.');
}
for (const [id, entry] of Object.entries(map.articles)) {
    const article = expected.get(id);
    if (entry.sourceId !== map.source.id || entry.label !== article.identificador
        || entry.type !== article.tipo_articulo
        || entry.contentSha256 !== createHash('sha256').update(article.contenido, 'utf8').digest('hex')
        || !entry.anchors.length || !entry.pageNumbers.length
        || entry.pageNumbers.some(number => number < 1 || number > 26)
        || entry.pageNumbers.some(number => !entry.anchors.some(anchor => anchor.page === number))) {
        throw new Error(`Falta cotejo/página para ${article.identificador}.`);
    }
    for (const anchor of entry.anchors) {
        const page = map.source.pages.find(item => item.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!page || ![x0, y0, x1, y1].every(Number.isFinite)
            || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)) {
            throw new Error(`Ancla fuera de página: ${article.identificador}, p. ${anchor.page}.`);
        }
    }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const oldSource = manifest.sources[map.source.id];
if (oldSource && !same(oldSource, map.source)) throw new Error('La fuente ya existe con otra huella.');
const oldMaps = Object.fromEntries(Object.entries(manifest.articles)
    .filter(([, entry]) => entry.sourceId === map.source.id));
if (Object.keys(oldMaps).length && !same(oldMaps, map.articles)) {
    throw new Error('La fuente ya tiene mapas distintos o parciales; revisar antes de sustituir.');
}
for (const [id, entry] of Object.entries(map.articles)) {
    if (manifest.articles[id] && !same(manifest.articles[id], entry)) {
        throw new Error(`El fragmento ${id} ya tiene otro mapa.`);
    }
}
const addSources = oldSource ? {} : { [map.source.id]: map.source };
const addArticles = Object.fromEntries(Object.entries(map.articles)
    .filter(([id]) => !manifest.articles[id]));
if (!Object.keys(addSources).length && !Object.keys(addArticles).length) {
    console.log('Los 40 mapas ya están publicados; sin cambios.');
} else {
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const indent = value => JSON.stringify(value, null, 2).split('\n')
        .map((line, index) => index ? `  ${line}` : line).join(eol);
    if (Object.keys(addSources).length) {
        const boundary = `${eol}  },${eol}  "articles": {`;
        if (!raw.includes(boundary)) throw new Error('No se encontró el cierre de sources.');
        const rows = Object.entries(addSources)
            .map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(`,${eol}`);
        raw = raw.replace(boundary, `,${eol}${rows}${eol}  },${eol}  "articles": {`);
    }
    if (Object.keys(addArticles).length) {
        const boundary = /\r?\n  }\r?\n}\r?\n?$/;
        if (!boundary.test(raw)) throw new Error('No se encontró el cierre de articles.');
        const rows = Object.entries(addArticles)
            .map(([id, value]) => `    ${JSON.stringify(id)}: ${indent(value)}`).join(`,${eol}`);
        raw = raw.replace(boundary, `,${eol}${rows}${eol}  }${eol}}`);
    }
    raw = raw.replace(`"revision": ${manifest.revision}`, `"revision": ${manifest.revision + 1}`)
        .replace(/("verifiedAt":\s*)"[^"]+"/, (_, prefix) => `${prefix}"${new Date().toISOString()}"`);
    JSON.parse(raw);
    writeFileSync(manifestPath, raw);
    console.log(`Manifiesto ${manifest.revision} → ${manifest.revision + 1}; fuente ${Object.keys(addSources).length}, mapas ${Object.keys(addArticles).length}.`);
}
