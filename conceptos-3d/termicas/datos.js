// Las cifras de la figura de las centrales térmicas, con su fuente en fuentes.js. Lo que es de ejemplo lo dice su comentario.

/** PLADESE 2025-2039, tablas 2.1 y 2.2: capacidad en MW al cierre de 2024 y generación neta inyectada en GWh. */
export const NACIONAL = {
    mw: { carbon: 5463, convencional: 11300, combustionInterna: 717, turbogas: 3953, cicloCombinado: 35669, total: 90543 },
    gwh: { carbon: 12968, convencional: 28228, combustionInterna: 3847, turbogas: 12017, total: 352305 },
    mw2010: { carbon: 5393, convencional: 12876, combustionInterna: 241, turbogas: 2914 },
    gwh2010: { carbon: 35371, convencional: 47376, combustionInterna: 1364, turbogas: 2217 },
    horas2024: 8784,
};

/** PLADESE 2025-2039: sustituciones (cap. 3 y tablas 4.1 a 4.8) y unidades candidatas a retiro (tabla A1.8, sin año). */
export const RETIROS = {
    sustituye: { convencional: 1631, turbogas: 33, combustionInterna: 142 },
    candidatas: { mw: 9935, unidades: 86, convencional: 7260.2, turbogas: 671.7, combustionInterna: 256, carbon: 0 },
};

/** PLADESE 2025-2039, tabla 3.1: costo de inversión promedio, USD por kW. */
export const INVERSION = { turbogas: 727, combustionInterna: 1265, carbon: 1895, cicloCombinado: 843 };
/** PLADESE 2025-2039 (texto en el DOF): el Sistema Interconectado de Baja California Sur en 2024 y su crecimiento a 2039. */
export const BCS = { pico2024: 689, consumoBruto2024: 3425, consumoFinal2024: 3079, crecePico: 0.033, creceConsumo: 0.031 };
/** PLADESE 2025-2039: margen de reserva de planeación. */
export const MARGEN = { sin: 0.213, sibc: 0.209, sibcs: 0.35 };

/** Acuerdo de la SHCP, DOF 22-12-2025: cuotas 2026 del IEPS a combustibles fósiles (art. 2.º, fr. I, inciso H). El gas natural no tiene cuota. */
export const IEPS = { combustoleo: { cuota: 0.229975, unidad: 'litro' }, diesel: { cuota: 0.215491, unidad: 'litro' }, carbon: { cuota: 47.1189, unidad: 'tonelada' }, gas: null };

/** NOM-085-SEMARNAT-2011, tabla 1: calderas existentes de más de 530 GJ/h con combustible sólido o líquido (ppmv, 5 % de O2). */
export const NOM085 = {
    so2: { valle: 550, criticas: 600, resto: 2200 },
    nox: { valle: 110, criticas: 110, resto: 375 },
    particulas: { valle: 60, criticas: 250, resto: 350 },
};

/** Factor de emisión del Sistema Eléctrico Nacional, t de CO2e por MWh (aviso de la SEMARNAT del 28-02-2025 para 2024; 2023 de la CRE). */
export const FACTOR_SEN = { 2023: 0.438, 2024: 0.444, pico2017: 0.582 };

// ------------------------------------------------------------------ las máquinas y sus combustibles
/**
 * Combustibles, todo en poder calorífico superior, como los regímenes de la EIA.
 * pcs: MJ por kg (carbón importado en Petacalco, COPAR 2012 cuadro 3.4) o MJ por litro (combustóleo y diésel domésticos, mismo cuadro).
 * co2: kg de CO2 por millón de BTU (EIA). azufre y cenizas: fracción de la masa. densidad: kg por litro (combustóleo No. 6, COPAR cuadro 3.2).
 */
