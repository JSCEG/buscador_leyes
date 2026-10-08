import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
const data = JSON.parse(readFileSync('revision-acervo/incorporacion-esquema-acervo-iin-2026-10-08/carga.json', 'utf8'));
const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));

it('maps the delivery procedure, diagrams and annexes without inventing articles or dates', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const instrument = data.instruments[0];
    expect(instrument.articulos).toHaveLength(11);
    expect(instrument.ley.fecha_publicacion).toBeNull();
    expect(instrument.source.transport).toBe('remote-pdf');
    expect(instrument.source.pageCount).toBe(13);
    for (const article of instrument.articulos) {
        const result = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(result.status, article.identificador).toBe('mapped');
        expect(result.contentVerified).toBe(true);
        expect(result.pages).toHaveLength(1);
    }
    const annex = instrument.articulos.find(a => a.identificador.endsWith('pág. 6'));
    expect(annex.contenido).toContain('únicamente la transcripción de sus rótulos');
    expect(manifest.articles[annex.id].pageNumbers).toEqual([6]);
    expect((await getReaderSource(annex.id, { articleText: annex.contenido + ' ', manifest })).reason).toBe('content-mismatch');
});
