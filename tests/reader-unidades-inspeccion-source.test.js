import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const articles = JSON.parse(readFileSync('revision-acervo/incorporacion-electricidad-2026-09-19/UNIDADES-INSPECCION-carga.json', 'utf8')).articulos;
const sourceId = 'dof-matutina-2024-05-20-ff2228046bb3';
afterEach(() => vi.unstubAllGlobals());

it('maps and verifies all official A/054/2024 inspection-unit provisions and annexes', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const official = articles.filter(article => !article.identificador.startsWith('Nota editorial'));
    expect(official).toHaveLength(56);
    const source = manifest.sources[sourceId];
    expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/20-05-2024/Matutina/313401');
    expect(source.instrumentIds).toContain('40ca1503-43de-5551-b655-704cbeeee109');
    expect(source.sha256).toBe('ff2228046bb3d69539afcb8e5e12ce20e28b5e03c657807452db5d88f20e8131');
    for (const article of official) {
        const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(result.status, article.identificador).toBe('mapped');
        expect(result.contentVerified, article.identificador).toBe(true);
        expect(result.source.id).toBe(sourceId);
        expect(result.pages.every(page => page.number >= 79 && page.number <= 117), article.identificador).toBe(true);
        expect(result.highlights.length, article.identificador).toBeGreaterThan(0);
    }
    for (const letter of 'ABCDEFG') {
        const article = official.find(row => row.identificador.startsWith(`Anexo ${letter}`));
        expect(article, `Anexo ${letter}`).toBeDefined();
        expect(manifest.articles[article.id].anchors.length, `Anexo ${letter}`).toBeGreaterThan(0);
    }
});
