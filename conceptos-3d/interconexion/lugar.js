// Dónde va cada cosa en la figura de cómo se conecta una central a la red. A la izquierda, las dos centrales fotovoltaicas (Proteus al
// frente, Tampico atrás) con sus estaciones de inversores y transformador de bloque; al centro, la subestación elevadora con sus dos
// transformadores, las celdas de 34.5 kV, el banco de capacitores y la casa de control; luego la línea de enlace de 115 kV; a la
// derecha, la subestación de maniobras San José Iturbide de la CFE, que entronca una línea de 115 kV que ya existía; atrás, el CENACE.
// Lo puro de la figura, sin three.js. Nada está a escala: la línea mide 4.76 km.
import { apoyo, colgar, enCruceta, lineaAerea } from '../planta-comun/lineas.js';

export { colgar };

export const BLOQUE = { x: [-8, 8], z: [-3.8, 3.6], y: [-0.4, 0] };
/** Los campos de paneles: filas a lo largo de x, en estas z. */
export const CAMPOS = {
    proteus: { x: [-7.7, -3.95], filas: [-0.2, 0.25, 0.7, 1.75, 2.2, 2.65, 3.1] },
    tampico: { x: [-7.7, -4.9], filas: [-3.45, -3.0, -2.55] },
};
/** [x, z] de las estaciones de inversores con su transformador de bloque (en la figura van 4 + 2; la central real tiene 11 + 6). */
export const ESTACIONES = [[-7.2, 1.1], [-6.3, 1.1], [-5.4, 1.1], [-4.5, 1.1], [-7.0, -2.05], [-5.7, -2.05]];
/** [x, z] del centro de cada cosa. */
export const SITIO = {
    celdas: [-3.45, 0.3],
    banco: [-3.3, -1.25],
    saee: [-2.2, -2.55],
    t1: [-2.6, 0.85],
    t2: [-2.6, -0.35],
    elevadora: [-2.25, 0.2],
    control: [-1.25, 1.95],
    poi: [4.6, 0.2],
    casaPoi: [3.55, -0.95],
    medidor: [3.75, 0.85],
    cenace: [1.2, -2.6],
};
export const ALTO_TORRE = 1.7;
export const ALTO_MARCO = 1.35;
/** Barras de 115 kV de la subestación elevadora: a lo largo de z, con las tres fases separadas en x. */
export const BE = { x: -1.75, y: 1.0, z: [-0.55, 1.15], fase: 0.2 };
/** Barras de 115 kV de la subestación de maniobras: también a lo largo de z. */
export const BP = { x: SITIO.poi[0], y: 1.0, z: [-1.15, 1.65], fase: 0.24 };
/** Las bahías de la subestación de maniobras: su z y de qué lado de las barras queda (−1 al oeste, +1 al este). */
export const BAHIAS = { central: [SITIO.poi[1], -1], red1: [-0.75, 1], red2: [0.45, 1], refuerzo: [1.3, 1] };
const xBahia = s => BP.x + s * 0.62;
const xMarco = s => BP.x + s * 1.25;
/** Torres: [x, z]. La línea de enlace, la que ya existía (al norte y al este) y la del refuerzo. */
export const TORRES = {
    enlace: [[0.15, 0.25], [1.25, 0.22], [2.35, 0.2]],
    red1: [[6.55, -2.2]],
    red2: [[6.95, BAHIAS.red2[0]]],
    refuerzo: [[6.95, 1.6]],
};
export const MARCOS = {
    salida: [-0.95, SITIO.elevadora[1]],
    ...Object.fromEntries(Object.entries(BAHIAS).map(([id, [z, s]]) => [id, [xMarco(s), z]])),
};
const enTorre = ([x, z]) => [x, ALTO_TORRE * 0.92, z];
const puntaTorre = ([x, z]) => [x, ALTO_TORRE, z];
const enMarco = ([x, z]) => [x, ALTO_MARCO * 0.95, z];
const [cx, cz] = SITIO.celdas;

