import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const root = 'revision-acervo/sincronizacion-reforma-lih-2026-10-05/';
const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const map = JSON.parse(readFileSync(`${root}map.json`, 'utf8'));
const pack = JSON.parse(readFileSync(`${root}articulos-verificados.json`, 'utf8'));
const audit = JSON.parse(readFileSync(`${root}cotejo.json`, 'utf8'));
const source = manifest.sources[map.source.id];

describe('REFORMA-LIH official source map', () => {
    it('maps all 41 official fragments to the March 18, 2025 DOF edition', () => {
        expect(pack.ley.id).toBe('6e4c2d90-0ad2-5c47-a0e0-ed132f09415c');
        expect(pack.articulos).toHaveLength(41);
        expect(Object.keys(map.articles)).toHaveLength(41);
        expect(audit.fragmentosOficiales).toBe(41);
        expect(audit.paginasImpresasDelInstrumento).toEqual([260, 268]);
        expect(audit.anclasGeometricas).toBeGreaterThan(400);

        for (const article of pack.articulos) {
            const entry = manifest.articles[article.id];
            expect(entry).toMatchObject({
                sourceId: map.source.id,
                label: article.identificador,
                type: article.tipo_articulo,
            });
            expect(entry.contentSha256).toBe(createHash('sha256').update(article.contenido, 'utf8').digest('hex'));
            expect(entry.pageNumbers.length).toBeGreaterThan(0);
            expect(entry.pageNumbers.every(page => page >= 260 && page <= 268)).toBe(true);
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

    it('reuses the exact DOF PDF source already registered for this edition', () => {
        expect(source).toMatchObject({
            sha256: 'ed57fbef06b46f37d53ca1caea856f4eb3b0d2d316c6e7bb7e837daa001708a3',
            transport: 'remote-pdf',
            originalUrl: 'https://sidof.segob.gob.mx/notas/getNewsletter/18-03-2025/Vespertina/320062',
            pageCount: 270,
        });
        expect(source.instrumentIds).toContain(pack.ley.id);
        expect(manifest.revision).toBe(68);
    });
});
