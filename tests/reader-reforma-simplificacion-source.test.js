import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/reader-sources/manifest.v1.json'), 'utf8'));
const pack = JSON.parse(readFileSync(resolve(process.cwd(), 'revision-acervo/sincronizacion-reforma-simplificacion-2026-10-06/articulos-verificados.json'), 'utf8'));
const audit = JSON.parse(readFileSync(resolve(process.cwd(), 'revision-acervo/sincronizacion-reforma-simplificacion-2026-10-06/cotejo.json'), 'utf8'));
const sourceId = 'dof-vespertina-2024-12-20-878e180516f1';
describe('REFORMA-SIMPLIFICACION official source map', () => {
  it('maps every official fragment to the reviewed DOF edition and keeps the editorial note unmapped', () => {
    const official = pack.articulos.filter(article => article.identificador !== 'Nota editorial · documentos relacionados');
    const source = manifest.sources[sourceId];
    expect(manifest.revision).toBeGreaterThanOrEqual(71);
    expect(pack.articulos).toHaveLength(30);
    expect(official).toHaveLength(29);
    expect(source).toMatchObject({
      originalUrl: 'https://sidof.segob.gob.mx/notas/getNewsletter/20-12-2024/Vespertina/318281',
      sha256: '878e180516f11559603f1c361026978b42ec475e50d0a3628cfae4ec61de9ee6',
      pageCount: 168,
    });
    expect(source.instrumentIds).toContain(pack.ley.id);
    expect(audit.fragmentosOficiales).toBe(29);
    expect(audit.paginasImpresasDelInstrumento).toEqual([2, 10]);
    for (const article of official) {
      const entry = manifest.articles[article.id];
      expect(entry).toBeDefined();
      expect(entry.sourceId).toBe(sourceId);
      expect(entry.label).toBe(article.identificador);
      expect(entry.type).toBe(article.tipo_articulo);
      expect(entry.contentSha256).toBe(createHash('sha256').update(article.contenido, 'utf8').digest('hex'));
      expect(entry.pageNumbers.length).toBeGreaterThan(0);
      expect(entry.pageNumbers.every(page => page >= 2 && page <= 10)).toBe(true);
      for (const anchor of entry.anchors) {
        const page = source.pages.find(value => value.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        expect(page).toBeDefined();
        expect(0 <= x0 && x0 < x1 && x1 <= page.width).toBe(true);
        expect(0 <= y0 && y0 < y1 && y1 <= page.height).toBe(true);
      }
    }
  });
});
