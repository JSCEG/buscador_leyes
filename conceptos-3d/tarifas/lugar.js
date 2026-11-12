// Dónde va cada cosa en la figura de tarifas: una calle con la casa, su medidor y el poste; atrás, la central, la línea de transmisión,
// la subestación y el CENACE; al frente, la oficina de la CFE que cobra, el Gobierno federal que pone la aportación, una tienda y una fábrica.
// Lo puro de la figura, sin three.js. Nada está a escala.
import { apoyo, lineaAerea } from '../planta-comun/lineas.js';

export const BLOQUE = { x: [-8, 8], z: [-4, 3.3], y: [-0.4, 0] };
/** [x, z] del centro de cada cosa. */
export const SITIO = {
    central: [-6.0, -2.6],
    subestacion: [1.2, -2.6],
    cenace: [-3.0, -1.0],
    casa: [4.0, 0.42],
    vecinas: [[2.2, 0.5], [5.8, 0.5]],
    comercio: [7.25, 0.5],
    suministro: [-0.9, 2.5],
    gobierno: [-3.9, 2.6],
    fabrica: [-6.1, 0.9],
};
export const CALLE = { z0: 1.5, z1: 2.3, x0: 0.4 };
export const POSTES = [1.7, 3.5, 5.3, 7.1];
export const Z_POSTE = -0.38;
export const POSTE_TRAFO = 3.5;
export const ALTO_POSTE = 1.25;
export const LAMPARAS = [2.9, 4.95, 6.6];
export const Z_LAMPARA = 2.47;
export const CASA = { ancho: 1.8, fondo: 1.1, alto: 0.92 };
export const ALTO_TORRE = 2.1;
export const TORRES = [-4.3, -1.6];
export const Z_TORRES = -3.35;

export const FLUIDOS = {
    red: { nombre: 'Energía', color: '#f2b233' },
    pago: { nombre: 'Lo que pagas', color: '#2fb36a' },
    aporte: { nombre: 'Lo que pone el Gobierno', color: '#e57a9a' },
    dap: { nombre: 'Alumbrado público', color: '#8a8f98' },
    senal: { nombre: 'Instrucciones del CENACE', color: '#7e57c2' },
};

const [cx, cz] = SITIO.central;
const [sx, sz] = SITIO.subestacion;
const [hx, hz] = SITIO.casa;
const [fx, fz] = SITIO.fabrica;
/** Los postes de media tensión que llevan la línea de la subestación a la fábrica: [x, z]. El primero, fuera de la grava de la subestación. */
export const POSTES_FABRICA = [[0.85, -1.25], [-1.25, -1.75], [-3.2, -1.75], [-5.15, -1.75]];
/** Los aisladores de las crucetas: a 0.17 del centro; el de en medio, sobre la punta del poste. El conductor va encima. */
export const ABRE_CRUCETA = 0.17;
const Y_MT = ALTO_POSTE + 0.025;
/** Altura del soporte de baja tensión de los postes. */
const Y_BT = 0.95;
/**
 * Hacia dónde abre sus fases cada poste de una ruta [[x, z], ...] (las puntas son boquillas): perpendicular al rumbo medio, a
 * ABRE_CRUCETA y siempre del mismo lado, para que las fases no se crucen. En una esquina queda en la bisectriz de la vuelta.
 */
