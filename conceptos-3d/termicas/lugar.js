// Dónde va cada cosa en la figura de las centrales térmicas: a la izquierda, una central de vapor que quema carbón o combustóleo,
// acomodada como las reales (junto al mar la sala de turbinas; detrás, la caldera, el filtro de cenizas y la chimenea en línea; a un
// lado, el patio de carbón y los tanques); a la derecha, una turbogás para las horas pico y una central de motores de combustión
// interna; atrás, la subestación, la red y el CENACE. Lo puro de la figura, sin three.js; Blender (blender/equipos.py) y la página
// leen este mismo acomodo. Nada está a escala.
import { apoyo, colgar, enCruceta, lineaAerea } from '../planta-comun/lineas.js';

export { colgar };

export const BLOQUE = { x: [-8, 8], z: [-4, 3.4], y: [-0.4, 0] };
/** [x, z] del centro de cada cosa. */
export const SITIO = {
    patio: [-6.3, 1.35],
    apiladora: [-6.1, 0.3],
    combustoleo: [-6.4, -2.0],
    torreBanda: [-5.2, -0.3],
    molinos: [-3.85, 0.3],
    caldera: [-2.6, 0.3],
    precalentador: [-2.15, -0.72],
    precipitador: [-2.6, -1.75],
    chimenea: [-2.6, -3.3],
    turbina: [-2.4, 2.0],
    toma: [-3.75, 3.0],
    trafo: [0.15, 2.3],
    turbogas: [2.55, 1.2],
    motores: [6.0, 1.0],
    trafoMotores: [7.62, 1.5],
    subestacion: [2.5, -2.45],
    cenace: [6.1, -2.4],
};
export const CALDERA = { ancho: 1.5, fondo: 1.5, alto: 3.4 };
export const SALA = { ancho: 3.3, fondo: 1.1, alto: 1.4 };
export const ALTO_CHIMENEA = 5.0;
export const ALTO_TORRE = 2.1;
export const TORRES = [3.8, 5.6, 7.4];
export const Z_TORRES = -3.4;
export const MAR = { z0: 2.75, z1: 3.4, x0: -8, x1: 0.6 };
const X0_SALA = SITIO.turbina[0] - SALA.ancho / 2;
/** El eje de la sala de turbinas: dónde va cada cuerpo, el generador, su excitatriz y el condensador (x), a qué altura y en qué z. */
export const EJE = { y: 0.62, z: SITIO.turbina[1], alta: X0_SALA + 0.42, baja: [X0_SALA + 1.64, X0_SALA + 2.24], generador: X0_SALA + 2.85, excitatriz: X0_SALA + 3.21, condensador: X0_SALA + 1.94 };
/** Postes que sostienen las líneas entre un equipo y otro: [x, z, alto]. El cable pasa por la cruceta, a 0.92 del alto. */
export const POSTES = { trafo: [1.0, 0.4, 1.45], turbogas: [3.3, -0.9, 1.45], motores: [7.72, -0.25, 1.55] };
const cruceta = ([x, z, h]) => [x, h * 0.92, z];
const [rx0, rz0] = SITIO.trafo;
const [sx0, sz0] = SITIO.subestacion;
/** Los bornes donde se conecta cada cable: cada punta de cable que no remata en la orilla debe caer en uno. */
export const BORNES = {
    generador: [EJE.generador + 0.12, 0.42, EJE.z + 0.3],
    trafoBaja: [rx0 - 0.22, 0.42, rz0],
    remateTrafo: [rx0 + 0.6, 0.85, rz0],
    posteTrafo: cruceta(POSTES.trafo),
    barraOeste: [sx0 - 0.95, 0.88, sz0],
    barraEste: [sx0 + 0.95, 0.88, sz0],
    bahiaTurbogas: [sx0 + 0.6, 1.0, sz0 + 0.3],
    trafoTurbogas: [SITIO.turbogas[0] + 1.45, 0.47, SITIO.turbogas[1]],
    posteTurbogas: cruceta(POSTES.turbogas),
    trafoMotores: [SITIO.trafoMotores[0], 0.53, SITIO.trafoMotores[1]],
    posteMotores: cruceta(POSTES.motores),
    gabineteSubestacion: [sx0 + 1.0, 0.12, sz0 + 0.45],
    cenace: [SITIO.cenace[0] - 0.6, 0.45, SITIO.cenace[1]],
    ...Object.fromEntries(TORRES.map((x, i) => [`torre${i + 1}`, [x, ALTO_TORRE * 0.92, Z_TORRES]])),
};

