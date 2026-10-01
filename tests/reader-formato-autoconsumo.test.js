import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const existing = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const map = JSON.parse(readFileSync('revision-acervo/sincronizacion-formato-autoconsumo-2026-10-01/map.json', 'utf8'));
const rows = JSON.parse(readFileSync('revision-acervo/sincronizacion-formato-autoconsumo-2026-10-01/articulos-verificados.json', 'utf8'));
const manifest = structuredClone(existing);
manifest.sources[map.source.id] = map.source;
Object.assign(manifest.articles, map.articles);
afterEach(() => vi.unstubAllGlobals());

it('verifies each official autoconsumption-format fragment against the DOF PDF pages', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(map.source).toMatchObject({
        id: 'formato-autoconsumo-cd93c396dc04',
        lawId: 'd93c8b82-8df1-530a-a779-6ad965b9d206',
        transport: 'remote-pdf',
        pageCount: 402,
        sha256: 'cd93c396dc04a950ef45c1c150795b42f154892fb0b39252a72712115c043d8c',
        originalUrl: 'https://sidof.segob.gob.mx/notas/docFuente/5769388',
        pdfUrl: '/api/reader/formato-autoconsumo-cd93c396dc04',
    });
    expect(rows).toHaveLength(6);
    expect(Object.keys(map.articles)).toHaveLength(5);
    for (const row of rows.filter(row => map.articles[row.id])) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status, row.identificador).toBe('mapped');
        expect(result.contentVerified, row.identificador).toBe(true);
        expect(result.source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/docFuente/5769388');
        expect(result.source.pdfUrl).toBe('/api/reader/formato-autoconsumo-cd93c396dc04');
        expect(result.highlights.length, row.identificador).toBeGreaterThan(0);
        expect(result.pages.map(page => page.number)).toEqual(map.articles[row.id].pageNumbers);
        for (let index = 0; index < result.pages.length; index++) {
            expect(resolveReaderSource(manifest, row.id, { pageIndex: index }).highlights.length).toBeGreaterThan(0);
        }
        expect((await getReaderSource(row.id, { articleText: `${row.contenido}.`, manifest })).reason).toBe('content-mismatch');
    }
    const editorial = rows.find(row => !map.articles[row.id]);
    expect(editorial.identificador).toContain('Nota editorial');
    expect(resolveReaderSource(manifest, editorial.id).status).toBe('unmapped');
});
