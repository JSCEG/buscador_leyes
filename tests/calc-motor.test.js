import { describe, expect, it } from 'vitest';
import { calcular, normalizarEstado } from '../src/lib/calc/motor.js';
import { ATAJOS, unidadesValidas } from '../src/lib/calc/pestanas.js';
import { rotulo, textoFrente } from '../src/lib/calc/formato.js';
import { convertir } from '../src/lib/calc/unidades.js';

const c = p => calcular(normalizarEstado(p));
const near = (g, w, t) => expect(Math.abs(g - w)).toBeLessThanOrEqual(t);
const todas = r => [r.principal, ...r.otras];

describe('what goes in front', () => {
  it('matches the approved mockup: 100 thousand barrels a day of gasoline', () => {
    const r = c({ pestana: 'petroliferos', valor: 100, unidad: 'mbd', producto: 'gasolina' });
    expect(textoFrente(r.principal)).toBe('15.9 millones de litros al día');
    expect(r.otras.filter(x => x.frente).map(textoFrente)).toEqual(['561 terajoules de energía al día', '38 900 toneladas de CO₂ al día']);
    expect(r.comparacion.texto).toBe('unos 320 mil tanques de coche de 50 L');
    expect(r.comparacion.rotulo).toBe('Ilustrativo');
    expect(r.origen).toBe('Valor publicado por CONUEE (SENER), 2026');
    expect(rotulo(r.otras.find(x => x.unidad === 'tco2'))).toBe('Valor publicado por Semarnat, 2015');
    near(r.otras.find(x => x.unidad === 'bep').valor, 88435, 1);
    expect(r.pasos.length).toBeGreaterThan(0);
    expect(r.fuentes.map(f => f.id)).toContain('lista-2026');
  });
  it('answers the three shortcuts', () => {
    const [mw, bl, tanque] = ATAJOS.map(a => c(a.ruta));
    expect(textoFrente(mw.principal)).toBe('1 megawatt-hora');
    expect(mw.comparacion.texto).toMatch(/^el 53\s% de la energía de un año de un usuario residencial$/);
    expect(textoFrente(bl.principal)).toBe('159 litros');
    expect(bl.otras.filter(x => x.frente).map(textoFrente)).toEqual(['5.61 gigajoules de energía', '389 kilos de CO₂']);
    expect(textoFrente(tanque.principal)).toBe('138 kilos');
    near(tanque.otras.find(x => x.unidad === 'l').valor, 255, 1e-9);
  });
  it('compares electricity with a year of homes', () => expect(c({ pestana: 'electricidad', valor: 500, unidad: 'gwh' }).comparacion.texto).toBe('la energía de un año de unos 270 mil usuarios residenciales'));
  it('gives power without hours no energy and no comparison', () => {
    const r = c({ pestana: 'electricidad', valor: 1, unidad: 'mw', horas: '' });
    expect(r.principal.unidad).toBe('kw');
    expect(r.comparacion).toBeNull();
  });
  it('rejects hours that make no sense', () => {
    for (const h of ['abc', 0, -1]) expect(c({ pestana: 'electricidad', valor: 1, unidad: 'mw', horas: h }).errores[0].campo).toBe('horas');
  });
  it('turns natural gas volume into energy', () => {
    const r = c({ pestana: 'gas-natural', valor: 1, unidad: 'mmpc' });
    expect(r.principal.unidad).toBe('tj');
    near(convertir(r.principal.valor, 'tj', 'gj'), 1094.2, 0.1);
    expect(r.avisos.join()).toMatch(/valor típico, no oficial/);
    expect(r.principal.clase).toBe('tipico');
    expect(r.comparacion.texto).toContain('1 100 cilindros');
    near(r.otras.find(x => x.unidad === 'bep').valor, 154.3, 0.1);
  });
  it('moves gas from the base condition to the standard one', () => near(c({ pestana: 'gas-natural', valor: 100, unidad: 'm3', ajustes: { c: 'base-nom' } }).otras.find(x => x.etiqueta.includes('estándar')).valor, 95.137, 1e-6));
  it('warns about a heating value outside the NOM and refuses zero', () => {
    expect(c({ pestana: 'gas-natural', valor: 1, unidad: 'm3', ajustes: { pc: 30 } }).avisos.join()).toContain('37.30');
    expect(c({ pestana: 'gas-natural', valor: 1, unidad: 'm3', ajustes: { pc: 0 } }).ok).toBe(false);
  });
});

