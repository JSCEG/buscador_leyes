import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
const root = 'revision-acervo/incorporacion-cne-asea-2026-10-27/';
const data = JSON.parse(readFileSync(root + 'carga.json'));
const map = JSON.parse(readFileSync(root + 'map.json'));

it('preserves the five columns and 132 permit records without losing leading zeroes or titles', () => {
    const cne = data.find(i => i.ley.siglas.startsWith('CNE-'));
    const first = cne.articulos.find(a => a.identificador === 'PRIMERO');
    const el = document.createElement('div');
    el.innerHTML = first.contenido;
    expect(el.querySelectorAll('table')).toHaveLength(1);
    expect(el.querySelectorAll('thead th')).toHaveLength(5);
    const rows = [...el.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(132);
    rows.forEach((row, i) => {
        expect(row.children).toHaveLength(5);
        expect(row.children[0].textContent.trim()).toBe(String(i + 1));
        expect(row.children[4].textContent.trim()).toBe('01/09/2025 - 31/08/2026');
    });
    expect(first.contenido).not.toContain('|');
    expect(map.articles[first.id].pageNumbers).toEqual([30, 31, 32, 33, 34, 35]);
});

it('maps every section to its own range, excluding the next INEEL publication, and verifies exact content', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const manifest = { schemaVersion: 1, sources: { [map.source.id]: map.source }, articles: map.articles };
    expect(data.flatMap(i => i.articulos)).toHaveLength(18);
    for (const item of data) {
        for (const a of item.articulos) {
            const result = await getReaderSource(a.id, { articleText: a.contenido, manifest });
            expect(result.status, a.identificador).toBe('mapped');
            expect(result.contentVerified).toBe(true);
            expect((await getReaderSource(a.id, { articleText: a.contenido + ' ', manifest })).reason).toBe('content-mismatch');
        }
    }
    const asea = data.find(i => i.ley.siglas.startsWith('ASEA-'));
    expect(map.articles[asea.articulos.find(a => a.identificador === 'PRIMERO').id].pageNumbers).toEqual([25]);
    expect(map.articles[asea.articulos.find(a => a.identificador === 'Considerandos').id].pageNumbers).toEqual([23, 24, 25]);
    const cne = data.find(i => i.ley.siglas.startsWith('CNE-'));
    const last = cne.articulos.at(-1);
    expect(last.tipo_articulo).toBe('transitorio');
    expect(last.contenido).toContain('Juan Carlos');
    expect(map.articles[last.id].anchors.every(a => a.page === 36 && a.bbox[3] < 400)).toBe(true);
});
