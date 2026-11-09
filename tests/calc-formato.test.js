import { describe, expect, it } from 'vitest';
import { formatoClase, formatoComparacion, formatoFrente, leerNumero, rotulo, textoFrente } from '../src/lib/calc/formato.js';

const NB = ' ';

describe('formatoFrente', () => {
  it.each([[15898729.5, '15.9 millones'], [561.3, '561'], [38898, `38${NB}900`], [1, '1'], [0, '0'], [0.5388, '0.539'],
    [1e6, '1 millón'], [999999, '1 millón'], [1.5e9, '1.5 mil millones'], [1e9, 'mil millones'],
    [2.5e12, '2.5 millones de millones'], [1e15, '1×10¹⁵'], [1.23e-5, '1.23×10⁻⁵'], [-10, '−10']])('%s', (v, t) => expect(formatoFrente(v)).toBe(t));
});

describe('formatoClase', () => {
  it.each([[1234567.891, 'exacto', `1${NB}234${NB}568`], [3.6, 'exacto', '3.6'], [158.987294928, 'exacto', '158.9873'], [0.00662447, 'exacto', '0.00662447'],
    [38.148, 'oficial', '38.15'], [38.64, 'tipico', '38.6'], [0.54, 'convencion', '0.54'], [1e20, 'exacto', '1×10²⁰']])('%s %s', (v, c, t) => expect(formatoClase(v, c)).toBe(t));
});

describe('textoFrente', () => {
  it('joins the number and its label', () => {
    expect(textoFrente({ valor: 15898729.5, etiqueta: 'litros al día' })).toBe('15.9 millones de litros al día');
    expect(textoFrente({ valor: 159, etiqueta: 'litros' })).toBe('159 litros');
    expect(textoFrente({ valor: 1, etiqueta: 'megawatts-hora', etiquetaUna: 'megawatt-hora' })).toBe('1 megawatt-hora');
  });
});

describe('formatoComparacion', () => {
  it.each([[317975, '320 mil'], [1200, `1${NB}200`], [1.5e6, '1.5 millones'], [530, '530'], [12.4, '12']])('%s', (v, t) => expect(formatoComparacion(v)).toBe(t));
});

describe('rotulo', () => {
  it('names each class', () => {
    expect(rotulo({ clase: 'oficial', anio: 2026 })).toBe('Valor publicado por SENER, 2026');
    expect(rotulo({ clase: 'oficial', anio: 2015, emisor: 'Semarnat' })).toBe('Valor publicado por Semarnat, 2015');
    expect(rotulo({ clase: 'exacto' })).toBe('Exacto por definición');
    expect(rotulo({ clase: 'tipico' })).toBe('Valor típico, puede variar');
    expect(rotulo({ clase: 'convencion', nota: 'las tablas de precios' })).toBe('Convención usada en las tablas de precios');
  });
});

describe('leerNumero', () => {
  it.each([['1 234.5', 1234.5], ['1,234.5', 1234.5], ['1234.5', 1234.5], ['1.234', 1.234], ['-5', -5], ['−5', -5], ['.5', 0.5], ['1.', 1], [' 12 ', 12], [`1${NB}234`, 1234], ['1,234,567', 1234567]])('reads %s without a warning', (t, v) => {
    expect(leerNumero(t)).toMatchObject({ ok: true, valor: v });
    expect(leerNumero(t).aviso).toBeFalsy();
  });
  it.each([['1,234', 1234, '1 234'], ['1,5', 1.5, '1.5'], ['12,34', 12.34, '12.34'], ['1 234,5', 1234.5, '1 234.5']])('reads %s and says how', (t, v, dice) => {
    const r = leerNumero(t);
    expect(r.valor).toBe(v);
    expect(r.aviso.replaceAll(NB, ' ')).toContain(dice);
  });
  it.each(['abc', '-', '.', ',', '1,', '1.234.567', '1e6', 'Infinity', 'NaN', '0x10', '<b>1</b>', '1'.repeat(400)])('rejects %s', t => expect(leerNumero(t)).toMatchObject({ ok: false, vacio: false }));
  it('knows an empty field', () => expect(leerNumero('  ')).toMatchObject({ ok: false, vacio: true }));
});
