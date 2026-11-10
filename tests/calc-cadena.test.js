import { describe, expect, it } from 'vitest';
import { calcular, normalizarEstado } from '../src/lib/calc/motor.js';
import { UNIDADES, convertir } from '../src/lib/calc/unidades.js';
import { aEstandar } from '../src/lib/calc/ajustes.js';

const LIQ = ['gasolina', 'diesel', 'turbosina', 'combustoleo', 'maya', 'istmo', 'olmeca'];
// Takes the first figure of the magnitude and converts it to MJ or kg; CO₂ (kgco2, tco2) is not in UNIDADES.
const en = (r, magnitud, hacia) => { const x = [r.principal, ...r.otras].find(y => UNIDADES[y.unidad]?.magnitud === magnitud); return convertir(x.valor, x.unidad, hacia); };
const mj = r => en(r, 'energia', 'mj');
const kg = r => en(r, 'masa', 'kg');

describe.each(['oficial', 'fisica'])('base %s', base => {
  describe.each([{}, { t: 35 }])('adjustments %j', ajustes => {
    it.each(LIQ)('L → kg → MJ equals L → MJ for %s', producto => {
      const l = calcular(normalizarEstado({ pestana: 'petroliferos', valor: 1000, unidad: 'l', producto, base, ajustes }));
      const porKg = calcular(normalizarEstado({ pestana: 'petroliferos', valor: kg(l), unidad: 'kg', producto, base }));
      expect(mj(porKg) / mj(l)).toBeCloseTo(1, 9);
    });
    it('gas LP', () => {
      const l = calcular(normalizarEstado({ pestana: 'gas-lp', valor: 100, unidad: 'l', base, ajustes: { ...ajustes, m: '70-30' } }));
      const porKg = calcular(normalizarEstado({ pestana: 'gas-lp', valor: kg(l), unidad: 'kg', base, ajustes: { m: '70-30' } }));
      expect(mj(porKg) / mj(l)).toBeCloseTo(1, 9);
    });
  });
});

describe('closed chains', () => {
  it('weighs warm gas LP', () => {
    const r = calcular(normalizarEstado({ pestana: 'gas-lp', valor: 100, unidad: 'l', ajustes: { t: 30, m: '60-40' } }));
    expect(Math.abs(r.principal.valor - 51.74)).toBeLessThan(0.01);
  });
  it('recalculates everything with the physical base', () => {
    const v = base => mj(calcular(normalizarEstado({ pestana: 'petroliferos', valor: 1, unidad: 'l', producto: 'gasolina', base })));
    expect(v('oficial')).toBeCloseTo(35.30, 2);
    expect(v('fisica')).toBeCloseTo(32.56, 2);
  });
  it('goes from gas volume to energy and back', () => {
    const ajustes = { c: 'conuee', k: 'inferior' };
    const ida = mj(calcular(normalizarEstado({ pestana: 'gas-natural', valor: 1, unidad: 'mmpc', ajustes })));
    // MJ is not a unit of the gas tab (the spec lists GJ, MMBtu, therm and kWh), so go back through GJ.
    const vuelta = calcular(normalizarEstado({ pestana: 'gas-natural', valor: ida / 1000, unidad: 'gj', ajustes }));
    expect(vuelta.otras.find(x => x.unidad === 'pc').valor / 1e6).toBeCloseTo(aEstandar(1, 'conuee'), 9);
  });
  it('goes from barrels of oil equivalent of gas and back', () => {
    const r = calcular(normalizarEstado({ pestana: 'gas-natural', valor: 10, unidad: 'bep' }));
    expect([r.principal, ...r.otras].find(x => x.unidad === 'bep')).toBeUndefined();
    const sm3 = r.principal.valor;
    const otra = calcular(normalizarEstado({ pestana: 'gas-natural', valor: sm3, unidad: 'm3' }));
    expect(otra.otras.find(x => x.unidad === 'bep').valor).toBeCloseTo(10, 9);
  });
});