/** Los bornes donde se conecta cada cable: cada punta de cable que no remata en la orilla debe caer en uno. */
export const BORNES = {
    ...Object.fromEntries(ESTACIONES.map(([x, z], i) => [`estacion${i + 1}`, [x + 0.25, 0.1, z]])),
    // cada cable de la red colectora entra por su lugar: los de Proteus por el lado oeste, los de Tampico por el sur
    ...Object.fromEntries([0, 1, 2, 3].map(k => [`entrada${k + 1}`, [cx - 0.25, 0.12, cz - 0.12 + k * 0.08]])),
    ...Object.fromEntries([0, 1].map(k => [`entrada${k + 5}`, [cx - 0.2 + k * 0.07, 0.12, cz - 0.5]])),
    celdasEste: [cx + 0.25, 0.12, cz],
    celdasSur: [cx + 0.02, 0.12, cz - 0.5],
    celdasSurEste: [cx + 0.16, 0.12, cz - 0.5],
    bajaT1: [SITIO.t1[0] - 0.42, 0.25, SITIO.t1[1]],
    bajaT2: [SITIO.t2[0] - 0.36, 0.22, SITIO.t2[1]],
    altaT1: [SITIO.t1[0] + 0.3, 0.98, SITIO.t1[1]],
    altaT2: [SITIO.t2[0] + 0.26, 0.86, SITIO.t2[1]],
    barrasT1: [BE.x, BE.y, SITIO.t1[1]],
    barrasT2: [BE.x, BE.y, SITIO.t2[1]],
    barrasSalida: [BE.x, BE.y, SITIO.elevadora[1]],
    interruptorSalida: [-1.35, 0.78, SITIO.elevadora[1]],
    marcoSalida: enMarco(MARCOS.salida),
    puntaSalida: [MARCOS.salida[0], ALTO_MARCO + 0.12, MARCOS.salida[1]],
    pieSalida: [MARCOS.salida[0] + 0.12, 0.1, MARCOS.salida[1]],
    banco: [SITIO.banco[0] - 0.1, 0.12, SITIO.banco[1] + 0.32],
    saee: [SITIO.saee[0] - 0.6, 0.12, SITIO.saee[1] + 0.45],
    control: [SITIO.control[0] + 0.4, 0.1, SITIO.control[1]],
    ...Object.fromEntries(Object.entries(TORRES).flatMap(([id, ts]) => ts.flatMap((t, i) => [[`${id}${i + 1}`, enTorre(t)], [`${id}Punta${i + 1}`, puntaTorre(t)]]))),
    ...Object.fromEntries(Object.entries(BAHIAS).flatMap(([id, [z, s]]) => [
        [`marco_${id}`, enMarco(MARCOS[id])],
        [`interruptor_${id}`, [xBahia(s), 0.78, z]],
        [`barras_${id}`, [BP.x, BP.y, z]],
    ])),
    puntaCentral: [MARCOS.central[0], ALTO_MARCO + 0.12, MARCOS.central[1]],
    pieCentral: [MARCOS.central[0], 0.1, MARCOS.central[1] - 0.12],
    casaPoi: [SITIO.casaPoi[0], 0.1, SITIO.casaPoi[1] + 0.33],
    casaPoiNorte: [SITIO.casaPoi[0] - 0.2, 0.1, SITIO.casaPoi[1] - 0.33],
    cenace: [SITIO.cenace[0] + 0.71, 0.12, SITIO.cenace[1]],
};

