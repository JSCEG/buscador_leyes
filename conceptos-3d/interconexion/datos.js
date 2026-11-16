// Las cifras de la figura de cómo se conecta una central a la red, con su fuente en fuentes.js. Lo que es de ejemplo lo dice su
// comentario. El caso: las centrales fotovoltaicas Proteus Solar y Tampico Solar (San Luis de la Paz y Doctor Mora, Guanajuato),
// conectadas a 115 kV en la subestación de maniobras San José Iturbide de la CFE, según el estudio de interconexión de la tesis
// UNAM de García Hurtado (2019).

/** Tesis UNAM 2019, tablas 13 a 17 y 20: la central tal como la estudia la tesis. */
export const CASO = {
    mw: 90.001, // potencia en el punto de interconexión con 100 % de generación (tabla 20)
    qFp95: 29.582, // MVAr en el punto de interconexión con factor de potencia 0.95 (tabla 20)
    modulos: { proteus: 187572, tampico: 93744, wp: 385 },
    inversores: { proteus: 11 * 56, tampico: 6 * 51, kva: 105, kvarMax: 63, vBaja: 0.8 },
    bloque: { mva: 6.0, z: 0.065, xr: 6.25, n: 17, vMedia: 34.5 },
    elevadoras: { proteus: 67, tampico: 33, z: 0.095, xr: 46, vAlta: 115 },
    linea: { km: 4.762, r: 0.07276, x: 0.46685, amperes: 900, conductor: 'ACSR 795 kcmil' },
    // resultados de la tesis para comparar: tensión más alta en bornes de inversor y carga de los inversores
    tesis: { vInvFp1: 1.0213, vInvEntrega: 1.0721, vInvAbsorbe: 0.9743, cargaEntrega: 1.0601, angulo: 34.9 },
    // cortocircuito en el punto de interconexión, medio ciclo (tabla 29), kA
    corto: { trifasico: 13.906, bifasicoTierra: 24.778, monofasico: 20.631 },
};
/** Prensa (Energy21): la capacidad de cada central y que Prana Power construyó la subestación para la CFE. */
export const PRENSA = { tampico: 36, proteus: 72 };

/** Tesis IPN 2012, tabla C.5 (datos de un estudio de la CFE de 1995): susceptancia por km de una línea de 115 kV con ACSR 795, en µS/km
 *  (conversión propia de Y/2 en por unidad). SIL de la misma tabla. */
export const LINEA_TIPICA = { bMicroS: 3.53, silMw: 36 };

/** Banco de capacitores en la barra de 34.5 kV: de ejemplo (la tesis dice que hace falta compensación, pero no la dimensiona). */
export const BANCO_MVAR = 15;

/** Límites que la tesis revisa en cada barra (Código de Red): tensión en operación normal. */
export const TENSION = { min: 0.95, max: 1.05 };

// ------------------------------------------------------------------ el Código de Red 2021 (CRE, DOF 31-12-2021), manual de interconexión
/** Tabla 1.1: tipos de central por capacidad instalada neta en el Sistema Interconectado Nacional, MW. */
export const TIPOS = { A: [0, 0.5], B: [0.5, 10], C: [10, 30], D: [30, Infinity] };
/** Tabla 2.1: frecuencia en que la central debe seguir conectada (SIN), Hz, y por cuánto tiempo. */
export const FRECUENCIA = [
    { de: 57.0, a: 58.2, tiempo: '15 minutos' },
    { de: 58.2, a: 58.8, tiempo: '30 minutos' },
    { de: 58.8, a: 61.2, tiempo: 'sin límite' },
    { de: 61.2, a: 61.8, tiempo: '30 minutos' },
    { de: 61.8, a: 62.4, tiempo: '15 minutos' },
];
/** Tabla 3.1.1: tensión en que la central debe seguir conectada, por unidad. */
export const TENSION_CR = [
    { de: 0.9, a: 0.95, tiempo: '30 minutos' },
    { de: 0.95, a: 1.05, tiempo: 'sin límite' },
    { de: 1.05, a: 1.1, tiempo: '30 minutos' },
];
/** Tablas 4.2.1.A y 4.2.1.B: hueco de tensión que una central tipo D debe aguantar sin desconectarse. [segundos, por unidad]. */
export const HUECO = {
    asincrona: [[0, 0], [0.25, 0], [0.35, 0], [0.45, 0], [1.05, 0.45], [1.5, 0.9]],
    sincrona: [[0, 0], [0.25, 0], [0.25, 0.25], [0.45, 0.25], [0.7, 0.5], [1.5, 0.9]],
};
/** 4.1.2 (aplica a la D por 4.2): la potencia activa vuelve a su valor de antes de la falla entre 0.25 y 0.5 s. */
export const RECUPERA = [0.25, 0.5];
/** Tabla 3.3.2 y 3.5.1: reactivos mínimos, Q/Pmáx ±0.33 (factor de potencia 0.95) entre 0.95 y 1.05 por unidad. */
export const REACTIVOS = { qp: 0.33, fp: 0.95 };
/** Calidad de la potencia para tipos C y D: distorsión armónica total de la tensión hasta la armónica 50, %. */
export const THD_MAX = 3.0;

