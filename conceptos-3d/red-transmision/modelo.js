// El modelo de la red de transmisión: puro, sin three.js ni DOM. Lo leen la escena, el tablero, las gráficas y las pruebas, así que una cifra
// sale de un solo lugar. Tiene las medidas de la línea de 400 kV Minatitlán Dos – Temascal Dos, de la CFE en Veracruz (tesis del Tecnológico
// de Ciudad Madero, 2019): 225 km, 659 torres, dos cables Bluejay por fase. Lo que no viene en las fuentes está marcado como «de ejemplo».
//
// Cuatro formas de verla: llevar la energía lejos (voltaje, corriente y pérdidas), el cable que se calienta y se cuelga (balance de calor y
// flecha), qué tan lejos se puede (voltaje al final, ángulo y límites) y un rayo y un incendio (aisladores, tierras y la salida de las líneas).
import { D2R, clamp01, lerp } from '../planta-comun/ayudas.js';

const RAIZ3 = Math.sqrt(3);
const W60 = 2 * Math.PI * 60;
const EPS0 = 8.854e-12;
const G = 9.80665;

// ------------------------------------------------------------------ la línea (tesis TecNM, 2019; GRTOR-CFE, 2015)
export const LINEA = { nombre: 'Minatitlán Dos – Temascal Dos', clave: 'A3360', kV: 400, km: 225, torres: 659, desde: 'Minatitlán Dos', hasta: 'Temascal Dos', estado: 'Veracruz' };
/** Claro medio: 225 km entre 658 claros. */
export const CLARO = (LINEA.km * 1000) / (LINEA.torres - 1);
/** Torre de un circuito con las fases en horizontal (tipo Dm+2): fases a 0, 12.5 y 25 m, a 26.2 m de altura; hilos de guarda a 34.88 m. */
export const TORRE = { fases: [0, 12.5, 25], altura: 26.2, guardas: [3.85, 21.6], alturaGuarda: 34.88, haz: 2, separacion: 0.45, cadena: 4 };
/** Bluejay, ACSR de 1113 kcmil 45/7 (catálogo Prysmian; áreas de Southwire). masa kg/m, rotura kN, resistencias Ω/km, áreas mm². */
export const BLUEJAY = { kcmil: 1113, hilos: '45/7', D: 0.032, masa: 1.872, rotura: (13533 * G) / 1000, Rcd20: 0.0505, Rca75: 0.0649, ampacidad: 1081, aluminio: 0.8745 * 645.16, acero: (0.935 - 0.8745) * 645.16, gmr: 0.042 * 0.3048 };
/** Con qué se calcula la ampacidad del catálogo: sol y viento de 0.61 m/s, aire a 25 °C, cable a 75 °C, 1,033.3 W/m², ε = α = 0.5, al nivel del mar. */
export const CATALOGO = { Ta: 25, v: 0.61, sol: 1033.3, eps: 0.5, abs: 0.5, Tc: 75 };
/** Aluminio y acero, para el módulo y la dilatación del cable por la proporción de cada uno (como pide la tesis de Aibar, 2000). GPa y 1/°C. */
export const MATERIAL = { Ea: 69, Es: 200, aa: 23e-6, as: 11.5e-6 };
/** Tensión de trabajo: 22 % de la ruptura en condición normal (tesis de Aibar, 2000), aquí a 25 °C. Diseño de la flecha a 50 °C sin viento. */
export const TENSE = { trabajo: 0.22, ref: 25, diseno: 50 };
/** Aisladores de 400 kV: aguantan 1,480 kV pico de un rayo (especificación CFE 52210-47, de 0 a 1,500 m). */
export const AISLADOR = { aguanta: 1480 };
/** Resistencia al pie de la torre: la CFE pide 10 Ω como máximo (especificación CFE 00J00-52). */
export const PIE = { maximo: 10 };
/**
 * Voltaje en el aislador cuando un rayo pega en el hilo de guarda: V = I × (a + b × R). Ajustado para dar los 1.61 MV de la simulación de la
 * tesis con 45 kA en una torre de unos 9 Ω: de ejemplo.
 */
export const RAYO = { a: 25, b: 1.2, tesis: { kA: 45, R: 9.2, kV: 1610 } };
/** Recierre monopolar: abre solo la fase con falla y la vuelve a cerrar. Tiempo muerto de ejemplo. */
export const RECIERRE = { muerto: 1, abre: 0.05 };
/** El 28 de diciembre de 2020 (CENACE y CFE). */
export const EVENTO2020 = { primera: '14:27:30', segunda: '14:28:39', entre: 69, flujo: 900, carga: 8696, demanda: 31789, fMax: 61.82, fMin: 58.9, km: 19, viento: 70, tramo: 1 };
/** Reactor en derivación al final de cada línea, MVAr a 400 kV: de ejemplo. */
export const REACTOR = { mvar: 100 };

export const DEF = { P: 900, kV: 400, Ta: 25, v: 0.61, sol: true, km: LINEA.km, reactor: false, abierta: false, kA: 45, R: 9.2 };
export const LIMITES = { P: [0, 3000], Ta: [0, 45], km: [50, 600], kA: [10, 150], R: [1, 60] };
export const VOLTAJES = [400, 230, 115];
export const VIENTOS = [{ v: 0.61, texto: 'Viento suave' }, { v: 2, texto: 'Viento fuerte' }, { v: 0.2, texto: 'Casi sin viento' }];

