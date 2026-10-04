import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const packageData = JSON.parse(readFileSync('revision-acervo/incorporacion-nom-em-008-asea-2026-10-02/NOM-EM-008-ASEA-2026-carga.json', 'utf8'));
const map = JSON.parse(readFileSync('revision-acervo/incorporacion-nom-em-008-asea-2026-10-02/map.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());

it('verifies every official NOM-EM-008 fragment against the reviewed October 2 DOF PDF', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(map.source).toMatchObject({
        id: 'dof-matutina-2026-10-02-e6d17b1ecd37',
        transport: 'remote-pdf',
        pageCount: 224,
        sha256: 'e6d17b1ecd3713cd74ab2b7f3921aafa884373526fb3a63604471e7a6abf3bef',
        originalUrl: 'https://sidof.segob.gob.mx/notas/getNewsletter/02-10-2026/Matutina/329985',
        pdfUrl: '/api/reader/dof-matutina-2026-10-02-e6d17b1ecd37',
    });
    expect(Object.keys(map.articles)).toHaveLength(147);
    expect(map.articles).toEqual(Object.fromEntries(Object.entries(manifest.articles)
        .filter(([, entry]) => entry.sourceId === map.source.id)));

    const official = packageData.articulos.filter(item => item.tipo_articulo !== 'nota');
    expect(official).toHaveLength(147);
    for (const item of official) {
        const result = await getReaderSource(item.id, { articleText: item.contenido, manifest });
        expect(result.status, item.identificador).toBe('mapped');
        expect(result.contentVerified, item.identificador).toBe(true);
        expect(result.source.originalUrl).toBe(map.source.originalUrl);
        expect(result.pages.map(page => page.number)).toEqual(map.articles[item.id].pageNumbers);
        for (let index = 0; index < result.pages.length; index++) {
            expect(resolveReaderSource(manifest, item.id, { pageIndex: index }).highlights.length)
                .toBeGreaterThan(0);
        }
        expect((await getReaderSource(item.id, { articleText: `${item.contenido}.`, manifest })).reason)
            .toBe('content-mismatch');
    }

    const editorial = packageData.articulos.find(item => item.tipo_articulo === 'nota');
    expect(editorial.identificador).toContain('Nota editorial');
    expect(resolveReaderSource(manifest, editorial.id).status).toBe('unmapped');
});
