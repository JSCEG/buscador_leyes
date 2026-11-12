// La central nuclear como cifras puras: el ciclo del vapor, la reacción en cadena, el calor que queda al apagar, el ciclo del
// combustible, el acomodo de la central y qué corre por cada tubo. Sin three.js ni DOM. El tablero, las gráficas y las partículas
// leen calcular(), así no pueden contradecirse.
//
// Central de ejemplo con las cifras de UNA unidad de Laguna Verde (Veracruz): un reactor de agua en ebullición BWR-5 con contención
// Mark II. No es el plano de la central real ni un simulador de operación:
// - 2,317 MW de calor, 444 ensambles (Trivedi et al., 2012); 109 barras de control (Chávez-Estrada y Aguilar-Arévalo, 2015).
// - 810 MW en el generador (CFE, 2025) y 777 netos (WNA, 2026). Recarga cada 18 meses: 132 de 444 ensambles (CFE, 2025).
// - Vapor: ~285 °C (WNA, Wikipedia). 12 a 15 % del agua se vuelve vapor en cada pasada (WNA).
// - Ciclo: se le quita a la turbina lo que sale de la regla de la entalpía. El rendimiento ETA_TURB está ajustado para dar los
//   810 MW de la unidad; todo lo demás (vapor, condensador, agua de mar) sale de ese balance y se compara en revisar().
// - Reacción: cinética de un punto con un grupo de neutrones retardados y salto inmediato. La respuesta de los vacíos y del
//   combustible son coeficientes de ejemplo elegidos para que se comporte como un BWR: frena sola al subir la potencia, y las
//   bombas de recirculación mueven la potencia sin tocar las barras (NRC). Es para ver la tendencia, no para operar nada.
//
// Tabla de saturación del agua: IAPWS-IF97, calculada con CoolProp 8. Cada cifra se compara en revisar() con lo publicado.
import { apoyo, cablesSueltos as revisarCables, enCruceta, lineaAerea } from '../planta-comun/lineas.js';

export const DURACION = 12;
export const FPS = 60;
const D2R = Math.PI / 180;
const clamp01 = x => Math.min(1, Math.max(0, x));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;

// ------------------------------------------------------------------ tabla: T °C, P bar, hf, hg kJ/kg, sf, sg kJ/kg·K
export const AGUA = {
    nombre: 'agua', cpVapor: 2,
    filas: [[20, 0.0234, 83.9, 2537.4, 0.2965, 8.666], [30, 0.0425, 125.7, 2555.5, 0.4368, 8.452], [40, 0.0738, 167.5, 2573.5, 0.5724, 8.2555], [45, 0.0959, 188.4, 2582.4, 0.6386, 8.1633], [50, 0.1235, 209.3, 2591.3, 0.7038, 8.0748], [60, 0.1995, 251.2, 2608.8, 0.8313, 7.9081], [70, 0.312, 293.1, 2626.1, 0.9551, 7.754], [80, 0.4741, 335, 2643, 1.0756, 7.6111], [90, 0.7018, 377, 2659.5, 1.1929, 7.4781], [100, 1.0142, 419.2, 2675.6, 1.3072, 7.3541], [110, 1.4338, 461.4, 2691.1, 1.4188, 7.2381], [120, 1.9867, 503.8, 2705.9, 1.5279, 7.1291], [130, 2.7028, 546.4, 2720.1, 1.6346, 7.0264], [140, 3.6154, 589.2, 2733.4, 1.7392, 6.9293], [150, 4.7616, 632.2, 2745.9, 1.8418, 6.8371], [160, 6.1823, 675.5, 2757.4, 1.9426, 6.7491], [170, 7.9219, 719.1, 2767.9, 2.0417, 6.665], [180, 10.0281, 763.1, 2777.2, 2.1392, 6.584], [190, 12.5524, 807.4, 2785.3, 2.2355, 6.5059], [200, 15.5493, 852.3, 2792, 2.3305, 6.4302], [210, 19.0767, 897.6, 2797.3, 2.4245, 6.3563], [220, 23.1959, 943.6, 2800.9, 2.5177, 6.284], [230, 27.9709, 990.2, 2802.9, 2.6101, 6.2128], [240, 33.4693, 1037.6, 2803, 2.702, 6.1423], [250, 39.7617, 1085.8, 2800.9, 2.7935, 6.0721], [260, 46.9226, 1135, 2796.6, 2.8849, 6.0016], [270, 55.0299, 1185.3, 2789.7, 2.9765, 5.9304], [280, 64.1658, 1236.9, 2779.9, 3.0685, 5.8579], [290, 74.4178, 1290, 2766.7, 3.1612, 5.7834], [300, 85.879, 1345, 2749.6, 3.2552, 5.7059], [310, 98.6505, 1402.2, 2727.9, 3.351, 5.6244], [320, 112.8429, 1462.2, 2700.6, 3.4494, 5.5372], [330, 128.5805, 1525.9, 2666, 3.5518, 5.4422], [340, 146.0068, 1594.5, 2621.8, 3.6601, 5.3356], [350, 165.2942, 1670.9, 2563.6, 3.7784, 5.211], [360, 186.6601, 1761.7, 2481.5, 3.9167, 5.0536], [370, 210.4356, 1890.7, 2334.5, 4.1112, 4.8012]],
    critico: [373.95, 220.64, 2084.3, 2084.3, 4.407, 4.407],
};
/** Propiedades de saturación a T °C, con interpolación entre filas (la presión, en logaritmo). */
export function sat(tabla, T) {
    const f = tabla.filas;
    const t = Math.min(f.at(-1)[0], Math.max(f[0][0], T));
    let i = 0;
    while (i < f.length - 2 && f[i + 1][0] < t) i++;
    const [a, b] = [f[i], f[i + 1]];
    const k = (t - a[0]) / (b[0] - a[0]);
    return { T: t, P: Math.exp(lerp(Math.log(a[1]), Math.log(b[1]), k)), hf: lerp(a[2], b[2], k), hg: lerp(a[3], b[3], k), sf: lerp(a[4], b[4], k), sg: lerp(a[5], b[5], k) };
}
/** Temperatura de saturación a P bar. */
export function tSat(tabla, P) {
    const f = tabla.filas;
    if (P <= f[0][1]) return f[0][0];
    if (P >= f.at(-1)[1]) return f.at(-1)[0];
    let i = 0;
    while (f[i + 1][1] < P) i++;
    return lerp(f[i][0], f[i + 1][0], (Math.log(P) - Math.log(f[i][1])) / (Math.log(f[i + 1][1]) - Math.log(f[i][1])));
}

