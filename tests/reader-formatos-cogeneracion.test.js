import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const existing = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const map = JSON.parse(readFileSync('revision-acervo/sincronizacion-formatos-cogeneracion-2026-09-30/map.json', 'utf8'));
const rows = JSON.parse(readFileSync('revision-acervo/sincronizacion-formatos-cogeneracion-2026-09-30/articulos-verificados.json', 'utf8'));
const manifest = structuredClone(existing);
manifest.sources[map.source.id] = map.source;
Object.assign(manifest.articles, map.articles);
afterEach(() => { vi.unstubAllGlobals(); });

it('verifies all official cogeneration formats and directs each fragment to the DOF page image', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(map.source.transport).toBe('official-image-pages');
    expect(map.source.pageCount).toBe(496);
    expect(map.source.pages).toHaveLength(496);
    const mappedRows = rows.filter(row => Object.hasOwn(map.articles, row.id));
    expect(mappedRows).toHaveLength(7);
    for (const row of mappedRows) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status, row.identificador).toBe('mapped');
        expect(result.contentVerified, row.identificador).toBe(true);
        expect(result.source.lawId).toBe(row.ley_id);
        expect(result.source.pdfUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/22-05-2026/Matutina/327465');
        expect(result.highlights.length, row.identificador).toBeGreaterThan(0);
        for (const [index, pageNumber] of result.pages.map(page => page.number).entries()) {
            expect(pageNumber).toBe(map.articles[row.id].pageNumbers[index]);
            const page = resolveReaderSource(manifest, row.id, { pageIndex: index });
            expect(page.status).toBe('mapped');
            expect(page.page.imageUrl).toMatch(/^https:\/\/sidof\.segob\.gob\.mx\/imagenes_diarios\/Matutina\/20260522-/);
            expect(page.highlights.length).toBeGreaterThan(0);
        }
    }
    const editorial = rows.find(row => row.identificador.startsWith('Nota editorial'));
    expect(resolveReaderSource(manifest, editorial.id).status).toBe('unmapped');
    const format07 = rows.find(row => row.identificador.includes('ELECTRICIDAD_07'));
    expect(resolveReaderSource(manifest, format07.id).pages.map(page => page.number)).toEqual([82, 83, 84, 85, 86, 87, 88]);
    const format08 = rows.find(row => row.identificador.includes('ELECTRICIDAD_08'));
    expect(resolveReaderSource(manifest, format08.id).pages.map(page => page.number)).toEqual([89, 90, 91, 92, 93]);
    expect((await getReaderSource(format07.id, { articleText: `${format07.contenido}.`, manifest })).reason).toBe('content-mismatch');
});

it('rejects modified hosts, image paths, editions and article image URLs', () => {
    const row = rows.find(article => article.identificador.includes('ELECTRICIDAD_07'));
    const modified = structuredClone(manifest);
    modified.sources[map.source.id].pages[81].imageUrl = 'https://evil.example/20260522-082-U-000.jpg';
    expect(resolveReaderSource(modified, row.id).status).toBe('unmapped');

    const alternateEdition = structuredClone(manifest);
    alternateEdition.sources[map.source.id].pdfUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/otra-edicion.pdf';
    expect(resolveReaderSource(alternateEdition, row.id).status).toBe('unmapped');

    const malformed = structuredClone(manifest);
    malformed.sources[map.source.id].pages[81].imageUrl = 'http://sidof.segob.gob.mx/imagenes_diarios/Matutina/20260522-082-U-000.jpg';
    expect(resolveReaderSource(malformed, row.id).status).toBe('unmapped');
});