// ------------------------------------------------------------------ el calor del cable (IEEE 738, en unidades del SI)
/** Resistencia en CA de un cable, Ω/km, con la temperatura: pasa por los dos datos del catálogo. */
export const ALFA_R = (BLUEJAY.Rcd20 / BLUEJAY.Rca75 - 1) / (20 - 75);
export const resistencia = T => BLUEJAY.Rca75 * (1 + ALFA_R * (T - 75));
function aireA(Tf, alt = 0) {
    const mu = (1.458e-6 * (Tf + 273) ** 1.5) / (Tf + 383.4);
    const rho = (1.293 - 1.525e-4 * alt + 6.379e-9 * alt * alt) / (1 + 0.00367 * Tf);
    const k = 2.424e-2 + 7.477e-5 * Tf - 4.407e-9 * Tf * Tf;
    return { mu, rho, k };
}
/** Calor que entra y que sale, W por metro de cable. */
export function balance(Tc, { Ta = DEF.Ta, v = DEF.v, sol = DEF.sol, eps = CATALOGO.eps, abs = CATALOGO.abs } = {}) {
    const D = BLUEJAY.D;
    const dT = Math.max(0, Tc - Ta);
    const { mu, rho, k } = aireA((Tc + Ta) / 2);
    const Re = (D * rho * Math.max(v, 0)) / mu;
    const forzada = Math.max((1.01 + 1.35 * Re ** 0.52) * k * dT, 0.754 * Re ** 0.6 * k * dT);
    const natural = 3.645 * Math.sqrt(rho) * D ** 0.75 * dT ** 1.25;
    const conveccion = Math.max(forzada, natural);
    const radiacion = 17.8 * D * eps * (((Tc + 273) / 100) ** 4 - ((Ta + 273) / 100) ** 4);
    const solar = sol ? abs * CATALOGO.sol * D : 0;
    return { conveccion, radiacion, solar };
}
/** Corriente por cable que lo deja a Tc grados. */
export function corrienteA(Tc, cond = {}) {
    const b = balance(Tc, cond);
    const q = b.conveccion + b.radiacion - b.solar;
    return q > 0 ? Math.sqrt(q / (resistencia(Tc) / 1000)) : 0;
}
/** Temperatura de un cable con I amperes, en equilibrio: donde lo que sale (viento y radiación) iguala lo que entra (corriente y sol). */
export function temperaturaCon(I, cond = {}) {
    const Ta = cond.Ta ?? DEF.Ta;
    const sobra = T => { const q = balance(T, cond); return q.conveccion + q.radiacion - q.solar - (I * I * resistencia(T)) / 1000; };
    let [a, b] = [Ta, 400];
    for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (sobra(m) < 0) a = m; else b = m; }
    return (a + b) / 2;
}
/** Los cuatro calores con la corriente I, para el diagrama y las barras. */
export function caloresCon(I, cond = {}) {
    const Tc = temperaturaCon(I, cond);
    const b = balance(Tc, cond);
    return { Tc, joule: (I * I * resistencia(Tc)) / 1000, ...b };
}

// ------------------------------------------------------------------ la flecha (ecuación de cambio de estado, parabólica)
/** Rigidez EA del cable, N, y su dilatación, por la proporción de aluminio y acero. */
export const EA = (MATERIAL.Ea * BLUEJAY.aluminio + MATERIAL.Es * BLUEJAY.acero) * 1e3;
export const ALFA = (MATERIAL.aa * MATERIAL.Ea * BLUEJAY.aluminio + MATERIAL.as * MATERIAL.Es * BLUEJAY.acero) / (MATERIAL.Ea * BLUEJAY.aluminio + MATERIAL.Es * BLUEJAY.acero);
const PESO = BLUEJAY.masa * G; // N/m
export const H_REF = TENSE.trabajo * BLUEJAY.rotura * 1000; // N
const flechaCon = (H, L = CLARO) => (PESO * L * L) / (8 * H);
/** Tensión horizontal, N, a la temperatura T del cable. */
export function tensionA(T, L = CLARO) {
    const k = (PESO * PESO * L * L) / 24;
    const f = H => (H - H_REF) / EA + ALFA * (T - TENSE.ref) - k * (1 / (H * H) - 1 / (H_REF * H_REF));
    let [a, b] = [500, H_REF * 4];
    for (let i = 0; i < 70; i++) { const m = (a + b) / 2; if (f(m) < 0) a = m; else b = m; }
    return (a + b) / 2;
}
const cacheFlecha = new Map();
/** Flecha, m, de un claro medio a la temperatura T del cable. */
export function flechaA(T, L = CLARO) {
    const k = `${Math.round(T * 4)}|${Math.round(L)}`;
    if (!cacheFlecha.has(k)) cacheFlecha.set(k, flechaCon(tensionA(Math.round(T * 4) / 4, L), L));
    return cacheFlecha.get(k);
}
/** Cuánto queda entre el cable y el suelo a media distancia, en un terreno plano. */
export const libreA = T => TORRE.altura - flechaA(T);

// ------------------------------------------------------------------ las constantes de la línea (de su geometría)
const GMD = Math.cbrt(Math.abs(TORRE.fases[1] - TORRE.fases[0]) * Math.abs(TORRE.fases[2] - TORRE.fases[1]) * Math.abs(TORRE.fases[2] - TORRE.fases[0]));
const GMR_HAZ = Math.sqrt(BLUEJAY.gmr * TORRE.separacion);
const R_HAZ = Math.sqrt((BLUEJAY.D / 2) * TORRE.separacion);
/** Inductancia, H/km, y capacitancia, F/km, por fase. */
export const L_KM = 2e-7 * Math.log(GMD / GMR_HAZ) * 1000;
export const C_KM = ((2 * Math.PI * EPS0) / Math.log(GMD / R_HAZ)) * 1000;
export const X_KM = W60 * L_KM;
export const B_KM = W60 * C_KM;
/** Impedancia característica sin pérdidas, Ω, y potencia natural (SIL), MW. */
export const ZC = Math.sqrt(L_KM / C_KM);
export const SIL = LINEA.kV ** 2 / ZC;
/** Ángulo eléctrico de la línea por km: una onda de 60 Hz mide unos 5,000 km. */
export const BETA = W60 * Math.sqrt(L_KM * C_KM);

// números complejos, lo justo
const cx = (re, im = 0) => ({ re, im });
const suma = (a, b) => cx(a.re + b.re, a.im + b.im);
const resta = (a, b) => cx(a.re - b.re, a.im - b.im);
const por = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const entre = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const conj = a => cx(a.re, -a.im);
const modulo = a => Math.hypot(a.re, a.im);
const raiz = a => { const r = Math.sqrt(modulo(a)); const t = Math.atan2(a.im, a.re) / 2; return cx(r * Math.cos(t), r * Math.sin(t)); };
const cosh = a => cx(Math.cosh(a.re) * Math.cos(a.im), Math.sinh(a.re) * Math.sin(a.im));
const sinh = a => cx(Math.sinh(a.re) * Math.cos(a.im), Math.cosh(a.re) * Math.sin(a.im));

