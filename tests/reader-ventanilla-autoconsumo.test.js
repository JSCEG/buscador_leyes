import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const existing = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const map = JSON.parse(readFileSync('revision-acervo/sincronizacion-ventanilla-autoconsumo-2026-10-01/map.json', 'utf8'));
const rows = JSON.parse(readFileSync('revision-acervo/sincronizacion-ventanilla-autoconsumo-2026-10-01/articulos-verificados.json', 'utf8'));
const manifest = structuredClone(existing);
manifest.sources[map.source.id] = map.source;
Object.assign(manifest.articles, map.articles);
afterEach(() => vi.unstubAllGlobals());

it('verifies every Ventanilla fragment against the official edition pages', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(map.source).toMatchObject({
        id: 'ventanilla-autoconsumo-92d7d0137e0a',
        lawId: '9ec1ad6e-375e-5248-ac10-cb9971d4424c',
        transport: 'remote-pdf',
        pageCount: 326,
        sha256: '92d7d0137e0aeab26cfddd931464f054d76591395dae42d994bc6d428cbe61f0',
        originalUrl: 'https://sidof.segob.gob.mx/notas/docFuente/5786923',
        pdfUrl: '/api/reader/ventanilla-autoconsumo-92d7d0137e0a',
    });
    expect(rows).toHaveLength(48);
    expect(Object.keys(map.articles)).toHaveLength(47);
    for (const row of rows.filter(row => map.articles[row.id])) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status, row.identificador).toBe('mapped');
        expect(result.contentVerified, row.identificador).toBe(true);
        expect(result.source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/docFuente/5786923');
        expect(result.highlights.length, row.identificador).toBeGreaterThan(0);
        expect(result.pages.map(page => page.number)).toEqual(map.articles[row.id].pageNumbers);
        for (let index = 0; index < result.pages.length; index++) {
            expect(resolveReaderSource(manifest, row.id, { pageIndex: index }).highlights.length).toBeGreaterThan(0);
        }
        expect((await getReaderSource(row.id, { articleText: `${row.contenido}.`, manifest })).reason).toBe('content-mismatch');
    }
    const annex = rows.find(row => row.identificador.startsWith('Anexo A'));
    expect(resolveReaderSource(manifest, annex.id).pages.map(page => page.number)).toEqual(Array.from({ length: 23 }, (_, index) => index + 40));
    const editorial = rows.find(row => !map.articles[row.id]);
    expect(editorial.identificador).toContain('Nota editorial');
    expect(resolveReaderSource(manifest, editorial.id).status).toBe('unmapped');
});
