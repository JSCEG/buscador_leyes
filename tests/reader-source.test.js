import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, loadReaderSources, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const loaded = JSON.parse(readFileSync('revision-acervo/incorporacion-7-2026-09-17/LCNE-carga.json', 'utf8'));
const cenace = JSON.parse(readFileSync('revision-acervo/incorporacion-cenace-2026-09-20/PROGRAMA-CENACE-carga.json', 'utf8'));
const article2 = loaded.articulos.find(row => row.identificador === 'Artículo 2');
const copy = value => JSON.parse(JSON.stringify(value));
afterEach(() => { vi.unstubAllGlobals(); });

it('verifies all 335 RLSE fragments against the reviewed regulation PDF', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const rows = JSON.parse(readFileSync('revision-acervo/sincronizacion-rlse-2026-09-22/articulos-verificados.json', 'utf8'));
    expect(rows).toHaveLength(335);
    for (const row of rows) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status, row.identificador).toBe('mapped');
        expect(result.contentVerified).toBe(true);
        expect(result.source.lawId).toBe(row.ley_id);
        expect(result.source.originalUrl).toBe('https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LSE.pdf');
        for (let pageIndex = 0; pageIndex < result.pages.length; pageIndex++) {
            expect(resolveReaderSource(manifest, row.id, { pageIndex }).highlights.length).toBeGreaterThan(0);
        }
    }
    const article = rows.find(row => row.identificador === 'Artículo 2');
    expect(resolveReaderSource(manifest, article.id).pages.map(p => p.number)).toEqual([1, 2, 3, 4]);
    expect((await getReaderSource(article.id, { articleText: article.contenido + '.', manifest })).reason).toBe('content-mismatch');
});

it('verifies all 207 live LSE fragments and their complete multi-page mappings', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const rows = JSON.parse(readFileSync('revision-acervo/sincronizacion-lse-2026-09-22/articulos-verificados.json', 'utf8'));
    expect(rows).toHaveLength(207);
    for (const row of rows) {
        const first = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(first.status, row.identificador).toBe('mapped');
        expect(first.contentVerified).toBe(true);
        expect(first.source.lawId).toBe(row.ley_id);
        expect(first.source.transport).toBe('remote-pdf');
        for (let pageIndex = 0; pageIndex < first.pages.length; pageIndex++) {
            const page = resolveReaderSource(manifest, row.id, { pageIndex });
            expect(page.status).toBe('mapped');
            expect(page.highlights.length).toBeGreaterThan(0);
        }
    }
    const first = rows.find(row => row.identificador === 'Artículo 1');
    expect(resolveReaderSource(manifest, first.id).pages.map(page => page.number)).toEqual([1, 2]);
    expect((await getReaderSource(first.id, { articleText: first.contenido + '.', manifest })).reason).toBe('content-mismatch');
});

it('maps all 48 reviewed UUIDs to the exact official PDF without published page images', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(Object.values(manifest.articles).filter(article => manifest.sources[article.sourceId].lawId === loaded.articulos[0].ley_id)).toHaveLength(48);
    for (const row of loaded.articulos) {
        const mapping = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(mapping.status, row.identificador).toBe('mapped');
        expect(mapping.contentVerified).toBe(true);
        expect(mapping.source.lawId).toBe(row.ley_id);
        expect(mapping.highlights.length).toBeGreaterThan(0);
        for (const rectangle of mapping.highlights) {
            expect(rectangle.x).toBeGreaterThanOrEqual(0);
            expect(rectangle.y).toBeGreaterThanOrEqual(0);
            expect(rectangle.x + rectangle.width).toBeLessThanOrEqual(100);
            expect(rectangle.y + rectangle.height).toBeLessThanOrEqual(100);
        }
    }
    const source = Object.values(manifest.sources)[0];
    expect(source.sha256).toBe(loaded.fuente.sha256);
    expect(source.transport).toBe('remote-pdf');
    expect(source.pdfUrl).toBe(`/api/reader/${source.id}`);
    expect(source.pages).toHaveLength(20);
    for (const page of source.pages) expect(page.imageUrl).toBeUndefined();
});