// ------------------------------------------------------------------ las líneas aéreas: tres fases que cuelgan entre apoyos
const orillaNorte = [TORRES.red1[0][0], ALTO_TORRE * 0.85, BLOQUE.z[0] + 0.05];
const orilla = z => [BLOQUE.x[1] - 0.05, ALTO_TORRE * 0.85, z];
const FB = [BP.fase, 0, 0];
const FE = [BE.fase, 0, 0];
const FZ = [0, 0, 0.24];
/** Una bahía de la subestación de maniobras: barras, interruptor y marco (o al revés, si la energía entra por el marco). */
const bahia = (id, haciaRed) => {
    const a = [apoyo(BORNES[`barras_${id}`], FB), apoyo(BORNES[`interruptor_${id}`], FZ), apoyo(BORNES[`marco_${id}`], FZ, 0.08)];
    return haciaRed ? a : a.reverse();
};
const T = (id, i = 0) => BORNES[`${id}${i + 1}`];
/** Cada línea aérea, apoyo por apoyo, en el sentido en que corre la energía de la central. */
export const AEREAS = {
    // en la subestación elevadora: de las boquillas de alta de cada transformador a las barras, y de las barras a la salida
    subeT1: [apoyo(BORNES.altaT1, [0, 0, 0.12]), apoyo(BORNES.barrasT1, FE)],
    subeT2: [apoyo(BORNES.altaT2, [0, 0, 0.1]), apoyo(BORNES.barrasT2, FE)],
    salida: [apoyo(BORNES.barrasSalida, FE), apoyo(BORNES.interruptorSalida, FZ), apoyo(BORNES.marcoSalida, FZ, 0.08)],
    // la línea de enlace: del marco de salida, por tres torres, al marco de la bahía de la central en San José Iturbide
    enlace: [
        apoyo(BORNES.marcoSalida, FZ, 0.08),
        enCruceta(T('enlace', 0), BORNES.marcoSalida, T('enlace', 1)),
        enCruceta(T('enlace', 1), T('enlace', 0), T('enlace', 2)),
        enCruceta(T('enlace', 2), T('enlace', 1), BORNES.marco_central),
        apoyo(BORNES.marco_central, FZ, 0.08),
    ],
    bahiaCentral: bahia('central', false),
    // la línea que ya existía, partida en dos para entrar a la subestación (el entronque)
    bahiaRed1: bahia('red1', true),
    red1: [apoyo(BORNES.marco_red1, FZ, 0.08), enCruceta(T('red1'), BORNES.marco_red1, orillaNorte), apoyo(orillaNorte, [0.26, 0, 0])],
    bahiaRed2: bahia('red2', true),
    red2: [apoyo(BORNES.marco_red2, FZ, 0.08), enCruceta(T('red2'), BORNES.marco_red2, orilla(BAHIAS.red2[0])), apoyo(orilla(BAHIAS.red2[0]), FZ)],
    // antes de la subestación: la misma línea pasaba de largo
    vieja: [apoyo(orillaNorte, [0.26, 0, 0]), enCruceta(T('red1'), orillaNorte, T('red2')), enCruceta(T('red2'), T('red1'), orilla(BAHIAS.red2[0])), apoyo(orilla(BAHIAS.red2[0]), FZ)],
    // una obra de refuerzo de ejemplo: otra bahía y otro circuito hacia la red
    bahiaRefuerzo: bahia('refuerzo', true),
    refuerzo: [apoyo(BORNES.marco_refuerzo, FZ, 0.08), enCruceta(T('refuerzo'), BORNES.marco_refuerzo, orilla(1.6)), apoyo(orilla(1.6), FZ)],
};

export const FLUIDOS = {
    media: { nombre: 'Media tensión, 34.5 kV', color: '#ff8a3c' },
    alta: { nombre: 'Alta tensión, 115 kV', color: '#f2b233' },
    reactivos: { nombre: 'Reactivos del banco de capacitores', color: '#2f7fd1' },
    saee: { nombre: 'Almacenamiento', color: '#2fb36a' },
    senal: { nombre: 'Datos y órdenes (fibra óptica)', color: '#7e57c2' },
};

