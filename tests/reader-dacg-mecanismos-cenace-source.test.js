// @vitest-environment node
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const root = 'revision-acervo/sincronizacion-dacg-mecanismos-cenace-2026-10-05/';
const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const map = JSON.parse(readFileSync(`${root}map.json`, 'utf8'));
const pack = JSON.parse(readFileSync(`${root}articulos-verificados.json`, 'utf8'));
const audit = JSON.parse(readFileSync(`${root}cotejo.json`, 'utf8'));
afterEach(() => vi.unstubAllGlobals());

describe('reader DACG-MECANISMOS-CENACE source map', () => {
    it('maps all 40 official fragments to their verified pages and excludes the editorial note', async () => {
        vi.stubGlobal('crypto', webcrypto);
        expect(pack.ley.id).toBe('59bbb2ee-8d9e-5de1-a3c9-ca087286c5c9');
        expect(pack.articulos).toHaveLength(40);
        expect(Object.keys(map.articles)).toHaveLength(40);
        expect(Object.keys(map.articles).sort()).toEqual(pack.articulos.map(article => article.id).sort());
        for (const article of pack.articulos) {
            const entry = manifest.articles[article.id];
            expect(entry.label).toBe(article.identificador);
            expect(entry.pageNumbers.length).toBeGreaterThan(0);
            expect(entry.anchors.length).toBeGreaterThan(0);
            expect(entry.pageNumbers.every(page => page >= 1 && page <= 26)).toBe(true);
            const resolved = resolveReaderSource(manifest, article.id);
            expect(resolved.status).toBe('mapped');
            expect(resolved.pages.map(page => page.number)).toEqual(entry.pageNumbers);
            expect((await getReaderSource(article.id, { articleText: article.contenido, manifest })).contentVerified).toBe(true);
        }
        expect(audit.fragmentosOficiales).toBe(40);
        expect(audit.paginasImpresasDelInstrumento).toEqual([54, 79]);
    });

    it('pins the exact official CENACE PDF and its edition hash', () => {
        const source = manifest.sources[map.source.id];
        expect(source.originalUrl).toBe('https://www.cenace.gob.mx/Docs/16_MARCOREGULATORIO/SENyMEM/%28DOF%202026-04-03%20SENER%29%20DACG%20Criterios%20para%20aplicaci%C3%B3n%20Mecanismos_Competitivos_Confiabilidad%20SEN.pdf');
        expect(source.sha256).toBe('d48705b079e9742cd38b920870a45d2100ebffa043b30bcff78432b54f40191e');
        expect(source.pageCount).toBe(26);
        expect(source.instrumentIds).toEqual([pack.ley.id]);
    });
});