it('maps all CENACE sections and keeps each indicator with its two original pages', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const source = Object.values(manifest.sources).find(s => s.lawId === cenace.ley.id);
    expect(source.originalUrl).toBe('https://dof.gob.mx/2026/CENACE/ProgramaInstitucional.pdf');
    expect(source.sha256).toBe(cenace.fuente.sha256);
    expect(source.pages).toHaveLength(52);
    expect(source.pages.every(page => !page.imageUrl)).toBe(true);
    const rows = cenace.articulos.filter(a => a.tipo_articulo !== 'complementario');
    expect(rows).toHaveLength(32);
    for (const row of rows) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status, row.identificador).toBe('mapped');
        expect(result.contentVerified).toBe(true);
        expect(result.source.lawId).toBe(cenace.ley.id);
    }
    const expectedPages = [[44, 45], [46, 47], [48, 49], [50, 51]];
    const indicators = rows.filter(a => a.identificador.startsWith('Indicador '));
    expect(indicators).toHaveLength(4);
    indicators.forEach((row, index) => expect(resolveReaderSource(manifest, row.id).pages.map(p => p.number)).toEqual(expectedPages[index]));
    expect(resolveReaderSource(manifest, cenace.articulos[0].id).status).toBe('unmapped');
});

it('keeps multi-page article boundaries and positions within each actual page dimensions', () => {
    const first = resolveReaderSource(manifest, article2.id);
    const second = resolveReaderSource(manifest, article2.id, { pageIndex: 1 });
    expect(first.pages.map(page => page.number)).toEqual([1, 2]);
    expect(first.page.number).toBe(1);
    expect(second.page.number).toBe(2);
    expect(second.pdfUrl).toBe(`${loaded.fuente.url}#page=2`);
    expect(first.highlights).not.toEqual(second.highlights);
    expect(resolveReaderSource(manifest, article2.id, { pageIndex: -3 }).pageIndex).toBe(0);
    expect(resolveReaderSource(manifest, article2.id, { pageIndex: 99 }).pageIndex).toBe(1);
    expect(resolveReaderSource(manifest, article2.id, { pageIndex: NaN }).pageIndex).toBe(0);
});

it('disables precision after any current text change, including equal-length edits', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const changedText = article2.contenido.replace('Comisión', 'comisión');
    const result = await getReaderSource(article2.id, { manifest, articleText: changedText });
    expect(result).toMatchObject({ status: 'unmapped', reason: 'content-mismatch', page: null, pdfUrl: null, highlights: [] });
    expect(result.originalUrl).toBe(loaded.fuente.url);
    expect((await getReaderSource(article2.id, { manifest })).reason).toBe('missing-content');
    vi.stubGlobal('crypto', {});
    expect((await getReaderSource(article2.id, { manifest, articleText: article2.contenido })).reason).toBe('verification-unavailable');
});

it('falls back to a safe official link for unknown articles without guessing by article number', () => {
    expect(resolveReaderSource(manifest, 'LCNE-Art-002', { originalUrl: loaded.fuente.url }))
        .toMatchObject({ status: 'unmapped', reason: 'no-traceability', originalUrl: loaded.fuente.url, pages: [], highlights: [] });
    expect(resolveReaderSource(manifest, 'unknown', { originalUrl: 'javascript:alert(1)' }).originalUrl).toBeNull();
    expect(resolveReaderSource(manifest, 'unknown', { originalUrl: 'https://name:secret@example.com/source.pdf' }).originalUrl).toBeNull();
    expect(resolveReaderSource(manifest, '__proto__').status).toBe('unmapped');
});

it('rejects broken coordinates and unsafe asset paths instead of displaying false precision', () => {
    const outsidePage = copy(manifest);
    outsidePage.articles[article2.id].anchors[0].bbox[2] = 100000;
    expect(resolveReaderSource(outsidePage, article2.id).reason).toBe('invalid-traceability');
    const badImage = copy(manifest);
    Object.values(badImage.sources)[0].pdfUrl = 'https://outside.invalid/tracking.pdf';
    expect(resolveReaderSource(badImage, article2.id).reason).toBe('invalid-traceability');
    const noDimensions = copy(manifest);
    Object.values(noDimensions.sources)[0].pages[0].width = 0;
    expect(resolveReaderSource(noDimensions, article2.id).reason).toBe('invalid-traceability');
});

it('fetches metadata only, and rejects unavailable or incompatible manifests', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => manifest });
    expect(await loadReaderSources({ fetcher })).toBe(manifest);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe('/reader-sources/manifest.v1.json');
    await expect(loadReaderSources({ fetcher: async () => ({ ok: false }) })).rejects.toThrow();
    await expect(loadReaderSources({ fetcher: async () => ({ ok: true, json: async () => ({ schemaVersion: 99 }) }) })).rejects.toThrow();
});