const pisoY = 0.03;
/** Un cable por el piso: sale de un borne, baja al piso, va por esquinas y sube al otro borne. */
const porPiso = (a, esquinas, b) => [a, [a[0], pisoY, a[2]], ...esquinas.map(([x, z]) => [x, pisoY, z]), [b[0], pisoY, b[2]], b];
/** Las zanjas de la red colectora: entre las filas de Proteus y al frente de Tampico. */
export const ZANJAS = { proteus: 1.45, tampico: -1.75, paso: -3.82 };
export const LINEAS = [
    // la red colectora de 34.5 kV: cables enterrados de cada estación a las celdas (se dibujan sobre su zanja, uno junto al otro)
    ...ESTACIONES.map(([x, z], i) => {
        const b = BORNES[`estacion${i + 1}`];
        const fin = BORNES[`entrada${i + 1}`];
        const k = i < 4 ? i : i - 4;
        if (z > 0) {
            const zz = ZANJAS.proteus + k * 0.035;
            const xx = cx - 0.42 - k * 0.035;
            return { id: `colectora${i + 1}`, fluido: 'media', r: 0.012, cable: true, puntos: porPiso(b, [[b[0], zz], [xx, zz], [xx, fin[2]]], fin) };
        }
        const zz = ZANJAS.tampico + k * 0.035;
        const xx = ZANJAS.paso + k * 0.035;
        return { id: `colectora${i + 1}`, fluido: 'media', r: 0.012, cable: true, puntos: porPiso(b, [[b[0], zz], [xx, zz], [xx, -0.5 - k * 0.035], [fin[0], -0.5 - k * 0.035]], fin) };
    }),
    // de las celdas a la caja de baja de cada transformador elevador
    { id: 'bajaT1', fluido: 'media', r: 0.016, cable: true, puntos: porPiso(BORNES.celdasEste, [[cx + 0.4, cz], [cx + 0.4, SITIO.t1[1]]], BORNES.bajaT1) },
    { id: 'bajaT2', fluido: 'media', r: 0.016, cable: true, puntos: porPiso(BORNES.celdasEste, [[cx + 0.4, cz], [cx + 0.4, SITIO.t2[1]]], BORNES.bajaT2) },
    // el banco de capacitores y el almacenamiento, a las celdas
    { id: 'banco', fluido: 'reactivos', r: 0.012, cable: true, puntos: porPiso(BORNES.banco, [], BORNES.celdasSur) },
    { id: 'saee', fluido: 'saee', r: 0.012, cable: true, puntos: porPiso(BORNES.saee, [[BORNES.saee[0], -0.75], [BORNES.celdasSurEste[0], -0.75]], BORNES.celdasSurEste) },
    // la fibra óptica: de la casa de control al pie del marco, por el cable de guarda de la línea y a la casa de control de San José
    // Iturbide; de ahí, al CENACE
    { id: 'datosPlanta', fluido: 'senal', r: 0.01, cable: true, puntos: porPiso(BORNES.control, [[BORNES.pieSalida[0], SITIO.control[1]]], BORNES.pieSalida) },
    lineaAerea('fibra', [apoyo(BORNES.puntaSalida, [0, 0, 0]), ...TORRES.enlace.map((_, i) => apoyo(BORNES[`enlacePunta${i + 1}`], [0, 0, 0])), apoyo(BORNES.puntaCentral, [0, 0, 0])], { fluido: 'senal', fases: 1, r: 0.008 }),
    { id: 'datosPoi', fluido: 'senal', r: 0.01, cable: true, puntos: porPiso(BORNES.pieCentral, [[BORNES.pieCentral[0], -0.35], [BORNES.casaPoi[0], -0.35]], BORNES.casaPoi) },
    { id: 'datosCenace', fluido: 'senal', r: 0.01, cable: true, puntos: porPiso(BORNES.casaPoiNorte, [[BORNES.casaPoiNorte[0], SITIO.cenace[1]]], BORNES.cenace) },
    // las líneas aéreas no llevan tubo: la página dibuja sus tres conductores; aquí va la fase de en medio, por donde corre la energía
    ...Object.entries(AEREAS).map(([id, apoyos]) => lineaAerea(id, apoyos, { fluido: 'alta' })),
];
/** Puntas que rematan en la orilla del sitio: la red de 115 kV sigue más allá. */
export const REMATE = new Set(['red1 (fin)', 'red2 (fin)', 'vieja (inicio)', 'vieja (fin)', 'refuerzo (fin)']);
const caja = (x, y0, z, w, h, d) => [x - w / 2, x + w / 2, y0, y0 + h, z - d / 2, z + d / 2];
export const EQUIPOS = {
    ...Object.fromEntries(ESTACIONES.map(([x, z], i) => [`estacion${i + 1}`, caja(x, 0, z, 0.5, 0.35, 0.36)])),
    celdas: caja(cx, 0, cz, 0.5, 0.45, 1.0),
    banco: caja(SITIO.banco[0], 0, SITIO.banco[1], 0.7, 0.6, 0.62),
    saee: caja(SITIO.saee[0], 0, SITIO.saee[1], 2.0, 0.4, 0.9),
    t1: caja(SITIO.t1[0], 0, SITIO.t1[1], 0.8, 1.05, 0.7),
    t2: caja(SITIO.t2[0], 0, SITIO.t2[1], 0.66, 0.95, 0.6),
    control: caja(SITIO.control[0], 0, SITIO.control[1], 0.8, 0.5, 0.6),
    casaPoi: caja(SITIO.casaPoi[0], 0, SITIO.casaPoi[1], 0.85, 0.5, 0.65),
    cenace: caja(SITIO.cenace[0], 0, SITIO.cenace[1], 1.4, 1.0, 0.9),
};

