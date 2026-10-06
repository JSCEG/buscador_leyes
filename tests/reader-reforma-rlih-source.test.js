import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const root = 'revision-acervo/sincronizacion-reforma-rlih-2026-10-05/';
const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const map = JSON.parse(readFileSync(`${root}map.json`, 'utf8'));
const pack = JSON.parse(readFileSync(`${root}articulos-verificados.json`, 'utf8'));
const audit = JSON.parse(readFileSync(`${root}cotejo.json`, 'utf8'));
const source = manifest.sources[map.source.id];

describe('REFORMA-RLIH official source map', () => {
    it('maps all 30 official fragments to the October 3, 2025 DOF edition', () => {
        expect(pack.ley.id).toBe('7bbbf2d1-24cd-557e-bd1e-d4b4f23ba210');
        expect(pack.articulos).toHaveLength(30);
        expect(Object.keys(map.articles)).toHaveLength(30);
        expect(audit.fragmentosOficiales).toBe(30);
        expect(audit.paginasImpresasDelInstrumento).toEqual([232, 235]);
        expect(audit.anclasGeometricas).toBeGreaterThan(150);

        for (const article of pack.articulos) {
            const entry = manifest.articles[article.id];
            expect(entry).toMatchObject({
                sourceId: map.source.id,
                label: article.identificador,
                type: article.tipo_articulo,
            });
            expect(entry.contentSha256).toBe(createHash('sha256').update(article.contenido, 'utf8').digest('hex'));
            expect(entry.pageNumbers.length).toBeGreaterThan(0);
            expect(entry.pageNumbers.every(page => page >= 232 && page <= 235)).toBe(true);
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

    it('uses the official DOF URL and its fingerprint without adding a PDF to the app', () => {
        expect(source).toMatchObject({
            instrumentIds: [pack.ley.id],
            sha256: '70701a5e439eb90fd61b55250c5802c26a6f695cfd81b1b4da2719ba2478907b',
            transport: 'remote-pdf',
            originalUrl: 'https://sidof.segob.gob.mx/notas/getNewsletter/03-10-2025/Vespertina/323363',
            pageCount: 334,
        });
        expect(manifest.revision).toBe(69);
    });
});
