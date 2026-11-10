import { describe, expect, it } from 'vitest';
import { PRECIO_NETO_2025, ahoraEnSistema, celGenerados, celRequeridos, figuraPermiso, kwMes, pagoPotencia, periodoGDMTH, precioNeto, temporadaGDMTH } from '../src/lib/calc/mercado.js';

const near = (g, w, t) => expect(Math.abs(g - w)).toBeLessThanOrEqual(t);

describe('capacity price', () => {
  it('reproduces the SIN net price with the official formula', () => {
    near(precioNeto(1.3749, 3812112.33, 843476.23), PRECIO_NETO_2025.sin, 2);
    expect(precioNeto(0, 1, 5)).toBe(0);
  });
  it('turns $/MW-year into $/kW-month', () => {
    near(kwMes(PRECIO_NETO_2025.sin), 366.48, 0.005);
    near(kwMes(PRECIO_NETO_2025.bca), 172.82, 0.005);
    near(kwMes(PRECIO_NETO_2025.bcs), 567.84, 0.005);
  });
  it('pays MW-year times the net price', () => near(pagoPotencia(50, 'sin'), 219889850.50, 0.01));
});

describe('GDMTH season', () => {
  it.each([['sin', '2026-04-04', 'invierno'], ['sin', '2026-04-05', 'verano'], ['sin', '2026-10-24', 'verano'], ['sin', '2026-10-25', 'invierno'], ['bcs', '2026-04-05', 'verano'],
    ['bca', '2026-04-30', 'invierno'], ['bca', '2026-05-01', 'verano'], ['bca', '2026-10-24', 'verano'], ['bca', '2026-10-25', 'invierno']])('%s %s', (s, f, t) => expect(temporadaGDMTH(s, f)).toBe(t));
  it('does not depend on the time zone', () => {
    const tz = process.env.TZ;
    process.env.TZ = 'America/Tijuana';
    expect(temporadaGDMTH('sin', '2026-04-05')).toBe('verano');
    process.env.TZ = tz;
  });
});

describe('GDMTH period', () => {
  it.each([
    ['sin', '2026-07-15', '19:59', false, 'intermedio'], ['sin', '2026-07-15', '20:00', false, 'punta'], ['sin', '2026-07-15', '22:00', false, 'intermedio'], ['sin', '2026-07-15', '05:59', false, 'base'],
    ['sin', '2026-07-15', '20:30', true, 'intermedio'], ['sin', '2026-07-18', '19:30', false, 'intermedio'], ['sin', '2026-12-12', '19:30', false, 'punta'], ['sin', '2026-12-16', '18:00', false, 'punta'],
    ['bca', '2026-07-15', '14:00', false, 'punta'], ['bca', '2026-07-18', '15:00', false, 'intermedio'], ['bca', '2026-12-13', '12:00', false, 'base'],
    ['bcs', '2026-07-18', '20:00', false, 'punta'], ['bcs', '2026-12-13', '20:00', false, 'intermedio'],
  ])('%s %s %s holiday=%s', (sistema, fecha, hora, festivo, periodo) => expect(periodoGDMTH({ sistema, fecha, hora, festivo }).periodo).toBe(periodo));
  it.each([['2026-02-30', '12:00'], ['', '12:00'], ['2026-07-15', '24:00'], ['2026-07-15', ''], ['ayer', '12:00']])('rejects %s %s', (fecha, hora) => {
    const r = periodoGDMTH({ sistema: 'sin', fecha, hora, festivo: false });
    expect(r.ok).toBe(false);
    expect(r.errores.length).toBeGreaterThan(0);
  });
});

describe('clean energy certificates and permits', () => {
  it('counts CEL only in years with a requirement', () => {
    expect(celRequeridos(10000, 2026)).toBeCloseTo(1390);
    expect(celRequeridos(10000, 2027)).toBeNull();
    expect(celGenerados(1000, 0.4)).toBe(400);
    expect(celGenerados(1000)).toBe(1000);
  });
  it('names the permit by size', () => {
    expect(figuraPermiso(0.69)).toBe('exenta');
    expect(figuraPermiso(0.7)).toBe('permiso');
    expect(figuraPermiso(20, { autoconsumo: true })).toBe('simplificado');
    expect(figuraPermiso(21, { autoconsumo: true })).toBe('permiso');
  });
});

describe('the clock of each system', () => {
  // Baja California follows Tijuana (with summer time); Baja California Sur, Mazatlán (UTC−7 all year).
  it('gives the date and time in Baja California and Baja California Sur', () => {
    const verano = new Date('2026-07-15T03:30:00Z');
    const invierno = new Date('2026-01-15T03:30:00Z');
    expect(ahoraEnSistema('bca', verano)).toEqual({ fecha: '2026-07-14', hora: '20:30' });
    expect(ahoraEnSistema('bcs', verano)).toEqual({ fecha: '2026-07-14', hora: '20:30' });
    expect(ahoraEnSistema('bca', invierno)).toEqual({ fecha: '2026-01-14', hora: '19:30' });
    expect(ahoraEnSistema('bcs', invierno)).toEqual({ fecha: '2026-01-14', hora: '20:30' });
  });
  it('writes midnight as 00:00', () => expect(ahoraEnSistema('bcs', new Date('2026-01-15T07:00:00Z')).hora).toBe('00:00'));
});
