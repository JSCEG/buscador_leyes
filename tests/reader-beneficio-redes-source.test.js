import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/reader-sources/manifest.v1.json'), 'utf8'));
const pack = JSON.parse(readFileSync(resolve(process.cwd(), 'revision-acervo/sincronizacion-beneficio-redes-2026-10-06/articulos-verificados.json'), 'utf8'));
const audit = JSON.parse(readFileSync(resolve(process.cwd(), 'revision-acervo/sincronizacion-beneficio-redes-2026-10-06/cotejo.json'), 'utf8'));
const sourceId = 'dof-matutina-2024-01-18-f19d73064218';

describe('BENEFICIO-REDES official source map', () => {
  it('maps the 25 official fragments to the DOF edition and leaves the editorial note unmapped', () => {
    const official = pack.articulos.filter(article => article.identificador !== 'Nota editorial · alcance de la publicación');
    const source = manifest.sources[sourceId];
    expect(pack.ley.id).toBe('a25595c8-cdb8-57de-8200-7551ca27ac9c');
    expect(pack.articulos).toHaveLength(26);
    expect(official).toHaveLength(25);
    expect(source).toMatchObject({
      lawId: pack.ley.id,
      originalUrl: 'https://sidof.segob.gob.mx/notas/getNewsletter/18-01-2024/Matutina/311042',
      sha256: 'f19d7306421896e2fb023a6d97b156233714ffb65876177c9849330f13bd1abe',
      pageCount: 646,
    });
    expect(audit.fragmentosOficiales).toBe(25);
    expect(audit.fragmentos).toHaveLength(25);
    for (const article of official) {
      const entry = manifest.articles[article.id];
      expect(entry).toBeDefined();
      expect(entry.sourceId).toBe(sourceId);
      expect(entry.label).toBe(article.identificador);
      expect(entry.type).toBe(article.tipo_articulo);
      expect(entry.contentSha256).toBe(createHash('sha256').update(article.contenido, 'utf8').digest('hex'));
      expect(entry.pageNumbers.length).toBeGreaterThan(0);
      expect(entry.pageNumbers.every(page => page >= 517 && page <= 547)).toBe(true);
      for (const anchor of entry.anchors) {
        const page = source.pages.find(value => value.number === anchor.page);
        const [x0, y0, x1, y1] = anchor.bbox;
        expect(page).toBeDefined();
        expect(0 <= x0 && x0 < x1 && x1 <= page.width).toBe(true);
        expect(0 <= y0 && y0 < y1 && y1 <= page.height).toBe(true);
      }
    }
  });

  it('preserves the complete form, the diagram image, and distributed footnotes at their printed pages', () => {
    const byLabel = label => Object.values(manifest.articles).find(article => article.label === label);
    expect(byLabel('Anexo I · Formulario de solicitud').pageNumbers).toEqual(Array.from({ length: 14 }, (_, i) => i + 532));
    expect(byLabel('Anexo II · Costos de evaluación').pageNumbers).toEqual([546, 547]);
    expect(byLabel('Anexo II · Costos de evaluación').anchors.some(anchor => anchor.page === 546 && anchor.lineId >= 100000)).toBe(true);
    expect(byLabel('Notas al pie de los criterios y anexos').pageNumbers).toEqual([526, 531, 544, 547]);
    expect(audit.fragmentos.find(item => item.fragmento.startsWith('Anexo I')).metodoCotejo)
      .toBe('formulario-tabular-paginas-completas');
  });
});
