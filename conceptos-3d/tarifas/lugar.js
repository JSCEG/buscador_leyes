// Dónde va cada cosa en la figura de tarifas: una calle con la casa, su medidor y el poste; atrás, la central, la línea de transmisión,
// la subestación y el CENACE; al frente, la oficina de la CFE que cobra, el Gobierno federal que pone la aportación, una tienda y una fábrica.
// Lo puro de la figura, sin three.js. Nada está a escala.

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
const yPoste = ALTO_POSTE + 0.02;
export const LINEAS = [
    { id: 'rnt', fluido: 'red', r: 0.04, cable: true, puntos: [[cx + 0.6, 1.0, cz - 0.55], [TORRES[0], ALTO_TORRE - 0.05, Z_TORRES], [TORRES[1], ALTO_TORRE - 0.05, Z_TORRES], [sx - 0.9, 1.2, sz - 0.35]] },
    { id: 'mt', fluido: 'red', r: 0.03, cable: true, puntos: [[sx + 0.9, 1.0, sz + 0.3], [1.6, 1.25, -1.2], [POSTES[0], yPoste, Z_POSTE], [POSTES[1], yPoste, Z_POSTE], [POSTES[2], yPoste, Z_POSTE], [POSTES[3], yPoste, Z_POSTE]] },
    { id: 'bt', fluido: 'red', r: 0.02, cable: true, puntos: [[POSTE_TRAFO + 0.05, 0.95, Z_POSTE + 0.04], [hx - 0.5, 1.2, 0.3], [hx - 0.5, 1.12, hz + CASA.fondo / 2 + 0.02]] },
    { id: 'fabrica', fluido: 'red', r: 0.03, cable: true, puntos: [[sx - 0.9, 1.0, sz + 0.35], [-2.0, 1.25, -2.0], [SITIO.fabrica[0] + 1.1, 0.95, SITIO.fabrica[1] - 0.25]] },
    { id: 'comercio', fluido: 'red', r: 0.02, cable: true, puntos: [[POSTES[3] + 0.05, 0.92, Z_POSTE + 0.04], [SITIO.comercio[0] - 0.3, 0.9, 0.4], [SITIO.comercio[0] - 0.3, 0.84, SITIO.comercio[1] + 0.5]] },
    { id: 'senal', fluido: 'senal', r: 0.02, cable: true, puntos: [[SITIO.cenace[0] - 0.6, 0.95, SITIO.cenace[1] - 0.35], [-4.6, 1.3, -2.0], [cx + 0.7, 0.8, cz + 0.4]] },
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
