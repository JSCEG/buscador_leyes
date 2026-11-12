// Dónde va cada cosa en la figura de cogeneración: a la izquierda, una fábrica con su planta de cogeneración (gas, turbina de gas,
// generador, caldera de recuperación, chimenea, vapor al proceso y una caldera aparte); atrás, la subestación, la línea a la red y el
// CENACE; a la derecha, un ingenio azucarero que quema su bagazo. Lo puro de la figura, sin three.js. Nada está a escala.

export const BLOQUE = { x: [-8, 8], z: [-4, 3.4], y: [-0.4, 0] };
/** [x, z] del centro de cada cosa. */
export const SITIO = {
    gas: [-7.1, 1.9],
    generador: [-6.3, 0.5],
    turbina: [-5.0, 0.5],
    recuperador: [-3.3, 0.5],
    chimenea: [-2.45, 0.5],
    trafo: [-6.3, -0.9],
    proceso: [-0.6, 2.1],
    caldera: [-3.4, 2.4],
    subestacion: [-3.4, -2.6],
    cenace: [0.4, -2.3],
    ingenio: [4.6, 1.6],
    bagazo: [6.9, 2.3],
    turbinaVapor: [4.8, -0.9],
};
export const ALTO_TORRE = 2.1;
export const TORRES = [0.0, 3.2, 6.4];
export const Z_TORRES = -3.4;
export const TURBINA = { largo: 1.7, ancho: 0.62, alto: 0.7 };
export const RECUPERADOR = { largo: 1.1, ancho: 0.9, alto: 1.5 };
export const ALTO_CHIMENEA = 2.5;

export const FLUIDOS = {
    gas: { nombre: 'Gas natural', color: '#2f7fd1' },
    escape: { nombre: 'Gases calientes', color: '#ff8a3c' },
    vapor: { nombre: 'Vapor', color: '#d64545' },
    agua: { nombre: 'Agua que regresa', color: '#4fb3c9' },
    elec: { nombre: 'Electricidad', color: '#f2b233' },
    bagazo: { nombre: 'Bagazo', color: '#b9933c' },
    senal: { nombre: 'Instrucciones del CENACE', color: '#7e57c2' },
};

const [gx, gz] = SITIO.gas;
const [tx, tz] = SITIO.turbina;
const [rx, rz] = SITIO.recuperador;
const [px, pz] = SITIO.proceso;
const [sx, sz] = SITIO.subestacion;
const [ix, iz] = SITIO.ingenio;
const [vx, vz] = SITIO.turbinaVapor;
const [bx, bz] = SITIO.bagazo;
const [cx, cz] = SITIO.caldera;
export const LINEAS = [
    { id: 'gasoducto', fluido: 'gas', r: 0.05, puntos: [[BLOQUE.x[0] + 0.05, 0.12, gz], [gx - 0.3, 0.12, gz]] },
    { id: 'gasTurbina', fluido: 'gas', r: 0.035, puntos: [[gx + 0.25, 0.25, gz - 0.2], [gx + 0.4, 0.3, 1.2], [tx - 0.3, 0.3, tz + 0.3]] },
    { id: 'gasCaldera', fluido: 'gas', r: 0.03, puntos: [[gx + 0.3, 0.2, gz + 0.15], [-5.0, 0.2, 2.6], [cx - 0.45, 0.25, cz]] },
    { id: 'escape', fluido: 'escape', r: 0.09, oculto: true, puntos: [[tx + 0.6, 0.4, tz], [rx - 0.4, 0.6, rz]] },
    { id: 'vapor', fluido: 'vapor', r: 0.05, puntos: [[rx, 1.45, rz + 0.2], [rx + 0.4, 1.3, 1.4], [-1.8, 1.0, 1.7], [px - 0.9, 0.7, pz - 0.2]] },
    { id: 'vaporCaldera', fluido: 'vapor', r: 0.04, puntos: [[cx + 0.4, 0.55, cz], [-2.2, 0.6, 2.5], [px - 0.9, 0.5, pz + 0.2]] },
    { id: 'retorno', fluido: 'agua', r: 0.03, puntos: [[px - 0.9, 0.2, pz - 0.35], [-2.0, 0.18, 1.3], [rx + 0.3, 0.2, rz + 0.4]] },
    { id: 'elec', fluido: 'elec', r: 0.03, cable: true, puntos: [[SITIO.generador[0], 0.6, SITIO.generador[1] - 0.25], [SITIO.trafo[0], 0.75, SITIO.trafo[1] + 0.2]] },
    { id: 'aRed', fluido: 'elec', r: 0.035, cable: true, puntos: [[SITIO.trafo[0] + 0.25, 0.9, SITIO.trafo[1] - 0.1], [-5.0, 1.4, -2.0], [sx - 0.8, 1.2, sz]] },
    { id: 'aFabrica', fluido: 'elec', r: 0.03, cable: true, puntos: [[SITIO.trafo[0] + 0.25, 0.85, SITIO.trafo[1] + 0.1], [-3.0, 1.2, -0.4], [px - 0.6, 1.0, pz - 0.7]] },
    { id: 'rnt', fluido: 'elec', r: 0.04, cable: true, puntos: [[sx + 0.8, 1.3, sz - 0.3], [TORRES[0], ALTO_TORRE - 0.05, Z_TORRES], [TORRES[1], ALTO_TORRE - 0.05, Z_TORRES], [TORRES[2], ALTO_TORRE - 0.05, Z_TORRES], [BLOQUE.x[1] - 0.05, ALTO_TORRE - 0.2, Z_TORRES]] },
    { id: 'ingenioRed', fluido: 'elec', r: 0.03, cable: true, puntos: [[vx + 0.6, 0.8, vz - 0.2], [5.6, 1.5, -2.4], [TORRES[2], ALTO_TORRE - 0.25, Z_TORRES]] },
    { id: 'banda', fluido: 'bagazo', r: 0.05, puntos: [[bx - 0.5, 0.35, bz - 0.4], [6.3, 0.5, 0.4], [vx - 0.3, 0.9, vz + 0.35]] },
    { id: 'molinos', fluido: 'bagazo', r: 0.045, puntos: [[ix + 0.9, 0.35, iz + 0.2], [bx - 0.6, 0.3, bz - 0.1]] },
    { id: 'vaporIngenio', fluido: 'vapor', r: 0.045, puntos: [[vx - 0.1, 1.0, vz + 0.4], [4.2, 0.9, 0.4], [ix - 0.3, 0.7, iz - 0.6]] },
    { id: 'senal', fluido: 'senal', r: 0.02, cable: true, puntos: [[SITIO.cenace[0] - 0.55, 0.9, SITIO.cenace[1] - 0.2], [-1.8, 1.4, -2.0], [sx + 0.7, 1.0, sz + 0.3]] },
];
/** Puntas que rematan en el borde del sitio: el gasoducto y la línea a la red vienen de fuera. */
export const REMATE = new Set(['gasoducto (inicio)', 'rnt (fin)', 'ingenioRed (fin)']);
const caja = (x, y0, z, w, h, d) => [x - w / 2, x + w / 2, y0, y0 + h, z - d / 2, z + d / 2];
export const EQUIPOS = {
    gas: caja(gx, 0, gz, 0.8, 0.6, 0.7),
    generador: caja(SITIO.generador[0], 0, SITIO.generador[1], 0.9, 0.9, 0.8),
    turbina: caja(tx, 0, tz, TURBINA.largo + 0.2, 1.0, TURBINA.ancho + 0.3),
    recuperador: caja(rx, 0, rz, RECUPERADOR.largo + 0.2, RECUPERADOR.alto + 0.2, RECUPERADOR.ancho + 0.3),
    trafo: caja(SITIO.trafo[0], 0, SITIO.trafo[1], 0.8, 1.0, 0.7),
    proceso: caja(px, 0, pz, 2.2, 1.3, 1.6),
    caldera: caja(cx, 0, cz, 1.0, 0.8, 0.7),
    subestacion: caja(sx, 0, sz, 1.8, 1.6, 1.2),
    cenace: caja(SITIO.cenace[0], 0, SITIO.cenace[1], 1.3, 1.1, 1.0),
    ingenio: caja(ix, 0, iz, 2.2, 1.2, 1.6),
    bagazo: caja(bx, 0, bz, 1.4, 0.8, 1.2),
    turbinaVapor: caja(vx, 0, vz, 2.0, 1.5, 1.2),
};