// ------------------------------------------------------------------ el trámite: Manual para la Interconexión (MIC, DOF 09-02-2018) y la LSE
/** MIC, anexo I, tabla I.1 (modalidad individual): días hábiles de cada estudio y costo total en pesos, por tamaño de la central. */
export const TABLA_I1 = [
    { mw: [0.5, 10], rapido: 20, instalaciones: 20, total: 40, costo: [285458, 642280] },
    { mw: [10, 30], indicativo: 15, impacto: 20, instalaciones: 20, validacion: 20, total: 75, costo: 1338083 },
    { mw: [30, 100], indicativo: 15, impacto: 30, instalaciones: 25, validacion: 30, total: 100, costo: 1784111, partes: { indicativo: 267617, impacto: 535233, instalaciones: 446028, validacion: 535233 } },
    { mw: [100, 150], indicativo: 15, impacto: 35, instalaciones: 30, validacion: 35, total: 115, costo: 2051728 },
    { mw: [150, 250], indicativo: 20, impacto: 40, instalaciones: 35, validacion: 40, total: 135, costo: 2408549 },
    { mw: [250, 500], indicativo: 25, impacto: 45, instalaciones: 35, validacion: 45, total: 150, costo: 2676167 },
    { mw: [500, 750], indicativo: 30, impacto: 50, instalaciones: 40, validacion: 50, total: 170, costo: 3032987 },
    { mw: [750, 1000], indicativo: 40, impacto: 60, instalaciones: 40, validacion: 60, total: 200, costo: 3568220 },
    { mw: [1000, Infinity], indicativo: 50, impacto: 70, instalaciones: 40, validacion: 70, total: 230, costo: 4103453 },
];
/** MIC: plazos en días hábiles. revision (tabla 8), contrato (12.1.1: pedir la instrucción del contrato), tope del trámite (13.2.1). */
export const MIC = { revision: 20, pedirContrato: 30, tope: 280, pruebasDias: 15, horasPlena: 240, paroMax: 25, garantia: [0.75, 1] };
/** LSE, art. 48: firmar el contrato en 10 días hábiles y conectar en 72 horas después de la orden del CENACE. */
export const LSE48 = { firma: 10, horas: 72 };
/** Construcción de las obras y certificado de la unidad de inspección: de ejemplo (dependen de cada proyecto). Días hábiles. */
export const EJEMPLO = { construccion: 250, inspeccion: 7, pruebas: 22 };

// ------------------------------------------------------------------ quién paga: costos de referencia
/** Tesis BUAP 2018, tabla 3.1 (precios de aportaciones de la CFE, julio de 2018, costo directo): pesos por km de línea de 115 kV. */
export const COSTO_KM = { rural: 3027932, abrupto: 3784927, dosCircuitos: 4165689, urbano: 5194258 };

/**
 * Primera Convocatoria de la SENER (DOF 17-10-2025), anexo técnico: proyectos que pide la planeación vinculante, con su subestación de
 * interconexión y la inversión de referencia en obras de refuerzo (millones de pesos). Una obra que comparten varios proyectos va
 * en el mismo grupo (g) y se reparte por MW, como dice la convocatoria.
 * [gcr, región, tecnología, año, MW, refuerzo MDP, subestación, kV, estado, grupo]
 */
