/**
 * Electrical formulas with numbers the person types. Plant factors come from the PLADESE tables
 * (2022–2024 average); solar yield per site from the Global Solar Atlas; the national grid
 * emission factor is the 2024 one that Semarnat ordered for the 2026 report.
 */

const HORAS_ANIO = 8760;

export const energiaMWh = (mw, horas) => mw * horas;

/** MW AC times the DC/AC ratio gives MW peak; MW peak times kWh/kWp gives MWh a year. */
export function solar({ mwAc, ilr, pvout }) {
    const mwDc = mwAc * ilr;
    const mwhAnio = mwDc * pvout;
    return { mwDc, mwhAnio, factorAc: mwhAnio / (mwAc * HORAS_ANIO), factorDc: mwhAnio / (mwDc * HORAS_ANIO) };
}

/** Storage (SAE): energy, C-rate and the energy it takes to charge with a round-trip efficiency. */
export function sae({ mw, horas, eficiencia }) {
    const mwh = mw * horas;
    return { mwh, cRate: 1 / horas, carga: mwh / eficiencia };
}

/** Apparent and reactive power from real power and power factor: S² = P² + Q². */
export function spq({ p, fdp }) {
    const s = p / fdp;
    return { s, q: Math.sqrt(s ** 2 - p ** 2) };
}

/** Amperes in a three-phase line: I = MVA × 1000 / (√3 × kV between phases). */
export const corrienteTrifasica = (mva, kV) => mva * 1000 / (Math.sqrt(3) * kV);

/** Reactive power to go from one power factor to another: Qc = P × (tan φ₁ − tan φ₂). */
export const compensacion = (p, fdp1, fdp2) => p * (Math.tan(Math.acos(fdp1)) - Math.tan(Math.acos(fdp2)));

const BETZ = 16 / 27;

/** Wind power P = ½ρAv³Cp, capped at the turbine's rated power when given. */
export function viento({ rotorM, v, cp = 0.45, rho = 1.225, nominalMw = null }) {
    const area = Math.PI * (rotorM / 2) ** 2;
    const libre = 0.5 * rho * area * v ** 3 * cp / 1e6;
    const topado = nominalMw != null && libre > nominalMw;
    return { mw: topado ? nominalMw : libre, topado, sobreBetz: cp > BETZ };
}

/** Hydro power P = ρgQHη, in MW. */
export const hidro = ({ q, h, eta }) => 1000 * 9.81 * q * h * eta / 1e6;

/** Efficiency from a heat rate in kJ/kWh. */
export const eficienciaHeatRate = hr => 3600 / hr;

export const FACTOR_SEN = Object.freeze({ valor: 0.444, anio: 2024, fuente: 'aviso-semarnat-2026' });

export const emisionesMWh = mwh => mwh * FACTOR_SEN.valor;

/** Observed plant factor, 2022–2024 average, from the PLADESE tables 2.1 and 2.2. */
export const FACTOR_PLANTA = Object.freeze({
    nuclear: 0.817,
    'ciclo-combinado': 0.668,
    geotermia: 0.473,
    turbogas: 0.340,
    eolica: 0.324,
    carbon: 0.288,
    solar: 0.276,
    hidro: 0.241,
});

export const NOMBRES_TECNOLOGIA = Object.freeze({
    nuclear: 'Nuclear', 'ciclo-combinado': 'Ciclo combinado', geotermia: 'Geotermia', turbogas: 'Turbogás',
    eolica: 'Eólica', carbon: 'Carboeléctrica', solar: 'Solar fotovoltaica', hidro: 'Hidroeléctrica',
});

/** Annual yield in kWh per kW peak, Global Solar Atlas, fixed structure. */
export const SITIOS_SOLARES = Object.freeze([
    { id: 'chihuahua', nombre: 'Chihuahua', pvout: 1952 },
    { id: 'mexicali', nombre: 'Mexicali', pvout: 1936 },
    { id: 'la-paz', nombre: 'La Paz, BCS', pvout: 1920 },
    { id: 'hermosillo', nombre: 'Hermosillo', pvout: 1908 },
    { id: 'guadalajara', nombre: 'Guadalajara', pvout: 1887 },
    { id: 'cdmx', nombre: 'Ciudad de México', pvout: 1814 },
    { id: 'juchitan', nombre: 'Juchitán, Oaxaca', pvout: 1810 },
    { id: 'merida', nombre: 'Mérida', pvout: 1702 },
    { id: 'monterrey', nombre: 'Monterrey', pvout: 1619 },
    { id: 'villahermosa', nombre: 'Villahermosa', pvout: 1582 },
]);
