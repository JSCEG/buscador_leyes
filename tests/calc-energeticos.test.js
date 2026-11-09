import { describe, expect, it } from 'vitest';
import { ENERGETICOS, bep, cadena, cadenaGas, co2Kg, gnl } from '../src/lib/calc/energeticos.js';

const near = (g, w, t) => expect(Math.abs(g - w)).toBeLessThanOrEqual(t);

describe('fuel chains', () => {
  it.each([['gasolina', 35.30], ['diesel', 38.15], ['turbosina', 37.03], ['combustoleo', 41.87], ['gas-lp', 26.12], ['maya', 39.92]])('official MJ/L of %s', (p, w) => near(cadena(p).mjPorL, w, 0.01));
  it.each([['gasolina', 32.56], ['diesel', 36.12], ['turbosina', 35.48], ['combustoleo', 40.16], ['gas-lp', 24.76]])('physical MJ/L of %s', (p, w) => near(cadena(p, 'fisica').mjPorL, w, 0.01));
  it('official gas LP implies 48.37 MJ/kg', () => near(cadena('gas-lp').mjPorKg, 48.37, 0.02));
  it('takes petroleum coke by mass only', () => {
    expect(cadena('coque').kgPorL).toBeNull();
    near(cadena('coque').mjPorKg, 34.518, 1e-9);
    near(cadena('coque', 'fisica').mjPorKg, 32.5, 1e-9);
  });
  it('gives the three crudes one official value and their own density', () => {
    expect(cadena('maya').mjPorL).toBe(cadena('olmeca').mjPorL);
    near(cadena('maya').kgPorL, 0.9239, 1e-4);
    near(cadena('istmo').kgPorL, 0.8620, 1e-4);
    near(cadena('olmeca').kgPorL, 0.8315, 1e-4);
  });
  it('labels each base', () => {
    expect(cadena('gasolina')).toMatchObject({ clase: 'oficial', fuente: 'lista-2026', anio: 2026 });
    expect(cadena('gasolina', 'fisica')).toMatchObject({ fuente: 'ipcc-2006' });
  });
  it('closes the chain with an edited density', () => near(cadena('diesel', 'fisica', { densidad: 0.85 }).mjPorL, 43 * 0.85, 1e-9));
});

describe('barrel of oil equivalent and CO₂', () => {
  it.each([['gasolina', 0.8844], ['diesel', 0.9556], ['gas-lp', 0.6543]])('bep of %s', (p, w) => near(bep(ENERGETICOS[p].oficialMjBl), w, 5e-5));
  it.each([['gasolina', 2.447], ['diesel', 2.827], ['turbosina', 2.648], ['combustoleo', 3.240], ['gas-lp', 1.648]])('CO₂ per litre of %s', (p, w) => near(co2Kg(cadena(p).mjPorL, p), w, 1e-3));
  it('coke, CO₂ per tonne', () => near(co2Kg(34518, 'coque') / 1000, 3.366, 1e-3));
  it('100 thousand barrels a day of gasoline', () => {
    const mj = 100000 * ENERGETICOS.gasolina.oficialMjBl;
    near(mj / 1e6, 561.3, 0.01);
    near(bep(mj), 88435, 1);
    near(mj / 1e6 * 365 / 1000, 204.9, 0.05);
  });
});

describe('natural gas and LNG', () => {
  it('uses the higher heating value and puts CO₂ on the lower one', () => {
    near(cadenaGas().co2KgPorSm3, 1.951, 1e-3);
    expect(cadenaGas({ inferior: true }).co2KgPorSm3).toBe(cadenaGas().co2KgPorSm3);
    near(cadenaGas({ inferior: true }).mjPorSm3, 34.776, 1e-9);
    near(cadenaGas().bepPorSm3 * 28316.846592, 154.3, 0.1);
  });
  it('closes LNG through energy', () => {
    const g = gnl(1);
    near(g.kg, 450, 1e-9);
    near(g.mmbtu, 23.4, 1e-9);
    near(g.sm3, 638.9, 0.1);
    near(g.sm3 * cadenaGas().mjPorSm3, g.mj, 1e-6);
  });
});
