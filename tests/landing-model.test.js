import { describe, expect, it } from 'vitest';
import { catalogFigures, figuresLine, mexicoPoint, recentDocuments, typeBars } from '../src/lib/landing-model.js';

const law = (id, tipo, articulos, fecha_publicacion, extra = {}) => ({ id, titulo: `Documento ${id}`, tipo, articulos, fecha_publicacion, ...extra });

describe('catalogFigures', () => {
  it('counts documents and adds only valid article counts', () => {
    const figures = catalogFigures([law('a', 'ley', 10), law('b', 'ley', null), law('c', 'ley', -4), law('d', 'ley', NaN), law('e', 'acuerdo', 5)]);
    expect(figures).toEqual({ documentos: 5, articulos: 15 });
  });
  it('is zero for an empty or missing catalog', () => {
    expect(catalogFigures([])).toEqual({ documentos: 0, articulos: 0 });
    expect(catalogFigures(undefined)).toEqual({ documentos: 0, articulos: 0 });
  });
});

describe('typeBars', () => {
  it('keeps the acervo order, leaves out empty groups and scales to the largest', () => {
    const bars = typeBars([law('a', 'ley', 1), law('b', 'reglamento', 1), law('c', 'reglamento', 1), law('d', 'reglamento', 1), law('e', 'reglamento', 1)]);
    expect(bars.map(bar => bar.id)).toEqual(['leyes', 'reglamentos']);
    expect(bars.map(bar => bar.count)).toEqual([1, 4]);
    expect(bars[0].label).toBe('Leyes');
    expect(bars[0].share).toBe(0.25);
    expect(bars[1].share).toBe(1);
  });
  it('is empty without documents', () => { expect(typeBars([])).toEqual([]); });
});

describe('recentDocuments', () => {
  it('returns the newest with a date, named in words and not by its internal acronym', () => {
    const recent = recentDocuments([
      law('a', 'ley', 1, '2020-01-02', { siglas: 'LA' }),
      law('b', 'ley', 1, '2025-03-18'),
      law('c', 'ley', 1, null),
      law('d', 'ley', 1, '2023-07-01', { siglas: 'CNE-INICIO-CADUCIDAD-132-2026' }),
    ], 2);
    expect(recent.map(item => item.id)).toEqual(['b', 'd']);
    expect(recent[0].name).toBe('Documento b');
    expect(recent[1].name).toBe('Documento d');
    expect(recent[0].year).toBe('2025');
    expect(recent[0].date).toMatch(/2025/);
  });
  it('is empty without dated documents', () => { expect(recentDocuments([law('a', 'ley', 1, null)])).toEqual([]); });
});

describe('mexicoPoint', () => {
  it('places real points inside the map, on the right side of the country', () => {
    const tijuana = mexicoPoint(32.51, -117.04);
    const cancun = mexicoPoint(21.16, -86.85);
    expect(tijuana[0]).toBeLessThan(60);
    expect(tijuana[1]).toBeLessThan(20);
    expect(cancun[0]).toBeGreaterThan(960);
    expect(cancun[0]).toBeLessThanOrEqual(1000);
    expect(cancun[1]).toBeGreaterThan(350);
  });
  it('rejects a point without coordinates', () => {
    expect(mexicoPoint(null, -94)).toBeNull();
    expect(mexicoPoint(18, undefined)).toBeNull();
  });
});

describe('figuresLine', () => {
  it('reads as plain Spanish with thousands', () => {
    expect(figuresLine({ documentos: 126, articulos: 5879 })).toBe('5,879 artículos en 126 documentos');
  });
});