// ------------------------------------------------------------------ la central de ejemplo
export const UNIDAD = { termica: 2317, bruta: 810, neta: 777, ensambles: 444, barras: 109, recambio: 132, mesesCiclo: 18, tEnsamble: 0.187 };
export const P_DOMO = 70; // bar en la vasija: hierve cerca de 286 °C
export const P_TURBINA = 66; // lo que llega a la turbina tras las líneas y válvulas
export const T_AGUA = 216; // °C del agua que regresa a la vasija, ya calentada con vapor que se saca de la turbina
export const T_MAR = 27; // °C del Golfo de México, de ejemplo
export const DT_MAR = 8; // cuánto se calienta el mar al cruzar el condensador
const TTD = 4; // lo que le falta al vapor para igualar al agua que sale de los tubos
export const ETA_TURB = 0.8243; // ajustado para que la unidad dé 810 MW
export const ETA_GEN = 0.985;
const AUX = 1 - UNIDAD.neta / UNIDAD.bruta; // lo que consume la propia central
const Y_TRABAJO = 0.45; // el vapor que se saca para calentar el agua alcanza a dejar esta parte de su trabajo
const H_EXTRACCION = 2550; // kJ/kg, promedio del vapor que se saca de la turbina
export const MAR_CP = 4.0; // kJ/kg·K del agua de mar
export const MAR_RHO = 1025; // kg/m³
export const FLUJO_NUCLEO = 8800; // kg/s por el núcleo a 100 %: unas 7 veces el vapor, como en WNA y Wikipedia
export const VACIO_0 = 0.4; // parte del núcleo que en promedio es vapor (Wikipedia: ~40 %)
const MJ_POR_KG_U235 = 82e6; // WNA: 82 TJ/kg
export const DEF = { barras: 12, flujo: 100, pPrim: 155, tSale: 325, mes: 0, horaLog: 0 };
export const LIMITES = { barras: [0, 70], flujo: [40, 100], pPrim: [120, 170], tSale: [300, 340], mes: [0, 60] };

/** Lo que el agua pierde en la turbina y a qué calidad sale. */
export function turbina(Tin, Tc) {
    const e = sat(AGUA, Tin);
    const c = sat(AGUA, Tc);
    const hfg = c.hg - c.hf;
    const xs = (e.sg - c.sf) / (c.sg - c.sf);
    const h4s = c.hf + xs * hfg;
    const dhs = e.hg - h4s;
    const h4 = e.hg - ETA_TURB * dhs;
    const x4 = (h4 - c.hf) / hfg;
    return { h3: e.hg, s3: e.sg, h4, h4s, x4, dh: e.hg - h4, s4: c.sf + x4 * (c.sg - c.sf), eta: ETA_TURB };
}
/** El ciclo del vapor con Q MW de calor: vapor, turbina, generador, condensador y agua de mar. */
export function cicloVapor({ Q = UNIDAD.termica, tMar = T_MAR, pVapor = P_DOMO, pTurbina = P_TURBINA, tAgua = T_AGUA } = {}) {
    const dom = sat(AGUA, tSat(AGUA, pVapor));
    const tC = tMar + DT_MAR + TTD;
    const c = sat(AGUA, tC);
    const ag = sat(AGUA, tAgua);
    const mv = (Q * 1000) / (dom.hg - ag.hf);
    const t = turbina(tSat(AGUA, pTurbina), tC);
    // el agua se calienta con vapor que se saca de la turbina: esa parte deja solo un poco de su trabajo
    const y = (ag.hf - c.hf) / (H_EXTRACCION - c.hf);
    const trabajo = 1 - y * (1 - Y_TRABAJO);
    const bruta = (mv * t.dh * trabajo * ETA_GEN) / 1000;
    const neta = bruta * (1 - AUX);
    const Qmar = Math.max(0, Q - bruta);
    const mMar = (Qmar * 1000) / (MAR_CP * DT_MAR);
    return {
        Q, mv, mCond: mv * (1 - y), y, t, bruta, neta, aux: bruta - neta, Qmar, mMar, m3Mar: mMar / MAR_RHO, tC, pC: c.P, tMar, tDescarga: tMar + DT_MAR,
        eficiencia: Q > 0 ? bruta / Q : 0, pVapor, tVapor: dom.T, tAgua,
        reparto: Q > 0 ? { red: neta / Q, propia: (bruta - neta) / Q, mar: Qmar / Q } : { red: 0, propia: 0, mar: 0 },
    };
}
/** Uranio-235 que se parte por día, a Q MW de calor. */
export const u235Dia = Q => (Q * 86400) / MJ_POR_KG_U235;

// ------------------------------------------------------------------ la reacción en cadena
export const NUCLEO = { beta: 0.0066, lambda: 0.08, W: 15, Kv: 12, Kd: 3.1, b0: DEF.barras / 100, tauF: 6, tauV: 3, neutrones: 2.45, fraccionResidual: 0.065 };
const curvaBarra = b => -NUCLEO.W * (b - Math.sin(2 * Math.PI * b) / (2 * Math.PI));
/** Reactividad de las barras en dólares, contra el punto de operación; b es la fracción adentro. */
export const rhoBarras = b => curvaBarra(clamp01(b)) - curvaBarra(NUCLEO.b0);
/** Parte del núcleo que es vapor, según la potencia y el flujo. */
export const vacio = (P, F) => (P <= 0 ? 0 : clamp(VACIO_0 * Math.sqrt(P / Math.max(0.05, F)), 0, 0.8));
const rhoRetro = (V, T) => -NUCLEO.Kv * (V - VACIO_0) - NUCLEO.Kd * (T - 1);
/** Potencia de equilibrio: donde lo que suman las barras y lo que frenan el vapor y el calor del combustible da cero. */
export function equilibrio({ barras = NUCLEO.b0, flujo = 1 } = {}) {
    const rho = P => rhoBarras(barras) + rhoRetro(vacio(P, flujo), P);
    if (rho(1e-4) <= 0) return 0;
    let [a, b] = [1e-4, 1.3];
    for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (rho(m) > 0) a = m; else b = m; }
    return (a + b) / 2;
}
/** Estado del reactor a plena potencia. */
export function estadoReactor({ barras = NUCLEO.b0, flujo = 1 } = {}) {
    const P = equilibrio({ barras, flujo });
    return { c: P, P, T: P, V: vacio(P, flujo), b: barras, F: flujo, D: NUCLEO.fraccionResidual * P, t: 0, apagado: false, P0: P, rho: 0 };
}
/**
 * Un paso del tiempo: los neutrones responden al instante a la reactividad y los retardados los sostienen. Función pura.
 * m: { barras (0–1), flujo (0–1), apagado }.
 */
export function pasoReactor(s, m, dt) {
    const pasos = Math.max(1, Math.ceil(dt / 0.04));
    const h = dt / pasos;
    const n = { ...s };
    if (m.apagado && !n.apagado) { n.apagado = true; n.t = 0; n.P0 = n.P; }
    if (!m.apagado) n.apagado = false;
    for (let i = 0; i < pasos; i++) {
        const meta = n.apagado ? 1 : m.barras;
        const vel = n.apagado ? 1 / 3.5 : 0.28; // al apagar entran en segundos
        n.b += clamp(meta - n.b, -vel * h, vel * h);
        n.F += clamp(m.flujo - n.F, -0.25 * h, 0.25 * h);
        n.rho = rhoBarras(n.b) + rhoRetro(n.V, n.T);
        const rho = Math.min(0.85, n.rho);
        n.P = Math.max(0, n.c / (1 - rho));
        n.c += NUCLEO.lambda * (n.P - n.c) * h;
        n.T += ((n.P - n.T) * h) / NUCLEO.tauF;
        n.V += ((vacio(n.P, n.F) - n.V) * h) / NUCLEO.tauV;
        if (n.apagado) { n.t += h; n.D = calorResidual(n.t) * n.P0; }
        else n.D += ((NUCLEO.fraccionResidual * n.P - n.D) * h) / 20;
    }
    return n;
}
/** Calor total del núcleo como parte de la potencia plena: fisiones más lo que sigue soltando el combustible. */
export const calorTotal = s => (1 - NUCLEO.fraccionResidual) * s.P + s.D;