export const CONVOCATORIA = [
    ['Central', 'Tula-Pachuca', 'fv', '2027-2028', 440, 991, 'Maniobras Km 110 – Pachuca Potencia', 230, 'Hidalgo', 0],
    ['Central', 'Toluca', 'fv', '2028', 30, 91, 'Villa Guerrero', 115, 'Estado de México', 1],
    ['Central', 'Tula-Pachuca', 'fv', '2030', 80, 45, 'Nochistongo', 115, 'Hidalgo', 2],
    ['Oriental', 'Puebla', 'fv', '2027', 200, 215, 'Maniobras Tecali', 115, 'Puebla', 3],
    ['Oriental', 'Veracruz', 'fv', '2028', 120, 31, 'Piedras Negras', 115, 'Veracruz', 4],
    ['Oriental', 'Morelos', 'fv', '2028', 120, 40, 'Yautepec Potencia', 115, 'Morelos', 5],
    ['Oriental', 'Juchitán', 'eol', '2028', 200, 31, 'Juchitán Dos', 115, 'Oaxaca', 6],
    ['Oriental', 'Veracruz', 'fv', '2029', 130, 31, 'Santa Fe', 115, 'Veracruz', 7],
    ['Oriental', 'Grijalva', 'fv', '2029', 200, 150, 'Tapachula Potencia', 115, 'Chiapas', 8],
    ['Oriental', 'Tabasco', 'fv', '2029', 100, 40, 'Cárdenas Dos', 115, 'Tabasco', 9],
    ['Oriental', 'Veracruz', 'fv', '2030', 250, 44, 'Manlio Fabio Altamirano', 230, 'Veracruz', 10],
    ['Peninsular', 'Chetumal', 'eol', '2028', 200, 41, 'Xul-ha', 115, 'Quintana Roo', 11],
    ['Peninsular', 'Escárcega', 'fv', '2028', 300, 139, 'Escárcega', 400, 'Campeche', 12],
    ['Peninsular', 'Escárcega', 'fv', '2028', 600, 2036, 'Maniobras Escárcega – Ticul', 400, 'Campeche', 13],
    ['Peninsular', 'Dzitnup', 'eol', '2028', 320, 139, 'Dzitnup', 400, 'Yucatán', 14],
    ['Peninsular', 'Valladolid', 'eol', '2028-2029', 350, 2439, 'Maniobras Norte – Kanasín Potencia', 230, 'Yucatán', 15],
    ['Occidental', 'Tepic', 'fv', '2029', 80, 97, 'Acaponeta', 115, 'Nayarit', 16],
    ['Occidental', 'San Luis Potosí', 'eol', '2028', 100, 1017, 'Charcas Potencia', 115, 'San Luis Potosí', 17],
    ['Occidental', 'San Luis Potosí', 'eol', '2029', 170, 1017, 'El Potosí', 230, 'San Luis Potosí', 17],
    ['Occidental', 'Aguascalientes', 'fv', '2029', 90, 126, 'Ojo Caliente', 115, 'Zacatecas', 18],
    ['Occidental', 'Aguascalientes', 'fv', '2028', 90, 479, 'La Virgen', 115, 'Jalisco', 19],
    ['Occidental', 'Aguascalientes', 'fv', '2028', 100, 479, 'Lagos Galera', 115, 'Jalisco', 19],
    ['Occidental', 'Salamanca', 'fv', '2027', 90, 479, 'El Toro', 115, 'Guanajuato', 19],
    ['Occidental', 'San Luis Potosí', 'fv', '2027', 130, 756, 'San Diego Peñuelas', 115, 'Guanajuato', 20],
    ['Occidental', 'San Luis de la Paz', 'fv', '2027-2029', 180, 756, 'Santa Fe', 115, 'Guanajuato', 20],
    ['Occidental', 'Querétaro', 'fv', '2027', 100, 2516, 'Tequisquiapan', 115, 'Querétaro', 21],
    ['Occidental', 'Querétaro', 'fv', '2028', 220, 2516, 'Maniobras San Juan Potencia – Dañú', 230, 'Hidalgo', 21],
    ['Norte', 'Cuauhtémoc', 'fv', '2029', 30, 35, 'Cuauhtémoc', 115, 'Chihuahua', 22],
    ['Noreste', 'Nuevo Laredo', 'eol', '2028', 140, 38, 'Falcón Mexicano', 138, 'Tamaulipas', 23],
    ['Noreste', 'Matamoros', 'eol', '2027', 120, 38, 'Matamoros Potencia', 138, 'Tamaulipas', 24],
    ['Noreste', 'Güémez', 'eol', '2028', 200, 176, 'Jiménez', 115, 'Tamaulipas', 25],
    ['Noreste', 'Huasteca', 'eol', '2027', 80, 106, 'Maniobras Libramiento – Mante', 115, 'Tamaulipas', 26],
    ['Noreste', 'Huasteca', 'fv', '2028', 110, 27, 'Puerto Altamira Eléctrica', 115, 'Tamaulipas', 27],
    ['Noreste', 'Saltillo', 'eol', '2028', 300, 76, 'Derramadero', 400, 'Coahuila', 28],
].map(([gcr, region, tec, anio, mw, mdp, subestacion, kv, estado, grupo]) => ({ gcr, region, tec, anio, mw, mdp, subestacion, kv, estado, grupo }));
/** Segunda Convocatoria (DOF 11-05-2026), 1.2.1-II: almacenamiento de al menos 30 % de la capacidad, por al menos tres horas. */
export const SEGUNDA = { saee: 0.3, horas: 3, solicitudes: 57, aprobadas: 6, mwAprobados: 649 };
/** Primera Convocatoria: permisos que otorgó la CNE (considerandos de la Segunda). */
export const PRIMERA = { permisos: 18 };
