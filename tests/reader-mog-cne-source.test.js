import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const articles = JSON.parse(readFileSync('revision-acervo/incorporacion-manuales-2026-09-22/MOG-CNE-carga.json', 'utf8')).articulos;
const sourceId = 'dof-matutina-2026-05-29-bc50921ecb6b';
afterEach(() => vi.unstubAllGlobals());

it('maps and verifies all 41 loaded fragments of the CNE organization manual', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(articles).toHaveLength(41);
    const source = manifest.sources[sourceId];
    expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/29-05-2026/Matutina/327605');
    expect(source.instrumentIds).toContain('b872a637-08eb-55ed-a529-9822185c86f2');
    expect(source.sha256).toBe('bc50921ecb6b6c7df79d6715d3c10eeb460ab7904667c2fcf4c4799c37258a1e');
    for (const article of articles) {
        const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(result.status, article.identificador).toBe('mapped');
        expect(result.contentVerified, article.identificador).toBe(true);
        expect(result.source.id).toBe(sourceId);
        expect(result.pages.every(page => page.number >= 86 && page.number <= 135), article.identificador).toBe(true);
        expect(result.highlights.length, article.identificador).toBeGreaterThan(0);
    }
    const organigram = articles.find(article => article.identificador.startsWith('8. ORGANIGRAMA'));
    const organigramMap = manifest.articles[organigram.id];
    expect(organigramMap.pageNumbers).toEqual([96]);
    expect(organigramMap.anchors).toHaveLength(1);
    expect(organigramMap.anchors[0].bbox).toEqual([60, 96, 735, 512]);
    const signature = articles.find(article => article.identificador === 'Firma del acuerdo');
    expect(manifest.articles[signature.id].pageNumbers).toEqual([135]);
});
