import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', root)));
const data = JSON.parse(readFileSync(new URL('carga.json', root)));
const path = new URL('../../public/reader-sources/manifest.v1.json', root);
const manifest = JSON.parse(readFileSync(path));
if (manifest.sources[map.source.id] || data.articulos.length !== 22) throw Error('Fuente duplicada o cobertura incompleta');
for (const a of data.articulos) {
    const m = map.articles[a.id];
    if (manifest.articles[a.id] || !m || m.contentSha256 !== createHash('sha256').update(a.contenido).digest('hex')) throw Error('Texto no cotejado');
    for (const anchor of m.anchors) {
        const p = map.source.pages[anchor.page - 1];
        const [x0, y0, x1, y1] = anchor.bbox;
        if (!p || anchor.page < 52 || anchor.page > 79 || !(x0 >= 0 && y0 >= 0 && x1 > x0 && y1 > y0 && x1 <= p.width && y1 <= p.height)) throw Error('Ancla inválida');
    }
}
manifest.sources[map.source.id] = map.source;
Object.assign(manifest.articles, map.articles);
manifest.revision++;
manifest.verifiedAt = new Date().toISOString();
writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
console.log(`SCJN CC 137/2026: 22 apartados; revisión ${manifest.revision}`);
