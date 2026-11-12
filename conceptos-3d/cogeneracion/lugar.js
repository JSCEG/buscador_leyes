// Dónde va cada cosa en la figura de cogeneración: a la izquierda, una fábrica con su planta de cogeneración (gas, turbina de gas,
// generador, caldera de recuperación, chimenea, vapor al proceso y una caldera aparte); atrás, la subestación, la línea a la red y el
// CENACE; a la derecha, un ingenio azucarero que quema su bagazo. Lo puro de la figura, sin three.js. Nada está a escala.
import { apoyo, lineaAerea } from '../planta-comun/lineas.js';

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
    trafoIngenio: [6.25, -0.9],
};
export const ALTO_TORRE = 2.1;
export const TORRES = [0.0, 3.2, 6.4];
export const Z_TORRES = -3.4;
export const TURBINA = { largo: 1.7, ancho: 0.62, alto: 0.7 };
export const RECUPERADOR = { largo: 1.1, ancho: 0.9, alto: 1.5 };
export const ALTO_CHIMENEA = 2.5;
/** Postes que sostienen las líneas: [x, z, alto]. El cable pasa por la cruceta, a 0.92 del alto. El del transformador hace esquina. */
export const POSTES = { trafo: [-6.3, -2.6, 1.45], ingenio: [7.6, -0.9, 1.3] };
/** El poste de esquina va girado 45° para que su cruceta quede en la bisectriz de la vuelta. */
export const GIRO_POSTE = { trafo: Math.PI / 4, ingenio: 0 };
const cruceta = ([x, z, h]) => [x, h * 0.92, z];
const [rx0, rz0] = SITIO.trafo;
const [sx0, sz0] = SITIO.subestacion;
const [ix0, iz0] = SITIO.trafoIngenio;
/** Los bornes donde se conecta cada cable: cada punta de cable que no remata en la orilla debe caer en uno. */
export const BORNES = {
    // las tres boquillas de alta del transformador (a 0.13 una de otra, en x) y su gabinete de medición
    trafoAlta: [rx0, 0.76, rz0 - 0.05],
    medicion: [rx0 + 0.54, 0.16, rz0],
    posteTrafo: cruceta(POSTES.trafo),
    // las tres barras de la subestación (a 0.25 una de otra, en z), por sus dos puntas, y su gabinete de control
    barraOeste: [sx0 - 0.7, 1.2, sz0],
    barraEste: [sx0 + 0.7, 1.2, sz0],
    // el punto de las barras sobre el transformador de la subestación, y sus tres boquillas (a 0.12, en x)
    barraTrafo: [sx0, 1.2, sz0],
    trafoSubestacion: [sx0, 0.62, sz0],
    gabineteSubestacion: [sx0 + 0.55, 0.15, sz0 + 0.5],
    cenace: [SITIO.cenace[0] - 0.55, 0.3, SITIO.cenace[1] + 0.2],
    // la caja de conexión en la pared de la fábrica
    fabrica: [-1.0, 0.15, SITIO.proceso[1] - 0.7],
    // el transformador del ingenio: tres boquillas en z, a 0.09 una de otra
    trafoIngenio: [ix0, 0.56, iz0],
    posteIngenio: cruceta(POSTES.ingenio),
    ...Object.fromEntries(TORRES.map((x, i) => [`torre${i + 1}`, [x, ALTO_TORRE * 0.92, Z_TORRES]])),
};
/** El ducto de barras del generador al transformador: sale de la caja de bornes del generador, sube, cruza a esta altura y baja a la caja de baja tensión del transformador. */
export const DUCTO = { generador: [SITIO.generador[0], 0.28, SITIO.generador[1] - 0.3], trafo: [rx0, 0.6, rz0 + 0.12], alto: 0.7 };
const orillaRnt = [BLOQUE.x[1] - 0.05, ALTO_TORRE * 0.85, Z_TORRES];
const orillaIngenio = [BLOQUE.x[1] - 0.05, POSTES.ingenio[2] * 0.85, POSTES.ingenio[1]];
/** Cada línea aérea, apoyo por apoyo, con la abertura de sus fases donde llega: boquillas, barras, crucetas. */
export const AEREAS = {
    // del transformador sale hacia atrás, da vuelta en el poste de esquina y entra a las barras por su punta oeste
    aRed: [apoyo(BORNES.trafoAlta, [0.13, 0, 0]), apoyo(BORNES.posteTrafo, [0.177, 0, 0.177], 0.08), apoyo(BORNES.barraOeste, [0, 0, 0.25])],
    // los puentes de las tres barras a las boquillas del transformador de la subestación
    barras: [apoyo(BORNES.barraTrafo, [0, 0, 0.25]), apoyo(BORNES.trafoSubestacion, [0.12, 0, 0])],
    rnt: [apoyo(BORNES.barraEste, [0, 0, 0.25]), ...[1, 2, 3].map(i => apoyo(BORNES[`torre${i}`], [0, 0, 0.28], 0.08)), apoyo(orillaRnt, [0, 0, 0.28])],
    ingenioRed: [apoyo(BORNES.trafoIngenio, [0, 0, 0.09]), apoyo(BORNES.posteIngenio, [0, 0, 0.22], 0.08), apoyo(orillaIngenio, [0, 0, 0.22])],
};

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
    // la electricidad: del generador al transformador por un ducto de barras (la página lo dibuja; aquí va lo que corre por dentro)
    { id: 'elec', fluido: 'elec', r: 0.03, oculto: true, puntos: [DUCTO.generador, [rx0, DUCTO.alto, DUCTO.generador[2]], [rx0, DUCTO.alto, DUCTO.trafo[2]], DUCTO.trafo] },
    // las líneas aéreas no llevan tubo: la página dibuja sus tres conductores; aquí va la fase de en medio, por donde corre la electricidad
    ...Object.entries(AEREAS).map(([id, apoyos]) => lineaAerea(id, apoyos)),
    // a la fábrica, un cable de media tensión por el piso: del gabinete de medición a la caja de conexión de la fábrica
    { id: 'aFabrica', fluido: 'elec', r: 0.02, cable: true, puntos: [BORNES.medicion, [BORNES.medicion[0] + 0.06, 0.03, rz0], [BORNES.fabrica[0], 0.03, rz0], [BORNES.fabrica[0], 0.03, BORNES.fabrica[2] - 0.08], BORNES.fabrica] },
    { id: 'banda', fluido: 'bagazo', r: 0.05, puntos: [[bx - 0.5, 0.35, bz - 0.4], [6.3, 0.5, 0.4], [vx - 0.3, 0.9, vz + 0.35]] },
    { id: 'molinos', fluido: 'bagazo', r: 0.045, puntos: [[ix + 0.9, 0.35, iz + 0.2], [bx - 0.6, 0.3, bz - 0.1]] },
    { id: 'vaporIngenio', fluido: 'vapor', r: 0.045, puntos: [[vx - 0.1, 1.0, vz + 0.4], [4.2, 0.9, 0.4], [ix - 0.3, 0.7, iz - 0.6]] },
    // las instrucciones del CENACE: un cable de control por el piso, de la pared del CENACE al gabinete de la subestación
    { id: 'senal', fluido: 'senal', r: 0.02, cable: true, puntos: [BORNES.cenace, [BORNES.cenace[0] - 0.07, 0.03, BORNES.cenace[2]], [BORNES.gabineteSubestacion[0] + 0.07, 0.03, BORNES.gabineteSubestacion[2]], BORNES.gabineteSubestacion] },
];
/** Puntas que rematan en el borde del sitio: el gasoducto y las líneas a la red vienen de fuera. */
export const REMATE = new Set(['gasoducto (inicio)', 'rnt (fin)', 'ingenioRed (fin)']);
const caja = (x, y0, z, w, h, d) => [x - w / 2, x + w / 2, y0, y0 + h, z - d / 2, z + d / 2];
export const EQUIPOS = {
    gas: caja(gx, 0, gz, 0.8, 0.6, 0.7),
    generador: caja(SITIO.generador[0], 0, SITIO.generador[1], 0.9, 0.9, 0.8),
    turbina: caja(tx, 0, tz, TURBINA.largo + 0.2, 1.0, TURBINA.ancho + 0.3),
    recuperador: caja(rx, 0, rz, RECUPERADOR.largo + 0.2, RECUPERADOR.alto + 0.2, RECUPERADOR.ancho + 0.3),
    trafo: caja(SITIO.trafo[0] + 0.1, 0, SITIO.trafo[1], 1.1, 1.0, 0.7),
    proceso: caja(px, 0, pz, 2.2, 1.3, 1.6),
    caldera: caja(cx, 0, cz, 1.0, 0.8, 0.7),
    subestacion: caja(sx, 0, sz, 1.8, 1.6, 1.2),
    cenace: caja(SITIO.cenace[0], 0, SITIO.cenace[1], 1.3, 1.1, 1.0),
    ingenio: caja(ix, 0, iz, 2.2, 1.2, 1.6),
    bagazo: caja(bx, 0, bz, 1.4, 0.8, 1.2),
    turbinaVapor: caja(vx, 0, vz, 2.0, 1.5, 1.2),
    trafoIngenio: caja(ix0, 0, iz0, 0.5, 0.7, 0.45),
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
