import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
import { getAcervoGroup } from '../src/lib/acervo-model.js';
const root = 'revision-acervo/incorporacion-scjn-137-2026-10-21/';
const data = JSON.parse(readFileSync(root + 'carga.json'));
const map = JSON.parse(readFileSync(root + 'map.json'));
it('preserves the judgment structure, tables, footnotes and conditional effects', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(data.ley.tipo).toBe('sentencia');
    expect(data.ley.vigente).toBeNull();
    expect(getAcervoGroup(data.ley)).toBe('otros');
    expect(data.articulos).toHaveLength(22);
    const content = data.articulos.map(a => a.contenido).join('');
    const div = document.createElement('div'); div.innerHTML = content;
    expect(div.querySelectorAll('table')).toHaveLength(5);
    expect(div.querySelectorAll('thead th').length).toBeGreaterThan(0);
    expect(div.textContent).toContain('notificación');
    const notes = data.articulos.at(-1);
    expect(notes.identificador).toBe('Notas al pie de la sentencia');
    expect(notes.contenido).toContain('67');
    expect(map.articles[notes.id].pageNumbers.every(n => n >= 55 && n <= 79)).toBe(true);
    const manifest = { schemaVersion: 1, sources: { [map.source.id]: map.source }, articles: map.articles };
    for (const a of data.articulos) {
        const result = await getReaderSource(a.id, { articleText: a.contenido, manifest });
        expect(result.status, a.identificador).toBe('mapped');
        expect(result.contentVerified).toBe(true);
    }
    const changed = await getReaderSource(notes.id, { articleText: notes.contenido + ' ', manifest });
    expect(changed.reason).toBe('content-mismatch');
});
