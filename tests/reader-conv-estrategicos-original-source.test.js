import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const articles = JSON.parse(readFileSync('revision-acervo/incorporacion-convocatorias-2026-09-17/CONV-ESTRATEGICOS-carga.json', 'utf8')).articulos;
const sourceId = 'dof-vespertina-2026-05-15-c06daf5c3f72';
afterEach(() => vi.unstubAllGlobals());

it('maps and verifies all official fragments of the original strategic-projects call', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const excluded = new Set(['Nota editorial · versiones relacionadas', 'Índice de la publicación']);
    const official = articles.filter(article => !excluded.has(article.identificador));
    expect(official).toHaveLength(56);
    const source = manifest.sources[sourceId];
    expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/15-05-2026/Vespertina/327345');
    expect(source.instrumentIds).toContain('24110e92-4d4c-5434-b02a-6a1794ee65ff');
    expect(source.sha256).toBe('c06daf5c3f72e1b170cbe01cf1e213f2eab4804a6c1a1db05c7950f2be736ff7');
    for (const article of official) {
        const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(result.status, article.identificador).toBe('mapped');
        expect(result.contentVerified, article.identificador).toBe(true);
        expect(result.source.id).toBe(sourceId);
        expect(result.pages.every(page => page.number >= 20 && page.number <= 38), article.identificador).toBe(true);
        expect(result.highlights.length, article.identificador).toBeGreaterThan(0);
    }
    expect(manifest.articles[articles.find(article => article.identificador === 'Nota editorial · versiones relacionadas').id]).toBeUndefined();
    expect(manifest.articles[articles.find(article => article.identificador === 'Índice de la publicación').id]).toBeUndefined();
});
