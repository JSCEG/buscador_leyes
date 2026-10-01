import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const existing = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const map = JSON.parse(readFileSync('revision-acervo/sincronizacion-formatos-saee-2026-10-01/map.json', 'utf8'));
const rows = JSON.parse(readFileSync('revision-acervo/sincronizacion-formatos-saee-2026-10-01/articulos-verificados.json', 'utf8'));
const manifest = structuredClone(existing);
manifest.sources[map.source.id] = map.source;
Object.assign(manifest.articles, map.articles);
afterEach(() => { vi.unstubAllGlobals(); });

it('verifies all FORMATOS-SAEE fragments against their pages in the official DOF issue', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(map.source).toMatchObject({
        id: 'formatos-saee-20260522-327465',
        lawId: '3811f946-9a03-580d-9d00-3487db4f5e5a',
        transport: 'official-image-pages',
        pageCount: 496,
        sha256: '7cefb3ae9c1b29d4d0e8188a0827060111e53cf6b1564754edbc2f43ce224ff3',
    });
    expect(rows).toHaveLength(8);
    expect(Object.keys(map.articles)).toHaveLength(8);
    for (const row of rows) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status, row.identificador).toBe('mapped');
        expect(result.contentVerified, row.identificador).toBe(true);
        expect(result.source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/docFuente/5788270');
        expect(result.highlights.length).toBeGreaterThan(0);
        for (const [index, pageNumber] of result.pages.map(page => page.number).entries()) {
            expect(pageNumber).toBe(map.articles[row.id].pageNumbers[index]);
            expect(resolveReaderSource(manifest, row.id, { pageIndex: index }).highlights.length).toBeGreaterThan(0);
        }
    }
    const formats = [
        ['CNE_ELECTRICIDAD_09', [62, 63, 64, 65, 66, 67, 68, 69]],
        ['CNE_ELECTRICIDAD_10', [70, 71, 72, 73]],
        ['CNE_ELECTRICIDAD_11', [74, 75, 76, 77, 78, 79]],
    ];
    for (const [label, pages] of formats) {
        const row = rows.find(article => article.identificador.includes(label));
        expect(resolveReaderSource(manifest, row.id).pages.map(page => page.number)).toEqual(pages);
        expect((await getReaderSource(row.id, { articleText: `${row.contenido}.`, manifest })).reason).toBe('content-mismatch');
    }
});

it('only permits the allowlisted official SIDOF page images and PDF edition', () => {
    const row = rows.find(article => article.identificador.includes('CNE_ELECTRICIDAD_09'));
    const wrongDocument = structuredClone(manifest);
    wrongDocument.sources[map.source.id].originalUrl = 'https://sidof.segob.gob.mx/notas/docFuente/5788271';
    expect(resolveReaderSource(wrongDocument, row.id).status).toBe('unmapped');

    const wrongImage = structuredClone(manifest);
    wrongImage.sources[map.source.id].pages[61].imageUrl = 'https://other.example/imagenes_diarios/Matutina/20260522-062-U-000.jpg';
    expect(resolveReaderSource(wrongImage, row.id).status).toBe('unmapped');
});
