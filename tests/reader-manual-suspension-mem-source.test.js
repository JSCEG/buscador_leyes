import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/reader-sources/manifest.v1.json'), 'utf8'));
const pack = JSON.parse(readFileSync(resolve(process.cwd(), 'revision-acervo/sincronizacion-manual-suspension-mem-2026-10-06/articulos-verificados.json'), 'utf8'));
const audit = JSON.parse(readFileSync(resolve(process.cwd(), 'revision-acervo/sincronizacion-manual-suspension-mem-2026-10-06/cotejo.json'), 'utf8'));
const sourceId = 'dof-vespertina-2024-01-12-310942';

describe('Manual de Suspensión del MEM official source map', () => {
  it('maps every official fragment to the exact reviewed DOF PDF and excludes the editorial note', () => {
    const official = pack.articulos.filter(article => article.identificador !== 'Nota editorial · alcance de la publicación');
    const source = manifest.sources[sourceId];
    expect(pack.ley.id).toBe('8f0c071e-ef10-5b40-a9f9-b401dbb823ea');
    expect(pack.articulos).toHaveLength(27);
    expect(official).toHaveLength(26);
    expect(source).toMatchObject({
      lawId: pack.ley.id,
      originalUrl: 'https://sidof.segob.gob.mx/notas/getNewsletter/12-01-2024/Vespertina/310942',
      sha256: 'e140498db008332e78d1773e5bb87a89a2420e2b518547e7457a6f23820eceb2',
      pageCount: 16,
    });
    expect(audit.fragmentosOficiales).toBe(26);
    expect(audit.fragmentos).toHaveLength(26);
    expect(audit.fragmentos.every(item => item.textoCompletoCotejado)).toBe(true);
    for (const article of official) {
      const entry = manifest.articles[article.id];
      expect(entry).toBeDefined();
      expect(entry.sourceId).toBe(sourceId);
      expect(entry.label).toBe(article.identificador);
      expect(entry.type).toBe(article.tipo_articulo);
      expect(entry.contentSha256).toBe(createHash('sha256').update(article.contenido, 'utf8').digest('hex'));
      expect(entry.pageNumbers.length).toBeGreaterThan(0);
      expect(entry.pageNumbers.every(page => page >= 2 && page <= 16)).toBe(true);
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
