// El modelo de la red de distribución: puro, sin three.js ni DOM. Lo leen la escena, el tablero, las gráficas y las pruebas, así que una
// cifra sale de un solo lugar. Es una calle de ejemplo hecha con los criterios de la CFE para líneas monofásicas con transformador tipo YT
// (tesis UNAM): un transformador de poste de 37.5 kVA, del tamaño promedio de los 1.66 millones que tiene CFE Distribución, que baja de
// 7,620 V (una fase de 13.2 kV) a 120/240 V para 30 casas, unas por servicio como el promedio nacional. Lo que no viene en las fuentes
// está marcado como «de ejemplo».
//
// Cuatro formas de verla: un día en la calle (la carga del transformador), el voltaje hasta la última casa (y los paneles en los techos),
// una rama sobre los cables (el fusible) y lo que se pierde (técnicas y no técnicas).
import { D2R, clamp01, lerp } from '../planta-comun/ayudas.js';
import { apoyo, lineaAerea } from '../planta-comun/lineas.js';

// ------------------------------------------------------------------ la red de CFE Distribución, al cierre de 2024 (su programa 2025-2039)
export const RED = { transformadores: 1660977, MVA: 60912, servicios: 49.1, kmMT: 555336, kmBT: 345966, electronicos: 37.2, ami: 4.9 };
/** Promedio de kVA por transformador y de servicios por transformador. */
export const KVA_MEDIO = (RED.MVA * 1000) / RED.transformadores;
export const SERVICIOS_MEDIO = (RED.servicios * 1e6) / RED.transformadores;
/** Pérdidas de 2024: TWh e indicadores (%). Las técnicas, por tramo. La CRE reconoce 5 % y 5 %. */
export const PERDIDAS = { ingresada: 270.485, entregada: 235.623, total: 34.863, tecnicas: 4.55, noTecnicas: 8.64, cre: 5, oriente: 14.33, golfoNorte: 13.97, tramos: { atmt: 0.943, mt: 4.036, trafos: 2.433, bt: 3.996, acometidas: 0.943 } };
/** Lo que se le pide a la red: duración y frecuencia de las interrupciones, voltaje en las barras de media tensión, factor de potencia. */
export const CALIDAD = { saidi: 50, saifi: 0.94, caidi: 53, tension: 0.05, fp: 0.95 };
/** Generación distribuida: MW conectados y solicitudes de baja tensión por año (promedio 2017-2024). */
export const GD = { MW: 4447, solar: 99.4, solicitudes: 57526, hasta10: 98.8 };

// ------------------------------------------------------------------ la calle (criterios de la CFE, tesis UNAM)
/** Transformador tipo YT: una fase de 13.2 kV (7,620 V al neutro) a 120 V al neutro y 240 V entre fases. */
export const TRAFO = { kVA: 37.5, primario: 7620, primarioLL: 13200, fase: 120, entre: 240, z: 0.025, xr: 1.5, vacio: 0.004, cobre: 0.016 };
/** Criterios: el suministro dentro de ±5 %; en la red de baja tensión monofásica, no más de 3 % de caída a demanda máxima. */
export const CRITERIO = { suministro: 0.05, caidaBT: 0.03, caidaBT3F: 0.05, voltsKm: 50 };
/** Cable de la red de baja tensión para 37.5 kVA: cobre calibre 2 (CFE); resistencia a 20 °C (tabla AWG), reactancia de ejemplo. Ω/km. */
export const CABLE = { calibre: '2 AWG', R20: 0.5127, X: 0.33, T: 50 };
export const R_KM = CABLE.R20 * (1 + 0.00393 * (CABLE.T - 20));
/** La calle: 30 casas, 15 de cada lado del transformador, a lo largo de 105 m hacia cada lado. Consumo por vivienda: CONUEE, 2018. */
export const CALLE = { casas: 30, largo: 105, consumo: 1852, FP: 0.9 };
/** Panel de una casa: 3 kW pico, de ejemplo (casi todas las solicitudes en baja tensión son de 10 kW o menos). */
export const PANEL = { kW: 3, rinde: 0.8 };
/** Fusible del transformador, de ejemplo: un listón de 8 A. Se funde con más del doble; entre más corriente, más rápido. */
export const FUSIBLE = { A: 8, minimo: 2, t0: 300, n: 5 };
/** Forma de la demanda de una casa en el día, hora por hora (de cada 1 de su promedio): de ejemplo, con la punta en la noche. */
export const FORMA = [0.62, 0.52, 0.48, 0.46, 0.48, 0.62, 0.92, 1.1, 0.98, 0.86, 0.84, 0.88, 0.98, 1.04, 1.02, 0.98, 1.0, 1.14, 1.42, 1.78, 1.86, 1.66, 1.28, 0.88];
const MEDIA = FORMA.reduce((s, x) => s + x, 0) / 24;