describe('labels of origin', () => {
  const energia = r => todas(r).find(x => ['mj', 'gj', 'tj', 'pj'].includes(x.unidad));
  it('labels energy that comes from barrels of oil equivalent with the fuel list', () => {
    expect(energia(c({ pestana: 'petroliferos', valor: 10, unidad: 'bep', producto: 'gasolina' }))).toMatchObject({ clase: 'oficial', fuente: 'lista-2026' });
  });
  it('labels gas volume from bep with the list and its energy as typical', () => {
    const r = c({ pestana: 'gas-natural', valor: 1, unidad: 'bep' });
    expect(r.principal).toMatchObject({ unidad: 'm3', fuente: 'lista-2026' });
    expect(energia(r).clase).toBe('tipico');
  });
  it('leaves gas LP on the convention when the temperature is out of range', () => {
    const r = c({ pestana: 'gas-lp', valor: 300, unidad: 'tanque-agua', ajustes: { t: 60 } });
    expect(r.principal.valor).toBeCloseTo(137.7, 9);
    expect(r.principal.clase).toBe('convencion');
    expect(r.avisos.join()).toContain('sin ajuste');
  });
  // User's call (2026-11-09): energy from kilos with a density the person changed is calculated, not published.
  const CALCULADO = { clase: 'calculado', fuente: 'lista-2026', anio: 2026, nota: 'la densidad que elegiste' };
  it('labels diesel energy from kilos with an edited density as calculated', () => {
    expect(energia(c({ pestana: 'petroliferos', valor: 1, unidad: 't', producto: 'diesel', ajustes: { d: 0.82 } }))).toMatchObject(CALCULADO);
    expect(energia(c({ pestana: 'petroliferos', valor: 1, unidad: 't', producto: 'diesel' }))).toMatchObject({ clase: 'oficial', fuente: 'lista-2026' });
  });
  it('labels gas LP energy from a cylinder with a chosen mixture as calculated', () => {
    expect(energia(c({ pestana: 'gas-lp', valor: 1, unidad: 'cil20', ajustes: { m: 'propano' } }))).toMatchObject(CALCULADO);
    expect(energia(c({ pestana: 'gas-lp', valor: 1, unidad: 'cil20' }))).toMatchObject({ clase: 'oficial', fuente: 'lista-2026' });
  });
  it('keeps the published value for energy from a volume', () => {
    expect(energia(c({ pestana: 'petroliferos', valor: 100, unidad: 'l', producto: 'diesel', ajustes: { d: 0.82 } })).clase).toBe('oficial');
  });
  it('never labels kilos that come from a density as published', () => {
    const kilos = todas(c({ pestana: 'petroliferos', valor: 10, unidad: 'gj', producto: 'diesel' })).find(x => x.unidad === 'kg');
    expect(kilos.clase).not.toBe('oficial');
  });
  it('says gas LP cubic metres are liquid', () => {
    const r = c({ pestana: 'gas-lp', valor: 1, unidad: 'cil20' });
    expect(todas(r).find(x => x.unidad === 'm3').etiqueta).toContain('líquido');
  });
});

describe('Otras', () => {
  it('shows the official unit first', () => {
    const r = c({ pestana: 'otras', magnitud: 'presion', valor: 1, unidad: 'bar' });
    expect(r.principal.unidad).toBe('kpa');
    expect(r.principal.valor).toBeCloseTo(100);
    expect(c({ pestana: 'otras', magnitud: 'presion', valor: 1, unidad: 'psi' }).principal.valor).toBeCloseTo(6.894757, 5);
  });
  it('labels every figure with its unit', () => {
    const r = c({ pestana: 'otras', magnitud: 'presion', valor: 1, unidad: 'bar' });
    expect(r.principal.etiqueta).toBe('kilopascales');
    for (const x of r.otras) expect(x.etiqueta, x.unidad).toBeTruthy();
  });
  it('keeps the oil-equivalent tonne a convention', () => {
    const r = c({ pestana: 'otras', magnitud: 'energia', valor: 1, unidad: 'tep' });
    expect(r.principal.clase).toBe('convencion');
    expect(r.origen).toBe('Convención usada en balances de energía');
  });
  it('adds the atmosphere to a gauge pressure', () => {
    const r = c({ pestana: 'otras', magnitud: 'presion', valor: 0, unidad: 'kpa', ajustes: { pm: 'man', a: 2240 } });
    near(r.otras.find(x => x.etiqueta.includes('absoluta')).valor, 77.15, 0.05);
  });
  it('tells a temperature from a difference', () => {
    expect(todas(c({ pestana: 'otras', magnitud: 'temperatura', valor: 20, unidad: 'c' })).find(x => x.unidad === 'f').valor).toBeCloseTo(68);
    expect(todas(c({ pestana: 'otras', magnitud: 'temperatura', valor: 10, unidad: 'c', ajustes: { dt: true } })).find(x => x.unidad === 'f').valor).toBeCloseTo(18);
  });
});

