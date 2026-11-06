import { describe, expect, it } from 'vitest';
import { bookOutline, paginateOutline } from '../src/lib/book-outline.js';

const article = (id, extra = {}) => ({ id, label: `Artículo ${id}`, titulo: '', capitulo: '', ...extra });

describe('book outline', () => {
  it('lists titles and chapters once, pointing at the article that opens them', () => {
    const entries = bookOutline([
      article('1', { titulo: 'TÍTULO I', capitulo: 'Capítulo I' }), article('2', { titulo: 'TÍTULO I', capitulo: 'Capítulo I' }),
      article('3', { titulo: 'TÍTULO I', capitulo: 'Capítulo II' }), article('4', { titulo: 'TÍTULO II', capitulo: 'Capítulo I' }),
    ]);
    expect(entries).toEqual([
      { level: 1, text: 'TÍTULO I', articleId: '1' }, { level: 2, text: 'Capítulo I', articleId: '1' }, { level: 2, text: 'Capítulo II', articleId: '3' },
      { level: 1, text: 'TÍTULO II', articleId: '4' }, { level: 2, text: 'Capítulo I', articleId: '4' },
    ]);
  });
  it('falls back to each article when a part has no structure, so nothing is unreachable', () => {
    const entries = bookOutline([article('1', { titulo: 'TÍTULO I' }), article('T1', { label: 'Transitorio Primero' }), article('T2', { label: 'Transitorio Segundo' })]);
    expect(entries.map(entry => entry.text)).toEqual(['TÍTULO I', 'Transitorio Primero', 'Transitorio Segundo']);
    expect(entries[1].level).toBe(3);
  });
  it('does not list a numbered section again when its articles resume after a subsection', () => {
    const titulo = 'Operación';
    const entries = bookOutline([
      article('1', { titulo, capitulo: '7.2 · Auto-tanque' }), article('2', { titulo, capitulo: '7.2.1 · Manual' }),
      article('3', { titulo, capitulo: '7.2 · Auto-tanque' }), article('4', { titulo, capitulo: '7.2.2 · Integridad' }),
      article('5', { titulo, capitulo: '7.2.2.5 · Pruebas' }), article('6', { titulo, capitulo: '7.2.2 · Integridad' }),
      article('7', { titulo, capitulo: '7.2 · Auto-tanque' }), article('8', { titulo }),
      article('9', { titulo, capitulo: '7.2.3 · Parte motriz' }), article('10', { titulo, capitulo: '7.3 · Reparto' }),
    ]);
    expect(entries.map(entry => [entry.text, entry.articleId])).toEqual([
      ['Operación', '1'], ['7.2 · Auto-tanque', '1'], ['7.2.1 · Manual', '2'], ['7.2.2 · Integridad', '4'],
      ['7.2.2.5 · Pruebas', '5'], ['7.2.3 · Parte motriz', '9'], ['7.3 · Reparto', '10'],
    ]);
  });
  it('keeps a numbered section that appears under another title', () => {
    const entries = bookOutline([
      article('1', { titulo: 'A', capitulo: '1 · Generales' }), article('2', { titulo: 'B', capitulo: '1 · Generales' }),
    ]);
    expect(entries.map(entry => entry.text)).toEqual(['A', '1 · Generales', 'B', '1 · Generales']);
  });
  it('does not list a chapter that only repeats its title', () => {
    const entries = bookOutline([article('1', { titulo: 'Apéndice A', capitulo: 'Apéndice A' }), article('2', { titulo: 'Apéndice A', capitulo: 'Tabla 1' })]);
    expect(entries.map(entry => entry.text)).toEqual(['Apéndice A', 'Tabla 1']);
  });
  it('names attached documents', () => {
    expect(bookOutline([article('1', { badge: 'Guía de trámite', capitulo: 'Pasos' })])[0]).toEqual({ level: 1, text: 'Guía de trámite', articleId: '1' });
  });
  it('splits a long index on pages without losing an entry', () => {
    const entries = Array.from({ length: 25 }, (_, index) => ({ level: 3, text: `Artículo ${index}`, articleId: String(index) }));
    const pages = paginateOutline(entries, list => list.length <= 10);
    expect(pages.length).toBe(3);
    expect(pages.flat()).toEqual(entries);
  });
  it('a document with nothing to list has no index page', () => {
    expect(paginateOutline([], () => true)).toEqual([]);
  });
});
