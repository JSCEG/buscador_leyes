import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
const root = 'revision-acervo/cierre-mapas-2026-10-15';
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const configs = read(`${root}/config.json`);
it('verifies all 79 remaining official fragments and excludes six local editorial notes', async () => {
    vi.stubGlobal('crypto', webcrypto);
    let total = 0, excluded = 0;
    for (const config of configs) {
        const data = read(`${root}/${config.key}/carga.json`);
        const map = read(`${root}/${config.key}/map.json`);
        const manifest = { schemaVersion: 1, sources: { [map.source.id]: map.source }, articles: map.articles };
        const official = data.articulos.filter(a => !a.identificador.startsWith('Nota editorial'));
        expect(official).toHaveLength(config.officialCount);
        expect(map.source.sha256).toBe(config.pdfSha256);
        expect(map.source.originalUrl).toBe(config.pdfUrl);
        for (const a of official) {
            const result = await getReaderSource(a.id, { articleText: a.contenido, manifest });
            expect(result.status, `${config.key}: ${a.identificador}`).toBe('mapped');
            expect(result.contentVerified).toBe(true);
            const entry = map.articles[a.id];
            expect(entry.pageNumbers.every(n => n >= config.first && n <= config.last)).toBe(true);
            for (const anchor of entry.anchors) {
                const page = map.source.pages[anchor.page - 1];
                const [x0, y0, x1, y1] = anchor.bbox;
                expect(x0 >= 0 && y0 >= 0 && x1 > x0 && y1 > y0 && x1 <= page.width && y1 <= page.height).toBe(true);
            }
            total++;
        }
        const changed = await getReaderSource(official[0].id, { articleText: official[0].contenido + ' ', manifest });
        expect(changed.reason).toBe('content-mismatch');
        for (const a of data.articulos.filter(a => a.identificador.startsWith('Nota editorial'))) {
            expect(map.articles[a.id]).toBeUndefined();
            excluded++;
        }
    }
    expect(total).toBe(79);
    expect(excluded).toBe(6);
});