/** Parámetros ABCD de la línea larga, con lineas en paralelo y la resistencia a la temperatura T. */
export function abcd({ km = LINEA.km, lineas = 1, T = 50 } = {}) {
    const z = cx(resistencia(T) / TORRE.haz, X_KM);
    const y = cx(0, B_KM);
    const zc = raiz(entre(z, y));
    const gl = por(raiz(por(z, y)), cx(km));
    const A = cosh(gl);
    const B = por(zc, sinh(gl));
    const C = entre(sinh(gl), zc);
    return { A, B: por(B, cx(1 / lineas)), C: por(C, cx(lineas)), zc };
}
const VN = LINEA.kV / RAIZ3; // kV por fase
const polar = (r, grados) => cx(r * Math.cos(grados * D2R), r * Math.sin(grados * D2R));
/** Lo que llega con un ángulo d entre las dos puntas, las dos sostenidas a 400 kV. MVA y kA. */
function conAngulo(d, Q) {
    const vs = cx(VN);
    const vr = polar(VN, -d);
    const ir = entre(resta(vs, por(Q.A, vr)), Q.B);
    const sr = por(vr, conj(ir));
    const is = suma(por(Q.C, vr), por(Q.A, ir));
    const ss = por(vs, conj(is));
    return { Pr: sr.re * 3, Qr: sr.im * 3, Ps: ss.re * 3, Qs: ss.im * 3, Is: modulo(is), Ir: modulo(ir), vr, ir };
}
const cacheEnlace = new Map();
/**
 * Lo que pasa si las dos puntas sostienen su voltaje (en la red las sostienen las centrales y los equipos de las subestaciones) y llegan
 * P MW. La potencia sale del ángulo entre las dos puntas. Qr: reactiva que la línea entrega al final (si es negativa, el final se la tiene que
 * dar); Qs: la que pide al inicio. ok es falso si la línea no puede llevar tanto.
 */
export function enlace({ P = DEF.P, km = LINEA.km, lineas = 2, T = 50 } = {}) {
    const clave = [Math.round(P), Math.round(km), lineas, Math.round(T)].join('|');
    if (cacheEnlace.has(clave)) return cacheEnlace.get(clave);
    const Q = abcd({ km, lineas, T });
    let pico = 0;
    let dPico = 0;
    for (let d = 0; d <= 170; d += 1) { const p = conAngulo(d, Q).Pr; if (p > pico) { pico = p; dPico = d; } }
    let r;
    if (P > pico) r = { ok: false, delta: dPico, ...conAngulo(dPico, Q), max: pico };
    else {
        let [a, b] = [0, dPico];
        for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (conAngulo(m, Q).Pr < P) a = m; else b = m; }
        const d = (a + b) / 2;
        r = { ok: true, delta: d, ...conAngulo(d, Q), max: pico };
    }
    r.perdida = r.Ps - r.Pr;
    r.I = (r.Is * 1000) / lineas; // A por fase en cada línea, al inicio
    r.Q = Q;
    cacheEnlace.set(clave, r);
    return r;
}
/** Voltaje en la punta abierta, de cada 1, al energizar la línea desde un solo lado: el efecto Ferranti. Con reactor, su corriente lo baja. */
export function vacio({ km = LINEA.km, reactor = false, T = 50 } = {}) {
    const { A, B } = abcd({ km, lineas: 1, T });
    const y = reactor ? cx(0, -REACTOR.mvar / LINEA.kV ** 2) : cx(0); // siemens del reactor, por fase
    return 1 / modulo(suma(A, por(B, y)));
}
/** El voltaje a lo largo de la línea, de cada 1: n puntos del inicio (0) al final (km). abierta: energizada desde un solo lado. */
export function perfil({ P = DEF.P, km = LINEA.km, lineas = 2, abierta = false, reactor = false, n = 24 } = {}) {
    const z = cx(resistencia(50) / TORRE.haz, X_KM);
    const yl = cx(0, B_KM);
    const zc = raiz(entre(z, yl));
    const g = raiz(por(z, yl));
    let vr;
    let ir;
    if (abierta) {
        const v = vacio({ km, reactor }) * VN;
        vr = cx(v);
        ir = reactor ? por(vr, cx(0, -REACTOR.mvar / LINEA.kV ** 2)) : cx(0);
    } else {
        const e = enlace({ P, km, lineas });
        vr = e.vr;
        ir = por(e.ir, cx(1 / lineas));
    }
    const pts = [];
    for (let i = 0; i <= n; i++) {
        const x = (km * i) / n; // km desde el inicio
        const gx = por(g, cx(km - x));
        const v = suma(por(cosh(gx), vr), por(por(zc, sinh(gx)), ir));
        pts.push({ km: x, v: modulo(v) / VN });
    }
    return pts;
}

// ------------------------------------------------------------------ llevar la energía lejos
export const amperes = (MW, kV) => (MW * 1000) / (RAIZ3 * kV);
/** Por las dos líneas van P MW, mitad y mitad, con los mismos cables a cualquier voltaje. Pérdidas con la resistencia a la temperatura del cable. */
export function lejos({ P = DEF.P, kV = DEF.kV, km = LINEA.km, lineas = 2 } = {}) {
    const I = amperes(P / lineas, kV); // A por fase en cada línea
    const Ic = I / TORRE.haz;
    const Tc = temperaturaCon(Ic, {});
    const perdida = (lineas * 3 * I * I * (resistencia(Tc) / TORRE.haz) * km) / 1e6;
    return { P, kV, km, I, Ic, Tc, perdida: Math.min(perdida, P), llega: Math.max(0, P - perdida), pct: P > 0 ? Math.min(1, perdida / P) : 0, cabe: Ic <= BLUEJAY.ampacidad };
}
/** Lo más que aguantan los cables de una línea sin pasar de 75 °C con el clima del catálogo, MW. */
export const TERMICO = (RAIZ3 * LINEA.kV * TORRE.haz * BLUEJAY.ampacidad) / 1000;

// ------------------------------------------------------------------ qué tan lejos
/** Ángulo con que se deja margen para que una falla no saque de paso a las centrales: de ejemplo, como se suele usar. */
export const ANGULO = 30;
/** Lo que manda en cada distancia: el calor de los cables o la estabilidad (el ángulo entre las dos puntas, no más de 30°). */
const cacheLimites = new Map();
export function limites({ km = LINEA.km, lineas = 2 } = {}) {
    const clave = `${Math.round(km)}|${lineas}`;
    if (cacheLimites.has(clave)) return cacheLimites.get(clave);
    const termico = TERMICO * lineas;
    const estabilidad = conAngulo(ANGULO, abcd({ km, lineas })).Pr;
    const manda = Math.min(termico, estabilidad);
    const r = { km, termico, estabilidad, manda, cual: manda === termico ? 'termico' : 'estabilidad', sil: SIL * lineas };
    cacheLimites.set(clave, r);
    return r;
}