export const DEF = { hora: 20, casas: CALLE.casas, consumo: CALLE.consumo, paneles: 0.3, d: 60, fusible: FUSIBLE.A, diablitos: 0.1 };
export const LIMITES = { casas: [10, 60], consumo: [1000, 6000], paneles: [0, 1], d: [5, CALLE.largo], fusible: [3, 20], diablitos: [0, 0.4], hora: [0, 24] };

// ------------------------------------------------------------------ la demanda
const formaEn = h => { const x = ((h % 24) + 24) % 24; const i = Math.floor(x); return lerp(FORMA[i], FORMA[(i + 1) % 24], x - i) / MEDIA; };
/** kW de una casa a la hora h, con un consumo anual en kWh. */
export const casaKW = (h, consumo = DEF.consumo) => (consumo / 8760) * formaEn(h);
/** kW de un panel a la hora h: sale con el sol, de 7 a 19 h; forma de ejemplo. */
export const panelKW = h => { const u = (h - 7) / 12; return u > 0 && u < 1 ? PANEL.kW * PANEL.rinde * Math.sin(Math.PI * u) ** 1.4 : 0; };
/** Energía de un día (kWh) de una casa: comprueba que el año sume su consumo. */
export const diaKWh = consumo => { let e = 0; for (let h = 0; h < 24; h += 0.05) e += casaKW(h + 0.025, consumo) * 0.05; return e; };

// ------------------------------------------------------------------ la calle a una hora
const ZBASE = TRAFO.entre ** 2 / (TRAFO.kVA * 1000);
const RT = (TRAFO.z * ZBASE) / Math.sqrt(1 + TRAFO.xr ** 2);
const XT = RT * TRAFO.xr;
/**
 * Lo que pasa en la calle a la hora h. casas: cuántas; consumo: kWh al año por casa; paneles: de cada 1, cuántas casas tienen panel.
 * P: kW netos que pasan por el transformador (negativo si la calle le regresa energía); uso: de cada 1 de su capacidad; perfil: el voltaje a lo
 * largo de la calle (de cada 1 de 120 V), del transformador (0 m) a la última casa (105 m).
 */
export function calle({ hora = DEF.hora, casas = DEF.casas, consumo = DEF.consumo, paneles = 0 } = {}) {
    const carga = casas * casaKW(hora, consumo);
    const sol = casas * paneles * panelKW(hora);
    const P = carga - sol; // kW
    const Q = carga * Math.tan(Math.acos(CALLE.FP)); // los paneles entregan con factor de potencia 1
    const S = Math.hypot(P, Q);
    const uso = S / TRAFO.kVA;
    // caída en el transformador, en por unidad de 240 V
    const dT = ((P * 1000 * RT + Q * 1000 * XT) / TRAFO.entre ** 2);
    // en cada lado va la mitad; la carga repartida a lo largo: a x m, la caída es (P r + Q x)(x − x²/2L)/V²
    const [Pl, Ql] = [(P * 1000) / 2, (Q * 1000) / 2];
    const r = (2 * R_KM) / 1000; // ida y vuelta por las dos fases, Ω por metro
    const xl = (2 * CABLE.X) / 1000;
    const L = CALLE.largo;
    const perfil = [];
    for (let i = 0; i <= 20; i++) {
        const x = (L * i) / 20;
        const dl = ((Pl * r + Ql * xl) * (x - (x * x) / (2 * L))) / TRAFO.entre ** 2;
        perfil.push({ m: x, v: 1 - dT - dl });
    }
    const fin = perfil.at(-1).v;
    const I = (S * 1000) / TRAFO.entre; // A en cada fase, a la salida del transformador
    return { hora, casas, consumo, paneles, carga, sol, P, Q, S, uso, I, Ip: (S * 1000) / TRAFO.primario, dT, perfil, fin, caida: 1 - fin, sube: fin > 1 };
}
/** El día entero, cada 6 minutos: carga, sol, uso y el voltaje de la última casa. Para las gráficas y las pérdidas. */
const cacheDia = new Map();
export function dia({ casas = DEF.casas, consumo = DEF.consumo, paneles = 0 } = {}) {
    const k = `${casas}|${Math.round(consumo)}|${paneles.toFixed(3)}`;
    if (cacheDia.has(k)) return cacheDia.get(k);
    const R = { h: [], carga: [], P: [], uso: [], fin: [] };
    for (let h = 0; h <= 24; h += 0.1) { const c = calle({ hora: h, casas, consumo, paneles }); R.h.push(h); R.carga.push(c.carga); R.P.push(c.P); R.uso.push(c.uso); R.fin.push(c.fin); }
    R.maxUso = Math.max(...R.uso);
    R.minFin = Math.min(...R.fin);
    R.maxFin = Math.max(...R.fin);
    R.horaPico = R.h[R.uso.indexOf(R.maxUso)];
    R.en = (serie, h) => { const x = clamp01(h / 24) * (R.h.length - 1); const i = Math.min(R.h.length - 2, Math.floor(x)); return lerp(R[serie][i], R[serie][i + 1], x - i); };
    cacheDia.set(k, R);
    return R;
}

