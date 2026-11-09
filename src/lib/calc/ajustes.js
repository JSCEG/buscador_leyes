/**
 * Adjustments that are not a single factor: temperature in liquids (API MPMS 11.1 form, from a
 * secondary source, so «orientativo»), gas LP density by temperature and mix (NIST), gas reference
 * conditions, altitude (standard atmosphere), compressibility Z (GPSA correlation) and API gravity.
 * Pressures in kPa, temperatures in °C unless the name says otherwise.
 */

export const RANGO_T_LIQUIDOS = [-10, 60];
export const RANGO_T_LP = [-10, 50];
export const RANGO_ALTITUD = [0, 4000];

const AGUA_KG_M3 = 999.016;
const P_ESTANDAR = 101.325;
const T_ESTANDAR_K = 288.15;
const KPA_POR_PSI = 6.894757293168361;
const KPA_POR_KGF_CM2 = 98.0665;

export const gravedadDeApi = api => 141.5 / (131.5 + api);
export const densidadDeApi = api => gravedadDeApi(api) * AGUA_KG_M3;
export const apiDeDensidad = kgM3 => 141.5 / (kgM3 / AGUA_KG_M3) - 131.5;

// Constant groups by API gravity (informe, «Temperatura en líquidos»).
const GRUPOS = [
    { nombre: 'Refinados pesados', hasta: 37.1, k0: 103.8720, k1: 0.2701, k2: 0 },
    { nombre: 'Refinados medios', hasta: 48, k0: 330.3010, k1: 0, k2: 0 },
    { nombre: 'Zona de transición', hasta: 52, k0: 1489.0670, k1: 0, k2: -0.0018684 },
    { nombre: 'Refinados ligeros', hasta: Infinity, k0: 192.4571, k1: 0.2438, k2: 0 },
];
const CRUDO = { nombre: 'Crudo', k0: 341.0957, k1: 0, k2: 0 };

export function grupoVcf(rhoKgM3, crudo = false) {
    if (crudo) return CRUDO;
    const api = apiDeDensidad(rhoKgM3);
    return GRUPOS.find(g => api < g.hasta);
}

/** Volume correction factor from `tC` to 60 °F: VCF = exp{−α·ΔT·[1 + 0.8·α·ΔT]}. */
export function vcf(rhoKgM3, tC, { crudo = false } = {}) {
    const { k0, k1, k2 } = grupoVcf(rhoKgM3, crudo);
    const alfa = k0 / rhoKgM3 ** 2 + k1 / rhoKgM3 + k2;
    const dT = tC * 1.8 + 32 - 60;
    return Math.exp(-alfa * dT * (1 + 0.8 * alfa * dT));
}

/** Litres at `tC` times this factor give litres at `tRef`. */
export function factorTemperatura(tC, { kgPorL, tRef, crudo = false }) {
    const rho = kgPorL * 1000;
    return vcf(rho, tC, { crudo }) / vcf(rho, tRef, { crudo });
}

// Saturated liquid density in kg/L, NIST; mixes as additive volumes at 15.56 °C (notes on gas LP).
const T_LP = [-20, -10, 0, 10, 15.56, 20, 30, 40, 50];
export const MEZCLAS_LP = Object.freeze({
    '60-40': { nombre: '60 % propano, 40 % butano', densidades: [0.5814, 0.5696, 0.5574, 0.5448, 0.5375, 0.5315, 0.5174, 0.5024, 0.4863] },
    '70-30': { nombre: '70 % propano, 30 % butano', densidades: [0.5746, 0.5627, 0.5502, 0.5373, 0.5298, 0.5236, 0.5092, 0.4937, 0.4769] },
    '80-20': { nombre: '80 % propano, 20 % butano', densidades: [0.5679, 0.5557, 0.5430, 0.5298, 0.5221, 0.5158, 0.5009, 0.4850, 0.4676] },
    propano: { nombre: 'Propano', densidades: [0.5545, 0.5418, 0.5286, 0.5147, 0.5067, 0.5001, 0.4844, 0.4675, 0.4489] },
});

/** Gas LP liquid density in kg/L by linear interpolation; null outside the table. */
export function densidadLP(tC, mezcla = '60-40') {
    const d = MEZCLAS_LP[mezcla]?.densidades;
    if (!d || !(tC >= T_LP[0] && tC <= T_LP.at(-1))) return null;
    const i = Math.max(0, T_LP.findIndex(t => t >= tC) - 1);
    if (T_LP[i + 1] === undefined || tC === T_LP[i]) return d[i];
    const r = (tC - T_LP[i]) / (T_LP[i + 1] - T_LP[i]);
    return d[i] + r * (d[i + 1] - d[i]);
}