export const COMBUSTIBLES = {
    carbon: { nombre: 'carbón', pcsKg: 26.28241, co2: 93.24, azufre: 0.005, cenizas: 0.1 },
    combustoleo: { nombre: 'combustóleo', pcsLitro: 41.69, densidad: 0.9851, co2: 75.09, azufre: 0.044, cenizas: 0 },
    gas: { nombre: 'gas natural', co2: 52.91, azufre: 0, cenizas: 0 },
    diesel: { nombre: 'diésel', pcsLitro: 38.69, co2: 74.14, azufre: 0, cenizas: 0 },
};
/** Del azufre del combustible, lo que sale como dióxido de azufre (EPA AP-42, sección 1.3: «more than 95 percent»). */
export const AZUFRE_A_SO2 = 0.95;
/** El tope de azufre del combustóleo (NOM-016-CRE-2016, tabla 9) y el de los corredores industriales como Tula (anexo 2). */
export const AZUFRE_NOM016 = { tope: 0.044, corredores: 0.02 };

/**
 * Régimen térmico probado a plena carga, BTU por kWh (EIA, Electric Power Annual, tabla 8.2, 2025).
 * castigo: cuánto sube a 50 % de carga (NREL, WWSIS-2, tabla 1: carbón 5 %, vapor de gas 6 %, turbina de gas 18 %).
 * minimo: carga mínima; espera: minutos hasta sincronizar, en caliente y en frío; rampa: fracción de la capacidad por minuto.
 * Vapor: Agora Energiewende 2017 (carbón: carga mínima de 25 a 40 %, rampa de 1.5 a 4 % por minuto, arranque de 2.5 a 3 h en caliente y 5 a 10 h en frío).
 * Turbogás: Agora (carga mínima de 40 a 50 %, rampa de 8 a 12 % por minuto, arranque de 5 a 11 minutos).
 * Motores: DEA, Technology Data 2025 (cada motor baja hasta 30 %; arranque de 1 minuto tibio y 5 en frío) y Wärtsilä (plena carga en unos dos minutos).
 */
export const TECNO = {
    vapor: { regimen: { carbon: 10040, combustoleo: 10319, gas: 10293 }, castigo: { carbon: 0.05, combustoleo: 0.06, gas: 0.06 }, minimo: 0.4, espera: { caliente: 120, frio: 420 }, rampa: 0.015 },
    turbogas: { regimen: { gas: 10975, diesel: 13145 }, castigo: 0.18, minimo: 0.5, espera: { caliente: 4, frio: 6 }, rampa: 0.1 },
    motores: { regimen: { combustoleo: 10484 }, castigo: 0.05, minimo: 0.3, espera: { caliente: 1, frio: 4 }, rampa: 0.7 },
};
/** La eficiencia de diseño de unidades nuevas (COPAR 2012, cuadro 1.7, neta) y lo que la CFE dice de su vapor convencional (Informe Anual 2024). */
export const EFICIENCIAS = { copar: { vapor350: 0.3917, carbon350: 0.377, aeroderivada: 0.3795, motor: 0.4255 }, cfeVapor: 0.3 };

/** Precios que pagó la CFE en 2024 (Informe Anual 2024, p. 192), dólares de 2023 por millón de BTU; gas: Henry Hub, promedio 2025 (EIA). */
export const PRECIOS = { combustoleo: 13.73, diesel: 36.52, gas: 3.52 };
/** Carbón: lo que gastó CFE Generación II en carbón en 2024 entre lo que quemó (9,777 millones de pesos por 83,298 TJ), a 18.3 pesos por dólar: cálculo propio, solo orientativo. */
export const PRECIO_CARBON = { pesos: 9777e6, tj: 83298.2, tipoCambio: 18.3 };
PRECIOS.carbon = +((PRECIO_CARBON.pesos / (PRECIO_CARBON.tj * 1000) / PRECIO_CARBON.tipoCambio) * 1.055056).toFixed(2);

/** Las unidades de la figura: la de vapor, del tamaño de las duales de Petacalco; la turbogás, de ejemplo; los motores, los de la CCI Baja California Sur I (PLADESE, tabla A1.8). */
export const UNIDADES = { vapor: 350, turbogas: [50, 50], motores: [35, 40, 41, 40] };
/** Petacalco: 2,778.4 MW (Informe Anual 2024 de la CFE); seis unidades duales de 350 MW y la 7, de 678 MW, solo con carbón (CFE y COPAR 2012). */
export const PETACALCO = { mw: 2778.4, duales: 6, u7: 678 };
/** El agua de mar del condensador: cuánto se calienta (diseño de Tuxpan, tesis del CIBNOR) y su calor por m³ y grado. */
export const AGUA = { dT: 8, mj: 4.1 };