describe('errors and limits', () => {
  it('follows the table of the spec', () => {
    expect(c({ pestana: 'electricidad', valor: 'abc', unidad: 'mw' }).errores[0].mensaje).toBe('Escribe un número, como 1 234.5');
    expect(c({ pestana: 'electricidad', valor: -1, unidad: 'mw' }).ok).toBe(false);
    expect(c({ pestana: 'otras', magnitud: 'temperatura', valor: -300, unidad: 'c' }).ok).toBe(false);
    expect(c({ pestana: 'otras', magnitud: 'temperatura', valor: -10, unidad: 'c' }).ok).toBe(true);
    expect(c({ pestana: 'otras', magnitud: 'presion', valor: -1, unidad: 'kpa', ajustes: { pm: 'abs' } }).ok).toBe(false);
    expect(c({ pestana: 'otras', magnitud: 'presion', valor: -1, unidad: 'kpa', ajustes: { pm: 'man' } }).ok).toBe(true);
    const fuera = c({ pestana: 'petroliferos', valor: 100, unidad: 'l', producto: 'gasolina', ajustes: { t: 90 } });
    expect(fuera.ok).toBe(true);
    expect(fuera.avisos.join()).toContain('sin ajuste');
    expect(c({ pestana: 'electricidad', valor: '1'.repeat(400), unidad: 'mw' }).ok).toBe(false);
  });
  it('shows the example for an empty field', () => {
    const r = c({ pestana: 'otras' });
    expect(r.ejemplo).toBe(true);
    expect(r.principal.valor).toBeCloseTo(100);
  });
  it('says how it read an ambiguous number', () => expect(c({ pestana: 'electricidad', valor: '1,234', unidad: 'mwh' }).avisoValor).toContain('1 234'));
  it('handles zero', () => {
    const r = c({ pestana: 'gas-lp', valor: 0, unidad: 'kg' });
    expect(r.ok).toBe(true);
    expect(r.principal.valor).toBe(0);
    expect(r.comparacion).toBeNull();
  });
  it('compares only where it makes sense', () => {
    for (const producto of ['combustoleo', 'coque', 'maya']) expect(c({ pestana: 'petroliferos', valor: 10, unidad: 't', producto }).comparacion).toBeNull();
  });
  it('drops what does not belong together', () => {
    expect(normalizarEstado({ pestana: 'gas-lp', unidad: 'mw', producto: 'gasolina', ajustes: { c: 'zzz', pc: 40 } })).toMatchObject({ unidad: 'cil20', ajustes: {} });
    expect(normalizarEstado({ pestana: 'gas-natural', base: 'fisica', producto: 'gasolina' })).toMatchObject({ base: null, producto: null });
    expect(normalizarEstado({ pestana: 'petroliferos', producto: 'coque', unidad: 'l' }).unidad).toBe('t');
    expect(normalizarEstado({ pestana: 'otras', magnitud: 'zzz' }).magnitud).toBe('presion');
    expect(unidadesValidas(normalizarEstado({ pestana: 'petroliferos', producto: 'coque' }))).not.toContain('l');
  });
  it('never returns figures that are not finite', () => {
    const r = c({ pestana: 'gas-natural', valor: '1 000 000 000 000 000 000 000', unidad: 'bcf' });
    for (const x of r.ok ? todas(r) : []) expect(Number.isFinite(x.valor)).toBe(true);
  });
});