// ------------------------------------------------------------------ las líneas aéreas: tres fases que cuelgan entre apoyos
const orillaRnt = [BLOQUE.x[1] - 0.05, ALTO_TORRE * 0.85, Z_TORRES];
const orillaBcs = [BLOQUE.x[1] - 0.05, POSTES.motores[2] * 0.85, POSTES.motores[1]];
/** Cada línea aérea, apoyo por apoyo, con la abertura de sus fases donde llega: boquillas, barras, marcos, crucetas. */
export const AEREAS = {
    aRed: [apoyo(BORNES.remateTrafo, [0, 0, 0.168]), enCruceta(BORNES.posteTrafo, BORNES.remateTrafo, BORNES.barraOeste), apoyo(BORNES.barraOeste, [0, 0.03, 0.3])],
    turbogasRed: [apoyo(BORNES.trafoTurbogas, [0.08, 0, 0]), enCruceta(BORNES.posteTurbogas, BORNES.trafoTurbogas, BORNES.bahiaTurbogas), apoyo(BORNES.bahiaTurbogas, [0.2, 0, 0])],
    rnt: [apoyo(BORNES.barraEste, [0, 0.03, 0.3]), ...[1, 2, 3].map(i => apoyo(BORNES[`torre${i}`], [0, 0, 0.28], 0.08)), apoyo(orillaRnt, [0, 0, 0.28])],
    aislado: [apoyo(BORNES.trafoMotores, [0, 0, 0.08]), enCruceta(BORNES.posteMotores, BORNES.trafoMotores, orillaBcs), apoyo(orillaBcs, [0, 0, 0.25])],
};

export const FLUIDOS = {
    carbon: { nombre: 'Carbón', color: '#6b6661' },
    combustoleo: { nombre: 'Combustóleo', color: '#8a5a2b' },
    gas: { nombre: 'Gas natural', color: '#2f7fd1' },
    vapor: { nombre: 'Vapor', color: '#d64545' },
    agua: { nombre: 'Agua que regresa a la caldera', color: '#4fb3c9' },
    mar: { nombre: 'Agua de mar que enfría', color: '#2a9d8f' },
    gases: { nombre: 'Gases de la combustión', color: '#ff8a3c' },
    elec: { nombre: 'Electricidad', color: '#f2b233' },
    senal: { nombre: 'Instrucciones del CENACE', color: '#7e57c2' },
};

