/**
 * Energy values per fuel, in two closed chains that never mix:
 * - official: the heating value SENER publishes in the 2026 fuel list (MJ per barrel at reference
 *   temperature), with mass from the working density;
 * - physical: IPCC 2006 net heating value per kilogram, times the same density.
 * Going through litres, kilos or energy gives the same result inside one chain.
 * The barrel of oil equivalent is always heating value ÷ 6 347 MJ; the list's rounded bep factors
 * are not copied. CO₂ uses the 2015 Acuerdo factor per TJ on whichever energy the chain gives.
 */

export const BARRIL_L = 158.987294928;
export const BEP_MJ = 6347;

const crudo = api => 141.5 / (131.5 + api) * 0.999016;

export const ENERGETICOS = Object.freeze({
    gasolina: { id: 'gasolina', nombre: 'Gasolinas y naftas', oficialMjBl: 5613, fisicaMjKg: 44.3, densidadKgL: 0.735, tRef: 20, co2TJ: 69.3 },
    diesel: { id: 'diesel', nombre: 'Diésel', oficialMjBl: 6065, fisicaMjKg: 43.0, densidadKgL: 0.84, tRef: 20, co2TJ: 74.1, densidadSinFuente: true },
    turbosina: { id: 'turbosina', nombre: 'Turbosina', oficialMjBl: 5888, fisicaMjKg: 44.1, densidadKgL: 0.8045, tRef: 20, co2TJ: 71.5 },
    combustoleo: { id: 'combustoleo', nombre: 'Combustóleo', oficialMjBl: 6656, fisicaMjKg: 40.4, densidadKgL: 0.9941, tRef: 20, co2TJ: 77.4 },
    coque: { id: 'coque', nombre: 'Coque de petróleo', oficialMjKg: 34.518, fisicaMjKg: 32.5, densidadKgL: null, tRef: null, co2TJ: 97.5, soloMasa: true },
    maya: { id: 'maya', nombre: 'Crudo Maya', oficialMjBl: 6347, fisicaMjKg: 42.3, api: 21.5, densidadKgL: crudo(21.5), tRef: 15.56, co2TJ: 73.3, crudo: true },
    istmo: { id: 'istmo', nombre: 'Crudo Istmo', oficialMjBl: 6347, fisicaMjKg: 42.3, api: 32.5, densidadKgL: crudo(32.5), tRef: 15.56, co2TJ: 73.3, crudo: true },
    olmeca: { id: 'olmeca', nombre: 'Crudo Olmeca', oficialMjBl: 6347, fisicaMjKg: 42.3, api: 38.5, densidadKgL: crudo(38.5), tRef: 15.56, co2TJ: 73.3, crudo: true },
    'gas-lp': { id: 'gas-lp', nombre: 'Gas LP', oficialMjBl: 4153, fisicaMjKg: 46.07, densidadKgL: 0.54, densidadFisicaKgL: 0.5375, tRef: 15.56, co2TJ: 63.1 },
});

/**
 * MJ per litre, kg per litre and MJ per kg of one fuel in one base.
 * `densidad` replaces the working density (kg/L) in both bases, so the chain stays closed.
 */
export function cadena(productoId, base = 'oficial', { densidad } = {}) {
    const e = ENERGETICOS[productoId];
    if (!e) throw new RangeError(`Producto desconocido: ${productoId}`);
    const oficial = base !== 'fisica';
    const etiqueta = oficial ? { clase: 'oficial', fuente: 'lista-2026', anio: 2026 } : { clase: 'tipico', fuente: 'ipcc-2006', anio: 2006 };
    if (e.soloMasa) return { mjPorL: null, kgPorL: null, mjPorKg: oficial ? e.oficialMjKg : e.fisicaMjKg, ...etiqueta };
    const kgPorL = densidad ?? (oficial ? e.densidadKgL : (e.densidadFisicaKgL ?? e.densidadKgL));
    if (oficial) {
        const mjPorL = e.oficialMjBl / BARRIL_L;
        return { mjPorL, kgPorL, mjPorKg: mjPorL / kgPorL, ...etiqueta };
    }
    return { mjPorL: e.fisicaMjKg * kgPorL, kgPorL, mjPorKg: e.fisicaMjKg, ...etiqueta };
}

/** Kilos of CO₂ for `mj` megajoules of a fuel (t/TJ is the same as g/MJ). */
export const co2Kg = (mj, productoId) => mj * ENERGETICOS[productoId].co2TJ / 1000;

export const bep = mj => mj / BEP_MJ;

/**
 * Natural gas. 38.64 MJ per standard cubic metre (15 °C, 101.325 kPa) is a typical higher heating
 * value, not an official one; the lower one is 0.90 of it. The list's dry gas (33 543 kJ/m³ at
 * 20 °C and 100 kPa) gives the barrel of oil equivalent.
 */
export const GAS = Object.freeze({ pcs: 38.64, factorPci: 0.9, kgSm3: 0.735, secoMjM3: 33.543, factorConuee: 0.97009, co2TJ: 56.1 });

export function cadenaGas({ pcs = GAS.pcs, inferior = false } = {}) {
    return {
        mjPorSm3: inferior ? pcs * GAS.factorPci : pcs,
        kgPorSm3: GAS.kgSm3,
        // The 56.1 t/TJ factor applies to the lower heating value, whatever base is on screen.
        co2KgPorSm3: pcs * GAS.factorPci * GAS.co2TJ / 1000,
        bepPorSm3: GAS.secoMjM3 / GAS.factorConuee / BEP_MJ,
    };
}

const MJ_POR_MMBTU = 1055.05585262;

/** LNG by mass: 450 kg per m³ and 52 MMBtu per tonne; gas cubic metres come from energy. */
export function gnl(m3) {
    const kg = m3 * 450;
    const mmbtu = kg / 1000 * 52;
    const mj = mmbtu * MJ_POR_MMBTU;
    return { kg, mmbtu, mj, sm3: mj / GAS.pcs };
}