// ------------------------------------------------------------------ lo que se pierde (un día, kWh)
/**
 * Pérdidas técnicas de la calle: el núcleo del transformador (siempre), sus devanados y los cables (con el cuadrado de la corriente).
 * Las no técnicas: lo que gastan las casas con diablito, que no pasa por el medidor.
 */
export function perdidas({ casas = DEF.casas, consumo = DEF.consumo, diablitos = DEF.diablitos } = {}) {
    let [nucleo, cobre, cables, entra] = [0, 0, 0, 0];
    const dt = 0.1;
    const r = (2 * R_KM) / 1000;
    for (let h = 0; h < 24; h += dt) {
        const c = calle({ hora: h + dt / 2, casas, consumo });
        nucleo += TRAFO.vacio * TRAFO.kVA * dt;
        cobre += TRAFO.cobre * TRAFO.kVA * c.uso * c.uso * dt;
        // carga repartida: cada lado pierde I² r L / 3, con la mitad de la corriente
        const Il = c.I / 2;
        cables += 2 * ((Il * Il * r * CALLE.largo) / 3 / 1000) * dt;
        entra += c.carga * dt;
    }
    const tecnicas = nucleo + cobre + cables;
    const robada = entra * diablitos;
    const total = entra + tecnicas;
    return { nucleo, cobre, cables, tecnicas, robada, cobrada: entra - robada, entra: total, pctTecnicas: tecnicas / total, pctNoTecnicas: robada / total };
}

// ------------------------------------------------------------------ una rama sobre los cables
/** Corriente de una falla a d m del transformador, en 240 V (A), y la que ve el fusible en 7,620 V. */
export function falla({ d = DEF.d } = {}) {
    const R = RT + ((2 * R_KM) / 1000) * d;
    const X = XT + ((2 * CABLE.X) / 1000) * d;
    const Ib = TRAFO.entre / Math.hypot(R, X);
    return { d, Ib, Ip: (Ib * TRAFO.entre) / TRAFO.primario };
}
/** Segundos que tarda en fundirse el fusible de A amperes con la corriente I: no se funde con menos del doble. Curva de ejemplo. */
export const funde = (I, A = DEF.fusible) => (I > FUSIBLE.minimo * A ? FUSIBLE.t0 * ((FUSIBLE.minimo * A) / I) ** FUSIBLE.n : Infinity);
/** Lo que pasa, tramo por tramo: falla, abierto (el fusible cayó) o sigue (no se fundió). Tiempos en segundos de verdad. */
export function secuencia({ d = DEF.d, fusible = DEF.fusible } = {}) {
    const F = falla({ d });
    const t = funde(F.Ip, fusible);
    const tope = 10;
    const tramos = Number.isFinite(t) && t < tope
        ? [{ t0: 0, t1: Math.max(t, 0.05), estado: 'falla' }, { t0: Math.max(t, 0.05), t1: 1e9, estado: 'abierto' }]
        : [{ t0: 0, t1: 1e9, estado: 'sigue' }];
    return { ...F, t, tramos, cae: tramos.length === 2 };
}
export const enTramo = (S, t) => S.tramos.find(x => t >= x.t0 && t < x.t1) ?? S.tramos.at(-1);
/** La corriente normal del lado de 7,620 V, para que el fusible no se funda con la carga: a plena carga, 4.92 A. */
export const plenaCarga = () => (TRAFO.kVA * 1000) / TRAFO.primario;

// ------------------------------------------------------------------ el tiempo de la escena
export const estadoPlanta = () => ({ t: 0, falla: null });
/** Un paso del tiempo. m: { falla }. La falla corre en cámara lenta los primeros 2 s. */
export function pasoPlanta(s, m, dt) {
    const n = { ...s };
    n.t += dt;
    if (!m.falla) n.falla = null;
    else if (n.falla === null) n.falla = 0;
    else n.falla += dt * (n.falla < 2 ? 0.25 : 1);
    return n;
}

