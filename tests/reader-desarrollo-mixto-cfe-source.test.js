import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const root = 'revision-acervo/sincronizacion-desarrollo-mixto-cfe-2026-10-05/';
const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const map = JSON.parse(readFileSync(`${root}map.json`, 'utf8'));
const pack = JSON.parse(readFileSync(`${root}articulos-verificados.json`, 'utf8'));
const audit = JSON.parse(readFileSync(`${root}cotejo.json`, 'utf8'));
const source = manifest.sources[map.source.id];

describe('CFE mixed-development official source map', () => {
    it('maps all 30 fragments and preserves the three verified tables', () => {
        expect(pack.ley.id).toBe('d4b231b0-6b12-5dbe-b003-a6986814c000');
        expect(pack.articulos).toHaveLength(30);
        expect(Object.keys(map.articles)).toHaveLength(30);
        expect(audit.fragmentosOficiales).toBe(30);
        expect(audit.paginasImpresasDelInstrumento).toEqual([65, 84]);
        expect(audit.tablasVerificadas).toBe(3);
        expect(audit.celdasVerificadas).toBe(216);
        expect(audit.anclasGeometricas).toBeGreaterThan(1400);

        const tableRows = pack.articulos.filter(article => /<table\b/i.test(article.contenido));
        expect(tableRows).toHaveLength(3);
        expect(tableRows.reduce((sum, article) => sum + (article.contenido.match(/<(?:td|th)\b/gi) ?? []).length, 0)).toBe(216);

        for (const article of pack.articulos) {
            const entry = manifest.articles[article.id];
            expect(entry).toMatchObject({
                sourceId: map.source.id,
                label: article.identificador,
                type: article.tipo_articulo,
            });
            expect(entry.contentSha256).toBe(createHash('sha256').update(article.contenido, 'utf8').digest('hex'));
            expect(entry.pageNumbers.length).toBeGreaterThan(0);
            expect(entry.pageNumbers.every(page => page >= 65 && page <= 84)).toBe(true);
            expect(entry.anchors.length).toBeGreaterThan(0);
            for (const anchor of entry.anchors) {
                const page = source.pages.find(item => item.number === anchor.page);
                expect(page).toBeDefined();
                expect(anchor.bbox).toHaveLength(4);
                expect(anchor.bbox.every(Number.isFinite)).toBe(true);
                expect(anchor.bbox[0]).toBeGreaterThanOrEqual(0);
                expect(anchor.bbox[2]).toBeLessThanOrEqual(page.width);
                expect(anchor.bbox[1]).toBeGreaterThanOrEqual(0);
                expect(anchor.bbox[3]).toBeLessThanOrEqual(page.height);
            }
        }
    });

    it('points to the hash-verified official January 28, 2026 DOF PDF', () => {
        expect(source).toMatchObject({
            instrumentIds: [pack.ley.id],
            sha256: 'b76dbe009e39723956037613bbfa882de1370c54e968bd45b97ba5a8fabd212c',
            transport: 'remote-pdf',
            originalUrl: 'https://sidof.segob.gob.mx/notas/getNewsletter/28-01-2026/Matutina/325425',
            pageCount: 342,
        });
        expect(manifest.revision).toBe(70);
    });
});
