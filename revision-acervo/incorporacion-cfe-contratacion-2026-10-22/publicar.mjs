import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('.', import.meta.url);
const data = JSON.parse(readFileSync(new URL('carga.json', root)));
const map = JSON.parse(readFileSync(new URL('map.json', root)));
const path = new URL('../../public/reader-sources/manifest.v1.json', root);
let raw = readFileSync(path, 'utf8');
const manifest = JSON.parse(raw);
if (data.length !== 9 || Object.keys(map.articles).length !== 9 || manifest.sources[map.source.id]) throw Error('Cobertura incompleta o fuente duplicada');
for (const item of data) {
    const a = item.articulos.find(a => a.orden === 1), m = map.articles[a.id];
    if (manifest.articles[a.id] || m.contentSha256 !== createHash('sha256').update(a.contenido).digest('hex')) throw Error('Texto no cotejado');
    for (const anchor of m.anchors) {
        const p = map.source.pages[anchor.page - 1];
        const [x0,y0,x1,y1] = anchor.bbox;
        if (!p || anchor.page < 155 || anchor.page > 159 || !(x0 >= 0 && y0 >= 0 && x1 > x0 && y1 > y0 && x1 <= p.width && y1 <= p.height)) throw Error('Ancla inválida');
    }
}
function endObject(start) {
    let depth = 0, quoted = false, escaped = false;
    for (let i = start; i < raw.length; i++) {
        const c = raw[i];
        if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
        else if (c === '"') quoted = true;
        else if (c === '{') depth++;
        else if (c === '}' && --depth === 0) return i;
    }
    throw Error('JSON incompleto');
}
for (const [kind, entries] of [['sources', { [map.source.id]: map.source }], ['articles', map.articles]]) {
    const open = raw.indexOf('{', raw.indexOf(`"${kind}":`)), end = endObject(open);
    const addition = Object.entries(entries).map(([id,v]) => `${JSON.stringify(id)}:${JSON.stringify(v)}`).join(',');
    raw = raw.slice(0,end) + ',' + addition + raw.slice(end);
}
raw = raw.replace(/"revision":\s*(\d+)/, (_,n) => `"revision": ${Number(n)+1}`)
    .replace(/("verifiedAt":\s*)"[^"]*"/, (_,p) => p + JSON.stringify(new Date().toISOString()));
JSON.parse(raw);
writeFileSync(path, raw);
console.log('Publicadas nueve convocatorias con una fuente PDF compartida.');
