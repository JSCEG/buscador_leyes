// Las tarifas domésticas de la CFE en 2026, copiadas de sus páginas de tarifas y del oficio de la SHCP 349-B-1-070 (30 de diciembre de 2025),
// que trae los cargos mes por mes. Precios en pesos por kWh, sin IVA. «Verano» usa los de octubre de 2026, el último mes que puede ser
// verano; «fuera de verano», los de noviembre de 2026. La DAC usa el oficio 349-B-1-095 de la SHCP (29 de octubre de 2026).

/** Temperatura media mínima en verano para que a una localidad le toque cada tarifa (la 1 no tiene). */
export const TEMPERATURA = { 1: null, '1A': 25, '1B': 28, '1C': 30, '1D': 31, '1E': 32, '1F': 33 };
export const NOMBRES = ['1', '1A', '1B', '1C', '1D', '1E', '1F'];

/** Bloques en kWh al mes (el último no tiene tope) y su precio. */
const fuera = i => ({ mes: 'noviembre de 2026', bloques: [['Básico', 75, 1.144], ['Intermedio', i, 1.389], ['Excedente', Infinity, 4.067]] });
export const TARIFAS = {
    1: {
        verano: { mes: 'octubre de 2026', bloques: [['Básico', 75, 1.14], ['Intermedio', 65, 1.385], ['Excedente', Infinity, 4.054]] },
        fuera: fuera(65),
    },
    '1A': {
        verano: { mes: 'octubre de 2026', bloques: [['Básico', 100, 1.019], ['Intermedio', 50, 1.183], ['Excedente', Infinity, 4.054]] },
        fuera: fuera(75),
    },
    '1B': {
        verano: { mes: 'octubre de 2026', bloques: [['Básico', 125, 1.019], ['Intermedio', 100, 1.183], ['Excedente', Infinity, 4.054]] },
        fuera: fuera(100),
    },
    '1C': {
        verano: { mes: 'octubre de 2026', bloques: [['Básico', 150, 1.019], ['Intermedio bajo', 150, 1.183], ['Intermedio alto', 150, 1.52], ['Excedente', Infinity, 4.054]] },
        fuera: fuera(100),
    },
    '1D': {
        verano: { mes: 'octubre de 2026', bloques: [['Básico', 175, 1.019], ['Intermedio bajo', 225, 1.183], ['Intermedio alto', 200, 1.52], ['Excedente', Infinity, 4.054]] },
        fuera: fuera(125),
    },
    '1E': {
        verano: { mes: 'octubre de 2026', bloques: [['Básico', 300, 0.854], ['Intermedio bajo', 450, 1.054], ['Intermedio alto', 150, 1.368], ['Excedente', Infinity, 4.054]] },
        fuera: fuera(125),
    },
    '1F': {
        verano: { mes: 'octubre de 2026', bloques: [['Básico', 300, 0.854], ['Intermedio bajo', 900, 1.054], ['Intermedio alto', 1300, 2.566], ['Excedente', Infinity, 4.054]] },
        fuera: fuera(125),
    },
};
/** Arriba de este promedio de 12 meses (kWh al mes), la casa pasa a la DAC. */
export const LIMITE_DAC = { 1: 250, '1A': 300, '1B': 400, '1C': 850, '1D': 1000, '1E': 2000, '1F': 2500 };
/** La DAC de noviembre de 2026: cargo fijo al mes y precio de la energía por región. */
export const DAC = {
    mes: 'noviembre de 2026',
    fijo: 146.01,
    regiones: {
        central: { nombre: 'Central', donde: 'Ciudad de México, municipios conurbados del Estado de México y Cuernavaca', kwh: 6.869 },
        noroeste: { nombre: 'Noroeste', donde: 'Sonora, salvo San Luis Río Colorado, y Sinaloa', kwh: 6.435 },
        norte: { nombre: 'Norte y Noreste', donde: '', kwh: 6.269 },
        sur: { nombre: 'Sur y Peninsular', donde: '', kwh: 6.37 },
        bc: { nombre: 'Baja California', donde: 'en verano; fuera de verano, 5.736', kwh: 6.679 },
        bcs: { nombre: 'Baja California Sur', donde: 'en verano; fuera de verano, 5.736', kwh: 7.278 },
    },
};
export const MINIMO_KWH = 25;
export const IVA = 0.16;
/** El ajuste de cada mes de 2026 para las tarifas 1 a 1F: (INPC nov 2025 ÷ INPC nov 2024)^(1/12). */
export const AJUSTE = { inpcNov24: 137.424, inpcNov25: 142.645, factor: 1.00311 };
/** La serie de la tarifa 1 en 2026 (básico, intermedio, excedente). */
export const SERIE_T1 = [['dic 2025', 1.107, 1.345, 3.932], ['ene 2026', 1.11, 1.349, 3.944], ['jun 2026', 1.125, 1.369, 4.004], ['oct 2026', 1.14, 1.385, 4.054], ['nov 2026', 1.144, 1.389, 4.067], ['dic 2026', 1.148, 1.393, 4.08]];
/** El recibo de ejemplo de la CFE («Conoce tu recibo»): tarifa 01, un bimestre de 2019 con 293 kWh. */
export const RECIBO_CFE = {
    kwh: 293, cargo: 279.66, iva: 44.74, dap: 27.97,
    costos: [['Suministro', 148.2], ['Distribución', 277.56], ['Transmisión', 44.57], ['CENACE', 2.05], ['Generación', 274.28], ['Capacidad', 163.0], ['SCnMEM', 1.58]],
    aportacion: 631.57,
};