// ------------------------------------------------------------------ el calor que queda al apagar
// Parte de la potencia anterior a cada tiempo, en segundos. Publicado: al apagar 6.5 %, a la hora 1.5 %, al día 0.4 %, a la semana 0.2 %
// (Wikipedia, Decay heat; WNA da también 1.5 % a la hora). Al año, unos 10 kW por tonelada; a los diez años, cerca de 1 (WNA).
export const T_UNO = { s: 1, min: 60, h: 3600, d: 86400, sem: 604800, anio: 31557600 };
const KW_T_PLENA = (UNIDAD.termica * 1000) / (UNIDAD.ensambles * UNIDAD.tEnsamble);
const RESIDUAL = [[1, 0.065], [T_UNO.h, 0.015], [T_UNO.d, 0.004], [T_UNO.sem, 0.002], [T_UNO.anio, 10 / KW_T_PLENA], [10 * T_UNO.anio, 1 / KW_T_PLENA]];
// Una curva suave que pasa exactamente por esos puntos, sin rebotes (interpolación cúbica monótona, en logaritmos).
const RX_LOG = RESIDUAL.map(r => Math.log(r[0]));
const RY_LOG = RESIDUAL.map(r => Math.log(r[1]));
const R_PEND = (() => {
    const d = RX_LOG.slice(0, -1).map((x, i) => (RY_LOG[i + 1] - RY_LOG[i]) / (RX_LOG[i + 1] - x));
    return RX_LOG.map((_, i) => (i === 0 ? d[0] : i === d.length ? d.at(-1) : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i])));
})();
export function calorResidual(s) {
    if (s <= RESIDUAL[0][0]) return RESIDUAL[0][1];
    const x = Math.log(s);
    if (x >= RX_LOG.at(-1)) return Math.exp(RY_LOG.at(-1) + R_PEND.at(-1) * (x - RX_LOG.at(-1)));
    let i = 0;
    while (RX_LOG[i + 1] < x) i++;
    const h = RX_LOG[i + 1] - RX_LOG[i];
    const t = (x - RX_LOG[i]) / h;
    const [t2, t3] = [t * t, t * t * t];
    return Math.exp((2 * t3 - 3 * t2 + 1) * RY_LOG[i] + (t3 - 2 * t2 + t) * h * R_PEND[i] + (-2 * t3 + 3 * t2) * RY_LOG[i + 1] + (t3 - t2) * h * R_PEND[i + 1]);
}
export const kwPorTonelada = s => calorResidual(s) * KW_T_PLENA;
/** Agua que hay que hervir cada hora para llevarse el calor, entrando a 40 °C. */
export function aguaParaEnfriar(Qmw) {
    const a = sat(AGUA, 40);
    const v = sat(AGUA, tSat(AGUA, P_DOMO));
    return ((Qmw * 1000) / (v.hg - a.hf)) * 3.6;
}

// ------------------------------------------------------------------ agua a presión, para comparar
export const AGUA_PRESION = { Q: UNIDAD.termica, dT: 35, dSec: 15, tAgua: 220, perdida: 3, lazos: 2 };
/** Reactor de agua a presión del mismo calor: el agua del reactor no hierve y un segundo circuito hace el vapor. */
export function aguaAPresion({ pPrim = DEF.pPrim, tSale = DEF.tSale } = {}) {
    const { Q, dT, dSec, tAgua, perdida } = AGUA_PRESION;
    const tEntra = tSale - dT;
    const cp = (sat(AGUA, tSale).hf - sat(AGUA, tEntra).hf) / dT;
    const mPrim = (Q * 1000) / (cp * dT);
    const tHierve = tSat(AGUA, pPrim);
    const margen = tHierve - tSale;
    const tSec = tEntra - dSec;
    const pSec = sat(AGUA, tSec).P;
    const ciclo = cicloVapor({ Q, pVapor: pSec, pTurbina: pSec - perdida, tAgua });
    return { pPrim, tSale, tEntra, tHierve, margen, hierve: margen <= 0, mPrim, tSec, pSec, ciclo, cp };
}

// ------------------------------------------------------------------ el ciclo del combustible
const MESES_VIDA = (UNIDAD.mesesCiclo * UNIDAD.ensambles) / UNIDAD.recambio; // cuánto dura un ensamble adentro
export const ENRIQUECIDO = 4; // % de U-235 al entrar. NRC: 3.5 %; WNA: 3.5 a 5 %
const FACTOR_CICLO = 0.95;
/** GWd por tonelada que acumula un ensamble tras tantos meses adentro. */
export const quemado = meses => ((UNIDAD.termica * ((meses * 365.25) / 12) * FACTOR_CICLO) / (UNIDAD.ensambles * UNIDAD.tEnsamble)) / 1000;
export const QUEMADO_FINAL = quemado(MESES_VIDA);
/** Lo que trae un ensamble tras tantos meses, en % del peso. Al salir: 1 % de U-235, 0.6 % de plutonio fisible y 3 % de residuos (WNA). */
export function composicion(meses) {
    const bu = quemado(Math.min(meses, MESES_VIDA));
    const k = Math.log(ENRIQUECIDO / 1) / QUEMADO_FINAL;
    const u235 = ENRIQUECIDO * Math.exp(-k * bu);
    const pu = (0.6 * (1 - Math.exp(-bu / 12))) / (1 - Math.exp(-QUEMADO_FINAL / 12));
    const residuos = (3 * bu) / QUEMADO_FINAL;
    return { bu, u235, pu, residuos, u238: 100 - u235 - pu - residuos - (0.4 * pu) / 0.6 };
}
/** Qué pasa en cada mes: cuándo hay recarga (~30 días de paro) y dónde van las barras. */
export function enElCiclo(mes) {
    const m = clamp(mes, 0, LIMITES.mes[1]);
    const dentro = m % UNIDAD.mesesCiclo;
    const cerca = Math.min(dentro, UNIDAD.mesesCiclo - dentro);
    const recarga = m >= 1 && cerca < 0.5;
    const avance = dentro / UNIDAD.mesesCiclo;
    return { mes: m, ciclo: Math.floor(m / UNIDAD.mesesCiclo) + 1, avance, recarga, barras: lerp(0.3, 0.1, avance), comp: composicion(m), usoAnual: (UNIDAD.recambio * UNIDAD.tEnsamble * 12) / UNIDAD.mesesCiclo };
}
/** Fracción de la vida del ensamble: lo que ya pasó adentro. */
export const MESES_DENTRO = MESES_VIDA;

// ------------------------------------------------------------------ las lecturas
/**
 * Lo que mide la central en cada modo. modo: 'operar' | 'apagar' | 'presion' | 'ciclo'.
 */