// ------------------------------------------------------------------ las lecturas
/** Lo que mide la calle. modo: 'dia' | 'voltaje' | 'falla' | 'perdidas'. */
export function calcular({ modo = 'dia', planta = null, hora = DEF.hora, casas = DEF.casas, consumo = DEF.consumo, paneles = DEF.paneles, d = DEF.d, fusible = DEF.fusible, diablitos = DEF.diablitos } = {}) {
    const L = { modo, hora, casas, consumo };
    if (modo === 'dia') {
        Object.assign(L, calle({ hora, casas, consumo }), { D: dia({ casas, consumo }) });
        L.casa = casaKW(hora, consumo);
        L.diaKWh = diaKWh(consumo);
    } else if (modo === 'voltaje') {
        Object.assign(L, calle({ hora, casas, consumo, paneles }), { D: dia({ casas, consumo, paneles }), paneles });
        L.panel = panelKW(hora);
    } else if (modo === 'falla') {
        const S = secuencia({ d, fusible });
        const t = planta && planta.falla !== null ? planta.falla : null;
        Object.assign(L, calle({ hora, casas, consumo }), { d, fusible, S, t, tramo: t === null ? null : enTramo(S, t) });
        L.estado = L.tramo ? L.tramo.estado : 'normal';
    } else {
        Object.assign(L, calle({ hora, casas, consumo }), { diablitos, Pd: perdidas({ casas, consumo, diablitos }) });
    }
    return L;
}

// ------------------------------------------------------------------ acomodo (no está a escala)
export const BLOQUE = { x: [-8.4, 8.4], z: [-3, 3], y: [-0.4, 0] };
/** Escala horizontal: 105 m de cada lado caben en 7.8 unidades. */
export const ESCX = 7.8 / CALLE.largo;
export const X = { postes: [-7.8, -5.2, -2.6, 0, 2.6, 5.2, 7.8], trafo: 0, arbol: 3.9 };
export const ZP = 0.95; // los postes, en la banqueta de enfrente
export const Y = { poste: 2.3, mt: 2.2, cruceta: 2.12, cortacircuito: 1.95, trafo: 1.6, neutro: 1.42, fases: [1.33, 1.24], fachada: 0.62, techo: 0.9 };
export const CALLEZ = { arroyo: 0.68, banqueta: 1.08 };
/** Las casas: 15 de cada lado de la calle, del frente (z > 0) y del fondo (z < 0). */
export const CASAS = [1, -1].flatMap((lado, j) => Array.from({ length: 15 }, (_, i) => ({ i: j * 15 + i, lado, x: -7.7 + i * 1.1, z: lado * 1.95 })));
/** De qué poste toma su acometida cada casa: el más cercano. */
export const posteDe = c => X.postes.reduce((a, b) => (Math.abs(b - c.x) < Math.abs(a - c.x) ? b : a));
/** Las casas con panel y con diablito: un orden fijo, para que no brinquen al mover el mando. */
const ORDEN = CASAS.map(c => c.i).sort((a, b) => ((a * 37) % 30) - ((b * 37) % 30));
export const conPanel = f => new Set(ORDEN.slice(0, Math.round(f * CASAS.length)));
export const conDiablito = f => new Set(ORDEN.slice().reverse().slice(0, Math.round(f * CASAS.length)));
/** Dónde cae la rama: a d m del transformador, hacia la derecha. */
export const xRama = d => X.trafo + d * ESCX;

export const FLUIDOS = {
    media: { nombre: 'Media tensión, 13.2 kV', color: '#2f9be0' },
    baja: { nombre: 'Baja tensión, 120/240 V', color: '#ffb000' },
    solar: { nombre: 'Energía de los paneles', color: '#3fb27f' },
    falla: { nombre: 'Corriente de una falla', color: '#e0302a' },
};
export const ZS = ZP - 0.06; // el bastidor de la red de baja tensión, del lado de la calle
const yF = Y.fases[0];
const POSTES_DER = X.postes.filter(x => x > X.trafo);
/** Dónde se conecta cada cable: el aislador de alfiler de cada cruceta, el bastidor de cada poste (su carrete de en medio), el
 *  cortacircuito, las boquillas del transformador, el apartarrayos y la mufa de cada casa. Coinciden con la geometría de planta.js. */