// ------------------------------------------------------------------ rayo e incendio
export const voltajeAislador = (kA, R) => kA * (RAYO.a + RAYO.b * R);
export const corrienteCritica = R => AISLADOR.aguanta / (RAYO.a + RAYO.b * R);
/** Un rayo en el hilo de guarda. Tiempos en segundos de verdad; la escena lo pasa en cámara lenta. */
export function secuenciaRayo({ kA = DEF.kA, R = DEF.R } = {}) {
    const V = voltajeAislador(kA, R);
    const salta = V > AISLADOR.aguanta;
    const tramos = [{ t0: 0, t1: 0.04, estado: 'golpe' }];
    if (salta) {
        tramos.push({ t0: 0.04, t1: 0.04 + RECIERRE.abre, estado: 'arco' });
        const t = 0.04 + RECIERRE.abre;
        tramos.push({ t0: t, t1: t + RECIERRE.muerto, estado: 'monopolar' });
        tramos.push({ t0: t + RECIERRE.muerto, t1: 1e9, estado: 'normal' });
    } else tramos.push({ t0: 0.04, t1: 1e9, estado: 'nada' });
    return { V, salta, critica: corrienteCritica(R), tramos, fin: salta ? 0.04 + RECIERRE.abre + RECIERRE.muerto : 0.04 };
}
/**
 * El incendio bajo las dos líneas, como el 28 de diciembre de 2020: la primera línea falla, su recierre monopolar no sirve porque el fuego
 * sigue, y 69 s después falla la segunda. Tiempos en segundos de verdad, desde que el fuego llega a la línea.
 */
export const LLEGA = 5;
export function secuenciaIncendio() {
    const a = LLEGA;
    const b = a + RECIERRE.abre;
    const c = b + RECIERRE.muerto;
    const d = c + RECIERRE.abre;
    const e = a + EVENTO2020.entre;
    const f = e + RECIERRE.abre;
    const tramos = [
        { t0: 0, t1: a, estado: 'fuego', abiertas: 0 },
        { t0: a, t1: b, estado: 'arco1', abiertas: 0 },
        { t0: b, t1: c, estado: 'monopolar1', abiertas: 0 },
        { t0: c, t1: d, estado: 'recierre1', abiertas: 0 },
        { t0: d, t1: e, estado: 'una', abiertas: 1 },
        { t0: e, t1: f, estado: 'arco2', abiertas: 1 },
        { t0: f, t1: 1e9, estado: 'separadas', abiertas: 2 },
    ];
    return { tramos, fin: f };
}
export const enTramo = (S, t) => S.tramos.find(x => t >= x.t0 && t < x.t1) ?? S.tramos.at(-1);
/** Qué tan rápido corre el reloj del incendio: muy lento en los arcos, que duran milésimas; normal en lo demás; deprisa en la espera de 69 s. */
export function rapidezIncendio(t) {
    const arcos = secuenciaIncendio().tramos.filter(x => x.estado.startsWith('arco') || x.estado.startsWith('recierre'));
    if (arcos.some(x => t >= x.t0 - 0.01 && t < x.t1 + 0.01)) return 0.05;
    return t > LLEGA + 3 && t < LLEGA + EVENTO2020.entre - 2 ? 10 : 1;
}
/** Y el del rayo: muy lento en el golpe y el arco, a la mitad mientras la fase está abierta. */
export const rapidezRayo = t => (t < 0.1 ? 0.05 : 0.5);

// ------------------------------------------------------------------ el tiempo de la escena
export const estadoPlanta = () => ({ t: 0, rayo: null, fuego: null });
/** Un paso del tiempo. m: { rayo, incendio }. El rayo y los arcos van en cámara lenta. */
export function pasoPlanta(s, m, dt) {
    const n = { ...s };
    n.t += dt;
    if (m.rayo) n.rayo = 0;
    else if (n.rayo !== null) { const r = n.rayo + dt * rapidezRayo(n.rayo); n.rayo = r > 2.2 ? null : r; }
    if (!m.incendio) n.fuego = null;
    else if (n.fuego === null) n.fuego = 0;
    else n.fuego += dt * rapidezIncendio(n.fuego);
    return n;
}

// ------------------------------------------------------------------ las lecturas
/** Lo que mide la línea. modo: 'lejos' | 'calor' | 'limite' | 'falla'. */
export function calcular({ modo = 'lejos', planta = null, P = DEF.P, kV = DEF.kV, Ta = DEF.Ta, v = DEF.v, sol = DEF.sol, km = DEF.km, reactor = DEF.reactor, abierta = DEF.abierta, kA = DEF.kA, R = DEF.R } = {}) {
    const L = { modo, P };
    const cond = { Ta, v, sol };
    if (modo === 'lejos') {
        Object.assign(L, lejos({ P, kV }));
        L.flechas = [flechaA(L.Tc), flechaA(L.Tc)];
        L.temps = [L.Tc, L.Tc];
        L.flujo = [1, 1];
    } else if (modo === 'calor') {
        const I = amperes(P / 2, LINEA.kV);
        const Ic = I / TORRE.haz;
        const c = caloresCon(Ic, cond);
        Object.assign(L, { Ta, v, sol, I, Ic, ...c, flecha: flechaA(c.Tc), diseno: flechaA(TENSE.diseno), libre: libreA(c.Tc), libreDiseno: libreA(TENSE.diseno), maxIc: corrienteA(75, cond) });
        L.baja = L.flecha - L.diseno;
        L.flechas = [L.flecha, L.flecha];
        L.temps = [c.Tc, c.Tc];
        L.flujo = [1, 1];
    } else if (modo === 'limite') {
        const e = enlace({ P, km });
        const lim = limites({ km });
        const fin = abierta ? vacio({ km, reactor }) : 1;
        // lo que la red del final tiene que absorber (+) o dar (−); el reactor absorbe por su cuenta
        const absorbe = e.Qr - (reactor ? REACTOR.mvar * 2 : 0);
        Object.assign(L, { km, reactor, abierta, ...e, lim, sil: SIL * 2, fin, sinReactor: vacio({ km }), conReactor: vacio({ km, reactor: true }), absorbe, carga: B_KM * km * LINEA.kV ** 2 * 2, perfil: perfil({ P: abierta ? 0 : P, km, abierta, reactor }) });
        if (abierta) L.P = 0;
        const I = abierta ? 0 : e.I;
        const Tc = temperaturaCon(I / TORRE.haz, {});
        L.flechas = [flechaA(Tc), flechaA(Tc)];
        L.temps = [Tc, Tc];
        L.flujo = [1, 1];
    } else {
        const S = secuenciaRayo({ kA, R });
        const tR = planta && planta.rayo !== null ? planta.rayo : null;
        const F = secuenciaIncendio();
        const tF = planta && planta.fuego !== null ? planta.fuego : null;
        const tramoF = tF === null ? null : enTramo(F, tF);
        const abiertas = tramoF ? tramoF.abiertas : 0;
        const enUna = enlace({ P: EVENTO2020.flujo, lineas: 1 });
        const enDos = enlace({ P: EVENTO2020.flujo, lineas: 2 });
        Object.assign(L, { kA, R, S, tR, tramoR: tR === null ? null : enTramo(S, tR), F, tF, tramoF, abiertas, enUna, enDos });
        L.P = EVENTO2020.flujo;
        L.Ilinea = abiertas === 0 ? enDos.I : abiertas === 1 ? enUna.I : 0;
        L.delta = abiertas === 0 ? enDos.delta : abiertas === 1 ? enUna.delta : null;
        const Tc = temperaturaCon((abiertas === 0 ? enDos.I : enUna.I) / TORRE.haz, {});
        L.flechas = [flechaA(Tc), flechaA(Tc)];
        L.temps = [Tc, Tc];
        L.flujo = abiertas === 0 ? [0.5, 0.5] : abiertas === 1 ? [0, 1] : [0, 0];
    }
    return L;
}