export function calcular({ modo = 'operar', reactor = null, tApagado = 1, sinRed = false, pPrim = DEF.pPrim, tSale = DEF.tSale, mes = DEF.mes } = {}) {
    const r = { modo, operar: null, apagar: null, presion: null, ciclo: null };
    if (modo === 'operar') {
        const s = reactor || estadoReactor();
        const q = calorTotal(s);
        const c = cicloVapor({ Q: UNIDAD.termica * q });
        r.operar = { P: s.P, q, barras: s.b, flujo: s.F, vacio: s.V, rho: s.rho, k: 1 + s.rho * NUCLEO.beta, calidad: c.mv / (FLUJO_NUCLEO * Math.max(0.05, s.F)), mNucleo: FLUJO_NUCLEO * s.F, u235: u235Dia(UNIDAD.termica * q), c };
        r.neta = c.neta;
        r.bruta = c.bruta;
    } else if (modo === 'apagar') {
        const pct = calorResidual(tApagado);
        const Q = UNIDAD.termica * pct;
        r.apagar = { t: tApagado, pct, Q, agua: aguaParaEnfriar(Q), sinRed, kwT: kwPorTonelada(tApagado) };
        r.neta = 0;
        r.bruta = 0;
    } else if (modo === 'presion') {
        const p = aguaAPresion({ pPrim, tSale });
        r.presion = p;
        r.neta = p.hierve ? 0 : p.ciclo.neta;
        r.bruta = p.hierve ? 0 : p.ciclo.bruta;
    } else {
        const c = enElCiclo(mes);
        const v = cicloVapor();
        r.ciclo = { ...c, c: v };
        r.neta = c.recarga ? 0 : v.neta;
        r.bruta = c.recarga ? 0 : v.bruta;
    }
    return r;
}
/** Los puntos de un ciclo para el diagrama temperatura y entropía. */
export function puntosCiclo(L) {
    const c = L.operar?.c || L.ciclo?.c || L.presion?.ciclo || cicloVapor();
    const a = sat(AGUA, c.tAgua);
    const d = sat(AGUA, c.tVapor);
    const f = sat(AGUA, c.tC);
    const entra = c.t;
    const puntos = [
        { n: 1, nombre: 'Agua que regresa', T: c.tAgua, s: a.sf, P: c.pVapor, h: a.hf },
        { n: 2, nombre: L.presion ? 'Empieza a hervir' : 'Empieza a hervir en el núcleo', T: c.tVapor, s: d.sf, P: c.pVapor, h: d.hf },
        { n: 3, nombre: 'Vapor a la turbina', T: c.tVapor, s: entra.s3, P: c.pVapor, h: entra.h3 },
        { n: 4, nombre: 'Sale de la turbina', T: c.tC, s: entra.s4, P: c.pC, h: entra.h4 },
        { n: 5, nombre: 'Agua del condensador', T: c.tC, s: f.sf, P: c.pC, h: f.hf },
    ];
    const r = { tabla: AGUA, puntos, ruta: [[f.sf, c.tC], [a.sf, c.tAgua], [d.sf, c.tVapor], [entra.s3, c.tVapor], [entra.s4, c.tC], [f.sf, c.tC]], otra: null };
    if (L.presion) {
        const p = L.presion;
        const sh = sat(AGUA, Math.min(p.tSale, 370));
        const sc = sat(AGUA, p.tEntra);
        r.otra = [[sc.sf, p.tEntra], [sh.sf, p.tSale]];
        r.puntos.push({ n: 6, nombre: 'Primer circuito, caliente', T: p.tSale, s: sh.sf, P: p.pPrim, h: sh.hf });
    }
    return r;
}

// ------------------------------------------------------------------ acomodo de la central (no está a escala)
export const BLOQUE = { x: [-7.2, 7.2], z: [-4.6, 4.2], y: [-1.6, 0] };
export const COSTA_Z = 1.9;
export const MAR_Y = -0.22;
export const RX = { x: -3.4, z: -0.3 };
export const VASIJA = { r: 0.55, y0: 1.2, y1: 3.7, nucleo: [1.72, 2.52], rNucleo: 0.4 };
export const EDIFICIO = { x: [-5.05, -1.75], z: [-1.95, 1.35], h: 5.2 };
export const NAVE = { x: [-1.35, 4.75], z: [-1.55, 1.15], h: 3 };
export const EJE = { y: 1.8, z: -0.2 };
export const FLUIDOS = {
    vapor: { nombre: 'Vapor', color: '#e0457b' },
    agua: { nombre: 'Agua del reactor', color: '#3558e8' },
    mar: { nombre: 'Agua de mar', color: '#16a9d4' },
    marCaliente: { nombre: 'Agua de mar de regreso', color: '#f08a24' },
    primario: { nombre: 'Primer circuito (agua a presión)', color: '#ff5a36' },
    elec: { nombre: 'Electricidad', color: '#ffb000' },
};
// Cada caja: x0, x1, y0, y1, z0, z1. Las pinta planta.js y con ellas se revisa que cada tubo llegue a un equipo.
const [T_Y, T_Z] = [EJE.y, EJE.z];
export const EQUIPOS = {
    vasija: [RX.x - 0.55, RX.x + 0.55, 1.2, 3.7, RX.z - 0.55, RX.z + 0.55],
    alberca: [RX.x - 1.25, RX.x + 1.25, 0.1, 0.95, RX.z - 1.25, RX.z + 1.25],
    bombaA: [RX.x + 0.7, RX.x + 1, 1.08, 1.62, RX.z - 0.15, RX.z + 0.15],
    bombaB: [RX.x - 1, RX.x - 0.7, 1.08, 1.62, RX.z - 0.15, RX.z + 0.15],
    tablero: [-3.75, -3.05, 0.03, 0.68, -1.95, -1.65],
    rcic: [-2.55, -2.15, 0.08, 0.5, -1.45, -1.05],
    rhr: [-2.45, -1.95, 0.08, 0.55, 0.55, 1.05],
    diesel: [-4.7, -2.7, 0, 0.95, -3.1, -2.3],
    tanque: [-1.18, -0.42, 0, 1, -2.98, -2.22],
    hp: [-0.55, 0.45, T_Y - 0.42, T_Y + 0.42, T_Z - 0.42, T_Z + 0.42],
    lp1: [0.75, 1.85, T_Y - 0.62, T_Y + 0.62, T_Z - 0.62, T_Z + 0.62],
    lp2: [2, 3.1, T_Y - 0.62, T_Y + 0.62, T_Z - 0.62, T_Z + 0.62],
    msr: [0.2, 2.9, 1.55, 1.95, 0.52, 0.92],
    generador: [3.3, 4.3, T_Y - 0.42, T_Y + 0.42, T_Z - 0.42, T_Z + 0.42],
    condensador: [0.7, 3.15, 0.12, 1.18, T_Z - 0.62, T_Z + 0.62],
    calentador: [-1.2, 0.35, 0.2, 0.6, 0.52, 0.92],
    bombaAgua: [-1.3, -0.9, 0.04, 0.44, 0, 0.4],
    bombasMar: [1.1, 2.7, 0, 0.75, 1.25, 1.88],
    mar: [-7.2, 7.2, -1.6, -0.2, COSTA_Z, 4.2],
    trafo: [5, 5.75, 0, 1.35, -0.95, 0.35],
    portico: [6, 6.55, 0, 2.6, -0.7, 0.1],
    reductora: [-0.1, 0.7, 0, 1.6, -4.3, -3.55],
    pueblo: [-2.7, -1, 0, 0.9, -4.4, -3.2],
    gv1: [-2.84, -2.4, 1, 3, 0, 0.44],
    gv2: [-2.84, -2.4, 1, 3, -1.04, -0.6],
    vasijaP: [RX.x - 0.42, RX.x + 0.42, 1, 2.75, RX.z - 0.42, RX.z + 0.42],
    bombaP1: [-3, -2.75, 0.85, 1.12, -0.05, 0.2],
    bombaP2: [-3, -2.75, 0.85, 1.12, -0.8, -0.55],
    presurizador: [-3.63, -3.37, 1.6, 2.7, 0.42, 0.68],
};
export const TORRES = [[6.6, -2.6], [4.2, -3.7], [1.6, -3.9]];
export const ALTO_TORRE = 3.3;
const puntasTorre = TORRES.map(([x, z]) => [x, ALTO_TORRE, z]);
/** El transformador y el pórtico de la subestación, la reductora del pueblo y los postes de la RGD: [x, z] y [x, z, alto]. */
export const TRAFO = [5.38, -0.3];
export const PORTICO = [6.3, -0.3];
export const REDUCTORA = [0.3, -3.9];
export const POSTES_RGD = [[-0.55, -3.85, 1], [-1.1, -3.8, 0.72]];
/** El ducto de barras del generador al transformador: sale por un lado del generador, cruza la pared de la nave y baja a la garganta de baja. */
export const DUCTO = { y: EJE.y, z: 0.4, x: [3.8, TRAFO[0]] };
const cruceta = ([x, z]) => [x, ALTO_TORRE * 0.92, z];
const brazo = ([x, z, h]) => [x, h - 0.02, z];
/**
 * Los bornes donde se conecta cada cable: la caja de terminales del generador, la garganta de baja y las boquillas del transformador,
 * los aisladores del pórtico, las crucetas de las torres y de los postes, el marco de la reductora, la casa de los diésel y su tablero.
 * Cada uno coincide con la pieza que dibuja planta.js.
 */
