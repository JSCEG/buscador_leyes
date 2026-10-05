import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const articles = JSON.parse(readFileSync('revision-acervo/sincronizacion-dacg-acceso-redes-2026-10-05/articulos-verificados.json', 'utf8'));
const instrumentId = '02442bce-c5ff-5b39-aeff-59a9d8a37a80';
const editorialId = '72237956-cba1-574a-a747-0b2a5b63f205';
const sourceId = 'dof-matutina-2024-01-23-69abcd4beaa7';
afterEach(() => vi.unstubAllGlobals());

it('maps and verifies all official loaded DACG network-access fragments to the original DOF issue', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(articles).toHaveLength(123);
    const official = articles.filter(article => article.id !== editorialId);
    expect(official).toHaveLength(122);
    expect(manifest.articles[editorialId]).toBeUndefined();
    const source = manifest.sources[sourceId];
    expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/23-01-2024/Matutina/311101');
    expect(source.instrumentIds).toContain(instrumentId);
    expect(source.sha256).toBe('69abcd4beaa791bbde64666099c23ba394e7db0f9a23ab0ef09717a34e014743');
    for (const article of official) {
        const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(result.status, article.identificador).toBe('mapped');
        expect(result.contentVerified, article.identificador).toBe(true);
        expect(result.source.id).toBe(sourceId);
        expect(result.pages.length, article.identificador).toBeGreaterThan(0);
        expect(result.pages.every(page => page.number >= 189 && page.number <= 304), article.identificador).toBe(true);
        expect(result.highlights.length, article.identificador).toBeGreaterThan(0);
    }
    for (const [id, page] of Object.entries({
        '6868bcb8-e80f-5736-993e-cad2a9d219f2': 298,
        '1ae34e5d-56a2-5c7c-9913-31eb0435cae0': 299,
        'e7218085-b8f1-5784-bc25-1628cf6a6ea8': 300,
        '9ecf87dc-1503-5a5d-8138-572e196ea480': 301,
    })) {
        expect(manifest.articles[id].pageNumbers).toEqual([page]);
    }
    const footnote = official.find(article => article.identificador === 'Nota al pie de los anexos');
    expect(manifest.articles[footnote.id].pageNumbers).toEqual([251]);
});
