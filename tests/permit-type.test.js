import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadTechIndex, permitType, resetTechIndexForTests, techOf, tileInk, typeTile } from '../src/lib/permit-type.js';
import { infraIcon } from '../src/lib/infra-icons.js';

describe('permit type', () => {
  it.each([
    ['CNE/PL/933/TRA/OM/2026', 'distribucion', 'Transporte sin ducto'],
    ['PL/9/TRA/TM/2020', 'distribucion', 'Transporte'],
    ['G/1/TRA/2020', 'ducto', 'Transporte por ducto'],
    ['PL/9/ALM/2020', 'almacenamiento', 'Almacenamiento'],
    ['PL/9/ALM/AE/2020', 'aerodromo', 'Almacenamiento en aeródromo'],
    ['LP/9/DIST/PLA/2020', 'planta', 'Planta de distribución'],
    ['LP/9/DIST/2020', 'distribucion', 'Distribución'],
    ['CNE/LP/931/EXP/ES/2026', 'estacion', 'Estación de servicio'],
    ['PL/9/EXP/ESA/2020', 'autoconsumo', 'Autoconsumo'],
    ['H/9/COM/2020', 'comercio', 'Comercialización'],
    ['G/9/LICUE/2020', 'planta', 'Licuefacción'],
    ['E/9/COG/2020', 'termica', 'Cogeneración'],
    ['E/9/IMP/2020', 'importacion', 'Importación'],
  ])('%s', (numero, icon, label) => { expect(permitType(numero)).toMatchObject({ icon, label }); });
  it('uses the technology when known', () => { expect(permitType('E/1/GEN/2020', { technology: 'Fotovoltaica' })).toMatchObject({ tech: 'fv', label: 'Fotovoltaica' }); });
  it('falls back to the code without a known technology', () => { expect(permitType('E/1/GEN/2020', { technology: 'Otra' })).toMatchObject({ icon: 'generacion', label: 'Generación' }); });
  it('never invents a type', () => { expect(permitType('G/1/TUP/2020').icon).toBe('otro'); expect(permitType('').icon).toBe('otro'); });
  it('picks readable ink', () => { expect(tileInk('#e0a12e')).toBe('#0a0707'); expect(tileInk('#9b2247')).toBe('#fff'); });
  it('draws a tile with its glyph', () => {
    document.body.innerHTML = typeTile(permitType('G/1/TRA/2020'), { size: 'ch' });
    expect(document.querySelector('.bu-ico.is-ch svg')).not.toBeNull();
    document.body.innerHTML = typeTile(permitType('E/1/GEN/2020', { technology: 'Eólica' }));
    expect(document.querySelector('.bu-ico').getAttribute('style')).toContain('--tec-eo');
  });
  it('has a pipeline icon', () => { expect(infraIcon('ducto', 12)).toContain('<svg'); });
});

describe('technology index', () => {
  beforeEach(resetTechIndexForTests);
  it('asks once and matches with or without the CNE prefix', async () => {
    const fetcher = vi.fn(async () => ({ features: [{ properties: { numeroPermiso: 'E/1/GEN/2020', tecnologia: 'Eólica' } }] }));
    const index = await loadTechIndex(fetcher);
    await loadTechIndex(fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(techOf(index, 'CNE/E/1/GEN/2020')).toBe('Eólica');
    expect(techOf(index, 'E/2/GEN/2020')).toBe('');
  });
  it('is empty when the layer fails', async () => {
    const index = await loadTechIndex(async () => { throw new Error('caído'); });
    expect(index.size).toBe(0);
  });
});
