import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
import { articleHtml } from '../src/lib/article-html.js';
const data = JSON.parse(readFileSync('revision-acervo/incorporacion-formato-iin-geografica-2026-10-07/carga.json', 'utf8'));
const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));

it('preserves geographic fields and maps every fragment to the official page', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(data.instruments.map(i => i.articulos.length)).toEqual([17, 31]);
    for (const instrument of data.instruments) {
        expect(instrument.ley.fecha_publicacion).toBeNull();
        for (const article of instrument.articulos) {
            const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
            expect(result.status, article.identificador).toBe('mapped');
            expect(result.contentVerified).toBe(true);
            expect(result.pages).toHaveLength(1);
            expect(articleHtml(article.contenido)).toContain('<pre');
        }
    }
    const form = data.instruments[0];
    const coordinates = form.articulos.find(a => a.identificador.endsWith('pág. 12'));
    expect(coordinates.contenido).toContain('5.5.1 Marco de Referencia Geodésico');
    expect(coordinates.contenido).toContain('5.5.2 Proyección');
    expect(coordinates.contenido).toContain('Resolución');
    const instructions = data.instruments[1];
    expect(instructions.articulos.find(a => a.identificador.endsWith('pág. 5')).contenido)
        .toContain('III. Instrucciones generales de llenado');
    const diagram = instructions.articulos.at(-1);
    expect(diagram.identificador).toContain('Diagrama de flujo');
    expect(diagram.contenido).toContain('únicamente la transcripción de sus rótulos');
    expect(manifest.articles[diagram.id].pageNumbers).toEqual([32]);
    expect((await getReaderSource(diagram.id, { articleText: diagram.contenido + ' ', manifest })).reason).toBe('content-mismatch');
});
