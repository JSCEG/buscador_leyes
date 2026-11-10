import { describe, expect, it } from 'vitest';
import { MAGNITUDES, UNIDADES, bajoCeroAbsoluto, convertir, convertirTemperatura, unidadesDe } from '../src/lib/calc/unidades.js';

const near = (got, want, tol) => expect(Math.abs(got - want)).toBeLessThanOrEqual(tol);

describe('factors against NIST', () => {
  it.each([
    ['gal', 'l', 3.785411784, 1e-12], ['bl', 'l', 158.987294928, 1e-12], ['m3', 'bl', 6.289811, 1e-6], ['pc', 'm3', 0.028316846592, 1e-15], ['m3', 'pc', 35.314667, 1e-6],
    ['gj', 'mmbtu', 0.947817, 1e-6], ['mwh', 'mmbtu', 3.412142, 1e-6], ['tep', 'gj', 41.868, 1e-9], ['tep', 'mwh', 11.63, 1e-9], ['tj', 'mwh', 277.78, 0.01], ['therm', 'mj', 105.506, 1e-9],
    ['hp', 'w', 745.699872, 1e-6], ['cv', 'w', 735.49875, 1e-9], ['kcal-h', 'w', 1.163, 1e-9], ['btu-h', 'w', 0.293071, 1e-6], ['tr', 'w', 3516.853, 1e-3],
    ['psi', 'kpa', 6.894757, 1e-6], ['kgf-cm2', 'kpa', 98.0665, 1e-9], ['inh2o', 'pa', 249.089, 1e-3], ['mh2o', 'kpa', 9.80665, 1e-9], ['bar', 'kpa', 100, 1e-12], ['atm', 'kpa', 101.325, 1e-12],
    ['nudo', 'm-s', 0.514444, 1e-6], ['mph', 'm-s', 0.44704, 1e-9], ['km-h', 'm-s', 1 / 3.6, 1e-12],
    ['bpd', 'm3-h', 0.00662447, 1e-8], ['bpd', 'l-min', 0.110408, 1e-6], ['mmpcd', 'm3-h', 1179.87, 0.01], ['lb', 'kg', 0.45359237, 1e-12], ['ton-corta', 'kg', 907.18474, 1e-9],
  ])('%s to %s', (a, b, want, tol) => near(convertir(1, a, b), want, tol));
});

describe('the table', () => {
  it('stores every factor as a fraction of safe integers', () => {
    for (const u of Object.values(UNIDADES)) {
      if (u.magnitud === 'temperatura') continue;
      expect(Number.isSafeInteger(u.factor[0]), u.id).toBe(true);
      expect(Number.isSafeInteger(u.factor[1]), u.id).toBe(true);
    }
  });
  it('goes there and back', () => {
    for (const m of MAGNITUDES.filter(x => x !== 'temperatura')) {
      const base = unidadesDe(m)[0].id;
      for (const u of unidadesDe(m)) near(convertir(convertir(7.5, u.id, base), base, u.id), 7.5, 1e-9);
    }
  });
  it('marks what is outside the NOM-008', () => {
    for (const id of ['bar', 'kgf-cm2', 'psi', 'btu', 'cal', 'hp', 'bl', 'gal']) expect(UNIDADES[id].oficial, id).toBe(false);
    expect(UNIDADES.kpa.oficial).toBe(true);
  });
  it('never spells M alone', () => {
    expect(UNIDADES.mbd.nombre).toBe('miles de barriles diarios (Mbd)');
    expect(UNIDADES.mmpc.nombre).toBe('millones de pies cúbicos (MMpc)');
  });
  it('does not mix magnitudes', () => expect(() => convertir(1, 'kg', 'l')).toThrow(RangeError));
});

describe('temperature', () => {
  it('converts a temperature and a difference differently', () => {
    expect(convertirTemperatura(0, 'c', 'f')).toBeCloseTo(32);
    expect(convertirTemperatura(0, 'c', 'k')).toBeCloseTo(273.15);
    expect(convertirTemperatura(10, 'c', 'f', { diferencia: true })).toBeCloseTo(18);
    expect(convertirTemperatura(10, 'c', 'k', { diferencia: true })).toBeCloseTo(10);
  });
  it('knows absolute zero', () => {
    expect(bajoCeroAbsoluto(-274, 'c')).toBe(true);
    expect(bajoCeroAbsoluto(-273, 'c')).toBe(false);
    expect(bajoCeroAbsoluto(-1, 'k')).toBe(true);
    expect(bajoCeroAbsoluto(-460, 'f')).toBe(true);
  });
});
