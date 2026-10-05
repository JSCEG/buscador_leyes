import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const articles = JSON.parse(readFileSync('revision-acervo/sincronizacion-dacg-permisos-ga-2026-10-05/articulos-verificados.json', 'utf8'));
const indexId = '35bac1e8-52b3-50aa-bf28-4209291bfe09';
const sourceId = 'dof-matutina-2025-10-23-0314af26eb12';
afterEach(() => vi.unstubAllGlobals());

it('maps and verifies the 85 CNE permit DACG fragments that appear in the official DOF pages', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(articles).toHaveLength(86);
    const official = articles.filter(article => article.id !== indexId);
    expect(official).toHaveLength(85);
    const source = manifest.sources[sourceId];
    expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/23-10-2025/Matutina/323704');
    expect(source.instrumentIds).toContain(articles[0].ley_id);
    expect(source.sha256).toBe('0314af26eb12f95ba3de3f838b7bf8821f5a1900f5ad76fd11e42d2e7bc66a7d');
    for (const article of official) {
        const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(result.status, article.identificador).toBe('mapped');
        expect(result.contentVerified, article.identificador).toBe(true);
        expect(result.source.id).toBe(sourceId);
        expect(result.pages.every(page => page.number >= 13 && page.number <= 69), article.identificador).toBe(true);
        expect(result.highlights.length, article.identificador).toBeGreaterThan(0);
    }
    expect(resolveReaderSource(manifest, indexId).status).toBe('unmapped');
    expect(resolveReaderSource(manifest, articles[2].id).pages.map(page => page.number)).toEqual([17]);
    expect(resolveReaderSource(manifest, articles.at(-1).id).pages.map(page => page.number)).toEqual([69]);
});
