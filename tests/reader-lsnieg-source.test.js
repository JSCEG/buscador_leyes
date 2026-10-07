import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const packageData = JSON.parse(readFileSync('revision-acervo/incorporacion-ley-snieg-2025-10-07/LSNIEG-carga.json', 'utf8'));

it('maps all consolidated LSNIEG articles to their official Diputados PDF pages', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const { source, articulos } = packageData;
    expect(articulos).toHaveLength(143);
    expect(articulos.filter(article => article.tipo_articulo === 'transitorio')).toHaveLength(17);
    expect(source.originalUrl).toBe('https://www.diputados.gob.mx/LeyesBiblio/pdf/LSNIEG.pdf');
    expect(source.transport).toBe('remote-pdf');
    expect(source.pageCount).toBe(67);
    expect(source.instrumentIds).toContain(packageData.ley.id);

    for (const article of articulos) {
        const mapping = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(mapping.status, article.identificador).toBe('mapped');
        expect(mapping.contentVerified, article.identificador).toBe(true);
        expect(mapping.source.id).toBe(source.id);
        expect(mapping.highlights.length, article.identificador).toBeGreaterThan(0);
        expect(mapping.pages.every(page => page.number <= 42), article.identificador).toBe(true);
    }

    const lastArticle = articulos.find(article => article.identificador === 'Artículo 126');
    expect(resolveReaderSource(manifest, lastArticle.id).pages.map(page => page.number))
        .toEqual(packageData.auditoria.fragmentos.find(row => row.id === lastArticle.id).paginasPdf);
    const stale = await getReaderSource(lastArticle.id, { articleText: `${lastArticle.contenido} `, manifest });
    expect(stale.reason).toBe('content-mismatch');
});
