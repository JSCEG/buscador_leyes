import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const articles = JSON.parse(readFileSync('revision-acervo/incorporacion-7-2026-09-17/RICNE-carga.json', 'utf8')).articulos;
const sourceId = 'dof-matutina-2025-05-08-a6e9c6b94672';
afterEach(() => vi.unstubAllGlobals());

it('maps and verifies all loaded articles, transitories and promulgation of RICNE', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(articles).toHaveLength(48);
    const source = manifest.sources[sourceId];
    expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/08-05-2025/Matutina/320943');
    expect(source.instrumentIds).toContain('ca974945-9edf-5386-822a-c2755e66afc4');
    expect(source.sha256).toBe('a6e9c6b9467274ba697a031f1e7b38736707f1107a9ae1a4e3b5d02349f08d43');
    for (const article of articles) {
        const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(result.status, article.identificador).toBe('mapped');
        expect(result.contentVerified, article.identificador).toBe(true);
        expect(result.source.id).toBe(sourceId);
        expect(result.pages.every(page => page.number >= 4 && page.number <= 27), article.identificador).toBe(true);
        expect(result.highlights.length, article.identificador).toBeGreaterThan(0);
    }
    const signatures = articles.find(article => article.identificador === 'Firmas y promulgación');
    expect(manifest.articles[signatures.id].pageNumbers).toContain(27);
    const signatureAnchors = manifest.articles[signatures.id].anchors.filter(anchor => anchor.page === 27);
    expect(Math.max(...signatureAnchors.map(anchor => anchor.bbox[3]))).toBeLessThan(480);
});
