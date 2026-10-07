import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
import { serveReaderPdf } from '../server/reader-pdf.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const data = JSON.parse(readFileSync('revision-acervo/incorporacion-acervo-iin-2026-10-07/carga.json', 'utf8'));

it('maps all Acervo IIN provisions, including the reformed clause and multipage definitions', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(data.articulos).toHaveLength(43);
    expect(data.articulos.filter(a => a.tipo_articulo === 'transitorio')).toHaveLength(6);
    for (const article of data.articulos) {
        const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(result.status, article.identificador).toBe('mapped');
        expect(result.contentVerified).toBe(true);
        expect(result.source.id).toBe(data.source.id);
    }
    const definitions = data.articulos.find(a => a.identificador === 'Artículo 3');
    expect(manifest.articles[definitions.id].pageNumbers).toEqual([3, 4, 5]);
    expect(definitions.contenido).toContain('XXVII.');
    const reformed = data.articulos.find(a => a.identificador === 'Artículo 6');
    expect(reformed.contenido).toContain('Fracción reformada DOF 03-09-2015');
    expect(reformed.contenido).toContain('La información generada antes de la entrada en vigor');
    expect((await getReaderSource(reformed.id, { articleText: reformed.contenido + ' ', manifest })).reason).toBe('content-mismatch');
});

it('accepts the reviewed SNIEG source without permitting arbitrary SNIEG URLs', async () => {
    const source = data.source;
    const fetcher = vi.fn().mockResolvedValue(new Response('x', { headers: { 'Content-Type': 'application/pdf' } }));
    const request = new Request(`https://example.test/api/reader/${source.id}`);
    const result = await serveReaderPdf(request, source.id, { fetcher, sources: { [source.id]: source } });
    expect(fetcher).toHaveBeenCalledWith(source.originalUrl, expect.any(Object));
    expect(result.status).toBe(409); // Bytes cannot masquerade as the verified edition.
    fetcher.mockClear();
    const unknown = { ...source, originalUrl: 'https://www.snieg.mx/arbitrary.pdf' };
    expect((await serveReaderPdf(request, source.id, { fetcher, sources: { [source.id]: unknown } })).status).toBe(404);
    expect(fetcher).not.toHaveBeenCalled();
});