const yPin = Y.cruceta + 0.11;
export const BORNES = {
    ...Object.fromEntries(X.postes.map((x, k) => [`alfiler${k}`, [x, yPin, ZP + 0.3]])),
    ...Object.fromEntries(X.postes.map((x, k) => [`bastidor${k}`, [x, yF, ZS]])),
    cortaArriba: [X.trafo + 0.12, Y.cortacircuito + 0.215, ZP + 0.3],
    cortaAbajo: [X.trafo + 0.12, Y.cortacircuito - 0.02, ZP + 0.3],
    trafoAlta: [X.trafo + 0.14, Y.trafo + 0.32, ZP + 0.14],
    apartarrayos: [X.trafo - 0.24, Y.cortacircuito + 0.055, ZP + 0.3],
    ...Object.fromEntries(CASAS.map(c => [`mufa${c.i}`, [c.x - 0.38, Y.fachada + 0.12, c.z - c.lado * 0.43]])),
};
/** Las boquillas de baja tensión del transformador (la de en medio, el neutro) y a qué carrete del bastidor va cada una. */
export const BAJA = [[-0.06, Y.fases[0]], [0, Y.neutro], [0.06, Y.fases[1]]].map(([dz, y]) => ({ boquilla: [X.trafo - 0.05, Y.trafo + 0.08, ZP + 0.14 + dz], carrete: [X.trafo, y, ZS] }));
const alfiler = x => apoyo(BORNES[`alfiler${X.postes.indexOf(x)}`], [0, 0, 0]);
/** El bastidor: la fase de en medio y, a 0.09 en vertical, la otra fase (abajo) y el neutro (arriba). */
const bastidor = x => apoyo(BORNES[`bastidor${X.postes.indexOf(x)}`], [0, Y.neutro - yF, 0]);
const unaFase = p => apoyo(p, [0, 0, 0]);
const orillaMT = x => unaFase([x, yPin, ZP + 0.3]);
/** Las líneas aéreas que se dibujan, apoyo por apoyo: una sola fase de media tensión que cruza la calle (viene de la subestación y sigue) y
 *  la red de baja tensión de poste a poste, que remata en los postes de las orillas. */
export const AEREAS = {
    mtCalle: [orillaMT(BLOQUE.x[0] + 0.02), ...X.postes.map(alfiler), orillaMT(BLOQUE.x[1] - 0.02)],
    btCalle: X.postes.map(bastidor),
};
/** Altura de un cable de la red de baja tensión en x, colgando entre postes como lo dibuja colgar(): k = 0 la fase de en medio, -1 la de
 *  abajo y 1 el neutro. Ahí caen la rama y el gancho del diablito. */
export function enLaRed(x, k = 0) {
    const i = Math.min(X.postes.length - 1, Math.max(1, X.postes.findIndex(p => p >= x)));
    const [a, b] = [X.postes[i - 1], X.postes[i]];
    const u = clamp01((x - a) / (b - a));
    return yF + k * (Y.neutro - yF) - 4 * 0.035 * (b - a) * u * (1 - u);
}
/** La acometida: del bastidor del poste más cercano a la mufa de la casa, colgando. */
const acometidaApoyos = c => [bastidor(posteDe(c)), unaFase(BORNES[`mufa${c.i}`])];
const porLaRed = xs => xs.map(bastidor);
export const LINEAS = [
    // la fase de media tensión llega por la cruceta, baja por el cortacircuito y entra al transformador
    lineaAerea('mt', [orillaMT(BLOQUE.x[0] + 0.02), ...X.postes.filter(x => x <= X.trafo).map(alfiler), ...['cortaArriba', 'cortaAbajo', 'trafoAlta'].map(b => unaFase(BORNES[b]))], { grupo: 'mt', parte: 'alimentador', fluido: 'media' }),
    ...[-1, 1].map((s, k) => lineaAerea(`b${k + 1}`, porLaRed([X.trafo, ...X.postes.filter(x => s * x > 0).sort((a, b) => s * (a - b))]), { grupo: `b${k + 1}`, parte: 'secundaria', fluido: 'baja' })),
    ...[-1, 1].map((s, k) => lineaAerea(`r${k + 1}`, porLaRed([...X.postes.filter(x => s * x > 0).sort((a, b) => s * (b - a)), X.trafo]), { grupo: `r${k + 1}`, parte: 'paneles', fluido: 'solar' })),
    ...CASAS.map(c => lineaAerea(`a${c.i}`, acometidaApoyos(c), { grupo: 'acometidas', parte: 'acometida', fluido: 'baja', r: 0.008, casa: c.i })),
    ...CASAS.map(c => lineaAerea(`g${c.i}`, acometidaApoyos(c).slice().reverse(), { grupo: 'paneles', parte: 'paneles', fluido: 'solar', r: 0.008, casa: c.i })),
    // la corriente de una falla: del transformador hasta el primer poste después de la rama (la rama cae hacia la derecha)
    ...POSTES_DER.map((x, k) => lineaAerea(`f${k + 1}`, porLaRed([X.trafo, ...POSTES_DER.filter(p => p <= x)]), { grupo: `f${k + 1}`, parte: 'secundaria', fluido: 'falla', r: 0.014 })),
];
/** Qué línea de falla se enciende: la que llega al primer poste después de la rama. */
export const lineaFalla = d => `f${Math.max(0, POSTES_DER.findIndex(p => p >= xRama(d) - 0.05)) + 1}`;
/** La línea de media tensión viene de la subestación, fuera del dibujo, y sigue a otras calles. */
export const REMATE = new Set(['mt (inicio)', 'mtCalle (inicio)', 'mtCalle (fin)']);
/** Las líneas aéreas que se dibujan, en la forma de LINEAS, para revisarlas con cablesSueltos(). */
export const DIBUJADAS = Object.entries(AEREAS).map(([id, apoyos]) => lineaAerea(id, apoyos, { fluido: 'media' }));
const caja = (x, y, z, w, h, d) => [x - w / 2, x + w / 2, y, y + h, z - d / 2, z + d / 2];
export const EQUIPOS = {
    ...Object.fromEntries(X.postes.map(x => [`poste${x}`, caja(x, 0, ZP, 0.16, Y.poste, 0.3)])),
    trafo: caja(X.trafo + 0.14, Y.trafo - 0.2, ZP + 0.14, 0.3, 0.6, 0.3),
    ...Object.fromEntries(CASAS.map(c => [`casa${c.i}`, caja(c.x, 0, c.z, 0.92, Y.techo + 0.3, 0.9)])),
};

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
/** Las casas de las fichas: todas del lado del fondo, con la fachada hacia la cámara. La de paneles y la del diablito los tienen
 *  con los valores de fábrica (conPanel(0.3) y conDiablito(0.1)). */
