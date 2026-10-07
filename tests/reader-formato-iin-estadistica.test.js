import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
import { articleHtml } from '../src/lib/article-html.js';
const data = JSON.parse(readFileSync('revision-acervo/incorporacion-formato-iin-estadistica-2026-10-07/carga.json', 'utf8'));
const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
it('maps support forms and instructions by real page without fabricating article numbering', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(data.instruments.map(i => i.articulos.length)).toEqual([14, 29]);
    for (const i of data.instruments) {
        expect(i.ley.fecha_publicacion).toBeNull(); // No unsupported exact day for a year/month edition.
        for (const a of i.articulos) {
            expect(a.identificador).not.toMatch(/^Artículo/);
            const mapped = await getReaderSource(a.id, { articleText: a.contenido, manifest });
            expect(mapped.status, a.identificador).toBe('mapped');
            expect(mapped.contentVerified).toBe(true);
            expect(mapped.pages).toHaveLength(1);
            expect(articleHtml(a.contenido)).toContain('<pre');
        }
    }
    const instructions = data.instruments[1];
    const raster = instructions.articulos.find(a => a.identificador.endsWith('pág. 9'));
    expect(raster.contenido).toContain('Transcripción manual revisada');
    expect(raster.contenido).toContain('2.2.4 Programa sectorial, regional o especial');
    const diagram = instructions.articulos.at(-1);
    expect(diagram.identificador).toContain('Diagrama de flujo');
    expect(diagram.contenido).toContain('únicamente la transcripción de sus rótulos');
    expect(manifest.articles[diagram.id].pageNumbers).toEqual([30]);
});