// ------------------------------------------------------------------ acomodo (no está a escala: los claros van muy recortados)
/** Escala vertical: 1 unidad = 20 m. */
export const ESC = 1 / 20;
export const BLOQUE = { x: [-8.4, 8.4], z: [-3, 3], y: [-0.5, 0] };
export const ZL = [1.05, -1.05]; // las dos líneas: la 1 adelante
/** Las fases y los hilos de guarda, de lado (z), respecto al eje de la línea. */
export const FASES = TORRE.fases.map(x => (x - TORRE.fases[1]) * ESC);
export const GUARDAS = TORRE.guardas.map(x => (x - TORRE.fases[1]) * ESC);
export const SEP = 0.075; // separación de los dos cables de una fase: muy aumentada
export const Y = { fase: TORRE.altura * ESC, cruceta: (TORRE.altura + TORRE.cadena) * ESC, guarda: TORRE.alturaGuarda * ESC, marco: 0.95, barra: 0.62, contacto: 0.5 };
export const X = { marcoA: -6.55, marcoB: 6.55, torres: [-5.05, -2.5, 0.05, 2.6, 5.05], rio: -1.22, fuego: 3.85, intA: -7.15, intB: 7.15, barraA: -7.75, barraB: 7.75, reactor: 7.2, casetaA: -7.7, casetaB: 7.7 };
/** Altura del suelo: lomas suaves, y el valle del río que cruza entre la segunda y la tercera torre. */
export function terreno(x, z) {
    const valle = -0.2 * Math.exp(-(((x - X.rio) / 0.62) ** 2));
    const lomas = 0.05 * Math.sin(x * 0.9 + 0.6) + 0.04 * Math.sin(x * 2.1 + z * 0.8) + 0.03 * Math.cos(z * 1.4);
    const plano = Math.abs(x) > 6.2 ? clamp01((Math.abs(x) - 6.2) / 0.5) : 0; // las subestaciones van en terreno plano
    return lerp(valle + lomas, 0, plano);
}
/** Largo de las cadenas acostadas de los marcos y de las torres de remate: el cable se sujeta en su punta, del lado del claro. */
export const CADENA_REMATE = 0.26;
/** Donde está la punta de las dos boquillas de los interruptores de tanque, respecto a su centro. */
export const BORNA = { dx: 0.09 + Math.sin(0.22) * 0.16, y: 0.4 + Math.cos(0.22) * 0.16 };
/**
 * Dónde se sujetan los cables de una línea (zl: su eje). En los marcos de las subestaciones y en las torres de remate, en la punta de su
 * cadena acostada (ancho: a cuánto del eje, hacia el claro); en las torres de suspensión, en el yugo bajo su cadena.
 */
export function apoyos(zl) {
    const n = X.torres.length - 1;
    return [
        { x: X.marcoA, y: Y.marco - 0.04, marco: true, ancho: CADENA_REMATE },
        ...X.torres.map((x, k) => (k === 0 || k === n ? { x, y: terreno(x, zl) + Y.cruceta - 0.035, remate: true, ancho: CADENA_REMATE } : { x, y: terreno(x, zl) + Y.fase, ancho: 0 })),
        { x: X.marcoB, y: Y.marco - 0.04, marco: true, ancho: CADENA_REMATE },
    ];
}
/** Altura del cable en la fracción u de un claro: parábola con la flecha f (m de verdad), entre dos apoyos. */
export const alturaEn = (a, b, f, u) => lerp(a.y, b.y, u) - 4 * f * ESC * 0.92 * u * (1 - u); // el claro está recortado: un poco menos de caída
/** Un cable de un claro: n + 1 puntos [x, y], de la punta de la cadena de un apoyo a la del otro. */
export function claro(a, b, f, n = 18) {
    const [xa, xb] = [a.x + a.ancho, b.x - b.ancho];
    const pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push([lerp(xa, xb, u), alturaEn(a, b, f, u)]); }
    return pts;
}
/** El puente de una torre de remate: pasa la corriente de la punta de una cadena a la de la otra, por debajo de la cruceta. */
export function puenteRemate(a, n = 10) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push([a.x + lerp(-a.ancho, a.ancho, u), a.y - 0.19 * Math.sin(u * Math.PI)]); }
    return pts;
}
/** El punto más bajo de un claro sobre el suelo, en unidades de la escena, para revisar que no toque. */
export function holgura(f) {
    let peor = Infinity;
    for (const z of ZL) for (const dz of FASES) {
        const A = apoyos(z);
        for (let i = 1; i < A.length; i++) for (const [x, y] of claro(A[i - 1], A[i], f, 24)) peor = Math.min(peor, y - terreno(x, z + dz));
    }
    return peor;
}

export const FLUIDOS = {
    alta: { nombre: 'Energía en 400 kV', color: '#ffb000' },
    falla: { nombre: 'Corriente de una falla', color: '#e0302a' },
    rayo: { nombre: 'El rayo', color: '#7d5cff' },
};

/** Dónde se conecta cada cable: la punta de cada cadena y cada yugo (por línea, fase y apoyo), las boquillas de los interruptores, las
 *  barras y la boquilla de los reactores. Coinciden con la geometría de planta.js. */
