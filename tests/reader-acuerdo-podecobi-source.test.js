import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const root = 'revision-acervo/sincronizacion-acuerdo-podecobi-2026-10-05/';
const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const map = JSON.parse(readFileSync(`${root}map.json`, 'utf8'));
const pack = JSON.parse(readFileSync(`${root}articulos-verificados.json`, 'utf8'));
const audit = JSON.parse(readFileSync(`${root}cotejo.json`, 'utf8'));
const source = manifest.sources[map.source.id];

describe('PODECOBI official source map', () => {
    it('maps all 39 lineamientos, preamble, sole transitory and signatures to the DOF issue', () => {
        expect(pack.articulos).toHaveLength(42);
        expect(Object.keys(map.articles)).toHaveLength(42);
        expect(audit.fragmentosOficiales).toBe(42);
        expect(pack.articulos.map(row => row.identificador)).toEqual([
            'Preámbulo', ...Array.from({ length: 39 }, (_, index) => `Lineamiento ${index + 1}`),
            'Transitorio Único', 'Firmas y promulgación',
        ]);
        for (const row of pack.articulos) {
            const entry = manifest.articles[row.id];
            expect(entry).toMatchObject({
                sourceId: map.source.id,
                label: row.identificador,
                type: row.tipo_articulo,
            });
            expect(entry.contentSha256).toBe(createHash('sha256').update(row.contenido, 'utf8').digest('hex'));
            expect(entry.pageNumbers.length).toBeGreaterThan(0);
            expect(entry.pageNumbers.every(page => page >= 9 && page <= 20)).toBe(true);
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
        expect(audit.fragmentos.every(row => row.textoCompletoCotejado === true)).toBe(true);
    });

    it('uses only the hash-verified official DOF edition PDF as its remote source', () => {
        expect(source).toMatchObject({
            instrumentIds: [pack.ley.id],
            sha256: '0c10b942c45598463323464bcd2ba3fba8fb28cfd3eee2cebd31071829b6e5f4',
            transport: 'remote-pdf',
            originalUrl: 'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=22052025-VES.pdf&repo=',
            pageCount: 20,
        });
        expect(audit.paginasImpresasDelInstrumento).toEqual([9, 20]);
    });
});
