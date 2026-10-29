import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
import { buildInstrumentTimeline } from '../src/lib/instrument-timeline.js';
const root = 'revision-acervo/incorporacion-estrategicos-m4-2026-10-29/';
const data = JSON.parse(readFileSync(root + 'carga.json'));
const map = JSON.parse(readFileSync(root + 'map.json'));
it('preserves the four-column official table and keeps the amendment in its original family', () => {
    const a = data.articulos.find(a => a.tipo_articulo === 'ordinario');
    const el = document.createElement('div'); el.innerHTML = a.contenido;
    expect(el.querySelectorAll('thead th')).toHaveLength(4);
    expect(el.querySelectorAll('tbody td')).toHaveLength(4);
    expect(el.textContent.replace(/\s/g, '')).toContain('1demarzode2027');
    const note = data.articulos[0];
    expect(note.contenido).toContain('no crea una convocatoria nueva ni reabre');
    const catalog = [...note.contenido.matchAll(/#ley-([\w-]+)\">([^<]+)/g)].map(m => ({ id: m[1], titulo: m[2] }));
    const timeline = buildInstrumentTimeline({ law: data.ley, summaries: catalog,
        articles: [{ id: note.id, tipo_articulo: note.tipo_articulo, articulo_label: note.identificador, texto: note.contenido }] });
    expect(timeline.entries.filter(e => e.kind === 'instrument')).toHaveLength(5);
    expect(timeline.unavailableCount).toBe(0);
});
it('maps the three official fragments independently and excludes the editorial note', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const manifest = { schemaVersion: 1, sources: { [map.source.id]: map.source }, articles: map.articles };
    expect(map.source.pageCount).toBe(184);
    for (const a of data.articulos.slice(1)) {
        const result = await getReaderSource(a.id, { articleText: a.contenido, manifest });
        expect(result.status).toBe('mapped');
        expect(result.contentVerified).toBe(true);
        expect(map.articles[a.id].pageNumbers).toEqual([49]);
        expect((await getReaderSource(a.id, { articleText: a.contenido + ' ', manifest })).reason).toBe('content-mismatch');
    }
    expect(map.articles[data.articulos[0].id]).toBeUndefined();
    const end = a => Math.max(...map.articles[a.id].anchors.map(x => x.bbox[3]));
    const start = a => Math.min(...map.articles[a.id].anchors.map(x => x.bbox[1]));
    expect(end(data.articulos[1])).toBeLessThanOrEqual(start(data.articulos[2]));
    expect(end(data.articulos[2])).toBeLessThanOrEqual(start(data.articulos[3]));
});