export const FICHA = { casa: 19, medidor: 20, acometida: 24, paneles: 18, diablito: 17 };
export const fachadaZ = c => c.z - c.lado * 0.42;
export const medidorEn = c => [c.x - 0.38, Y.fachada - 0.04, c.z - c.lado * 0.45];
/** Los cables como los dibuja la planta: la acometida llega al medidor; el diablito, a la azotea. */
export const acometidaPlanta = c => acometidaApoyos(c).map(a => a.p);
/** El gancho del diablito se cuelga de la fase de abajo, a 0.55 del poste; de ahí el cable baja a la azotea. */
export function diablitoPlanta(c) {
    const x = posteDe(c) + (c.x > posteDe(c) ? 0.55 : -0.55);
    return [[x, enLaRed(x, -1) - 0.025, ZS], [c.x + 0.3, Y.techo + 0.02, c.z - c.lado * 0.3]];
}
const enMedio = ([a, b], dy = 0) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + dy, (a[2] + b[2]) / 2];
export const PARTES = [
    { id: 'alimentador', ancla: [-4.5, Y.mt + 0.1, ZP + 0.3], vista: { az: 20, el: 18, tam: 3.4, mira: [-3.5, 1.7, ZP] } },
    { id: 'apartarrayos', ancla: [X.trafo - 0.25, Y.cruceta + 0.05, ZP + 0.3], vista: { az: 34, el: 14, tam: 1.2, mira: [X.trafo, 1.95, ZP + 0.1] } },
    { id: 'cortacircuito', ancla: [X.trafo + 0.22, Y.cortacircuito + 0.08, ZP + 0.3], vista: { az: 30, el: 12, tam: 1.1, mira: [X.trafo + 0.05, 1.85, ZP + 0.15] } },
    { id: 'transformador', ancla: [X.trafo + 0.3, Y.trafo + 0.2, ZP + 0.3], vista: { az: 40, el: 14, tam: 1.4, mira: [X.trafo + 0.1, 1.6, ZP + 0.1] } },
    { id: 'postes', ancla: [2.6, Y.poste + 0.05, ZP], vista: { az: 14, el: 16, tam: 3.2, mira: [2.6, 1.2, ZP] } },
    { id: 'retenida', ancla: [7.95, 1.2, ZP + 0.3], vista: { az: 56, el: 18, tam: 2.4, mira: [7.9, 0.9, ZP] } },
    { id: 'secundaria', ancla: [-1.3, Y.neutro + 0.08, ZS], vista: { az: 16, el: 12, tam: 2.4, mira: [-1.3, 1.3, ZP] } },
    { id: 'neutro', ancla: [X.trafo - 0.12, 0.5, ZP + 0.12], vista: { az: 24, el: 16, tam: 1.8, mira: [X.trafo, 0.9, ZP] } },
    { id: 'acometida', ancla: enMedio(acometidaPlanta(CASAS[FICHA.acometida]), -0.04), vista: { az: -28, el: 22, tam: 2.4, mira: [enMedio(acometidaPlanta(CASAS[FICHA.acometida]))[0], 0.9, -0.5] } },
    { id: 'medidor', ancla: medidorEn(CASAS[FICHA.medidor]), vista: { az: 16, el: 12, tam: 1.25, mira: [medidorEn(CASAS[FICHA.medidor])[0] + 0.08, 0.55, medidorEn(CASAS[FICHA.medidor])[2]] } },
    { id: 'casa', ancla: [CASAS[FICHA.casa].x, Y.techo - 0.15, fachadaZ(CASAS[FICHA.casa])], vista: { az: -12, el: 28, tam: 2.2, mira: [CASAS[FICHA.casa].x, 0.5, CASAS[FICHA.casa].z + 0.4] } },
    { id: 'paneles', ancla: [CASAS[FICHA.paneles].x - 0.12, Y.techo + 0.5, CASAS[FICHA.paneles].z], vista: { az: 12, el: 40, tam: 2.2, mira: [CASAS[FICHA.paneles].x, 1.0, CASAS[FICHA.paneles].z + 0.2] } },
    { id: 'diablito', ancla: enMedio(diablitoPlanta(CASAS[FICHA.diablito])), vista: { az: 22, el: 18, tam: 2.2, mira: [enMedio(diablitoPlanta(CASAS[FICHA.diablito]))[0], 0.85, -0.7] } },
    { id: 'arbol', ancla: [X.arbol, 1.85, ZP + 0.3], vista: { az: 200, el: 20, tam: 2.4, mira: [X.arbol + 0.3, 1.2, ZP] } },
];