export const BORNES = {
    generador: [DUCTO.x[0], DUCTO.y, 0.27],
    trafoBaja: [DUCTO.x[1], 0.8, DUCTO.z],
    trafoAlta: [TRAFO[0] + 0.12, 1.32, TRAFO[1]],
    columnas: [PORTICO[0], 1.96, PORTICO[1]],
    portico: [PORTICO[0], 2.72, PORTICO[1]],
    ...Object.fromEntries(TORRES.map((t, i) => [`torre${i + 1}`, cruceta(t)])),
    marcoReductora: [REDUCTORA[0], 1.5, REDUCTORA[1]],
    reductoraAlta: [REDUCTORA[0] + 0.05, 0.66, REDUCTORA[1]],
    reductoraBaja: [REDUCTORA[0] - 0.12, 0.58, REDUCTORA[1] + 0.1],
    poste1: brazo(POSTES_RGD[0]),
    poste2: brazo(POSTES_RGD[1]),
    diesel: [-3.4, 0.045, -2.3],
    tablero: [-3.4, 0.045, -1.905],
};
/** Las líneas aéreas, apoyo por apoyo: tres fases que llegan a boquillas, a los aisladores del pórtico, a crucetas y al marco de la reductora. */
export const AEREAS = {
    trafoPortico: [apoyo(BORNES.trafoAlta, [0, 0, 0.38]), apoyo(BORNES.columnas, [0.16, 0, 0]), apoyo(BORNES.portico, [0.16, 0, 0])],
    rnt: [
        apoyo(BORNES.portico, [0.16, 0, 0]),
        ...TORRES.map((_, i) => enCruceta(BORNES[`torre${i + 1}`], i ? BORNES[`torre${i}`] : BORNES.portico, BORNES[`torre${i + 2}`] ?? BORNES.marcoReductora)),
        apoyo(BORNES.marcoReductora, [0, 0, 0.2], 0.08),
        apoyo(BORNES.reductoraAlta, [0, 0, 0.12]),
    ],
    rgd: [apoyo(BORNES.reductoraBaja, [0, 0, 0.08]), ...[BORNES.poste1, BORNES.poste2].map(p => apoyo(p, [0, 0, 0.1], 0.04))],
};
/** Ningún cable sale por la orilla: todos rematan en algo de la figura. */
export const REMATE = new Set();
const TODOS = ['operar', 'apagar', 'presion', 'ciclo'];
const HIERVE = ['operar', 'apagar', 'ciclo'];
const CON_TURBINA = ['operar', 'presion', 'ciclo'];
const DZ = [-0.27, -0.09, 0.09, 0.27];
const espejo = z => 2 * RX.z - z;
const lineaP = (p, f) => p.map(([x, y, z]) => [x, y, f(z)]);
// modos: en cuáles corre. Cada tubo tiene su grupo, y pose() dice cuánto corre por cada grupo.
export const LINEAS = [
    ...DZ.map((d, i) => ({ id: `vaporDentro${i}`, grupo: 'vaporRx', fluido: 'vapor', modos: HIERVE, r: 0.052, puntos: [[-2.9, 3.2, RX.z + d], [-2.3, 3.2, RX.z + d], [-2.1, 2.6, RX.z + d], [-1.75, 2.5, RX.z + d]] })),
    ...DZ.map((d, i) => ({ id: `vaporFuera${i}`, grupo: 'vaporTurbina', fluido: 'vapor', modos: i === 0 || i === 3 ? CON_TURBINA : ['operar', 'ciclo'], r: 0.052, puntos: [[-1.75, 2.5, RX.z + d], [-1.35, 2.4, RX.z + d], [-1, 2.15, RX.z + d], [-0.62, 2.15, RX.z + d], [-0.45, 1.98, T_Z + d * 0.5]] })),
    { id: 'bypass', grupo: 'bypass', fluido: 'vapor', modos: ['apagar'], r: 0.05, puntos: [[-1, 2.15, RX.z + DZ[1]], [-0.95, 1.05, RX.z + DZ[1]], [0.3, 0.8, RX.z + DZ[1]], [0.78, 0.8, T_Z - 0.2]] },
    { id: 'cruce1', grupo: 'vaporTurbina', fluido: 'vapor', modos: CON_TURBINA, r: 0.07, puntos: [[0.05, 2.15, T_Z + 0.25], [0.05, 2.38, 0.3], [0.4, 2.38, 0.72], [0.4, 1.9, 0.72]] },
    { id: 'cruce2', grupo: 'vaporTurbina', fluido: 'vapor', modos: CON_TURBINA, r: 0.07, puntos: [[1.3, 1.93, 0.72], [1.3, 2.62, 0.72], [1.3, 2.62, T_Z], [1.3, 2.38, T_Z]] },
    { id: 'cruce3', grupo: 'vaporTurbina', fluido: 'vapor', modos: CON_TURBINA, r: 0.07, puntos: [[2.55, 1.93, 0.72], [2.55, 2.62, 0.72], [2.55, 2.62, T_Z], [2.55, 2.38, T_Z]] },
    { id: 'extraccion', grupo: 'vaporTurbina', fluido: 'vapor', modos: CON_TURBINA, r: 0.03, puntos: [[1, 1.25, 0.35], [0.6, 0.8, 0.72], [0.2, 0.5, 0.72]] },
    { id: 'escape1', grupo: 'vaporTurbina', fluido: 'vapor', modos: CON_TURBINA, r: 0.11, puntos: [[1.3, 1.24, T_Z], [1.3, 1.02, T_Z]] },
    { id: 'escape2', grupo: 'vaporTurbina', fluido: 'vapor', modos: CON_TURBINA, r: 0.11, puntos: [[2.55, 1.24, T_Z], [2.55, 1.02, T_Z]] },
    { id: 'condensado', grupo: 'agua', fluido: 'agua', modos: TODOS, r: 0.05, puntos: [[0.75, 0.22, T_Z], [0.3, 0.22, T_Z], [0.3, 0.3, 0.72]] },
    { id: 'agua1', grupo: 'agua', fluido: 'agua', modos: TODOS, r: 0.05, puntos: [[-1.15, 0.35, 0.72], [-1.1, 0.3, 0.3]] },
    { id: 'agua2', grupo: 'agua', fluido: 'agua', modos: TODOS, r: 0.05, puntos: [[-1.25, 0.25, 0.2], [-1.75, 0.25, 0.2]] },
    { id: 'agua3', grupo: 'agua', fluido: 'agua', modos: HIERVE, r: 0.05, puntos: [[-1.75, 0.25, 0.2], [-2.2, 0.6, 0.2], [-2.3, 2.85, 0.1], [-2.9, 2.85, -0.1]] },
    ...[1, -1].flatMap((s, i) => [
        { id: `recirc${i}a`, grupo: 'recirc', fluido: 'agua', modos: HIERVE, r: 0.042, puntos: [[RX.x + s * 0.5, 2.05, RX.z], [RX.x + s * 0.85, 2.05, RX.z], [RX.x + s * 0.85, 1.5, RX.z]] },
        { id: `recirc${i}b`, grupo: 'recirc', fluido: 'agua', modos: HIERVE, r: 0.042, puntos: [[RX.x + s * 0.8, 1.2, RX.z], [RX.x + s * 0.56, 1.3, RX.z], [RX.x + s * 0.5, 1.75, RX.z]] },
    ]),
    { id: 'toma', grupo: 'mar', fluido: 'mar', modos: TODOS, r: 0.1, puntos: [[1.45, -0.3, 2.75], [1.45, -0.26, 2.2], [1.45, 0.18, 1.6]] },
    { id: 'marEntra', grupo: 'mar', fluido: 'mar', modos: TODOS, r: 0.09, puntos: [[1.45, 0.2, 1.3], [1.45, 0.2, 0.4]] },
    { id: 'marSale', grupo: 'mar', fluido: 'marCaliente', modos: TODOS, r: 0.09, puntos: [[2.4, 0.2, 0.4], [2.9, 0.2, 1], [3, 0.1, 1.5], [5.9, 0.05, 1.5], [6.15, -0.1, 1.95], [6.3, -0.3, 2.5]] },
    { id: 'rhrMar', grupo: 'rhrMar', fluido: 'mar', modos: ['apagar'], r: 0.04, puntos: [[1.45, 0.2, 1.05], [-1.6, 0.12, 1.05], [-2, 0.25, 0.85]] },
    { id: 'rcicAgua1', grupo: 'rcic', fluido: 'agua', modos: ['apagar'], r: 0.04, puntos: [[-1.15, 0.18, -2.45], [-1.9, 0.18, -1.75], [-2.3, 0.2, -1.3]] },
    { id: 'rcicAgua2', grupo: 'rcic', fluido: 'agua', modos: ['apagar'], r: 0.035, puntos: [[-2.35, 0.45, -1.2], [-2.35, 2.85, -1], [-2.9, 2.85, -0.5]] },
    { id: 'rcicVapor', grupo: 'rcic', fluido: 'vapor', modos: ['apagar'], r: 0.03, puntos: [[-2.3, 3.2, RX.z + DZ[0]], [-2.25, 3.2, -1.2], [-2.25, 0.45, -1.25]] },
    { id: 'rcicEscape', grupo: 'rcic', fluido: 'vapor', modos: ['apagar'], r: 0.03, puntos: [[-2.45, 0.2, -1.1], [-2.6, 0.4, -0.9]] },
    { id: 'rhrAgua', grupo: 'rhr', fluido: 'agua', modos: ['apagar'], r: 0.04, puntos: [[-2.6, 0.35, 0.45], [-2.3, 0.3, 0.75]] },
    { id: 'rhrRegreso', grupo: 'rhr', fluido: 'agua', modos: ['apagar'], r: 0.035, puntos: [[-2.2, 0.5, 0.75], [-2.2, 2.2, 0.5], [-2.9, 2.2, 0]] },
    // la electricidad: del generador al transformador por un ducto de barras (por dentro, sin tubo)
    { id: 'gen', grupo: 'generador', fluido: 'elec', modos: CON_TURBINA, r: 0.05, oculto: true, puntos: [BORNES.generador, [DUCTO.x[0], DUCTO.y, DUCTO.z], [DUCTO.x[1], DUCTO.y, DUCTO.z], BORNES.trafoBaja] },
    // las líneas aéreas no llevan tubo: planta.js dibuja sus tres conductores; aquí va la fase de en medio, por donde corre la electricidad
    ...Object.entries(AEREAS).map(([id, apoyos]) => lineaAerea(id, apoyos, { grupo: 'red', modos: CON_TURBINA })),
    // de los diésel al tablero de emergencia, que está sobre el piso: un cable delgado por el piso que entra por su espalda
    { id: 'dieselElec', grupo: 'diesel', fluido: 'elec', modos: ['apagar'], r: 0.016, cable: true, puntos: [BORNES.diesel, BORNES.tablero] },
    // agua a presión: el circuito cerrado del reactor y el segundo circuito
    { id: 'calienteA', grupo: 'primario', fluido: 'primario', modos: ['presion'], r: 0.07, puntos: [[-3.05, 2.1, -0.1], [-2.85, 1.6, 0.1], [-2.72, 1.2, 0.2]] },
    { id: 'frioA1', grupo: 'primario', fluido: 'primario', modos: ['presion'], r: 0.06, puntos: [[-2.62, 1.1, 0.2], [-2.85, 1.05, 0.08]] },
    { id: 'frioA2', grupo: 'primario', fluido: 'primario', modos: ['presion'], r: 0.06, puntos: [[-2.95, 1.05, 0.05], [-3.1, 1.3, -0.1], [-3.1, 1.75, -0.14]] },
    { id: 'calienteB', grupo: 'primario', fluido: 'primario', modos: ['presion'], r: 0.07, puntos: lineaP([[-3.05, 2.1, -0.1], [-2.85, 1.6, 0.1], [-2.72, 1.2, 0.2]], espejo) },
    { id: 'frioB1', grupo: 'primario', fluido: 'primario', modos: ['presion'], r: 0.06, puntos: lineaP([[-2.62, 1.1, 0.2], [-2.85, 1.05, 0.08]], espejo) },
    { id: 'frioB2', grupo: 'primario', fluido: 'primario', modos: ['presion'], r: 0.06, puntos: lineaP([[-2.95, 1.05, 0.05], [-3.1, 1.3, -0.1], [-3.1, 1.75, -0.14]], espejo) },
    { id: 'surge', grupo: 'quieto', fluido: 'primario', modos: [], r: 0.025, puntos: [[-3.5, 1.62, 0.55], [-3.2, 1.4, 0.3], [-2.85, 1.6, 0.1]] },
    { id: 'vaporP1', grupo: 'vaporTurbina', fluido: 'vapor', modos: ['presion'], r: 0.06, puntos: [[-2.62, 2.95, 0.22], [-2.62, 3.2, 0.22], [-2.1, 2.9, RX.z + DZ[3]], [-1.75, 2.5, RX.z + DZ[3]]] },
    { id: 'vaporP2', grupo: 'vaporTurbina', fluido: 'vapor', modos: ['presion'], r: 0.06, puntos: [[-2.62, 2.95, -0.82], [-2.62, 3.2, -0.82], [-2.1, 2.9, RX.z + DZ[0]], [-1.75, 2.5, RX.z + DZ[0]]] },
    { id: 'aguaP1', grupo: 'agua', fluido: 'agua', modos: ['presion'], r: 0.05, puntos: [[-1.75, 0.25, 0.2], [-2.3, 0.35, 0.25], [-2.5, 1.7, 0.25]] },
    { id: 'aguaP2', grupo: 'agua', fluido: 'agua', modos: ['presion'], r: 0.05, puntos: [[-2.3, 0.35, 0.25], [-2.25, 0.4, -0.8], [-2.45, 1.7, -0.8]] },
];

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
export const MUESTRA = { x: -6.25, z: 1.1 };
export const SECO = { x: [-6.95, -5.35], z: [-2.2, -0.2] };
export const PARTES = [
    { id: 'combustible', ancla: [MUESTRA.x - 0.32, 2.02, MUESTRA.z], vista: { az: -24, el: 14, tam: 2.75, mira: [MUESTRA.x + 0.05, 0.86, MUESTRA.z] } },
    { id: 'reaccion', ancla: [RX.x, 2.12, RX.z + 0.45], vista: { az: 6, el: 6, tam: 1.45, mira: [RX.x, 2.12, RX.z] } },
    { id: 'barras', ancla: [RX.x + 0.12, 1.08, RX.z + 0.3], vista: { az: 12, el: 3, tam: 2.1, mira: [RX.x, 1.6, RX.z] } },
    { id: 'vapor', ancla: [RX.x, 3.12, RX.z + 0.45], vista: { az: -8, el: 8, tam: 2.3, mira: [RX.x + 0.15, 2.8, RX.z] } },
    { id: 'contencion', ancla: [RX.x + 0.92, 2.05, RX.z + 0.55], vista: { az: -14, el: 10, tam: 6.2, mira: [RX.x, 2.45, RX.z] } },
    { id: 'turbina', ancla: [1.3, 2.75, T_Z + 0.5], vista: { az: 6, el: 18, tam: 4.6, mira: [1.15, 1.55, T_Z] } },
    { id: 'generador', ancla: [3.8, 2.35, T_Z + 0.3], vista: { az: -16, el: 16, tam: 2.4, mira: [3.85, 1.65, T_Z] } },
    { id: 'condensador', ancla: [1.9, 0.7, 0.45], vista: { az: 8, el: 6, tam: 3.3, mira: [1.9, 0.65, 0] } },
    { id: 'enfriamiento', ancla: [4.4, 0.38, 1.5], vista: { az: 16, el: 34, tam: 8.2, mira: [3.4, 0, 1.75] } },
    { id: 'emergencia', ancla: [-0.8, 1.15, -2.6], vista: { az: 142, el: 22, tam: 5, mira: [-2.5, 0.85, -1.9] } },
    { id: 'residuos', ancla: [-4.64, 3.98, -0.3], vista: { az: -68, el: 30, tam: 6.4, mira: [-5.2, 1.9, -0.8] } },
    { id: 'subestacion', ancla: [5.4, 1.65, -0.3], vista: { az: 34, el: 18, tam: 3.5, mira: [5.65, 1, -0.2] } },
    { id: 'red', ancla: [3.2, 3.5, -3.7], vista: { az: 160, el: 20, tam: 10.6, mira: [2.2, 1, -3.4] } },
];

