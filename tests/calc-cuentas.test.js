import { describe, expect, it } from 'vitest';
import { CUENTAS, calcularCuenta, cuentasDe } from '../src/lib/calc/cuentas.js';

const linea = (r, id) => r.lineas.find(l => l.id === id);

// [cuenta, campos, [[línea, valor, tolerancia]]]: values from the report, tolerance half the last printed digit.
const CASOS = [
  ['central', { mw: 100, horas: 8760, tecnologia: 'ciclo-combinado' }, [['energia', 585168, 0.5]]],
  ['solar', { mwAc: 100, ilr: 1.3, sitio: 'hermosillo' }, [['mw-pico', 130, 1e-9], ['energia', 248040, 0.5], ['factor-ac', 28.3, 0.05], ['factor-dc', 21.8, 0.05]]],
  ['sae', { mw: 30, horas: 3, eficiencia: 85 }, [['energia', 90, 1e-9], ['c', 0.33, 0.005], ['carga', 105.9, 0.05]]],
  ['factor-potencia', { p: 90, fdp: 0.9, kv: 230, objetivo: 0.97 }, [['s', 100, 1e-9], ['q', 43.59, 0.005], ['corriente', 251, 0.5], ['compensacion', 21.0, 0.05]]],
  ['viento-agua', { tipo: 'viento', rotor: 150, v: 8 }, [['potencia', 2.49, 0.005]]],
  ['viento-agua', { tipo: 'agua', q: 100, h: 100, eta: 0.88 }, [['potencia', 86.3, 0.05]]],
  ['costo-electricidad', { mwh: 1, precio: 1.8674 }, [['por-mwh', 1867.40, 0.005], ['total', 1867.40, 0.005]]],
  ['emisiones-electricidad', { mwh: 120 }, [['emisiones', 53.28, 0.005]]],
  ['precio-potencia', { sistema: 'sin', mwAnio: 50 }, [['kw-mes', 366.48, 0.005], ['pago', 219889850.50, 0.005]]],
  ['cel', { mwh: 10000, anio: 2026 }, [['requeridos', 1390, 0.5]]],
  ['costo-petroliferos', { precio: 23, producto: 'gasolina' }, [['por-barril', 3656.7, 0.05], ['por-gj', 651.5, 0.05], ['por-gj-fisica', 706.4, 0.05]]],
  ['dilatacion', { litros: 20000, t: 35, tRef: 20, producto: 'gasolina' }, [['litros', 19623, 0.5]]],
  ['api', { api: 22 }, [['gravedad', 0.9218, 0.00005], ['densidad', 920.9, 0.05], ['kg-barril', 146.4, 0.05], ['barriles-tonelada', 6.83, 0.005]]],
  ['velocidad-ducto', { mbd: 100, diametro: 0.3048 }, [['velocidad', 2.52, 0.005]]],
  ['medidor-altitud', { volumen: 100, presion: 2, t: 20, altitud: 2240 }, [['estandar', 76.8, 0.05]]],
  // The report's 53 800 and 2 078 used Z rounded to 0.900; unrounded GPSA gives 53 909 and 2 083 (ledger, Task 4).
  ['presion-z', { volumen: 1000, presion: 50, t: 20 }, [['estandar', 53900, 50], ['z', 0.90, 0.005], ['energia', 2083, 0.5]]],
  ['gas-central', { mw: 1000, hr: 7, pcs: 38.64 }, [['flujo', 154, 0.5]]],
  ['gnl', { m3: 1 }, [['masa', 450, 1e-9], ['mmbtu', 23.4, 1e-9], ['gas', 639, 0.5]]],
  ['costo-gas', { precio: 4, cambio: 18.6297 }, [['por-gj', 70.63, 0.005], ['por-kwh', 0.254, 0.0005]]],
  ['tanque', { litros: 300, llenado: 85 }, [['litros', 255, 1e-9], ['kilos', 137.7, 0.05]]],
  ['quemador', { altitud: 2240 }, [['potencia', 87.3, 0.05]]],
  ['costo-lp', { precio: 20 }, [['por-litro', 10.80, 0.005]]],
  ['emisiones-lp', { kg: 20 }, [['emisiones', 61.0, 0.05]]],
];