/** Lo que la escena necesita para dibujarse en este momento. */
export function pose({ modo = 'dia', planta = null, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, planta, ...resto });
    const paneles = modo === 'voltaje' ? conPanel(L.paneles) : conPanel(0.3);
    const diablitos = modo === 'perdidas' ? conDiablito(L.diablitos) : new Set();
    const abierto = modo === 'falla' && L.estado === 'abierto';
    const enFalla = modo === 'falla' && (L.estado === 'falla' || L.estado === 'sigue');
    const cargaRel = clamp01(Math.abs(L.P) / TRAFO.kVA);
    const vuelve = L.P < 0; // la calle le regresa energía al transformador
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    if (!abierto) {
        flujos.mt = 0.15 + 0.85 * cargaRel;
        flujos.b1 = flujos.b2 = vuelve ? 0 : 0.15 + 0.85 * cargaRel;
        flujos.r1 = flujos.r2 = vuelve ? 0.15 + 0.85 * cargaRel : 0;
        for (const c of CASAS) {
            const genera = paneles.has(c.i) && modo === 'voltaje' && panelKW(L.hora) > casaKW(L.hora, L.consumo);
            flujos[`a${c.i}`] = genera ? 0 : 0.3 + 0.7 * clamp01(casaKW(L.hora, L.consumo) / 1.2);
            flujos[`g${c.i}`] = genera ? 0.4 : 0;
        }
        // con la rama en los cables, la corriente de la falla corre del transformador a la rama, y la de media tensión sube
        if (enFalla) {
            flujos.mt = 1;
            flujos.b2 = 0;
            flujos[lineaFalla(L.d)] = 1;
        }
    }
    // la luz de las casas: de noche se ven sus ventanas; baja con el voltaje y se apaga si el fusible cayó
    const luz = abierto ? 0 : clamp01((L.fin - 0.85) / 0.15);
    const cam = camara || { mira: [0, 0.8, 0], az: 18, el: 26, d: 34 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos,
        paneles, diablitos, abierto, enFalla, luz, uso: L.uso,
        xRama: modo === 'falla' ? xRama(L.d) : xRama(DEF.d),
        rama: modo === 'falla' && L.t !== null ? 1 : 0,
        activo: { energia: 1, falla: enFalla ? 1 : 0, calor: clamp01((L.uso - 0.8) / 0.6), sol: clamp01(panelKW(L.hora) / 2) },
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'dia', camara: { mira: [0, 0.8, 0], az: lerp(10, 26, t / 12), el: 26, d: 34 } });
}
export function posicionCamara({ mira, az, el, d }) {
    return [mira[0] + d * Math.cos(el) * Math.sin(az), mira[1] + d * Math.sin(el), mira[2] + d * Math.cos(el) * Math.cos(az)];
}

