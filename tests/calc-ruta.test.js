import { describe, expect, it } from 'vitest';
import { calcHash, calcRoute } from '../src/lib/calc/ruta.js';

describe('calculator routes', () => {
  it('reads the basic addresses', () => {
    expect(calcRoute('#calculadora')).toEqual({ pestana: 'electricidad' });
    expect(calcRoute('#calculadora=gas-lp')).toEqual({ pestana: 'gas-lp' });
    expect(calcRoute('#polos')).toBeNull();
    expect(calcRoute('#calculadoras')).toBeNull();
    expect(calcRoute('')).toBeNull();
    expect(calcRoute(undefined)).toBeNull();
  });
  it('reads a full link', () => expect(calcRoute('#calculadora=petroliferos&v=100&u=mbd&p=gasolina&b=fisica&t=35')).toEqual({ pestana: 'petroliferos', valor: 100, unidad: 'mbd', producto: 'gasolina', base: 'fisica', ajustes: { t: 35 } }));
  it('ignores what is not valid', () => {
    expect(calcRoute('#calculadora=zzz')).toEqual({ pestana: 'electricidad' });
    expect(calcRoute('#calculadora=otras&v=abc&b=x&t=NaN&u=<b>&k=z')).toEqual({ pestana: 'otras' });
  });
  it.each([{ pestana: 'electricidad' }, { pestana: 'gas-lp', valor: 300, unidad: 'tanque-agua' }, { pestana: 'electricidad', valor: 1, unidad: 'mw', horas: 1 },
    { pestana: 'gas-natural', valor: 1, unidad: 'mmpc', ajustes: { c: 'base-nom', pc: 40, k: 'inferior' } }, { pestana: 'otras', magnitud: 'presion', valor: 1, unidad: 'bar', ajustes: { pm: 'man', a: 2240 } },
    { pestana: 'otras', magnitud: 'temperatura', valor: 10, unidad: 'c', ajustes: { dt: true } }, { pestana: 'gas-lp', valor: -5, unidad: 'kg', ajustes: { t: -5, m: '70-30' } }])('goes there and back %#', p => expect(calcRoute(calcHash(p))).toEqual(p));
  it('uses the short address for electricity alone', () => expect(calcHash({ pestana: 'electricidad' })).toBe('#calculadora'));
  it('leaves out defaults', () => expect(calcHash({ pestana: 'petroliferos', valor: 100, unidad: 'mbd', producto: 'gasolina', base: 'oficial', horas: null, ajustes: {} })).toBe('#calculadora=petroliferos&v=100&u=mbd&p=gasolina'));
});

describe('links that keep what the person had', () => {
  it('keep very small and very large numbers', () => {
    for (const v of [1e-7, 2.5e-9, 1e21]) expect(calcRoute(calcHash({ pestana: 'electricidad', valor: v, unidad: 'mwh' })).valor).toBe(v);
  });
  it('keep power without hours', () => {
    const hash = calcHash({ pestana: 'electricidad', valor: 1, unidad: 'mw', horas: '' });
    expect(hash).toBe('#calculadora=electricidad&v=1&u=mw&h=');
    expect(calcRoute(hash).horas).toBe('');
  });
});
