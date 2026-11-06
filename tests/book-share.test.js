import { describe, expect, it } from 'vitest';
import { bookLink, bookRoute, bookShareTargets } from '../src/lib/book-share.js';

describe('sharing a book', () => {
  it('adds the reading to a readable address and to a hash address', () => {
    expect(bookLink('https://buscador-juridico.com/ley/lse', 'abc')).toBe('https://buscador-juridico.com/ley/lse?libro=1&art=abc');
    expect(bookLink('http://localhost:5173/#ley-9', null)).toBe('http://localhost:5173/#ley-9?libro=1');
  });
  it('reads it back from the app address', () => {
    expect(bookRoute('#ley-9?libro=1&art=abc')).toEqual({ lawId: '9', book: { articleId: 'abc' } });
    expect(bookRoute('#ley-9?libro=1')).toEqual({ lawId: '9', book: { articleId: null } });
    expect(bookRoute('#ley-9')).toEqual({ lawId: '9', book: null });
    expect(bookRoute('#ley-a%20b')).toEqual({ lawId: 'a b', book: null });
  });
  it('offers messaging and networks with the link encoded', () => {
    const targets = bookShareTargets({ title: 'Ley & más', url: 'https://x.mx/ley/l?libro=1' });
    const whatsapp = targets.find(target => target.id === 'whatsapp');
    expect(whatsapp.href).toBe(`https://wa.me/?text=${encodeURIComponent('Lee «Ley & más» como libro: https://x.mx/ley/l?libro=1')}`);
    expect(targets.map(target => target.id)).toEqual(['whatsapp', 'telegram', 'x', 'linkedin', 'correo']);
    expect(targets.every(target => !/\s/.test(target.href))).toBe(true);
  });
});
