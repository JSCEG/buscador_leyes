import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const root = 'revision-acervo/sincronizacion-aviso-programa-cenace-2026-10-05/';
const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const map = JSON.parse(readFileSync(`${root}map.json`, 'utf8'));
const pack = JSON.parse(readFileSync(`${root}articulos-verificados.json`, 'utf8'));

describe('reader AVISO-PROGRAMA-CENACE source map', () => {
    it('maps all four official fragments to printed page 189 and excludes the editorial note', () => {
        expect(pack.ley.id).toBe('f17cb3b7-0f09-5a97-8c90-47812c921dbd');
        expect(pack.articulos).toHaveLength(4);
        for (const article of pack.articulos) {
            const entry = manifest.articles[article.id];
            expect(entry.label).toBe(article.identificador);
            expect(entry.pageNumbers).toEqual([189]);
            expect(entry.anchors.length).toBeGreaterThan(0);
        }
    });

    it('uses only the pinned official DOF PDF', () => {
        const source = manifest.sources[map.source.id];
        expect(source.originalUrl).toBe('https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=30042026-MAT.pdf&repo=');
        expect(source.sha256).toBe('8c7956f18f1e1c92ae928fba2e72ab33ca5a86565116b83cf869a39ab1b2de8b');
        expect(source.instrumentIds).toEqual([pack.ley.id]);
    });
});
