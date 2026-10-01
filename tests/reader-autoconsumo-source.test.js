import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const existing = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const map = JSON.parse(readFileSync('revision-acervo/sincronizacion-autoconsumo-2026-10-01/map.json', 'utf8'));
const rows = JSON.parse(readFileSync('revision-acervo/sincronizacion-autoconsumo-2026-10-01/articulos-verificados.json', 'utf8'));
const manifest = structuredClone(existing);
manifest.sources[map.source.id] = map.source;
Object.assign(manifest.articles, map.articles);
afterEach(() => vi.unstubAllGlobals());

it('verifies every official autoconsumption requirement fragment against DOF pages', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(map.source).toMatchObject({
        id: 'autoconsumo-0-7-20-47b9e25c4def',
        lawId: '156449fb-698e-59bf-a9e1-06f1e9dafa85',
        transport: 'remote-pdf',
        pageCount: 524,
        sha256: '47b9e25c4def3e17c37434fb2344a76d9fc0f34cf34144b4cd4f423c492be27d',
        originalUrl: 'https://sidof.segob.gob.mx/notas/docFuente/5764827',
        pdfUrl: '/api/reader/autoconsumo-0-7-20-47b9e25c4def',
    });
    expect(rows).toHaveLength(9);
    expect(Object.keys(map.articles)).toHaveLength(8);
    for (const row of rows.filter(row => map.articles[row.id])) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status, row.identificador).toBe('mapped');
        expect(result.contentVerified, row.identificador).toBe(true);
        expect(result.source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/docFuente/5764827');
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