export const BORNES = (() => {
    const b = {};
    ZL.forEach((zl, i) => {
        const A = apoyos(zl);
        FASES.forEach((dz, j) => A.forEach((a, k) => {
            const z = zl + dz;
            if (!a.ancho) b[`l${i + 1}-${k}-${j}`] = [a.x, a.y, z];
            if (a.ancho && k > 0) b[`l${i + 1}-${k}-${j}-llega`] = [a.x - a.ancho, a.y, z];
            if (a.ancho && k < A.length - 1) b[`l${i + 1}-${k}-${j}-sale`] = [a.x + a.ancho, a.y, z];
        }));
        for (const [lado, xi, xb, sg] of [['A', X.intA, X.barraA, -1], ['B', X.intB, X.barraB, 1]]) {
            FASES.forEach((dz, j) => {
                b[`int${lado}${i + 1}-${j}-linea`] = [xi - sg * BORNA.dx, BORNA.y, zl + dz];
                b[`int${lado}${i + 1}-${j}-barra`] = [xi + sg * BORNA.dx, BORNA.y, zl + dz];
                b[`barra${lado}${i + 1}-${j}`] = [xb + [-0.12, 0, 0.12][j], Y.barra, zl + dz];
            });
        }
        b[`reactor${i + 1}`] = [X.reactor, 0.68, zl > 0 ? 2.1 : -2.1];
    });
    return b;
})();
/** La fase de afuera de cada línea, del lado del reactor, y la punta de su cadena en el marco de llegada. */
export const faseReactor = i => (ZL[i] > 0 ? 2 : 0);
/** Lo que se ve dentro de cada subestación (sus cables no tienen tubo: corre por dentro de los equipos): en la de salida, de la barra al
 *  interruptor y a la línea; en la de llegada, de la línea al interruptor y a la barra. Por la fase de en medio. */
const subLinea = (lado, z, i) => {
    const k = lado === 'A' ? 0 : X.torres.length + 1;
    const marco = BORNES[`l${i + 1}-${k}-1-${lado === 'A' ? 'sale' : 'llega'}`];
    const camino = [marco, BORNES[`int${lado}${i + 1}-1-linea`], BORNES[`int${lado}${i + 1}-1-barra`], BORNES[`barra${lado}${i + 1}-1`]];
    return { id: `s${lado}${i + 1}`, grupo: `l${i + 1}`, parte: lado === 'A' ? 'salida' : 'llegada', fluido: 'alta', r: 0.02, cable: true, oculto: true, puntos: lado === 'A' ? camino.reverse() : camino };
};
export const LINEAS = [...ZL.flatMap((z, i) => [subLinea('A', z, i), subLinea('B', z, i)])];
export const REMATE = new Set();
/**
 * Los cables que se dibujan, en la forma de LINEAS, para revisarlos con cablesSueltos(): cada fase de cada línea, de punta de cadena en
 * punta de cadena (las torres de remate tienen dos, unidas por su puente); los puentes de las subestaciones y los de los reactores.
 */
export const DIBUJADAS = ZL.flatMap((zl, i) => {
    const A = apoyos(zl);
    const ultimo = A.length - 1;
    const fases = FASES.map((dz, j) => ({ id: `l${i + 1}f${j}`, cable: true, oculto: true, puntos: A.flatMap((a, k) => (a.ancho ? [k > 0 && `llega`, k < ultimo && `sale`].filter(Boolean).map(t => BORNES[`l${i + 1}-${k}-${j}-${t}`]) : [BORNES[`l${i + 1}-${k}-${j}`]])) }));
    const puentes = ['A', 'B'].flatMap(lado => FASES.flatMap((dz, j) => {
        const marco = BORNES[`l${i + 1}-${lado === 'A' ? 0 : ultimo}-${j}-${lado === 'A' ? 'sale' : 'llega'}`];
        return [{ id: `p${lado}${i + 1}${j}a`, cable: true, puntos: [marco, BORNES[`int${lado}${i + 1}-${j}-linea`]] }, { id: `p${lado}${i + 1}${j}b`, cable: true, puntos: [BORNES[`int${lado}${i + 1}-${j}-barra`], BORNES[`barra${lado}${i + 1}-${j}`]] }];
    }));
    const reactor = { id: `reactor${i + 1}`, cable: true, puntos: [BORNES[`l${i + 1}-${ultimo}-${faseReactor(i)}-llega`], BORNES[`reactor${i + 1}`]] };
    return [...fases, ...puentes, reactor];
});
const caja = (x, y, z, w, h, d) => [x - w / 2, x + w / 2, y, y + h, z - d / 2, z + d / 2];
export const EQUIPOS = {
    ...Object.fromEntries(ZL.flatMap((z, i) => [[`marcoA${i}`, caja(X.marcoA, 0, z, 2 * CADENA_REMATE + 0.06, Y.marco + 0.06, 1.5)], [`marcoB${i}`, caja(X.marcoB, 0, z, 2 * CADENA_REMATE + 0.06, Y.marco + 0.06, 1.5)]])),
    barraA: caja(X.barraA, Y.barra - 0.06, 0, 0.2, 0.12, 4.4),
    barraB: caja(X.barraB, Y.barra - 0.06, 0, 0.2, 0.12, 4.4),
    ...Object.fromEntries(X.torres.flatMap(x => ZL.map((z, i) => [`torre${x}_${i}`, caja(x, terreno(x, z), z, 2 * CADENA_REMATE + 0.06, Y.guarda + 0.05, 1.5)]))),
};

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
const T1 = X.torres[1];
const yT = x => terreno(x, ZL[0]);
export const PARTES = [
    { id: 'salida', ancla: [X.marcoA - 0.3, 1.25, ZL[0]], vista: { az: -40, el: 24, tam: 3.4, mira: [-7.3, 0.5, -0.2] } },
    { id: 'remate', ancla: [X.torres[0], yT(X.torres[0]) + Y.guarda + 0.15, ZL[0]], vista: { az: -24, el: 16, tam: 2.6, mira: [X.torres[0], yT(X.torres[0]) + 0.9, ZL[0]] } },
    { id: 'suspension', ancla: [T1, yT(T1) + Y.guarda + 0.15, ZL[0] + 0.3], vista: { az: 18, el: 12, tam: 2.6, mira: [T1, yT(T1) + 0.9, ZL[0]] } },
    { id: 'haz', ancla: [T1 + 0.7, yT(T1) + Y.fase - 0.05, ZL[0] + FASES[2]], vista: { az: 30, el: 14, tam: 1.4, mira: [T1 + 0.5, yT(T1) + Y.fase - 0.05, ZL[0] + FASES[2]] } },
    { id: 'separadores', ancla: [T1 + 1.25, yT(T1) + Y.fase - 0.32, ZL[0] + FASES[2]], vista: { az: 8, el: 10, tam: 1.4, mira: [T1 + 1.25, yT(T1) + Y.fase - 0.35, ZL[0] + FASES[2]] } },
    { id: 'amortiguadores', ancla: [T1 - 0.28, yT(T1) + Y.fase - 0.1, ZL[0] + FASES[2]], vista: { az: -24, el: 10, tam: 1.1, mira: [T1 - 0.25, yT(T1) + Y.fase - 0.1, ZL[0] + FASES[2]] } },
    { id: 'aisladores', ancla: [T1, yT(T1) + Y.cruceta, ZL[0] + FASES[2] + 0.12], vista: { az: -35, el: 16, tam: 0.95, mira: [T1, yT(T1) + (Y.fase + Y.cruceta) / 2, ZL[0] + FASES[2]] } },
    { id: 'guarda', ancla: [T1 + 0.9, yT(T1) + Y.guarda - 0.04, ZL[0] + GUARDAS[1]], vista: { az: -20, el: 18, tam: 2, mira: [T1 + 0.5, yT(T1) + Y.guarda - 0.2, ZL[0]] } },
    { id: 'tierras', ancla: [T1 + 0.35, yT(T1) + 0.05, ZL[0] + 0.45], vista: { az: 26, el: 40, tam: 1.6, mira: [T1, yT(T1) - 0.05, ZL[0]] } },
    { id: 'flecha', ancla: [(X.torres[2] + X.torres[3]) / 2, 0.75, ZL[0] + FASES[2]], vista: { az: 4, el: 6, tam: 3.4, mira: [(X.torres[2] + X.torres[3]) / 2, 0.75, ZL[0]] } },
    { id: 'derecho', ancla: [X.torres[2] - 1, 0.2, 2.15], vista: { az: 28, el: 44, tam: 5.6, mira: [X.torres[2] - 0.8, 0.2, 0] } },
    { id: 'segunda', ancla: [X.torres[3], terreno(X.torres[3], ZL[1]) + Y.guarda + 0.15, ZL[1]], vista: { az: 22, el: 32, tam: 4.4, mira: [X.fuego - 0.8, 0.5, 0] } },
    { id: 'reactor', ancla: [X.reactor, 0.9, -2.1], vista: { az: 140, el: 22, tam: 2.2, mira: [X.reactor, 0.35, -2.1] } },
    { id: 'llegada', ancla: [X.marcoB + 0.3, 1.25, ZL[1]], vista: { az: 40, el: 24, tam: 3.4, mira: [7.3, 0.5, 0.2] } },
];