// Gas reference conditions, absolute pressure in kPa (informe, «La NOM-001 fija dos condiciones»).
export const CONDICIONES = Object.freeze({
    'base-nom': { nombre: 'Base NOM (20 °C y 98.07 kPa)', tC: 20, pKpa: 98.07, factor: 0.95137 },
    estandar: { nombre: 'Estándar NOM (15 °C y 101.325 kPa)', tC: 15, pKpa: P_ESTANDAR },
    conuee: { nombre: 'CONUEE y Balance (20 °C y 100 kPa)', tC: 20, pKpa: 100 },
    produccion: { nombre: 'Medición de producción (15.56 °C y 101.325 kPa)', tC: 15.56, pKpa: P_ESTANDAR },
    'ee-uu': { nombre: 'EE. UU. habitual (60 °F y 14.73 psia)', tC: 140 / 9, pKpa: 14.73 * KPA_POR_PSI },
    texas: { nombre: 'Contratos de Texas (60 °F y 14.65 psia)', tC: 140 / 9, pKpa: 14.65 * KPA_POR_PSI },
    normal: { nombre: 'Normal (0 °C y 101.325 kPa)', tC: 0, pKpa: P_ESTANDAR },
});

/** Cubic metres at condition `id` expressed as standard cubic metres (ideal gas; base NOM by norm). */
export function aEstandar(m3, id) {
    const c = CONDICIONES[id];
    if (!c) throw new RangeError(`Condición desconocida: ${id}`);
    const factor = c.factor ?? (c.pKpa / P_ESTANDAR) * (T_ESTANDAR_K / (c.tC + 273.15));
    return m3 * factor;
}

export const CIUDADES = Object.freeze({
    mar: { nombre: 'Nivel del mar', altitud: 0 },
    monterrey: { nombre: 'Monterrey', altitud: 540 },
    guadalajara: { nombre: 'Guadalajara', altitud: 1566 },
    cdmx: { nombre: 'Ciudad de México', altitud: 2240 },
    toluca: { nombre: 'Toluca', altitud: 2660 },
});

/** Standard-atmosphere pressure in kPa at `h` metres. */
export const presionAtm = h => P_ESTANDAR * (1 - 2.25577e-5 * h) ** 5.25588;

/** GPSA compressibility, pressure in psia and temperature in °R. */
export function zGpsa(pPsia, tRankine, sg = 0.6) {
    if (pPsia <= 100) return 1 / (1 + 0.0002 * pPsia);
    return 1 / (1 + pPsia * 344400 * 10 ** (1.785 * sg) / tRankine ** 3.825);
}

const ZB = 0.997;

/**
 * Line volume to standard cubic metres: Vb = Vf × (Pf/Pb) × (Tb/Tf) × (Zb/Zf), absolute pressures.
 * Up to 7 kg/cm² gauge Z is left out; 7 to 28 uses GPSA; 28 to 85 uses GPSA and warns of ±3 %;
 * above 85 there is no Z.
 */
export function corregirGas({ volumen, pManKpa, tC, altitud = 0, sg = 0.6 }) {
    const pAbs = pManKpa + presionAtm(altitud);
    const sm3SinZ = volumen * (pAbs / P_ESTANDAR) * (T_ESTANDAR_K / (tC + 273.15));
    const kgCm2 = pManKpa / KPA_POR_KGF_CM2;
    if (kgCm2 <= 7) return { sm3SinZ, sm3ConZ: sm3SinZ, z: null, avisoZ: null };
    if (kgCm2 > 85) return { sm3SinZ, sm3ConZ: sm3SinZ, z: null, avisoZ: 'fuera' };
    const z = zGpsa(pAbs / KPA_POR_PSI, (tC + 273.15) * 1.8, sg);
    return { sm3SinZ, sm3ConZ: sm3SinZ * ZB / z, z, avisoZ: kgCm2 > 28 ? 'tres' : null };
}

/** Share of sea-level power a fixed-orifice burner keeps at altitude `h`: √(p/101.325). */
export const factorQuemador = h => Math.sqrt(presionAtm(h) / P_ESTANDAR);
