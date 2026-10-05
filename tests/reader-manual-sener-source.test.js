import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const articles = JSON.parse(readFileSync('revision-acervo/sincronizacion-manual-organizacion-sener-2026-10-05/articulos-verificados.json', 'utf8'));
const sourceId = 'dof-matutina-2026-04-27-1036c19a6f74';
afterEach(() => vi.unstubAllGlobals());

it('maps and verifies all loaded Manual de Organización General de SENER fragments', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(articles).toHaveLength(77);
    const source = manifest.sources[sourceId];
    expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/27-04-2026/Matutina/326905');
    expect(source.instrumentIds).toContain(articles[0].ley_id);
    expect(source.sha256).toBe('1036c19a6f74f6bd1a5a5abc9fb1a4468f823c8e1d45c6a164317e8805067852');
    for (const article of articles) {
        const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(result.status, article.identificador).toBe('mapped');
        expect(result.contentVerified, article.identificador).toBe(true);
        expect(result.source.id).toBe(sourceId);
        expect(result.pages.every(page => page.number >= 191 && page.number <= 332), article.identificador).toBe(true);
        expect(result.highlights.length, article.identificador).toBeGreaterThan(0);
    }
    const org = articles.find(article => article.identificador === '7. ORGANIGRAMA.');
    expect(resolveReaderSource(manifest, org.id).pages.map(page => page.number)).toEqual([221]);
    expect(resolveReaderSource(manifest, articles[0].id).pages[0].number).toBe(191);
});
