import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', dir);
let raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
const indent = value => JSON.stringify(value, null, 2).split('\n').map((line, i) => i ? `  ${line}` : line).join('\n');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let changed = false;

if (manifest.sources[map.source.id]) {
    if (!same(manifest.sources[map.source.id], map.source)) throw new Error('El origen ya existe con otra huella.');
} else {
    const boundary = '\n  },\n  "articles": {';
    if (!raw.includes(boundary)) throw new Error('No se encontró el cierre de sources.');
    raw = raw.replace(boundary, `,\n    "${map.source.id}": ${indent(map.source)}\n  },\n  "articles": {`);
    changed = true;
}

const additions = Object.entries(map.articles).filter(([id, value]) => {
    if (manifest.articles[id]) {
        if (!same(manifest.articles[id], value)) throw new Error(`El fragmento ${id} ya existe con otro mapa.`);
        return false;
    }
    return true;
});
if (additions.length) {
    const boundary = /\n  }\n}\n$/;
    if (!boundary.test(raw)) throw new Error('No se encontró el cierre de articles.');
    const rows = additions.map(([id, value]) => `    "${id}": ${indent(value)}`).join(',\n');
    raw = raw.replace(boundary, `,\n${rows}\n  }\n}\n`);
    changed = true;
}

if (!changed) {
    console.log('VENTANILLA-AUTOCONSUMO ya está publicado en el manifiesto.');
} else {
    manifest.revision += 1;
    raw = raw.replace(/"revision": \d+/, `"revision": ${manifest.revision}`);
    raw = raw.replace(/"verifiedAt": "[^"]+"/, `"verifiedAt": "${new Date().toISOString()}"`);
    const updated = JSON.parse(raw);
    if (!updated.sources[map.source.id] || Object.keys(map.articles).some(id => !updated.articles[id])) {
        throw new Error('La validación posterior al cambio falló.');
    }
    writeFileSync(manifestPath, raw.replace(/\r?\n/g, '\n'), 'utf8');
    console.log(`Publicados ${additions.length} fragmentos VENTANILLA-AUTOCONSUMO; revisión ${updated.revision}.`);
}