function fasesEnPostes(ruta) {
    const rumbo = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
    return ruta.slice(1).map((p, i) => {
        const a = rumbo(ruta[i], p);
        const b = ruta[i + 2] ? rumbo(p, ruta[i + 2]) : a;
        const l = Math.hypot(a[0] + b[0], a[1] + b[1]);
        return [(ABRE_CRUCETA * (a[1] + b[1])) / l, 0, (-ABRE_CRUCETA * (a[0] + b[0])) / l];
    });
}
// las boquillas de baja de los transformadores de la subestación, de donde salen las dos líneas de media tensión
const salidaOeste = [sx - 0.35, sz + 0.1];
const salidaEste = [sx + 0.35, sz + 0.1];
const FASES_MT = fasesEnPostes([salidaEste, ...POSTES.map(x => [x, Z_POSTE])]);
const FASES_FABRICA = fasesEnPostes([salidaOeste, ...POSTES_FABRICA, [fx + 0.95, fz - 0.25]]).slice(0, -1);
/** Los aisladores de cada poste de media tensión: x, z y el giro de su cruceta (los de esquina van en la bisectriz de la vuelta). */
export const CRUCETAS = [
    ...POSTES.map((x, i) => ({ x, z: Z_POSTE, giro: Math.atan2(FASES_MT[i][0], FASES_MT[i][2]) })),
    ...POSTES_FABRICA.map(([x, z], i) => ({ x, z, giro: Math.atan2(FASES_FABRICA[i][0], FASES_FABRICA[i][2]) })),
];
/** Las casas vecinas: alto de cada una (la casita de planta.js) y su medidor al frente. */
export const ALTO_VECINAS = [0.6, 0.66];
/** Los bornes donde se conecta cada cable. */
export const BORNES = {
    // la central: su transformador con tres boquillas en z, a 0.1 una de otra; y la cara este de su gabinete de control
    centralTrafo: [cx + 0.55, 0.5, cz - 0.6],
    centralGabinete: [cx + 1.15, 0.15, cz + 0.25],
    ...Object.fromEntries(TORRES.map((x, i) => [`torre${i + 1}`, [x, ALTO_TORRE * 0.92, Z_TORRES]])),
    // las barras de la subestación (a 0.25 una de otra, en z): su punta oeste y el punto sobre cada transformador
    barraOeste: [sx - 0.75, 1.2, sz],
    barraTrafoOeste: [salidaOeste[0], 1.2, sz],
    barraTrafoEste: [salidaEste[0], 1.2, sz],
    // los dos transformadores de potencia: atrás las boquillas de alta (115 kV, de las barras), al frente las de baja (13.8 kV)
    altaOeste: [salidaOeste[0], 0.66, sz - 0.07],
    altaEste: [salidaEste[0], 0.66, sz - 0.07],
    trafoOeste: [salidaOeste[0], 0.58, salidaOeste[1]],
    trafoEste: [salidaEste[0], 0.58, salidaEste[1]],
    // los postes de media tensión, sobre su aislador de en medio
    ...Object.fromEntries(POSTES.map((x, i) => [`poste${i + 1}`, [x, Y_MT, Z_POSTE]])),
    ...Object.fromEntries(POSTES_FABRICA.map(([x, z], i) => [`posteFabrica${i + 1}`, [x, Y_MT, z]])),
    // el transformador de poste: su boquilla de media tensión arriba y la de baja que va a las casas
    trafoPosteAlta: [POSTE_TRAFO + 0.15, 1.11, Z_POSTE],
    trafoPosteBaja: [POSTE_TRAFO + 0.1, 1.08, Z_POSTE + 0.04],
    // el soporte de baja tensión de los postes (todos menos el del transformador)
    ...Object.fromEntries([0, 2, 3].map(i => [`bt${i + 1}`, [POSTES[i], Y_BT, Z_POSTE + 0.05]])),
    // las mufas de la casa, de las vecinas y de la tienda, donde entra la acometida
    mufaCasa: [hx - 0.5, CASA.alto + 0.2, hz + CASA.fondo / 2 + 0.02],
    ...Object.fromEntries(SITIO.vecinas.map(([x, z], i) => [`mufaVecina${i + 1}`, [x - 0.4, ALTO_VECINAS[i] + 0.2, z + 0.485]])),
    mufaComercio: [SITIO.comercio[0] - 0.3, 0.87, SITIO.comercio[1] + 0.5],
    // la fábrica: las tres boquillas de su transformador (a 0.1, en x)
    fabricaTrafo: [fx + 0.95, 0.5, fz - 0.25],
    cenace: [SITIO.cenace[0] - 0.6, 0.3, SITIO.cenace[1] - 0.2],
};
const solo = p => apoyo(p, [0, 0, 0]);
/** Cada línea aérea, apoyo por apoyo, con la abertura de sus fases donde llega: boquillas, barras, crucetas. */
export const AEREAS = {
    // la red de transmisión: del transformador de la central, por las dos torres, a las barras de la subestación
    rnt: [apoyo(BORNES.centralTrafo, [0, 0, 0.1]), apoyo(BORNES.torre1, [0, 0, 0.28], 0.08), apoyo(BORNES.torre2, [0, 0, 0.28], 0.08), apoyo(BORNES.barraOeste, [0, 0, 0.25])],
    // los puentes de las barras a las boquillas de alta de cada transformador
    barrasOeste: [apoyo(BORNES.barraTrafoOeste, [0, 0, 0.25]), apoyo(BORNES.altaOeste, [0.1, 0, 0])],
    barrasEste: [apoyo(BORNES.barraTrafoEste, [0, 0, 0.25]), apoyo(BORNES.altaEste, [0.1, 0, 0])],
    // la media tensión de la calle: sale del transformador del este, da vuelta en el primer poste y sigue por los postes
    mt: [apoyo(BORNES.trafoEste, [0.1, 0, 0]), ...POSTES.map((_, i) => apoyo(BORNES[`poste${i + 1}`], FASES_MT[i]))],
    // la media tensión de la fábrica: del transformador del oeste, por cuatro postes, a las boquillas de su transformador
    fabrica: [apoyo(BORNES.trafoOeste, [0.1, 0, 0]), ...POSTES_FABRICA.map((_, i) => apoyo(BORNES[`posteFabrica${i + 1}`], FASES_FABRICA[i])), apoyo(BORNES.fabricaTrafo, [0.1, 0, 0])],
    // el puente de la fase de en medio a la boquilla de media tensión del transformador de poste
    puente: [solo(BORNES.poste2), solo(BORNES.trafoPosteAlta)],
    // la baja tensión: un solo cable que cuelga del transformador a la casa y, por los soportes de los postes, a las vecinas y la tienda
    bt: [solo(BORNES.trafoPosteBaja), solo(BORNES.mufaCasa)],
    secundaria: [solo(BORNES.trafoPosteBaja), solo(BORNES.bt3), solo(BORNES.bt4)],
    secundariaOeste: [solo(BORNES.trafoPosteBaja), solo(BORNES.bt1)],
    vecina1: [solo(BORNES.bt1), solo(BORNES.mufaVecina1)],
    vecina2: [solo(BORNES.bt3), solo(BORNES.mufaVecina2)],
    comercio: [solo(BORNES.bt4), solo(BORNES.mufaComercio)],
};
/** Las líneas de baja tensión: un solo conductor. */
export const BAJA = new Set(['puente', 'bt', 'secundaria', 'secundariaOeste', 'vecina1', 'vecina2', 'comercio']);
export const LINEAS = [
    // las líneas aéreas no llevan tubo: la página dibuja sus conductores; aquí va la fase de en medio, por donde corre la energía
    ...Object.entries(AEREAS).map(([id, apoyos]) => lineaAerea(id, apoyos, BAJA.has(id) ? { fluido: 'red', fases: 1 } : { fluido: 'red' })),
    // las instrucciones del CENACE: un cable de control por el piso, de la pared del CENACE al gabinete de la central
    { id: 'senal', fluido: 'senal', r: 0.02, cable: true, puntos: [BORNES.cenace, [BORNES.cenace[0] - 0.07, 0.03, BORNES.cenace[2]], [-4.5, 0.03, BORNES.cenace[2]], [-4.5, 0.03, BORNES.centralGabinete[2]], [BORNES.centralGabinete[0] + 0.07, 0.03, BORNES.centralGabinete[2]], BORNES.centralGabinete] },
    { id: 'pago', fluido: 'pago', r: 0.03, puntos: [[hx - 0.75, 0.12, 1.08], [2.6, 0.1, 1.2], [1.1, 0.1, 1.25], [0.25, 0.1, 2.1], [SITIO.suministro[0] + 0.85, 0.12, SITIO.suministro[1] - 0.15]] },
    { id: 'aporte', fluido: 'aporte', r: 0.03, puntos: [[SITIO.gobierno[0] + 0.85, 0.12, SITIO.gobierno[1]], [-2.4, 0.1, 2.75], [SITIO.suministro[0] - 0.85, 0.12, SITIO.suministro[1] + 0.05]] },
    { id: 'dap', fluido: 'dap', r: 0.02, puntos: [[SITIO.suministro[0] + 0.85, 0.12, SITIO.suministro[1] + 0.3], [1.4, 0.1, 2.85], [LAMPARAS[0] - 0.02, 0.1, Z_LAMPARA + 0.06]] },
];
/** Puntas que rematan en algo que no es un equipo (una torre). */
export const REMATE = new Set();
const caja = (x, y0, z, w, h, d) => [x - w / 2, x + w / 2, y0, y0 + h, z - d / 2, z + d / 2];
export const EQUIPOS = {
    central: caja(cx, 0, cz, 2.6, 1.8, 1.6),
    subestacion: caja(sx, 0, sz, 2.0, 1.6, 1.2),
    cenace: caja(SITIO.cenace[0], 0, SITIO.cenace[1], 1.4, 1.2, 1.0),
    poste: caja(POSTE_TRAFO, 0, Z_POSTE, 0.4, 1.4, 0.4),
    postes: caja((POSTES[0] + POSTES[3]) / 2, 0.8, Z_POSTE, POSTES[3] - POSTES[0] + 0.3, 0.7, 0.3),
    casa: caja(hx, 0, hz, CASA.ancho + 0.2, 1.1, CASA.fondo + 0.2),
    ...Object.fromEntries(SITIO.vecinas.map(([x, z], i) => [`vecina${i + 1}`, caja(x, 0, z, 1.3, 1.0, 1.1)])),
    comercio: caja(SITIO.comercio[0], 0, SITIO.comercio[1], 1.1, 1.0, 1.1),
    fabrica: caja(SITIO.fabrica[0], 0, SITIO.fabrica[1], 2.6, 1.3, 1.4),
    suministro: caja(SITIO.suministro[0], 0, SITIO.suministro[1], 1.9, 1.0, 1.1),
    gobierno: caja(SITIO.gobierno[0], 0, SITIO.gobierno[1], 1.9, 1.1, 1.1),
    lampara: caja(LAMPARAS[0], 0, Z_LAMPARA, 0.3, 1.2, 0.3),
};

