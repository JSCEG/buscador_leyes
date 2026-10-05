import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const articles = JSON.parse(readFileSync('revision-acervo/sincronizacion-dacg-sae-2026-10-05/articulos-verificados.json', 'utf8'));
const instrumentId = 'd5562ad3-7682-4add-8cc9-7ee5994fdc1c';
const sourceId = 'dacg-cogeneracion-aa23e284c9c9';
afterEach(() => vi.unstubAllGlobals());

it('maps and content-verifies every loaded SAE DACG fragment in the shared official DOF PDF', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(articles).toHaveLength(154);
    const source = manifest.sources[sourceId];
    expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/16-04-2026/Matutina/326685');
    expect(source.instrumentIds).toContain(instrumentId);
    for (const article of articles) {
        const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(result.status, article.identificador).toBe('mapped');
        expect(result.contentVerified, article.identificador).toBe(true);
        expect(result.source.id).toBe(sourceId);
        expect(result.source.sha256).toBe('aa23e284c9c97542a96c8db5278f4694f38d0ad1f07b2081b6f0db268a93cba4');
        expect(result.pages.length, article.identificador).toBeGreaterThan(0);
        expect(result.pages.every(page => page.number >= 35 && page.number <= 57), article.identificador).toBe(true);
        expect(result.highlights.length, article.identificador).toBeGreaterThan(0);
    }
    const preamble = articles[0];
    expect(resolveReaderSource(manifest, preamble.id).pages.map(page => page.number)).toEqual([35, 36, 37, 38]);
    const signature = articles.at(-1);
    expect(signature.identificador).toBe('Firmas y promulgación');
    expect(resolveReaderSource(manifest, signature.id).pages.map(page => page.number)).toEqual([57]);
});