/** Lo que la escena necesita para dibujarse en este momento. */
export function pose({ modo = 'lejos', planta = null, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, planta, ...resto });
    const cerradas = [[1, 1, 1], [1, 1, 1]]; // por fase, en cada línea
    let rayo = 0;
    let arcoA = 0;
    let fuego = 0;
    const arcos = [0, 0];
    let falla = [0, 0];
    if (modo === 'falla') {
        const tr = L.tramoR;
        if (tr) {
            rayo = tr.estado === 'golpe' ? 1 : 0;
            arcoA = tr.estado === 'arco' ? 1 : 0;
            if (tr.estado === 'monopolar') cerradas[0][0] = 0;
        }
        const tf = L.tramoF;
        if (tf) {
            fuego = clamp01(L.tF / 3) * (tf.estado === 'separadas' ? clamp01(1 - (L.tF - tf.t0) / 40) * 0.7 + 0.3 : 1);
            if (tf.estado === 'arco1' || tf.estado === 'recierre1') arcos[0] = 1;
            if (tf.estado === 'monopolar1') cerradas[0][0] = 0;
            if (tf.abiertas >= 1) cerradas[0] = [0, 0, 0];
            if (tf.estado === 'arco2') arcos[1] = 1;
            if (tf.abiertas >= 2) cerradas[1] = [0, 0, 0];
            falla = arcos.slice();
        }
        if (arcoA) falla = [1, falla[1]];
    }
    const carga = clamp01((modo === 'lejos' ? L.P : modo === 'calor' ? L.P : modo === 'limite' ? L.P : EVENTO2020.flujo) / 2400);
    const flujos = {};
    for (const l of LINEAS) {
        const i = Number(l.id.at(-1)) - 1;
        flujos[l.id] = cerradas[i].some(Boolean) ? (0.15 + 0.85 * carga) * (L.flujo[i] > 0 ? 1 : 0) : 0;
    }
    const abiertaB = modo === 'limite' && L.abierta;
    const lineas = [0, 1].map(i => ({ flujo: cerradas[i].every(x => !x) ? 0 : abiertaB ? 0.06 : (0.15 + 0.85 * carga) * (L.flujo[i] > 0 ? 1 : 0.05), flecha: L.flechas[i], temp: L.temps[i], fases: cerradas[i], falla: falla[i] }));
    const cam = camara || { mira: [0, 0.5, 0], az: 18, el: 26, d: 36 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, lineas,
        rayo, arcoA, fuego, arcos, reactor: modo === 'limite' ? (L.reactor ? 1 : 0) : 1, extremoB: modo === 'limite' && L.abierta ? 0 : 1,
        activo: { energia: 1, rayo, arco: Math.max(arcoA, ...arcos), fuego, calor: clamp01(((L.temps[0] ?? 25) - 40) / 60) },
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'lejos', camara: { mira: [0, 0.5, 0], az: lerp(10, 26, t / 12), el: 26, d: 36 } });
}
export function posicionCamara({ mira, az, el, d }) {
    return [mira[0] + d * Math.cos(el) * Math.sin(az), mira[1] + d * Math.sin(el), mira[2] + d * Math.cos(el) * Math.cos(az)];
}

