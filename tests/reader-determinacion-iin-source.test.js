import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const data = JSON.parse(readFileSync('revision-acervo/incorporacion-determinacion-iin-2026-10-07/carga.json', 'utf8'));

it('maps all determination rules without turning wrapped section headings into duplicate articles', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(data.articulos).toHaveLength(42);
    expect(new Set(data.articulos.map(a => a.id)).size).toBe(42);
    expect(data.articulos.filter(a => a.tipo_articulo === 'ordinario').map(a => a.identificador))
        .toEqual(Array.from({ length: 37 }, (_, i) => `Artículo ${i + 1}`));
    expect(data.articulos.filter(a => a.tipo_articulo === 'transitorio')).toHaveLength(4);
    for (const article of data.articulos) {
        const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(result.status, article.identificador).toBe('mapped');
        expect(result.contentVerified).toBe(true);
        expect(result.source.id).toBe(data.source.id);
    }
    const definitions = data.articulos.find(a => a.identificador === 'Artículo 2');
    expect(manifest.articles[definitions.id].pageNumbers).toEqual([2, 3, 4]);
    expect(definitions.contenido).toContain('XXVII.');
    const decision = data.articulos.find(a => a.identificador === 'Artículo 20');
    expect(decision.seccion_nombre).toContain('Información de Interés Nacional');
    expect(decision.contenido).toMatch(/^<p>Artículo 20/);
    const repeal = data.articulos.find(a => a.identificador === 'Transitorio Segundo');
    expect(repeal.contenido).toContain('Se abrogan');
    expect(repeal.contenido).toContain('3 de septiembre de 2015');
    expect((await getReaderSource(repeal.id, { articleText: repeal.contenido + ' ', manifest })).reason).toBe('content-mismatch');
});