/** Puntos clave: dónde va el número y desde dónde se ve. */
const [ex, ez] = SITIO.elevadora;
const [px, pz] = SITIO.poi;
export const PARTES = [
    { id: 'campo', ancla: [-5.8, 0.75, 2.4], vista: { az: 14, el: 34, tam: 4.4, mira: [-5.8, 0.2, 1.4] } },
    { id: 'inversores', ancla: [ESTACIONES[2][0], 0.8, ESTACIONES[2][1]], vista: { az: 26, el: 28, tam: 2.2, mira: [ESTACIONES[2][0], 0.25, ESTACIONES[2][1]] } },
    { id: 'colectora', ancla: [-4.1, 0.45, ZANJAS.proteus], vista: { az: -10, el: 46, tam: 3.4, mira: [-4.0, 0, 0.5] } },
    { id: 'elevadora', ancla: [SITIO.t1[0], 1.5, SITIO.t1[1]], vista: { az: 32, el: 26, tam: 3.2, mira: [ex - 0.2, 0.6, ez] } },
    { id: 'reactivos', ancla: [SITIO.banco[0], 1.0, SITIO.banco[1]], vista: { az: -20, el: 28, tam: 2.4, mira: [SITIO.banco[0] + 0.1, 0.3, SITIO.banco[1] + 0.4] } },
    { id: 'control', ancla: [SITIO.control[0], 1.05, SITIO.control[1]], vista: { az: 22, el: 26, tam: 2.4, mira: [SITIO.control[0], 0.35, SITIO.control[1] - 0.3] } },
    { id: 'linea', ancla: [TORRES.enlace[1][0], ALTO_TORRE + 0.35, TORRES.enlace[1][1]], vista: { az: 8, el: 18, tam: 4.8, mira: [1.2, 0.8, 0.3] } },
    { id: 'punto', ancla: [MARCOS.central[0], ALTO_MARCO + 0.45, MARCOS.central[1]], vista: { az: 34, el: 28, tam: 3.4, mira: [px - 0.3, 0.6, pz] } },
    { id: 'medicion', ancla: [SITIO.medidor[0], 1.0, SITIO.medidor[1]], vista: { az: 30, el: 22, tam: 1.8, mira: [SITIO.medidor[0] + 0.15, 0.4, SITIO.medidor[1] - 0.2] } },
    { id: 'red', ancla: [TORRES.red2[0][0], ALTO_TORRE + 0.35, TORRES.red2[0][1]], vista: { az: 20, el: 24, tam: 4.0, mira: [6.1, 0.7, -0.2] } },
    { id: 'refuerzo', ancla: [TORRES.refuerzo[0][0], ALTO_TORRE + 0.35, TORRES.refuerzo[0][1]], vista: { az: 30, el: 26, tam: 3.6, mira: [6.1, 0.6, 1.2] } },
    { id: 'saee', ancla: [SITIO.saee[0], 0.8, SITIO.saee[1]], vista: { az: 16, el: 30, tam: 2.8, mira: [SITIO.saee[0] - 0.4, 0.2, SITIO.saee[1] + 0.3] } },
    { id: 'cenace', ancla: [SITIO.cenace[0], 1.5, SITIO.cenace[1]], vista: { az: 14, el: 26, tam: 3.0, mira: [SITIO.cenace[0], 0.5, SITIO.cenace[1] + 0.3] } },
];