/** Puntos clave: dónde va el número y desde dónde se ve. */
export const PARTES = [
    { id: 'casa', ancla: [hx + 0.45, 1.25, hz], vista: { az: -8, el: 24, tam: 3.4, mira: [hx, 0.45, hz] } },
    { id: 'medidor', ancla: [hx - 0.5, 0.78, hz + 0.56], vista: { az: -4, el: 12, tam: 1.5, mira: [hx - 0.5, 0.45, hz + 0.56] } },
    { id: 'clima', ancla: [hx + 1.02, 0.78, hz + 0.15], vista: { az: -38, el: 20, tam: 2.1, mira: [hx + 0.8, 0.45, hz] } },
    { id: 'aparatos', ancla: [hx - 0.1, 0.55, hz + 0.1], vista: { az: -4, el: 34, tam: 1.8, mira: [hx, 0.3, hz] } },
    { id: 'poste', ancla: [POSTE_TRAFO, 1.5, Z_POSTE], vista: { az: 160, el: 18, tam: 2.2, mira: [POSTE_TRAFO, 0.8, Z_POSTE] } },
    { id: 'alumbrado', ancla: [LAMPARAS[1], 1.3, Z_LAMPARA], vista: { az: -14, el: 18, tam: 2.4, mira: [LAMPARAS[1], 0.6, Z_LAMPARA - 0.3] } },
    { id: 'subestacion', ancla: [sx, 1.85, sz], vista: { az: 12, el: 22, tam: 3.0, mira: [sx, 0.8, sz] } },
    { id: 'transmision', ancla: [TORRES[1], ALTO_TORRE + 0.3, Z_TORRES], vista: { az: 14, el: 18, tam: 4.4, mira: [-3.0, 1.2, -3.0] } },
    { id: 'central', ancla: [cx, 2.0, cz], vista: { az: 22, el: 22, tam: 3.4, mira: [cx, 0.8, cz] } },
    { id: 'cenace', ancla: [SITIO.cenace[0], 1.4, SITIO.cenace[1]], vista: { az: 20, el: 22, tam: 2.4, mira: [SITIO.cenace[0], 0.6, SITIO.cenace[1]] } },
    { id: 'suministro', ancla: [SITIO.suministro[0], 1.6, SITIO.suministro[1]], vista: { az: 8, el: 22, tam: 2.8, mira: [SITIO.suministro[0], 0.7, SITIO.suministro[1]] } },
    { id: 'gobierno', ancla: [SITIO.gobierno[0], 1.45, SITIO.gobierno[1]], vista: { az: 12, el: 20, tam: 2.6, mira: [SITIO.gobierno[0], 0.6, SITIO.gobierno[1]] } },
    { id: 'comercio', ancla: [SITIO.comercio[0], 1.15, SITIO.comercio[1]], vista: { az: -20, el: 22, tam: 2.0, mira: [SITIO.comercio[0], 0.5, SITIO.comercio[1]] } },
    { id: 'fabrica', ancla: [SITIO.fabrica[0], 1.5, SITIO.fabrica[1]], vista: { az: 24, el: 22, tam: 3.2, mira: [SITIO.fabrica[0], 0.6, SITIO.fabrica[1]] } },
];