// ------------------------------------------------------------------ revisiones
const dentro = (p, c, h = 0.06) => p[0] >= c[0] - h && p[0] <= c[1] + h && p[1] >= c[2] - h && p[1] <= c[3] + h && p[2] >= c[4] - h && p[2] <= c[5] + h;
/** Cada punta de cada cable debe tocar un equipo. Los cables de los claros van de apoyo en apoyo. Devuelve las que quedan al aire. */
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) if (!Object.values(EQUIPOS).some(c => dentro(p, c))) sueltas.push(`${L.id} (${nombre})`);
    for (const [i, z] of ZL.entries()) for (const dz of FASES) for (const a of apoyos(z)) for (const x of [a.x - a.ancho, a.x + a.ancho]) if (!Object.values(EQUIPOS).some(c => dentro([x, a.y, z + dz], c))) sueltas.push(`claro de la línea ${i + 1} en x = ${x}`);
    return sueltas;
}
/** Revisión de cifras contra lo publicado. */
export function revisar() {
    const p = [];
    const lejosDe = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // la línea y el cable
    lejosDe(CLARO, 340, 345, 'claro medio: 225 km entre 658 claros');
    lejosDe(resistencia(20), BLUEJAY.Rcd20 - 1e-9, BLUEJAY.Rcd20 + 1e-9, 'la resistencia a 20 °C es la del catálogo');
    lejosDe(corrienteA(CATALOGO.Tc, { Ta: CATALOGO.Ta, v: CATALOGO.v, sol: true }), BLUEJAY.ampacidad - 15, BLUEJAY.ampacidad + 15, 'ampacidad con las condiciones del catálogo (1,081 A)');
    lejosDe(temperaturaCon(BLUEJAY.ampacidad, { Ta: 25, v: 0.61, sol: true }), 73, 77, 'con 1,081 A el cable queda a 75 °C');
    lejosDe(temperaturaCon(800, { v: 2 }), 0, temperaturaCon(800, { v: 0.2 }) - 5, 'con más viento se enfría');
    lejosDe(temperaturaCon(800, { sol: true }), temperaturaCon(800, { sol: false }) + 1, 300, 'el sol lo calienta');
    lejosDe(ALFA, 20e-6, 22e-6, 'dilatación del cable, por la proporción de aluminio y acero');
    lejosDe(flechaA(TENSE.ref), 8.5, 10, 'flecha de un claro medio a 25 °C, con 22 % de la ruptura');
    lejosDe(flechaA(75) - flechaA(25), 1, 4, 'de 25 a 75 °C el cable baja');
    lejosDe(libreA(100), 8, TORRE.altura, 'aun a 100 °C el cable queda lejos del suelo plano');
    lejosDe(holgura(flechaA(110)), 0.15, 5, 'en la escena el cable nunca toca el suelo');
    // la electricidad
    lejosDe(ZC, 280, 340, 'impedancia característica con dos cables por fase, Ω');
    lejosDe(SIL, 470, 570, 'potencia natural de una línea, MW');
    lejosDe((2 * Math.PI) / BETA, 4800, 5200, 'una onda de 60 Hz mide unos 5,000 km');
    lejosDe(vacio({ km: LINEA.km }), 1.03, 1.06, 'energizada desde un lado, la punta abierta sube (Ferranti)');
    lejosDe(vacio({ km: 600 }), vacio({ km: 225 }) + 0.1, 3, 'más larga, más sube');
    lejosDe(vacio({ km: LINEA.km, reactor: true }), 0.98, vacio({ km: LINEA.km }) - 0.01, 'el reactor lo baja');
    const mitad = P => perfil({ P, lineas: 1 })[12].v;
    lejosDe(mitad(SIL * 0.98), 0.985, 1.015, 'con la potencia natural, el voltaje es parejo a lo largo');
    lejosDe(mitad(150), 1.005, 1.1, 'con poca carga, a la mitad sube');
    lejosDe(mitad(SIL * 1.7), 0.85, 0.995, 'con mucha carga, a la mitad baja');
    lejosDe(enlace({ P: 150, lineas: 1 }).Qr, 1, 1000, 'con poca carga, la línea da reactiva al final');
    lejosDe(enlace({ P: SIL * 1.7, lineas: 1 }).Qr, -1000, -1, 'con mucha, la pide');
    lejosDe(lejos({ P: 1000, kV: 400, lineas: 1 }).pct, 0.02, 0.06, 'pérdidas de 1,000 MW por una línea de 225 km a 400 kV');
    lejosDe(enlace({ P: 1000, lineas: 1 }).perdida / 1000, 0.02, 0.06, 'y con la cuenta completa de la línea, lo mismo');
    lejosDe(lejos({ P: 600, kV: 230 }).perdida / lejos({ P: 600, kV: 400 }).perdida, 2.8, 3.6, 'con 230 kV se pierde unas (400/230)² = 3 veces más');
    lejosDe(TERMICO, 1450, 1550, 'lo que aguantan los cables de una línea a 75 °C, MW');
    const L225 = limites({ km: LINEA.km, lineas: 1 });
    lejosDe(L225.estabilidad, 750, 1050, 'una línea de 225 km: estabilidad con 30°');
    lejosDe(L225.estabilidad / SIL, 1.4, 2.2, 'en 225 km se puede de 1.4 a 2.2 veces la potencia natural (curva de cargabilidad)');
    lejosDe(limites({ km: 60, lineas: 1 }).manda, TERMICO - 1, TERMICO + 1, 'una línea corta la limita el calor');
    lejosDe(limites({ km: 600, lineas: 1 }).manda, 0, SIL * 1.3, 'una muy larga, cerca de su potencia natural');
    // rayo e incendio
    lejosDe(voltajeAislador(RAYO.tesis.kA, RAYO.tesis.R), RAYO.tesis.kV * 0.97, RAYO.tesis.kV * 1.03, 'rayo de 45 kA: 1.61 MV en el aislador (tesis)');
    lejosDe(corrienteCritica(PIE.maximo), 30, 50, 'con 10 Ω, un rayo de 30 a 50 kA ya rompe el aislamiento');
    lejosDe(corrienteCritica(1), corrienteCritica(PIE.maximo) + 10, 100, 'con buena tierra aguanta más');
    lejosDe(enlace({ P: EVENTO2020.flujo, lineas: 1 }).I / enlace({ P: EVENTO2020.flujo, lineas: 2 }).I, 1.8, 2.2, 'si sale una línea, la otra lleva el doble');
    lejosDe(enlace({ P: EVENTO2020.flujo, lineas: 1 }).I, 0, TORRE.haz * BLUEJAY.ampacidad, 'con 900 MW una sola línea todavía aguanta el calor');
    lejosDe(enlace({ P: EVENTO2020.flujo, lineas: 1 }).delta, enlace({ P: EVENTO2020.flujo, lineas: 2 }).delta * 1.7, 60, 'con una sola, el ángulo casi se duplica');
    const F = secuenciaIncendio();
    lejosDe(F.tramos.find(x => x.estado === 'arco2').t0 - F.tramos.find(x => x.estado === 'arco1').t0, 69, 69, 'la segunda línea sale 69 s después (14:27:30 y 14:28:39)');
    lejosDe((EVENTO2020.carga / EVENTO2020.demanda) * 100, 26, 28, 'la carga que salió, de cada 100 de la demanda');
    return p;
}
