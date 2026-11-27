import {applyTableCorrections} from './support/table-corrections.js';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const packageData = JSON.parse(readFileSync('revision-acervo/incorporacion-nom-em-009-asea-2026-10-05/NOM-EM-009-ASEA-2026-carga.json', 'utf8'));
const map = JSON.parse(readFileSync('revision-acervo/incorporacion-nom-em-009-asea-2026-10-05/map.json', 'utf8'));
applyTableCorrections(packageData.articulos,map);
// La revisión de noviembre se aplica sobre la de tablas de octubre.
const auditFolder = 'revision-acervo/cotejo-asea-snieg-2026-11-27';
const reviewedMap = JSON.parse(readFileSync(`${auditFolder}/map.json`, 'utf8')).articles;
const reviewedTexts = JSON.parse(readFileSync(`${auditFolder}/textos.json`, 'utf8'));
for (const item of packageData.articulos) {
    if (Object.hasOwn(reviewedMap, item.id)) {
        map.articles[item.id] = reviewedMap[item.id];
        item.contenido = reviewedTexts[item.id];
    }
}
afterEach(() => vi.unstubAllGlobals());

it('keeps the verified text and complete highlight for all five November corrections', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(Object.keys(reviewedTexts)).toHaveLength(5);
    expect(Object.keys(reviewedMap).sort()).toEqual(Object.keys(reviewedTexts).sort());
    for (const [id, articleText] of Object.entries(reviewedTexts)) {
        expect(manifest.articles[id]).toEqual(reviewedMap[id]);
        const result = await getReaderSource(id, { articleText, manifest });
        expect(result.contentVerified).toBe(true);
        expect(result.highlights).toHaveLength(reviewedMap[id].anchors.length);
    }
});

it('verifies each NOM-EM-009 fragment against the October 5 official DOF PDF', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(map.source).toMatchObject({
        id: 'dof-matutina-2026-10-05-83c8aaff9f11',
        transport: 'remote-pdf',
        pageCount: 328,
        sha256: '83c8aaff9f1162268aebcc63cf38106e82c5242d9a9f8dc101575bc5849eec49',
        originalUrl: 'https://sidof.segob.gob.mx/notas/getNewsletter/05-10-2026/Matutina/330025',
        pdfUrl: '/api/reader/dof-matutina-2026-10-05-83c8aaff9f11',
    });
    expect(Object.keys(map.articles)).toHaveLength(245);
    expect(map.articles).toEqual(Object.fromEntries(Object.entries(manifest.articles)
        .filter(([, entry]) => entry.sourceId === map.source.id)));

    const official = packageData.articulos.filter(item => item.tipo_articulo !== 'nota');
    expect(official).toHaveLength(245);
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