const [cx, cz] = SITIO.caldera;
const [mx, mz] = SITIO.molinos;
const [tx, tz] = SITIO.turbina;
const [px, pz] = SITIO.precipitador;
const [ax, az] = SITIO.precalentador;
const [hx, hz] = SITIO.chimenea;
const [gx, gz] = SITIO.turbogas;
const [sx, sz] = SITIO.subestacion;
const [ox, oz] = SITIO.combustoleo;
const [rx, rz] = SITIO.trafo;
const [bx, bz] = SITIO.torreBanda;
const quemador = (y, dz) => [cx - 0.75, y, cz + dz];
export const LINEAS = [
    // el carbón: del patio a la torre, a las tolvas y, ya molido, a los quemadores (por dentro de la banda y de la nave)
    { id: 'banda', fluido: 'carbon', r: 0.04, oculto: true, puntos: [[SITIO.patio[0] - 1.4, 0.13, SITIO.apiladora[1] - 0.24], [bx - 0.05, 0.13, SITIO.apiladora[1] - 0.24], [bx, 1.5, bz], [mx - 0.42, 2.4, mz - 0.25], [mx, 2.35, mz]] },
    { id: 'molido1', fluido: 'carbon', r: 0.025, puntos: [[mx + 0.05, 0.48, mz - 0.48], [mx + 0.05, 0.75, mz - 0.48], quemador(0.75, -0.25)] },
    { id: 'molido2', fluido: 'carbon', r: 0.025, puntos: [[mx + 0.05, 0.48, mz], [mx + 0.05, 1.05, mz], quemador(1.05, 0)] },
    { id: 'molido3', fluido: 'carbon', r: 0.025, puntos: [[mx + 0.05, 0.48, mz + 0.48], [mx + 0.05, 1.35, mz + 0.48], quemador(1.35, 0.25)] },
    // el combustóleo: de los tanques a los quemadores
    { id: 'combustoleo', fluido: 'combustoleo', r: 0.03, puntos: [[ox + 1.2, 0.08, oz], [-4.55, 0.08, oz], [-4.55, 0.08, cz - 0.95], [cx - 0.79, 0.08, cz - 0.95], [cx - 0.79, 0.6, cz - 0.4]] },
    // el vapor: del sobrecalentador a la turbina de alta presión y de ahí a las de baja
    { id: 'vapor', fluido: 'vapor', r: 0.05, puntos: [[cx + 0.3, 2.75, cz + 0.65], [cx + 0.3, 2.75, cz + 0.95], [cx + 0.3, 1.2, cz + 0.95], [tx - 0.95, 1.2, tz - 0.4], [tx - 0.95, 0.9, tz]] },
    { id: 'cruce', fluido: 'vapor', r: 0.04, puntos: [[EJE.alta + 0.78, 0.9, tz], [EJE.alta + 0.78, 1.08, tz], [EJE.baja[0], 1.08, tz], [EJE.baja[0], 0.92, tz]] },
    // el agua condensada regresa a la caldera
    { id: 'retorno', fluido: 'agua', r: 0.03, puntos: [[EJE.condensador - 0.4, 0.1, tz - 0.22], [EJE.condensador - 0.4, 0.1, cz + 1.0], [cx + 0.5, 0.1, cz + 1.0], [cx + 0.5, 0.75, cz + 0.72]] },
    // el agua de mar entra al condensador y regresa al mar más caliente
    { id: 'marEntra', fluido: 'mar', r: 0.04, puntos: [[SITIO.toma[0], 0.3, SITIO.toma[1] - 0.15], [SITIO.toma[0], 0.3, tz + 0.62], [EJE.condensador, 0.16, tz + 0.62], [EJE.condensador, 0.16, tz + 0.36]] },
    { id: 'marSale', fluido: 'mar', r: 0.04, puntos: [[EJE.condensador + 0.1, 0.16, tz - 0.36], [EJE.condensador + 0.1, 0.06, tz - 0.62], [-0.68, 0.06, tz - 0.62], [-0.68, 0.06, 2.95]] },
    // los gases: de la caldera al precalentador, al filtro, a los ventiladores y a la chimenea (por dentro de los ductos)
    { id: 'gases', fluido: 'gases', r: 0.06, oculto: true, puntos: [[ax, 2.9, cz - 0.6], [ax, 2.9, az], [ax, 1.25, az], [px, 1.17, pz + 0.75], [px, 1.17, pz - 0.45], [px, 0.4, pz - 0.88], [hx, 0.3, hz + 0.45], [hx, 1.2, hz], [hx, 4.9, hz]] },
    // la electricidad
    // la electricidad: por las barras del generador al transformador, del marco de remate a la subestación y de ahí a la red
    { id: 'generador', fluido: 'elec', r: 0.02, oculto: true, puntos: [BORNES.generador, BORNES.trafoBaja] },
    // las líneas aéreas no llevan tubo: la página dibuja sus tres conductores; aquí va la fase de en medio, por donde corre la electricidad
    ...Object.entries(AEREAS).map(([id, apoyos]) => lineaAerea(id, apoyos)),
    // el gas natural llega a la turbogás (por fuera del terreno de Baja California Sur)
    { id: 'gasoducto', fluido: 'gas', r: 0.04, puntos: [[BLOQUE.x[1] - 0.05, 0.1, -1.15], [3.9, 0.1, -1.15], [3.9, 0.1, 0.38], [gx + 0.12, 0.1, 0.38], [gx + 0.12, 0.2, gz - 0.48]] },
    // las instrucciones del CENACE
    { id: 'senal', fluido: 'senal', r: 0.02, cable: true, puntos: [BORNES.cenace, [SITIO.cenace[0] - 0.68, 0.04, SITIO.cenace[1]], [sx0 + 1.1, 0.04, sz0 + 0.45], BORNES.gabineteSubestacion] },
];
/** Puntas que rematan en el borde del sitio: la red, el gas y la red aislada vienen de fuera. */
export const REMATE = new Set(['rnt (fin)', 'aislado (fin)', 'gasoducto (inicio)', 'marSale (fin)']);
const caja = (x, y0, z, w, h, d) => [x - w / 2, x + w / 2, y0, y0 + h, z - d / 2, z + d / 2];
export const EQUIPOS = {
    patio: caja(SITIO.patio[0], 0, SITIO.apiladora[1], 3.4, 0.3, 0.7),
    torreBanda: caja(bx, 0, bz, 0.5, 1.8, 0.5),
    molinos: caja(mx, 0, mz, 0.95, 2.6, 1.6),
    combustoleo: caja(ox, 0, oz, 2.9, 0.7, 1.5),
    caldera: caja(cx, 0, cz, 1.6, 3.6, 1.6),
    precalentador: caja(ax, 0, az, 0.5, 1.3, 0.5),
    precipitador: caja(px, 0, pz, 1.4, 1.75, 1.6),
    chimenea: caja(hx, 0, hz, 1.0, 5.1, 1.4),
    sala: caja(tx, 0, tz, 3.4, 1.6, 1.2),
    toma: caja(SITIO.toma[0], 0, SITIO.toma[1], 1.0, 0.5, 0.6),
    trafo: caja(rx + 0.15, 0, rz, 1.2, 1.1, 0.8),
    turbogas: caja(gx, 0, gz, 2.4, 1.4, 1.7),
    trafoTurbogas: caja(gx + 1.45, 0, gz, 0.5, 0.55, 0.5),
    motores: caja(SITIO.motores[0], 0, SITIO.motores[1], 2.8, 1.0, 2.2),
    trafoMotores: caja(SITIO.trafoMotores[0], 0, SITIO.trafoMotores[1], 0.45, 0.6, 0.45),
    subestacion: caja(sx, 0, sz, 2.0, 1.1, 1.2),
    cenace: caja(SITIO.cenace[0], 0, SITIO.cenace[1], 1.3, 0.7, 0.8),
};

