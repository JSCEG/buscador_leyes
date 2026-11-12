// Las cifras de la cogeneración, cada una con su fuente (están en fuentes.js). Las reglas son las de la CRE que siguen vigentes mientras
// la CNE emite sus Criterios Técnicos de Cogeneración (Disposiciones de Cogeneración de la CNE, DOF 16-04-2026, transitorio segundo):
// RES/003/2011 y RES/1838/2016, con los valores que les puso el Acuerdo A/018/2023.

/** Eficiencia eléctrica de referencia por tamaño de la central (RES/1838/2016, numeral 3.3.1, con A/018/2023). [MW hasta, RefE] */
export const REF_E = [[0.5, 0.31], [6, 0.34], [15, 0.37], [50, 0.41], [150, 0.44], [300, 0.47], [Infinity, 0.5]];
/** Eficiencia térmica de referencia: vapor o agua caliente, y uso directo de los gases. */
export const REF_H = { vapor: 0.9, gases: 0.82 };
/** Factor de pérdidas según la tensión a la que se conecta (A/018/2023). [kV hasta, fp] */
export const FP = [[1, 0.94], [34.5, 0.95], [85, 0.97], [230, 0.98], [Infinity, 0.99]];
/** Prueba de eficiencia del régimen anterior (RES/003/2011 con RES/206/2014): ahorro sobre el combustible de la electricidad, por tamaño. */
export const ETA_MIN = [[0.5, 0.05], [30, 0.1], [100, 0.15], [Infinity, 0.2]];
export const REF_E_ANTERIOR = 0.41;
export const refE = mw => REF_E.find(([tope]) => mw <= tope)[1];
export const fp = kv => FP.find(([tope]) => kv <= tope)[1];
export const etaMin = mw => ETA_MIN.find(([tope]) => mw < tope)[1];

/** La planta de ejemplo, con el tamaño de la cogeneración de Nuevo Pemex: 277 MW en modo cogeneración, 500 t/h de vapor y hasta 800 con
 * postcombustión (Banobras, IDOM, Combined Cycle Journal). La eficiencia de las turbinas y las condiciones del vapor no son públicas: son
 * de ejemplo, con las de una turbina 7F (38.5 % nueva en sitio ISO; aquí 34 % por calor y antigüedad) y el vapor de la refinería de
 * Madero (42 kg/cm², 385 °C: 2,754 kJ por kg desde agua a 100 °C, NIST). */
export const PLANTA = {
    mw: 277, kv: 115, vaporBase: 500, vaporMax: 800,
    etaE: 0.34, perdidasTurbina: 0.02, kjPorKg: 2754, etaPostcombustion: 0.9,
    consumoFabrica: 120, auxiliares: 8, minimo: 0.45, horasAnio: 8000,
};
/** Vapor que da 1 t/h, en MW térmicos. */
export const MW_POR_TH = PLANTA.kjPorKg / 3600;

/** Un ciclo combinado nuevo, para comparar: 60 % (GE 7F.04 en ciclo combinado 1x1: 59.7 %, LHV). */
export const CICLO_NUEVO = 0.6;

/** Capacidad y generación de cogeneración eficiente en México (SENER, PLADESE 2025-2039, tablas 2.1 y 2.2). */
export const NACIONAL = {
    mw: [[2014, 819], [2015, 943], [2016, 1036], [2017, 1322], [2018, 1709], [2019, 1710], [2020, 2305], [2021, 2305], [2022, 2308], [2023, 2322], [2024, 2293]],
    gwh2024: 3912, mwSen2024: 90543, mwLimpia2024: 33441, gwhSen2024: 352305, gwhLimpia2024: 82426,
    nuevas: [['Cangrejera', 900, 2029], ['Salina Cruz', 728, 2029], ['Tula', 794, 2030]],
};
/** Cogeneraciones reales de México, para la tabla. */
export const REALES = [
    ['Nuevo Pemex (Tabasco)', '300 MW (277 en cogeneración)', '500 a 800 t/h de vapor', 'desde 2013; da 100 % de la electricidad y 55 % del vapor del complejo de gas'],
    ['A3T (Tabasco)', '220 MW garantizados', 'vapor de alta presión', 'desde 2018'],
    ['Salamanca (Guanajuato, CFE)', '373.1 MW', '1,099 GWh en 2024', 'junto a la refinería de Salamanca'],
    ['Refinería de Madero (Tamaulipas)', '25 MW', '49 t/h a 42 kg/cm² y 385 °C', 'para las desulfuradoras'],
];

/** Los ingenios azucareros (CONADESUCA): la zafra 2025/26 y lo que dio cada tonelada de caña en la 2023/24. */
export const INGENIOS = {
    zafra: { ingenios: 47, inicio: '12 de noviembre de 2025', fin: '17 de julio de 2026', dias: 247, caniaT: 49605341, azucarT: 5325181 },
    porTonelada: { bagazo: 0.29451, humedad: 0.50569, vapor: 0.553, kwh: 22.128 },
    anterior: { ingenios: 49, caniaT: 46093814, kwh: 1019971645, conPetroleo: 7 },
    brasil: { comun: 28, moderno: 72 },
    /** Meses de zafra de un ingenio de ejemplo (0 = enero): de mediados de noviembre a mediados de julio. */
    meses: [1, 1, 1, 1, 1, 1, 0.55, 0, 0, 0, 0.6, 1],
};

/** La obligación de Certificados de Energías Limpias para 2026 (SENER, DOF 17-08-2026). */
export const CEL = { requisito2026: 0.139 };
