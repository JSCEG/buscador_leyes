import { describe, expect, it } from 'vitest';
import { FACTOR_PLANTA, SITIOS_SOLARES, compensacion, corrienteTrifasica, eficienciaHeatRate, emisionesMWh, energiaMWh, hidro, sae, solar, spq, viento } from '../src/lib/calc/electricidad.js';
import { convertir } from '../src/lib/calc/unidades.js';

const near = (g, w, t) => expect(Math.abs(g - w)).toBeLessThanOrEqual(t);

describe('electrical formulas from the report', () => {
  it('energy', () => { expect(energiaMWh(100, 8)).toBe(800); near(convertir(800, 'mwh', 'tj'), 2.88, 1e-9); });
  it('S, P and Q', () => { const r = spq({ p: 90, fdp: 0.9 }); near(r.s, 100, 1e-9); near(r.q, 43.59, 0.01); });
  it('three-phase current', () => near(corrienteTrifasica(100, 230), 251, 0.5));
  it('compensation', () => near(compensacion(1000, 0.8, 0.97), 499, 0.5));
  it('solar in Hermosillo', () => {
    const r = solar({ mwAc: 100, ilr: 1.3, pvout: 1908 });
    near(r.mwDc, 130, 1e-9);
    expect(r.mwhAnio).toBeCloseTo(248040);
    near(r.factorAc, 0.283, 5e-4);
    near(r.factorDc, 0.218, 5e-4);
  });
  it('storage', () => { const r = sae({ mw: 30, horas: 3, eficiencia: 0.85 }); expect(r.mwh).toBe(90); near(r.cRate, 0.33, 0.01); near(r.carga, 105.9, 0.05); });
  it('wind with its rated cap', () => {
    near(viento({ rotorM: 150, v: 8 }).mw, 2.49, 0.01);
    const t = viento({ rotorM: 150, v: 12, nominalMw: 3 });
    expect(t.mw).toBe(3);
    expect(t.topado).toBe(true);
    expect(viento({ rotorM: 150, v: 8, cp: 0.6 }).sobreBetz).toBe(true);
  });
  it('hydro', () => near(hidro({ q: 100, h: 100, eta: 0.88 }), 86.3, 0.05));
  it('heat rate', () => near(eficienciaHeatRate(7139), 0.504, 5e-4));
  it('emissions', () => near(emisionesMWh(120), 53.28, 1e-9));
  it('tables', () => {
    expect(SITIOS_SOLARES).toHaveLength(10);
    expect(FACTOR_PLANTA['ciclo-combinado']).toBe(0.668);
    expect(Object.keys(FACTOR_PLANTA)).toHaveLength(8);
  });
});