// ------------------------------------------------------------------ la pose
/** Todo lo que necesita posar(): lecturas, cuánto corre por cada tubo (0–1) y la cámara. */
export function pose({ modo = 'operar', reactor = null, tApagado = 1, sinRed = false, pPrim = DEF.pPrim, tSale = DEF.tSale, mes = DEF.mes, noche = 0, adentro = 0, desarme = 0, encendido = 1, pwr = 0, t = 0, dt = 0, camara = null } = {}) {
    const lectura = calcular({ modo, reactor, tApagado, sinRed, pPrim, tSale, mes });
    const O = lectura.operar;
    const A = lectura.apagar;
    const Pr = lectura.presion;
    const C = lectura.ciclo;
    const q = O ? O.q : Pr ? (Pr.hierve ? 0 : 1) : C ? (C.recarga ? 0 : 1) : 0;
    const qA = A ? clamp01(0.3 + Math.log10(Math.max(1e-4, A.pct / 0.0005)) / 3) : 0;
    const fg = {
        vaporRx: A ? (sinRed ? 0 : qA) : q,
        vaporTurbina: q,
        bypass: A && !sinRed ? qA : 0,
        agua: A ? (sinRed ? 0 : qA) : q,
        recirc: A ? (sinRed ? 0 : 0.25) : O ? O.flujo : C ? (C.recarga ? 0 : 1) : 0,
        mar: A ? (sinRed ? 0 : 0.55) : 1,
        rhrMar: A && sinRed ? 0.7 : 0,
        rcic: A && sinRed ? qA : 0,
        rhr: A && sinRed ? 0.7 : 0,
        generador: clamp01(lectura.bruta / UNIDAD.bruta),
        red: clamp01(lectura.neta / UNIDAD.neta),
        diesel: A && sinRed ? 1 : 0,
        primario: Pr ? 1 : 0,
        quieto: 0,
    };
    const flujos = {};
    for (const L of LINEAS) flujos[L.id] = L.modos.includes(modo) ? (fg[L.grupo] ?? 0) : 0;
    const P = O ? O.P : Pr ? (Pr.hierve ? 0 : 1) : C ? (C.recarga ? 0 : 1) : 0;
    const activo = { turbina: clamp01(lectura.bruta / UNIDAD.bruta), red: clamp01(lectura.neta / UNIDAD.neta), reactor: clamp01(P), hervor: A ? qA * 0.55 : q, mar: fg.mar, diesel: fg.diesel, rcic: fg.rcic, rhr: fg.rhr, recarga: C?.recarga ? 1 : 0, pwr: Pr ? 1 : 0, recirc: fg.recirc };
    const c = camara || { mira: [0, 1, 0], az: -16, el: 18, d: 36 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, pwr, sol: 1 - clamp01(noche), lectura, flujos, activo,
        barras: O ? O.barras : C ? C.barras : Pr ? 0.2 : (reactor?.b ?? 1),
        mes, sinRed,
        camara: { mira: c.mira, az: c.az * D2R, el: c.el * D2R, d: c.d, fov: c.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'operar', noche: clamp01((t - 7) / 2), adentro: clamp01((t - 3) / 2) * (1 - clamp01((t - 5.5) / 1)), camara: { mira: [0, 1, 0], az: lerp(-26, -8, t / DURACION), el: 18, d: 36 } });
}
export function posicionCamara({ mira, az, el, d }) {
    return [mira[0] + d * Math.cos(el) * Math.sin(az), mira[1] + d * Math.sin(el), mira[2] + d * Math.cos(el) * Math.cos(az)];
}
/** Dónde va cada ensamble y cada barra de control en el núcleo, vistos desde arriba. Se cuentan los reales: 444 y 109. */
export function rejillaNucleo() {
    const paso = VASIJA.rNucleo * Math.sqrt(Math.PI / UNIDAD.ensambles);
    const ensambles = [];
    for (let i = -16; i < 16; i++) for (let j = -16; j < 16; j++) ensambles.push([(i + 0.5) * paso, (j + 0.5) * paso]);
    ensambles.sort((a, b) => Math.hypot(...a) - Math.hypot(...b) || Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
    const barras = [];
    // cada barra queda en la esquina donde se juntan cuatro ensambles
    for (let i = -8; i < 8; i++) for (let j = -8; j < 8; j++) barras.push([2 * i * paso, 2 * j * paso]);
    barras.sort((a, b) => Math.hypot(...a) - Math.hypot(...b) || Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
    return { paso, ensambles: ensambles.slice(0, UNIDAD.ensambles), barras: barras.slice(0, UNIDAD.barras) };
}

// ------------------------------------------------------------------ revisiones
const dentro = (p, c, h = 0.03) => p[0] >= c[0] - h && p[0] <= c[1] + h && p[1] >= c[2] - h && p[1] <= c[3] + h && p[2] >= c[4] - h && p[2] <= c[5] + h;
const distSeg = (p, a, b) => {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
    const k = clamp01((ab[0] * ap[0] + ab[1] * ap[1] + ab[2] * ap[2]) / Math.max(1e-9, ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2));
    return Math.hypot(ap[0] - ab[0] * k, ap[1] - ab[1] * k, ap[2] - ab[2] * k);
};
/** Cada punta de cada tubo debe tocar un equipo u otro tubo. Devuelve las que quedan al aire. */
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) {
        for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
            const enEquipo = Object.values(EQUIPOS).some(c => dentro(p, c));
            const enTorre = puntasTorre.some(q => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 0.05);
            const enBorne = Object.values(BORNES).some(q => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 0.05);
            const enTubo = LINEAS.some(o => o !== L && o.puntos.some((q, i) => i > 0 && distSeg(p, o.puntos[i - 1], q) < 0.06));
            if (!enEquipo && !enTorre && !enBorne && !enTubo) sueltas.push(`${L.id} (${nombre})`);
        }
    }
    return sueltas.concat(cablesSueltos());
}
/** Cada cable llega a un borne: sus puntas y sus vueltas, y cada apoyo de las líneas aéreas (planta-comun/lineas.js). */
export const cablesSueltos = () => revisarCables(LINEAS, BORNES, REMATE);
/** Revisión de cifras contra lo publicado de estos equipos. */
export function revisar() {
    const p = [];
    const lejos = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // 1. tabla del agua
    lejos(sat(AGUA, 100).P, 1, 1.03, 'presión del agua a 100 °C');
    lejos(tSat(AGUA, P_DOMO), 284, 288, 'temperatura en la vasija (WNA: ~285 °C)');
    // 2. una unidad de Laguna Verde
    const c = cicloVapor();
    lejos(c.bruta, 805, 815, 'MW brutos (CFE: 810)');
    lejos(c.neta, 770, 785, 'MW netos (WNA: 777)');
    lejos(c.eficiencia, 0.33, 0.37, 'eficiencia (WNA: 33 a 37 %)');
    lejos(c.mv / FLUJO_NUCLEO, 0.12, 0.15, 'parte del agua que se vuelve vapor (WNA: 12 a 15 %)');
    lejos(FLUJO_NUCLEO / c.mv, 6.2, 8, 'agua por el núcleo entre vapor (Wikipedia: ~6.9)');
    lejos(c.t.x4, 0.72, 0.9, 'calidad a la salida de la turbina');
    lejos(c.pC, 0.05, 0.09, 'presión del condensador en bar');
    lejos(c.m3Mar, 40, 52, 'm³/s de mar (WNA: 90 m³/s para 1,600 MW)');
    lejos(u235Dia(UNIDAD.termica), 2.2, 2.6, 'kg de U-235 al día (WNA: 82 TJ/kg)');
    lejos(c.reparto.red + c.reparto.propia + c.reparto.mar, 0.999, 1.001, 'reparto del calor');
    lejos(cicloVapor({ tMar: 32 }).bruta / c.bruta, 0.95, 0.995, 'mar más caliente, menos potencia');
    // 3. Laguna Verde en 2024 (CFE): 11,977.77 GWh netos de 1,552 MW, factor 87.9 %
    lejos(11977.77 / ((1552 * 366 * 24) / 1000), 0.875, 0.883, 'factor de planta en 2024');
    // 4. la reacción
    lejos(equilibrio({ barras: NUCLEO.b0, flujo: 1 }), 0.999, 1.001, 'plena potencia en el punto de operación');
    lejos(equilibrio({ barras: NUCLEO.b0, flujo: 0.4 }), 0.5, 0.72, 'potencia con las bombas al 40 %');
    lejos(equilibrio({ barras: 0.2, flujo: 1 }), 0.85, 0.95, 'potencia con las barras un poco más adentro');
    lejos(equilibrio({ barras: 0.7, flujo: 1 }), 0, 0.001, 'con las barras muy adentro se apaga');
    lejos(NUCLEO.neutrones, 2.4, 2.5, 'neutrones por fisión (WNA: 2.45)');
    // 5. el calor que queda
    lejos(calorResidual(0.5), 0.06, 0.07, 'calor al apagar (6.5 %)');
    lejos(calorResidual(T_UNO.h), 0.014, 0.016, 'calor a la hora (1.5 %)');
    lejos(calorResidual(T_UNO.d), 0.0038, 0.0042, 'calor al día (0.4 %)');
    lejos(calorResidual(T_UNO.sem), 0.0019, 0.0021, 'calor a la semana (0.2 %)');
    lejos(kwPorTonelada(T_UNO.anio), 9.5, 10.5, 'kW por tonelada al año (WNA: 10)');
    lejos(kwPorTonelada(10 * T_UNO.anio), 0.95, 1.05, 'kW por tonelada a los 10 años (WNA: 1)');
    // 6. agua a presión
    const pr = aguaAPresion();
    lejos(pr.tHierve, 340, 350, 'hierve a 155 bar');
    lejos(pr.margen, 15, 25, 'margen antes de hervir');
    lejos(pr.ciclo.eficiencia, 0.32, 0.37, 'eficiencia con agua a presión');
    lejos(pr.mPrim, 10000, 15000, 'kg/s del primer circuito');
    if (!aguaAPresion({ pPrim: 120 }).hierve) p.push('a 120 bar y 325 °C el primer circuito debería hervir');
    // 7. combustible
    lejos(UNIDAD.recambio / UNIDAD.ensambles, 0.27, 0.34, 'parte que se cambia en cada recarga (WNA: cerca de un tercio)');
    lejos(QUEMADO_FINAL, 45, 55, 'GWd/t al salir (WNA: 45 a 55)');
    lejos(enElCiclo(0).usoAnual, 12, 22, 't de uranio al año');
    const sale = composicion(MESES_VIDA);
    lejos(sale.u235, 0.95, 1.05, '% de U-235 al salir (WNA: ~1)');
    lejos(sale.pu, 0.55, 0.65, '% de plutonio fisible al salir (WNA: 0.6)');
    lejos(sale.u238, 94, 97, '% de U-238 al salir (WNA: ~95)');
    // 8. geometría
    const nucleo = rejillaNucleo();
    lejos(nucleo.ensambles.length, 444, 444, 'ensambles dibujados');
    lejos(nucleo.barras.length, 109, 109, 'barras dibujadas');
    const s = puntasSueltas();
    if (s.length) p.push(`Tubos con una punta suelta: ${s.join(', ')}`);
    return p;
}