/** Puntos clave: dónde va el número y desde dónde se ve. */
export const PARTES = [
    { id: 'patio', ancla: [SITIO.patio[0], 0.95, SITIO.patio[1]], vista: { az: 18, el: 30, tam: 3.2, mira: [-6.0, 0.3, 0.9] } },
    { id: 'combustoleo', ancla: [ox, 0.95, oz], vista: { az: -28, el: 32, tam: 3.6, mira: [ox, 0.3, oz] } },
    { id: 'molinos', ancla: [mx, 2.8, mz], vista: { az: -35, el: 22, tam: 3.6, mira: [mx - 0.2, 1.2, mz] } },
    { id: 'caldera', ancla: [cx, 3.85, cz], vista: { az: 32, el: 18, tam: 4.6, mira: [cx, 1.8, cz] } },
    { id: 'precipitador', ancla: [px, 1.95, pz], vista: { az: 62, el: 24, tam: 3.4, mira: [px, 0.9, pz - 0.2] } },
    { id: 'chimenea', ancla: [hx, ALTO_CHIMENEA + 0.3, hz], vista: { az: 34, el: 14, tam: 6.0, mira: [hx, 2.6, hz + 0.4] } },
    { id: 'turbina', ancla: [tx - 0.6, 1.9, tz], vista: { az: 14, el: 30, tam: 3.6, mira: [tx - 0.2, 0.6, tz] } },
    { id: 'generador', ancla: [EJE.generador, 1.9, tz], vista: { az: 26, el: 30, tam: 2.8, mira: [EJE.generador + 0.1, 0.6, tz] } },
    { id: 'condensador', ancla: [SITIO.toma[0], 0.75, SITIO.toma[1]], vista: { az: 8, el: 32, tam: 3.2, mira: [tx - 0.6, 0.3, tz + 0.5] } },
    { id: 'trafo', ancla: [rx + 0.3, 1.35, rz], vista: { az: 34, el: 26, tam: 3.0, mira: [rx - 0.1, 0.5, rz - 0.3] } },
    { id: 'turbogas', ancla: [gx, 1.6, gz], vista: { az: 24, el: 26, tam: 3.6, mira: [gx + 0.3, 0.5, gz] } },
    { id: 'motores', ancla: [SITIO.motores[0], 1.4, SITIO.motores[1]], vista: { az: 20, el: 28, tam: 3.8, mira: [SITIO.motores[0], 0.5, SITIO.motores[1] - 0.2] } },
    { id: 'subestacion', ancla: [sx, 1.4, sz], vista: { az: 20, el: 30, tam: 3.8, mira: [sx + 0.8, 0.8, sz - 0.4] } },
    { id: 'cenace', ancla: [SITIO.cenace[0], 1.05, SITIO.cenace[1]], vista: { az: 14, el: 26, tam: 2.8, mira: [SITIO.cenace[0], 0.4, SITIO.cenace[1]] } },
];