/** Puntos clave: dónde va el número y desde dónde se ve. */
export const PARTES = [
    { id: 'gas', ancla: [gx, 0.75, gz], vista: { az: 24, el: 24, tam: 3.2, mira: [gx + 0.3, 0.3, gz] } },
    { id: 'turbina', ancla: [tx, 1.05, tz], vista: { az: 18, el: 24, tam: 3.8, mira: [tx, 0.4, tz] } },
    { id: 'generador', ancla: [SITIO.generador[0], 1.0, SITIO.generador[1]], vista: { az: 30, el: 24, tam: 3.4, mira: [SITIO.generador[0], 0.4, SITIO.generador[1]] } },
    { id: 'recuperador', ancla: [rx, RECUPERADOR.alto + 0.3, rz], vista: { az: 20, el: 24, tam: 3.8, mira: [rx, 0.8, rz] } },
    { id: 'chimenea', ancla: [SITIO.chimenea[0], ALTO_CHIMENEA + 0.25, SITIO.chimenea[1]], vista: { az: 14, el: 18, tam: 4.6, mira: [SITIO.chimenea[0], 1.3, SITIO.chimenea[1]] } },
    { id: 'vapor', ancla: [-1.9, 1.3, 1.7], vista: { az: 12, el: 28, tam: 4.2, mira: [-2.2, 0.8, 1.3] } },
    { id: 'proceso', ancla: [px, 1.55, pz], vista: { az: -10, el: 26, tam: 4.0, mira: [px, 0.6, pz] } },
    { id: 'caldera', ancla: [cx, 1.0, cz], vista: { az: 16, el: 26, tam: 3.0, mira: [cx, 0.4, cz] } },
    { id: 'trafo', ancla: [SITIO.trafo[0], 1.15, SITIO.trafo[1]], vista: { az: 28, el: 26, tam: 3.4, mira: [SITIO.trafo[0], 0.5, SITIO.trafo[1]] } },
    { id: 'subestacion', ancla: [sx, 1.85, sz], vista: { az: -38, el: 30, tam: 4.0, mira: [sx, 0.8, sz] } },
    { id: 'cenace', ancla: [SITIO.cenace[0], 1.35, SITIO.cenace[1]], vista: { az: 12, el: 24, tam: 3.2, mira: [SITIO.cenace[0], 0.6, SITIO.cenace[1]] } },
    { id: 'ingenio', ancla: [ix, 1.5, iz], vista: { az: -14, el: 28, tam: 4.2, mira: [ix, 0.6, iz] } },
    { id: 'bagazo', ancla: [bx, 1.0, bz], vista: { az: -22, el: 26, tam: 3.2, mira: [bx, 0.4, bz] } },
    { id: 'turbinaVapor', ancla: [vx, 1.85, vz], vista: { az: -72, el: 28, tam: 4.2, mira: [vx, 0.8, vz] } },
];
