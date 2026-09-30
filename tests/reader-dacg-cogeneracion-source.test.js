import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const rows = JSON.parse(readFileSync('revision-acervo/sincronizacion-dacg-cogeneracion-2026-09-30/articulos-verificados.json', 'utf8'));
const map = JSON.parse(readFileSync('revision-acervo/sincronizacion-dacg-cogeneracion-2026-09-30/map.json', 'utf8'));

afterEach(() => vi.unstubAllGlobals());

it('maps every official cogeneration DACG fragment and leaves the local editorial note unmapped', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(rows).toHaveLength(35);
    expect(Object.keys(map.articles)).toHaveLength(34);
    expect(map.source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/16-04-2026/Matutina/326685');
    const editorial = rows.find(row => row.tipo_articulo === 'complementario' && row.identificador.startsWith('Nota editorial'));
    expect(map.articles[editorial.id]).toBeUndefined();

    for (const row of rows.filter(row => row.id !== editorial.id)) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status, row.identificador).toBe('mapped');
        expect(result.contentVerified, row.identificador).toBe(true);
        expect(result.source.lawId).toBe(row.ley_id);
        expect(result.source.originalUrl).toBe(map.source.originalUrl);
        expect(result.pages.length, row.identificador).toBeGreaterThan(0);
        for (let pageIndex = 0; pageIndex < result.pages.length; pageIndex++) {
            expect(resolveReaderSource(manifest, row.id, { pageIndex }).highlights.length, row.identificador).toBeGreaterThan(0);
        }
    }
});