// ------------------------------------------------------------------ revisiones
const dentro = (p, c, h = 0.06) => p[0] >= c[0] - h && p[0] <= c[1] + h && p[1] >= c[2] - h && p[1] <= c[3] + h && p[2] >= c[4] - h && p[2] <= c[5] + h;
/** Cada punta de cada cable debe tocar un equipo: un poste, el transformador o una casa. Devuelve las que quedan al aire. */
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
        if (REMATE.has(`${L.id} (${nombre})`)) continue;
        if (!Object.values(EQUIPOS).some(c => dentro(p, c))) sueltas.push(`${L.id} (${nombre})`);
    }
    return sueltas;
}
/** Revisión de cifras contra lo publicado. */
export function revisar() {
    const p = [];
    const entre = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    entre(KVA_MEDIO, 36, 37.5, 'kVA promedio de un transformador de CFE Distribución');
    entre(SERVICIOS_MEDIO, 29, 30.5, 'servicios por transformador, en promedio');
    entre(PERDIDAS.ingresada - PERDIDAS.entregada, PERDIDAS.total - 0.002, PERDIDAS.total + 0.002, 'las pérdidas son lo que entra menos lo que se entrega');
    entre(Object.values(PERDIDAS.tramos).reduce((s, x) => s + x, 0), 12.3, 12.4, 'las técnicas por tramo suman 12.35 TWh');
    entre((Object.values(PERDIDAS.tramos).reduce((s, x) => s + x, 0) / PERDIDAS.ingresada) * 100, PERDIDAS.tecnicas - 0.1, PERDIDAS.tecnicas + 0.1, 'y son 4.55 % de lo que entra');
    entre(diaKWh(CALLE.consumo) * 365, CALLE.consumo - 2, CALLE.consumo + 2, 'el día de una casa suma su consumo del año');
    entre(plenaCarga(), 4.9, 4.95, 'a plena carga, 4.92 A en 7,620 V (S&C)');
    entre(TRAFO.primarioLL / Math.sqrt(3), TRAFO.primario - 2, TRAFO.primario + 2, '7,620 V es una fase de 13.2 kV');
    // un día normal: el transformador no pasa de su capacidad y la última casa no baja más de 3 %
    const D = dia({ casas: CALLE.casas, consumo: CALLE.consumo });
    entre(D.maxUso, 0.3, 0.9, 'en un día normal, el transformador va abajo de su capacidad');
    entre(1 - D.minFin, 0.01, CRITERIO.caidaBT, 'en un día normal, la última casa baja menos de 3 %');
    entre(D.horaPico, 18, 22, 'la punta, en la noche');
    // con aire acondicionado y muchas casas, se pasa
    entre(dia({ casas: 60, consumo: 5000 }).maxUso, 1, 10, 'con 60 casas y mucho consumo, el transformador se pasa');
    entre(1 - dia({ casas: 60, consumo: 5000 }).minFin, CRITERIO.caidaBT, 0.3, 'y la última casa baja más de 3 %');
    // paneles: a mediodía la calle le regresa energía y el voltaje sube
    const sol = calle({ hora: 13, paneles: 1 });
    entre(sol.P, -200, -1, 'a mediodía, con paneles en todas las casas, la calle regresa energía');
    entre(sol.fin, 1.01, 1.3, 'y el voltaje de la última casa sube');
    entre(calle({ hora: 13, paneles: 1 }).fin, calle({ hora: 13, paneles: 0.3 }).fin + 0.005, 2, 'más paneles, más sube');
    entre(panelKW(3), 0, 0, 'de noche no hay sol');
    // la falla y el fusible
    entre(falla({ d: 0 }).Ib, 5000, 8000, 'una falla junto al transformador, en 240 V');
    entre(falla({ d: CALLE.largo }).Ib, 800, falla({ d: 0 }).Ib / 3, 'al final de la calle, mucha menos');
    entre(funde(falla({ d: 5 }).Ip), 0, 0.1, 'cerca, el fusible se funde casi de inmediato');
    entre(funde(falla({ d: CALLE.largo }).Ip), 0.5, 10, 'lejos, tarda segundos');
    entre(funde(plenaCarga()), Infinity, Infinity, 'con la carga normal, no se funde');
    entre(funde(falla({ d: CALLE.largo }).Ip, 20), 10, Infinity, 'un fusible muy grande ya no ve a tiempo la falla lejana');
    entre(secuencia({ d: CALLE.largo, fusible: 20 }).cae ? 1 : 0, 0, 0, 'y no cae en los 10 s que se esperan');
    // pérdidas de un día en la calle, comparadas con lo nacional
    const P0 = perdidas({ diablitos: 0 });
    entre(P0.pctTecnicas * 100, 1, 6, 'pérdidas técnicas de la calle, de cada 100 que entran');
    entre(P0.nucleo / P0.tecnicas, 0.2, 0.9, 'el núcleo del transformador pierde aunque no haya carga');
    entre(perdidas({ diablitos: 0.1 }).pctNoTecnicas * 100, 8, 11, 'con 3 de 30 casas colgadas, cerca de lo nacional (8.64 %)');
    return p;
}