describe('the report examples', () => {
  it.each(CASOS)('%s %j', (id, campos, esperados) => {
    const r = calcularCuenta(id, campos);
    expect(r.ok, JSON.stringify(r.errores)).toBe(true);
    for (const [lineaId, valor, tol] of esperados) {
      const l = linea(r, lineaId);
      expect(l, lineaId).toBeTruthy();
      expect(Math.abs(l.valor - valor), lineaId).toBeLessThanOrEqual(tol);
    }
  });
  it('tells the GDMTH period', () => {
    const r = calcularCuenta('periodo', { sistema: 'sin', fecha: '2026-07-15', hora: '20:00', festivo: false });
    expect(linea(r, 'periodo').texto).toMatch(/punta/i);
    expect(linea(r, 'periodo').texto).toMatch(/verano/i);
  });
  it('writes the CEL share without float noise', () => expect(linea(calcularCuenta('cel', { mwh: 10000, anio: 2026 }), 'requeridos').texto).toMatch(/\(13\.9\s%\)$/));
  it('keeps the two dilatation lines on whole litres so they add up', () => {
    const r = calcularCuenta('dilatacion', { litros: 20000, t: 35, tRef: 20, producto: 'gasolina' });
    expect(linea(r, 'litros').decimales).toBe(0);
    expect(linea(r, 'diferencia').decimales).toBe(0);
  });
  it('names the permit', () => expect(linea(calcularCuenta('permiso', { mw: 0.5, autoconsumo: false }), 'figura').texto).toContain('Generadora Exenta'));
});

describe('limits', () => {
  it.each([['solar', { mwAc: 100, ilr: '', sitio: 'hermosillo' }, 'ilr'], ['solar', { mwAc: 100, ilr: 0, sitio: 'hermosillo' }, 'ilr'], ['factor-potencia', { p: 90, fdp: 0, kv: 230, objetivo: 0.97 }, 'fdp'], ['factor-potencia', { p: 90, fdp: 0.9, kv: 0, objetivo: 0.97 }, 'kv'],
    ['sae', { mw: 30, horas: 3, eficiencia: 0 }, 'eficiencia'], ['velocidad-ducto', { mbd: 100, diametro: 0 }, 'diametro'], ['costo-gas', { precio: 4, cambio: '' }, 'cambio'], ['gas-central', { mw: 1000, hr: 7, pcs: 0 }, 'pcs'], ['viento-agua', { tipo: 'viento', rotor: 0, v: 8 }, 'rotor'], ['tanque', { litros: 300, llenado: 150 }, 'llenado']])('%s rejects %j', (id, v, campo) => {
    const r = calcularCuenta(id, v);
    expect(r.ok).toBe(false);
    expect(r.errores[0].campo).toBe(campo);
    expect(r.lineas).toEqual([]);
  });
  it('never returns figures that are not finite with the defaults', () => {
    for (const c of Object.values(CUENTAS)) {
      const v = Object.fromEntries(c.campos.map(f => [f.id, f.porDefecto]));
      for (const l of calcularCuenta(c.id, v).lineas) if (l.valor != null) expect(Number.isFinite(l.valor), c.id).toBe(true);
    }
  });
  it.each([['medidor-altitud', { volumen: 100, presion: 2, t: -300, altitud: 0 }], ['medidor-altitud', { volumen: 100, presion: 2, t: -273.15, altitud: 0 }], ['presion-z', { volumen: 1000, presion: 50, t: -280 }]])('refuses temperatures at or below absolute zero in %s', (id, v) => {
    const r = calcularCuenta(id, v);
    expect(r.ok).toBe(false);
    expect(r.errores[0].campo).toBe('t');
  });
  it('closes LNG both ways', () => {
    const r = calcularCuenta('gnl', { m3: 1 });
    const gas = r.lineas.find(l => l.unidad === 'sm3').valor;
    expect(gas * 38.64).toBeCloseTo(r.lineas.find(l => l.unidad === 'mj').valor, 6);
  });
  it('gives no CEL for a year without requirement', () => {
    const r = calcularCuenta('cel', { mwh: 100, anio: 2027 });
    expect(r.lineas.find(l => l.unidad === 'cel')).toBeUndefined();
    expect(r.avisos.join()).toMatch(/2027/);
  });
  it('goes without Z above 85 kg/cm²', () => {
    const r = calcularCuenta('presion-z', { volumen: 1000, presion: 90, t: 20 });
    expect(r.ok).toBe(true);
    expect(r.avisos.join()).toMatch(/sin Z/);
  });
  it('warns that a DC/AC ratio above 1.3 clips energy', () => expect(calcularCuenta('solar', { mwAc: 100, ilr: 1.5, sitio: 'hermosillo' }).avisos.join()).toMatch(/recort/));
  it('offers every small calculation of the spec in its tab', () => {
    expect(cuentasDe('electricidad').map(c => c.id)).toEqual(['central', 'solar', 'sae', 'factor-potencia', 'viento-agua', 'costo-electricidad', 'emisiones-electricidad']);
    expect(cuentasDe('petroliferos').map(c => c.id)).toEqual(['costo-petroliferos', 'dilatacion', 'api', 'velocidad-ducto']);
    expect(cuentasDe('gas-natural').map(c => c.id)).toEqual(['medidor-altitud', 'presion-z', 'gas-central', 'gnl', 'costo-gas']);
    expect(cuentasDe('gas-lp').map(c => c.id)).toEqual(['tanque', 'quemador', 'costo-lp', 'emisiones-lp']);
    expect(cuentasDe('otras')).toEqual([]);
  });
});
