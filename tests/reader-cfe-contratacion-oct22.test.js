import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
import { getAcervoGroup } from '../src/lib/acervo-model.js';
const root = 'revision-acervo/incorporacion-cfe-contratacion-2026-10-22/';
const read = name => JSON.parse(readFileSync(root + name));
const data = read('carga.json'), map = read('map.json'), meta = read('metadatos-contratacion.json');
it('identifies nine procurement calls without implying awards, execution or permits', () => {
    expect(data).toHaveLength(9);
    expect(new Set(data.map(i => i.ley.siglas)).size).toBe(9);
    for (const item of data) {
        expect(item.ley.titulo).toMatch(/^Convocatoria de contratación CFE/);
        expect(item.ley.tipo).toBe('convocatoria');
        expect(getAcervoGroup(item.ley)).toBe('convocatorias');
        expect(item.ley.fecha_publicacion).toBe('2026-10-22');
        expect(item.ley.vigente).toBeNull();
        const info = meta.find(m => m.id === item.ley.id);
        expect(info.etapa_acreditada).toBe('convocatoria_concurso');
        expect(info.adjudicacion_acreditada).toBe(false);
        expect(info.ejecucion_acreditada).toBe(false);
        const notice = item.articulos.find(a => a.orden === 1);
        const el = document.createElement('div'); el.innerHTML = notice.contenido;
        expect(el.querySelectorAll('table')).toHaveLength(1);
        // Carbón II does not publish a separate deadline row; do not invent one.
        expect(el.querySelectorAll('tr').length).toBe(item.ley.siglas === 'CFE-0700-CASAN-0048-2026' ? 7 : 8);
        expect(el.textContent).toContain(item.ley.siglas);
        expect(el.textContent).toMatch(/Fallo|fallo/);
        expect(item.articulos[0].contenido).toContain('fechas previstas');
    }
});
it('maps only the official notices to their precise page and rejects changed text', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const manifest = { schemaVersion: 1, sources: { [map.source.id]: map.source }, articles: map.articles };
    expect(map.source.instrumentIds).toHaveLength(9);
    expect(map.source.pageCount).toBe(224);
    for (const item of data) {
        const notice = item.articulos.find(a => a.orden === 1);
        const result = await getReaderSource(notice.id, { articleText: notice.contenido, manifest });
        expect(result.status, item.ley.siglas).toBe('mapped');
        expect(result.contentVerified).toBe(true);
        expect(map.articles[item.articulos[0].id]).toBeUndefined();
        const changed = await getReaderSource(notice.id, { articleText: notice.contenido + ' ', manifest });
        expect(changed.reason).toBe('content-mismatch');
    }
});
