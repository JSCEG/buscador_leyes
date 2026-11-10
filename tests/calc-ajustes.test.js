import { describe, expect, it } from 'vitest';
import { aEstandar, apiDeDensidad, corregirGas, densidadDeApi, densidadLP, factorQuemador, factorTemperatura, gravedadDeApi, grupoVcf, presionAtm } from '../src/lib/calc/ajustes.js';

const near = (g, w, t) => expect(Math.abs(g - w)).toBeLessThanOrEqual(t);

describe('liquids and temperature', () => {
  it('shrinks warm gasoline to 20 °C', () => near(20000 * factorTemperatura(35, { kgPorL: 0.735, tRef: 20 }), 19623, 1));
  it('treats diesel as a heavy refined product', () => {
    expect(grupoVcf(840, false).k0).toBe(103.8720);
    near(factorTemperatura(25, { kgPorL: 0.84, tRef: 20 }), 0.99575, 1e-4);
  });
  it('picks the group by density', () => {
    expect(grupoVcf(735, false).k0).toBe(192.4571);
    expect(grupoVcf(804.5, false).k0).toBe(330.3010);
    expect(grupoVcf(780, false).k2).toBe(-0.0018684);
    expect(grupoVcf(920, true).k0).toBe(341.0957);
  });
  it('gives 1 at the reference', () => near(factorTemperatura(20, { kgPorL: 0.735, tRef: 20 }), 1, 1e-12));
  it('reads gas LP density by temperature and mix', () => {
    near(100 * densidadLP(30, '60-40'), 51.74, 0.01);
    near(100 * densidadLP(30, '80-20'), 50.09, 0.01);
    near(densidadLP(15.56, '60-40'), 0.5375, 1e-9);
    near(densidadLP(25, '60-40'), (0.5315 + 0.5174) / 2, 1e-9);
  });
});

describe('gas', () => {
  it.each([['base-nom', 0.95137], ['estandar', 1], ['conuee', 0.97009], ['produccion', 0.99808], ['ee-uu', 1.00039], ['texas', 0.99495], ['normal', 1.05491]])('reference condition %s', (c, w) => near(aEstandar(1, c), w, 2e-5));
  it.each([[0, 101.325], [540, 95.00], [1566, 83.87], [2240, 77.15], [2660, 73.18]])('atmosphere at %s m', (h, w) => near(presionAtm(h), w, 0.05));
  it('corrects a meter for altitude', () => {
    near(corregirGas({ volumen: 100, pManKpa: 2, tC: 20, altitud: 2240 }).sm3SinZ, 76.8, 0.1);
    near(corregirGas({ volumen: 100, pManKpa: 2, tC: 20, altitud: 0 }).sm3SinZ, 100.2, 0.1);
  });
  it('applies Z in a pipeline', () => {
    const r = corregirGas({ volumen: 1000, pManKpa: 50 * 98.0665, tC: 20 });
    near(r.z, 0.90, 0.005);
    near(r.sm3SinZ, 48550, 10);
    // The report's «unos 53 800» divides by Z rounded to 0.900; unrounded Z (0.8979) gives 53 909.
    near(r.sm3ConZ, 53909, 20);
    expect(r.avisoZ).toBe('tres');
  });
  it('uses Z only where it belongs', () => {
    const p = k => corregirGas({ volumen: 1, pManKpa: k * 98.0665, tC: 20 });
    expect(p(5).z).toBeNull();
    expect(p(20).z).toBeGreaterThan(0.9);
    expect(p(20).avisoZ).toBeFalsy();
    expect(p(90).z).toBeNull();
    expect(p(90).avisoZ).toBe('fuera');
  });
  it('loses power in a burner at Mexico City', () => near(1 - factorQuemador(2240), 0.127, 0.005));
});

describe('API gravity', () => {
  it('goes from degrees to density and back', () => {
    near(gravedadDeApi(22), 0.9218, 1e-4);
    near(densidadDeApi(22), 920.9, 0.1);
    near(apiDeDensidad(densidadDeApi(22)), 22, 1e-9);
  });
});
