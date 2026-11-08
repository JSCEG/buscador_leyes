// La central de ciclo combinado como cifras puras: la turbina de gas, el recuperador de calor con sus tres presiones, la turbina de
// vapor, el condensador, la torre, el clima y el arranque. Sin three.js ni DOM. El tablero, las gráficas y las partículas leen
// calcular(), así no pueden contradecirse.
//
// Central de ejemplo con el equipo de Empalme I (CFE, Sonora): dos turbinas de gas SGT6-8000H, dos recuperadores y una turbina de
// vapor de la clase de 300 MW. No es el plano de esa central ni un simulador de operación:
// - Turbina de gas (Siemens, 2016): 296 MW a 15 °C y nivel del mar, 40 %, 640 kg/s de gases a 630 °C. Relación de presión: 21 en la
//   versión actual de 310 MW (Siemens Energy). Compresor y turbina se ajustaron para dar esas cifras; la temperatura de entrada a la
//   turbina que resulta queda en lo que da el DOE para turbinas avanzadas (hasta 2,600 °F, 1,427 °C).
// - Recuperador: tres presiones con recalentamiento (Siemens). Los niveles de 150, 30 y 4 bar son de ejemplo; JICA da 118, 29 y 3.4 bar
//   en máquinas de clase F. Los gases salen por la chimenea cerca de 100 °C (JICA: 101 °C).
// - Ciclo: 440 MW en 1×1 y 880 MW en 2×1, con más de 60 % (Siemens, 2016). El rendimiento de la turbina de vapor y el consumo propio
//   están ajustados para dar esas cifras; todo lo demás sale del balance y se compara en revisar().
// - Clima: de 10 a 35 °C, la potencia baja cerca de 13 % y la eficiencia 1.4 puntos (JICA). Por altura, 3.5 % cada 1,000 pies; un
//   enfriador evaporativo baja el aire hasta 80 % de la distancia al bulbo húmedo (Power Engineering, Wikipedia).
// - Carga parcial y reparto de las etapas del arranque: de ejemplo, para ver la tendencia. Los totales de arranque sí salen de fuente.
//
// Vapor: IAPWS-IF97, calculado con CoolProp 8.

export const DURACION = 12;
export const FPS = 60;
const D2R = Math.PI / 180;
const clamp01 = x => Math.min(1, Math.max(0, x));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const interp = (filas, x, cx = 0, cy = 1) => {
    if (x <= filas[0][cx]) return filas[0][cy];
    if (x >= filas.at(-1)[cx]) return filas.at(-1)[cy];
    let i = 0;
    while (filas[i + 1][cx] < x) i++;
    return lerp(filas[i][cy], filas[i + 1][cy], (x - filas[i][cx]) / (filas[i + 1][cx] - filas[i][cx]));
};

// ------------------------------------------------------------------ el agua
// T °C, P bar, hf, hg kJ/kg, sf, sg kJ/kg·K (la misma tabla que la central nuclear y la geotérmica).
const SAT = [[20, 0.0234, 83.9, 2537.4, 0.2965, 8.666], [30, 0.0425, 125.7, 2555.5, 0.4368, 8.452], [40, 0.0738, 167.5, 2573.5, 0.5724, 8.2555], [45, 0.0959, 188.4, 2582.4, 0.6386, 8.1633], [50, 0.1235, 209.3, 2591.3, 0.7038, 8.0748], [60, 0.1995, 251.2, 2608.8, 0.8313, 7.9081], [70, 0.312, 293.1, 2626.1, 0.9551, 7.754], [80, 0.4741, 335, 2643, 1.0756, 7.6111], [100, 1.0142, 419.2, 2675.6, 1.3072, 7.3541], [120, 1.9867, 503.8, 2705.9, 1.5279, 7.1291], [140, 3.6154, 589.2, 2733.4, 1.7392, 6.9293], [160, 6.1823, 675.5, 2757.4, 1.9426, 6.7491], [180, 10.0281, 763.1, 2777.2, 2.1392, 6.584], [200, 15.5493, 852.3, 2792, 2.3305, 6.4302], [220, 23.1959, 943.6, 2800.9, 2.5177, 6.284], [240, 33.4693, 1037.6, 2803, 2.702, 6.1423], [260, 46.9226, 1135, 2796.6, 2.8849, 6.0016], [280, 64.1658, 1236.9, 2779.9, 3.0685, 5.8579], [300, 85.879, 1345, 2749.6, 3.2552, 5.7059], [320, 112.8429, 1462.2, 2700.6, 3.4494, 5.5372], [340, 146.0068, 1594.5, 2621.8, 3.6601, 5.3356], [350, 165.2942, 1670.9, 2563.6, 3.7784, 5.211]];
const sat = T => ({ T, P: Math.exp(interp(SAT.map(f => [f[0], Math.log(f[1])]), T)), hf: interp(SAT, T, 0, 2), hg: interp(SAT, T, 0, 3), sf: interp(SAT, T, 0, 4), sg: interp(SAT, T, 0, 5) });
/** Tres presiones del vapor. h y s del vapor sobrecalentado a cada T °C, de CoolProp. */
export const NIVELES = {
    ap: { nombre: 'Alta', P: 150, Tsat: 342.16, hf: 1610.2, hg: 2610.7, sf: 3.6846, sg: 5.3106, filas: [[350, 2693.1, 5.4437], [375, 2858.9, 5.705], [400, 2975.7, 5.8819], [425, 3072.3, 6.0229], [450, 3157.9, 6.1434], [475, 3236.6, 6.2505], [500, 3310.8, 6.348], [525, 3381.7, 6.4383], [550, 3450.4, 6.523], [575, 3517.4, 6.6032], [600, 3583.1, 6.6796], [625, 3648, 6.7528]] },
    mp: { nombre: 'Media', P: 30, Tsat: 233.85, hf: 1008.3, hg: 2803.2, sf: 2.6455, sg: 6.1856, filas: [[300, 2994.3, 6.5412], [325, 3056.3, 6.6471], [350, 3116.1, 6.7449], [375, 3174.3, 6.8366], [400, 3231.7, 6.9234], [425, 3288.4, 7.0062], [450, 3344.8, 7.0856], [475, 3401.1, 7.162], [500, 3457.2, 7.2359], [525, 3513.4, 7.3074], [550, 3569.7, 7.3768], [575, 3626.2, 7.4444], [600, 3682.8, 7.5103], [625, 3739.7, 7.5745]] },
    bp: { nombre: 'Baja', P: 4, Tsat: 143.61, hf: 604.7, hg: 2738.1, sf: 1.7765, sg: 6.8955, filas: [[150, 2752.8, 6.9306], [175, 2807.9, 7.0571], [200, 2860.9, 7.1723], [225, 2913, 7.2795], [250, 2964.5, 7.3804], [275, 3015.8, 7.4762], [300, 3067.1, 7.5677], [325, 3118.5, 7.6554], [350, 3170, 7.7399], [375, 3221.8, 7.8214], [400, 3273.9, 7.9002]] },
};
for (const n of Object.values(NIVELES)) n.tabla = [[n.Tsat, n.hg, n.sg], ...n.filas];
const sobre = (n, T) => ({ h: interp(n.tabla, T, 0, 1), s: interp(n.tabla, T, 0, 2) });
/** h a la presión del nivel con esa entropía: vapor seco si le alcanza, húmedo si no. */
function hConS(n, s) {
    if (s >= n.sg) return interp(n.tabla, s, 2, 1);
    const x = (s - n.sf) / (n.sg - n.sf);
    return n.hf + x * (n.hg - n.hf);
}
const sConH = (n, h) => (h >= n.hg ? interp(n.tabla, h, 1, 2) : n.sf + ((h - n.hf) / (n.hg - n.hf)) * (n.sg - n.sf));

// ------------------------------------------------------------------ la central de ejemplo
export const EQUIPO = { potenciaTG: 296, eficienciaTG: 0.4, escape: 640, tEscape: 630, unoPorUno: 440, dosPorUno: 880, vaporClase: 300, empalme1: 770, empalme2: 791, rpm: 3600 };
export const ISO = { T: 15, P: 1.01325, HR: 0.6 };
export const AIRE = { cp: 1.02, exp: 0.2857, etaC: 0.93 };
export const GASES = { cp: 1.0925, exp: 0.25, etaT: 0.9175, cpEscape: 1.1, perdidaP: 0.95 };
export const COMB = { LHV: 50000, eta: 0.995, co2GJ: 55.7, MJm3: 34.8 }; // kJ/kg. CO₂: EIA, 50.15 kg/GJ con poder alto, pasado a poder bajo
export const DISENO = { rp: 18.25, T3: 1425, mAire: 625.3, etaMec: 0.986 };
export const RECUPERADOR = { pinch: 10, acerca: 5, aMax: 600, rMax: 600, mpSobre: 300, bpSobre: 200, cerca: 25 };
export const TURBINA_V = { etaAP: 0.875, etaMP: 0.915, etaBP: 0.875, etaGen: 0.986, extra2x1: 1.003 };
export const AUX = 0.02; // consumo propio
export const TORRE = { acerca: 7, rango: 9, ttd: 4.5, QcRef: 0 };
export const DEF = { carga: 100, tAire: 15, altitud: 0, humedad: 40, minutos: 0 };
export const LIMITES = { carga: [40, 100], tAire: [5, 45], altitud: [0, 2400], minutosCal: [0, 30], minutosFrio: [0, 240] };
export const SITIOS = [{ nombre: 'Empalme, Sonora', m: 10, t: 38 }, { nombre: 'Salamanca, Guanajuato', m: 1720, t: 32 }, { nombre: 'Valle de México', m: 2240, t: 28 }];

/** Presión del aire, en bar, a tantos metros. */
export const presion = m => ISO.P * (1 - 2.25577e-5 * m) ** 5.25588;
/** Temperatura de bulbo húmedo, °C (Stull, 2011): lo más que puede enfriar el agua al evaporarse. */
export function bulboHumedo(T, HR) {
    const r = HR * 100;
    return T * Math.atan(0.151977 * Math.sqrt(r + 8.313659)) + Math.atan(T + r) - Math.atan(r - 1.676331) + 0.00391838 * r ** 1.5 * Math.atan(0.023101 * r) - 4.686035;
}
/** A qué temperatura entra el aire al compresor, con o sin enfriador evaporativo. */
export const aireEntrada = ({ tAire, humedad = DEF.humedad, enfriar = false }) => (enfriar ? tAire - 0.8 * Math.max(0, tAire - bulboHumedo(tAire, humedad / 100)) : tAire);

// ------------------------------------------------------------------ la turbina de gas
function cicloBrayton(T1, p1, v, T3C) {
    const T0 = ISO.T + 273.15;
    const m = DISENO.mAire * v * (p1 / ISO.P) * (T0 / T1);
    const rp = Math.max(4, DISENO.rp * v * (T0 / T1));
    const T3 = T3C + 273.15;
    const T2 = T1 * (1 + (rp ** AIRE.exp - 1) / AIRE.etaC);
    const wc = AIRE.cp * (T2 - T1);
    const f = (GASES.cp * (T3 - T0) - AIRE.cp * (T2 - T0)) / (COMB.LHV * COMB.eta - GASES.cp * (T3 - T0));
    const T4 = T3 * (1 - GASES.etaT * (1 - (rp * GASES.perdidaP) ** -GASES.exp));
    const wt = (1 + f) * GASES.cp * (T3 - T4);
    const W = (m * (wt - wc) * DISENO.etaMec) / 1000;
    return { m, rp, T1, T2, T3, T4, f, W, Q: (m * f * COMB.LHV) / 1000, mEsc: m * (1 + f), wc, wt };
}
const VGV_MIN = 0.62; // lo más que cierran los álabes guía de entrada, de ejemplo
const T4_MAX = 655; // °C. JICA: la zona de escape se diseña para cerca de 650 °C
/** T3 con esos álabes, sin pasar del tope de la entrada a la turbina ni del de los gases de escape. */
function t3Permitida(T1, p1, v) {
    let [a, b] = [700, DISENO.T3];
    if (cicloBrayton(T1, p1, v, b).T4 - 273.15 <= T4_MAX) return b;
    for (let i = 0; i < 22; i++) { const m = (a + b) / 2; if (cicloBrayton(T1, p1, v, m).T4 - 273.15 > T4_MAX) b = m; else a = m; }
    return a;
}
/**
 * Una turbina de gas a cierta carga (0–1 de lo que puede dar con ese aire): primero cierra los álabes guía y deja calientes los gases
 * para que el recuperador siga aprovechándolos; ya cerrados, baja la temperatura.
 */
export function turbinaGas({ carga = 1, tAire = DEF.tAire, altitud = DEF.altitud, humedad = DEF.humedad, enfriar = false } = {}) {
    const T1 = aireEntrada({ tAire, humedad, enfriar }) + 273.15;
    const p1 = presion(altitud);
    const max = cicloBrayton(T1, p1, 1, t3Permitida(T1, p1, 1));
    const meta = max.W * clamp(carga, 0, 1);
    const enVgv = cicloBrayton(T1, p1, VGV_MIN, t3Permitida(T1, p1, VGV_MIN));
    let r;
    if (meta >= enVgv.W) {
        let [a, b] = [VGV_MIN, 1];
        for (let i = 0; i < 22; i++) { const v = (a + b) / 2; if (cicloBrayton(T1, p1, v, t3Permitida(T1, p1, v)).W > meta) b = v; else a = v; }
        r = cicloBrayton(T1, p1, a, t3Permitida(T1, p1, a));
        r.v = a;
    } else {
        let [a, b] = [500, t3Permitida(T1, p1, VGV_MIN)];
        for (let i = 0; i < 26; i++) { const t = (a + b) / 2; if (cicloBrayton(T1, p1, VGV_MIN, t).W > meta) b = t; else a = t; }
        r = cicloBrayton(T1, p1, VGV_MIN, a);
        r.v = VGV_MIN;
    }
    const W = meta > 0 ? r.W : 0;
    const Q = meta > 0 ? r.Q : 0;
    return { ...r, W, Q, eficiencia: Q > 0 ? W / Q : 0, tEscape: r.T4 - 273.15, tEntra: r.T3 - 273.15, tComp: r.T2 - 273.15, tAireC: T1 - 273.15, kgGas: Q / (COMB.LHV / 1000) };
}

// ------------------------------------------------------------------ el recuperador de calor
const hf = T => sat(T).hf;
/** Reparte el calor de los gases entre las tres presiones, de lo más caliente a lo más frío. Todo en kW y kg/s de una turbina de gas. */
export function recuperador(g, tC) {
    const R = RECUPERADOR;
    const { ap, mp, bp } = NIVELES;
    const G = g.mEsc * GASES.cpEscape;
    const T4 = g.tEscape;
    if (G <= 0) return { G: 0, Q: 0, mAP: 0, mMP: 0, mBP: 0, tChim: T4, perfil: [], etapas: [], T4 };
    const tAP = Math.min(R.aMax, T4 - R.cerca);
    const tRH = Math.min(R.rMax, T4 - R.cerca);
    const eAP = sobre(ap, tAP);
    const eRH = sobre(mp, tRH);
    const eMP = sobre(mp, R.mpSobre);
    const eBP = sobre(bp, R.bpSobre);
    const hSal = hAP => hAP - TURBINA_V.etaAP * (hAP - hConS(mp, eAP.s));
    const hCRH = hSal(eAP.h);
    const [hApA, hApM, hApB] = [hf(ap.Tsat - R.acerca), hf(mp.Tsat - R.acerca), hf(bp.Tsat - R.acerca)];
    const [tA, tB, tC_] = [ap.Tsat + R.pinch, mp.Tsat + R.pinch, bp.Tsat + R.pinch];
    let [mAP, mMP, mBP] = [0, 0, 0];
    for (let i = 0; i < 6; i++) {
        mAP = Math.max(0, (G * (T4 - tA) - mMP * (eRH.h - hCRH)) / (eAP.h - hApA + (eRH.h - hCRH)));
        mMP = Math.max(0, (G * (tA - tB) - mAP * (hApA - hApM)) / (eMP.h - hApM));
    }
    mBP = Math.max(0, (G * (tB - tC_) - (mAP + mMP) * (hApM - hApB)) / (eBP.h - hApB));
    const mT = mAP + mMP + mBP;
    const hCond = hf(tC);
    const tChim = tC_ - (mT * (hApB - hCond)) / G;
    const Q = G * (T4 - tChim);
    const Q4 = mT * (hApB - hCond);
    const Q3 = G * (tB - tC_);
    const Q2 = G * (tA - tB);
    const Q1 = G * (T4 - tA);
    const qEvBP = mBP * (bp.hg - bp.hf);
    const qEvMP = mMP * (mp.hg - mp.hf);
    const qEvAP = mAP * (ap.hg - ap.hf);
    const perfil = [[0, tC], [Q4, bp.Tsat - R.acerca], [Q4 + qEvBP, bp.Tsat], [Q4 + Q3, mp.Tsat - R.acerca], [Q4 + Q3 + qEvMP, mp.Tsat], [Q4 + Q3 + Q2, ap.Tsat - R.acerca], [Q4 + Q3 + Q2 + qEvAP, ap.Tsat], [Q, tAP]];
    return { G, Q, Q1, Q2, Q3, Q4, mAP, mMP, mBP, mT, tChim, tAP, tRH, hCRH, eAP, eRH, eBP, perfil, T4, pinch: [tA, tB, tC_] };
}
/** La turbina de vapor con el vapor de los recuperadores. n: cuántos recuperadores la alimentan. */
export function turbinaVapor(r, tC, n = 1) {
    if (!r.mT) return { W: 0, Qc: 0, mT: 0, tC, pC: sat(tC).P, hSale: 0, xSale: 1 };
    const { mp, bp } = NIVELES;
    const V = TURBINA_V;
    const c = sat(tC);
    const hxMP = r.eRH.h - V.etaMP * (r.eRH.h - hConS(bp, r.eRH.s));
    const mAM = r.mAP + r.mMP;
    const hMezcla = (mAM * hxMP + r.mBP * r.eBP.h) / r.mT;
    const sMezcla = sConH(bp, hMezcla);
    const xs = (sMezcla - c.sf) / (c.sg - c.sf);
    const hs = c.hf + xs * (c.hg - c.hf);
    const hSale = hMezcla - V.etaBP * (hMezcla - hs);
    const trabajo = r.mAP * (r.eAP.h - r.hCRH) + mAM * (r.eRH.h - hxMP) + r.mT * (hMezcla - hSale);
    const escala = n >= 2 ? V.extra2x1 : 1;
    const W = ((trabajo * V.etaGen * escala * n) / 1000);
    const Qc = (r.mT * (hSale - c.hf) * n) / 1000;
    return { W, Qc, mT: r.mT * n, tC, pC: c.P, hSale, xSale: (hSale - c.hf) / (c.hg - c.hf), mp };
}
/** El condensador se enfría con una torre: el agua no baja del bulbo húmedo, y el rango crece con el calor que trae. */
export function torre({ tAire, humedad = DEF.humedad, QcRel = 1 }) {
    const tb = bulboHumedo(tAire, humedad / 100);
    const entra = tb + TORRE.acerca;
    const sale = entra + TORRE.rango * QcRel;
    return { tb, entra, sale, tC: clamp(sale + TORRE.ttd * Math.max(0.35, QcRel), 21, 58) };
}

// ------------------------------------------------------------------ una central completa
const Qc_DISENO = (() => {
    // el calor que la torre espera, sacado sin iterar en un punto cercano al de diseño
    const g = cicloBrayton(ISO.T + 273.15, ISO.P, 1, DISENO.T3);
    const G = g.m * (1 + g.f) * GASES.cpEscape;
    return (G * ((g.T4 - 273.15) - 100) * 0.585) / 1000;
})();
/**
 * Lo que da la central en régimen. tg: cuántas turbinas de gas. abierto: los gases se van por la chimenea de paso.
 * cargaVapor: la carga que «siente» el recuperador, que tarda en seguir a la turbina de gas. vapor: 0–1 cuánto vapor ya llega.
 */
export function central({ carga = 1, cargaVapor = carga, tAire = DEF.tAire, altitud = DEF.altitud, humedad = DEF.humedad, enfriar = false, dos = true, abierto = 0, vapor = 1 } = {}) {
    const n = dos ? 2 : 1;
    const g = turbinaGas({ carga, tAire, altitud, humedad, enfriar });
    const gv = cargaVapor === carga ? g : turbinaGas({ carga: cargaVapor, tAire, altitud, humedad, enfriar });
    const parte = clamp01((1 - abierto) * vapor);
    // el condensador y su torre dependen del calor; se resuelve en dos pasadas
    let qRel = parte * Math.max(0.2, gv.W > 0 ? gv.W / DISENO_W : 0.2);
    let tw = torre({ tAire, humedad, QcRel: qRel });
    let r = recuperador(gv, tw.tC);
    let v = turbinaVapor(r, tw.tC, 1);
    for (let i = 0; i < 2; i++) {
        qRel = (parte * v.Qc) / Qc_DISENO;
        tw = torre({ tAire, humedad, QcRel: qRel });
        r = recuperador(gv, tw.tC);
        v = turbinaVapor(r, tw.tC, 1);
    }
    const st = turbinaVapor(r, tw.tC, n);
    const brutaGas = g.W * n;
    const brutaVapor = st.W * parte;
    const bruta = brutaGas + brutaVapor;
    const neta = bruta * (1 - AUX);
    const Qgas = g.Q * n;
    const Qc = st.Qc * parte;
    const Qrec = (r.Q / 1000) * n * parte;
    const Qgen = bruta / 0.986; // lo que sale por el eje; el resto de los generadores se calienta
    const Qchim = Math.max(0, Qgas - Qgen - Qc);
    const m3s = (Qgas * 1000) / (COMB.MJm3 * 1000);
    return {
        n, g, gv, r, st, tw, parte, abierto, brutaGas, brutaVapor, bruta, neta, Qgas, Qc, Qrec, Qchim, aux: bruta - neta, eficiencia: Qgas > 0 ? neta / Qgas : 0, eficienciaBruta: Qgas > 0 ? bruta / Qgas : 0,
        tChim: abierto > 0.5 ? g.tEscape : lerp(r.tChim, g.tEscape, abierto), m3Dia: (m3s * 86400) / 1e6, m3s, kgGas: g.kgGas * n, tCO2: (Qgas * 3.6 * COMB.co2GJ) / 1000, co2MWh: bruta > 0 ? (Qgas * 3.6 * COMB.co2GJ) / 1000 / neta : 0, evapora: ((Qc * 1000 * 0.85) / 2430) * 3.6,
        reparto: Qgas > 0 ? { gas: brutaGas / Qgas, vapor: brutaVapor / Qgas, propia: (bruta - neta) / Qgas, torre: Qc / Qgas, chimenea: Qchim / Qgas, red: neta / Qgas } : { gas: 0, vapor: 0, propia: 0, torre: 0, chimenea: 0, red: 0 },
    };
}
const DISENO_W = EQUIPO.potenciaTG;

// ------------------------------------------------------------------ el arranque
// Siemens: en caliente, a plena carga en 30 minutos, subiendo 30 MW por minuto; así la turbina de gas tarda unos 10 minutos en subir.
// JICA: un arranque en frío de una planta de clase F se pide en máximo 240 minutos. El reparto de las etapas es de ejemplo.
export const RAMPA_MW_MIN = 30;
export const ARRANQUES = {
    caliente: { nombre: 'En caliente', total: 30, etapas: [['Purga y encendido', 0, 3], ['La turbina de gas se conecta a la red', 3, 5], ['Sube la turbina de gas', 5, 15], ['Sube la turbina de vapor', 8, 30]], tg: [[0, 0], [3, 0], [5, 0.04], [15, 1], [30, 1]], vapor: [[0, 0], [8, 0], [30, 1]] },
    frio: { nombre: 'En frío', total: 240, etapas: [['Purga y encendido', 0, 15], ['La turbina de gas espera con poca carga', 15, 150], ['Se calientan el recuperador y la turbina de vapor', 40, 170], ['Suben las dos', 150, 240]], tg: [[0, 0], [12, 0], [15, 0.04], [30, 0.22], [150, 0.22], [240, 1]], vapor: [[0, 0], [110, 0], [150, 0.14], [240, 1]] },
};
/** Cuánto lleva cada turbina a tantos minutos de la orden. */
export function arranque(min, tipo = 'caliente') {
    const A = ARRANQUES[tipo];
    const m = clamp(min, 0, A.total);
    const etapa = A.etapas.reduce((acc, e) => (m >= e[1] ? e[0] : acc), A.etapas[0][0]);
    return { tipo, min: m, total: A.total, tg: interp(A.tg, m), vapor: interp(A.vapor, m), etapa };
}

// ------------------------------------------------------------------ el tiempo: lo que tarda en responder
export const RAPIDEZ = { tg: 0.12, tauVapor: 5, tauAbrir: 3.2 }; // 10 % de la turbina por minuto real, 60 veces más rápido en pantalla
export const estadoPlanta = ({ carga = 1, modo = 'combinado' } = {}) => ({ tg: carga, lenta: carga, vapor: modo === 'abierto' ? 0 : 1, abierto: modo === 'abierto' ? 1 : 0 });
/** Un paso del tiempo. m: { modo, carga, min, tipo }. Función pura e independiente de la velocidad de los cuadros. */
export function pasoPlanta(s, m, dt) {
    const pasos = Math.max(1, Math.ceil(dt / 0.05));
    const h = dt / pasos;
    const n = { ...s };
    const A = m.modo === 'arranque' ? arranque(m.min, m.tipo) : null;
    const meta = A ? A.tg : m.carga;
    const abierto = m.modo === 'abierto' ? 1 : 0;
    for (let i = 0; i < pasos; i++) {
        n.tg = A ? meta : n.tg + clamp(meta - n.tg, -RAPIDEZ.tg * h, RAPIDEZ.tg * h);
        n.lenta = A ? meta : n.lenta + (n.tg - n.lenta) * (1 - Math.exp(-h / RAPIDEZ.tauVapor));
        n.abierto += clamp(abierto - n.abierto, -h / RAPIDEZ.tauAbrir, h / RAPIDEZ.tauAbrir);
        const v = A ? A.vapor : 1 - abierto;
        n.vapor = A ? v : n.vapor + (v - n.vapor) * (1 - Math.exp(-h / RAPIDEZ.tauVapor));
    }
    return n;
}

// ------------------------------------------------------------------ las lecturas
/** Lo que mide la central en cada modo. modo: 'combinado' | 'abierto' | 'clima' | 'arranque'. */
export function calcular({ modo = 'combinado', planta = null, carga = 1, tAire = DEF.tAire, altitud = DEF.altitud, humedad = DEF.humedad, enfriar = false, dos = true, min = 0, tipo = 'caliente' } = {}) {
    const p = planta || estadoPlanta({ carga, modo });
    const A = modo === 'arranque' ? arranque(min, tipo) : null;
    const c = central({ carga: p.tg, cargaVapor: Math.max(p.lenta, 0.0001), tAire, altitud, humedad, enfriar, dos, abierto: p.abierto, vapor: p.vapor });
    const r = { modo, c, arranque: A, etapas: A ? ARRANQUES[tipo].etapas : null, carga: p.tg, cargaVapor: p.lenta, neta: p.tg > 0.001 ? c.neta : 0, bruta: p.tg > 0.001 ? c.bruta : 0, tAire, altitud, enfriar, dos };
    if (A && A.tg <= 0) { r.neta = 0; r.bruta = 0; }
    return r;
}
/** Reparto de la potencia para la gráfica de la temperatura. */
export const potenciaA = (tAire, altitud = 0, o = {}) => central({ tAire, altitud, ...o }).neta;

// ------------------------------------------------------------------ acomodo de la central (no está a escala)
export const BLOQUE = { x: [-7.4, 7.95], z: [-4, 4.55], y: [-1.3, 0] };
export const ZA = 1.3;
export const ZB = -1.7;
export const EJE_G = 1.15;
export const ST = { z: 0.3, y: 1.3 };
export const X = { gen: [-6.85, -5.7], filtro: [-6.3, -4.75], ducto: [-5.62, -5.08], comp: [-5.08, -3.6], comb: [-3.6, -3.05], turb: [-3.05, -2.25], dif: [-2.25, -1.4], desvio: [-1.4, -0.85], trans: [-0.85, -0.3], hrsg: [-0.3, 2.7], salida: [2.7, 3], chim: 3.35 };
export const HRSG = { y: [0.2, 3.2], ancho: 1.05 };
export const ALTO_CHIM = 5.6;
export const ALTO_PASO = 4.6;
export const X_DOMOS = { ap: 0.45, mp: 1.3, bp: 2.15 };
export const TORRES = [[3.55, 4.3], [7.55, 4.3]];
const ALTO_TORRE = 3.3;
const puntasTorre = TORRES.map(([x, z]) => [x, ALTO_TORRE, z]);
export const FLUIDOS = {
    gas: { nombre: 'Gas natural', color: '#62a83d' },
    aire: { nombre: 'Aire', color: '#7fb2d6' },
    caliente: { nombre: 'Gases calientes', color: '#ff5a36' },
    tibio: { nombre: 'Gases cediendo calor', color: '#f08a24' },
    frio: { nombre: 'Gases fríos', color: '#8d939b' },
    vapor: { nombre: 'Vapor', color: '#e0457b' },
    agua: { nombre: 'Agua del ciclo', color: '#3558e8' },
    torre: { nombre: 'Agua de la torre', color: '#16a9d4' },
    elec: { nombre: 'Electricidad', color: '#ffb000' },
};
// Cada caja: x0, x1, y0, y1, z0, z1. Las pinta planta.js y con ellas se revisa que cada tubo llegue a un equipo.
const cajaTren = z => ({
    gen: [X.gen[0], X.gen[1], EJE_G - 0.46, EJE_G + 0.46, z - 0.46, z + 0.46],
    filtro: [X.filtro[0], X.filtro[1], 2.15, 3.25, z - 0.95, z + 0.95],
    entrada: [X.ducto[0], X.ducto[1], 0.5, 2.15, z - 0.6, z + 0.6],
    comp: [X.comp[0], X.comp[1], EJE_G - 0.55, EJE_G + 0.55, z - 0.55, z + 0.55],
    comb: [X.comb[0], X.comb[1], EJE_G - 0.8, EJE_G + 0.8, z - 0.8, z + 0.8],
    turb: [X.turb[0], X.turb[1], EJE_G - 0.62, EJE_G + 0.62, z - 0.62, z + 0.62],
    dif: [X.dif[0], X.dif[1], EJE_G - 0.85, EJE_G + 0.85, z - 0.85, z + 0.85],
    desvio: [X.desvio[0], X.desvio[1], 0.25, 2.05, z - 0.85, z + 0.85],
    trans: [X.trans[0], X.trans[1], 0.2, 3.2, z - 1.05, z + 1.05],
    hrsg: [X.hrsg[0], X.hrsg[1], HRSG.y[0], HRSG.y[1], z - HRSG.ancho, z + HRSG.ancho],
    salida: [X.salida[0], X.chim, 0.3, 3, z - 0.7, z + 0.7],
    chim: [X.chim - 0.4, X.chim + 0.4, 0, ALTO_CHIM, z - 0.4, z + 0.4],
    paso: [-1.55, -0.7, 2.05, ALTO_PASO, z - 0.42, z + 0.42],
    domoAP: [X_DOMOS.ap - 0.18, X_DOMOS.ap + 0.18, 3.2, 3.62, z - 0.95, z + 0.95],
    domoMP: [X_DOMOS.mp - 0.14, X_DOMOS.mp + 0.14, 3.2, 3.54, z - 0.95, z + 0.95],
    domoBP: [X_DOMOS.bp - 0.16, X_DOMOS.bp + 0.16, 3.2, 3.58, z - 0.95, z + 0.95],
});
export const TRENES = { A: cajaTren(ZA), B: cajaTren(ZB) };
export const EQUIPOS = {
    ...Object.fromEntries(Object.entries(TRENES.A).map(([k, v]) => [`${k}A`, v])),
    ...Object.fromEntries(Object.entries(TRENES.B).map(([k, v]) => [`${k}B`, v])),
    tvAP: [4.02, 4.66, ST.y - 0.36, ST.y + 0.36, ST.z - 0.36, ST.z + 0.36],
    tvMP: [4.7, 5.32, ST.y - 0.42, ST.y + 0.42, ST.z - 0.42, ST.z + 0.42],
    tvBP: [5.38, 6.42, ST.y - 0.66, ST.y + 0.66, ST.z - 0.66, ST.z + 0.66],
    gen2: [6.56, 7.5, ST.y - 0.46, ST.y + 0.46, ST.z - 0.46, ST.z + 0.46],
    condensador: [5.2, 6.6, 0.06, 0.66, ST.z - 0.72, ST.z + 0.72],
    bombaAgua: [4.6, 5.05, 0, 0.42, -0.5, -0.1],
    torre: [4, 7.7, 0, 2.15, -3.65, -1.95],
    bombaTorre: [6.75, 7.2, 0, 0.42, -1.5, -1.05],
    estacion: [-6.95, -4.25, 0, 0.75, 3.1, 4.15],
    gasoducto: [-7.5, -6.95, -0.8, 0.5, 3.4, 3.9],
    trafoA: [-1, -0.2, 0, 1.2, 3.05, 4.2],
    trafoB: [0.1, 0.9, 0, 1.2, 3.05, 4.2],
    trafoC: [1.2, 2, 0, 1.2, 3.05, 4.2],
    portico: [2.25, 2.75, 0, 2.62, 3.25, 4.05],
    reductora: [6.6, 7.4, 0, 1.6, 2.75, 3.55],
    pueblo: [4.3, 6.55, 0, 0.9, 2.75, 3.75],
};
const catenaria = (a, b, flecha, n = 5) => Array.from({ length: n + 1 }, (_, i) => { const k = i / n; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - flecha * 4 * k * (1 - k), lerp(a[2], b[2], k)]; });
const unir = (...tramos) => tramos.reduce((acc, t) => acc.concat(acc.length ? t.slice(1) : t), []);
// lo que corre en cada tren de turbina de gas
const lineasTren = (t, z) => {
    const s = z > 0 ? -1 : 1; // hacia el pasillo entre los dos trenes
    return [
        { id: `aire${t}`, tren: t, grupo: 'aire', fluido: 'aire', r: 0.06, puntos: [[-5.35, 2.7, z], [-5.35, 2, z], [-5.35, 1.35, z], [-5, EJE_G, z]] },
        { id: `aireComp${t}`, tren: t, grupo: 'aire', fluido: 'aire', r: 0.05, oculto: true, puntos: [[-5, EJE_G + 0.3, z], [-3.65, EJE_G + 0.28, z]] },
        { id: `gases${t}`, tren: t, grupo: 'gases', fluido: 'caliente', r: 0.07, oculto: true, puntos: [[-3.05, EJE_G + 0.32, z], [-2.25, EJE_G + 0.34, z]] },
        { id: `difusor${t}`, tren: t, grupo: 'gases', fluido: 'caliente', r: 0.09, puntos: [[-2.2, EJE_G, z], [-0.9, EJE_G, z]] },
        ...[[0.9, 0], [1.7, 1], [2.5, 2]].flatMap(([y]) => [
            { id: `entra${t}${y}`, tren: t, grupo: 'hrsg', fluido: 'caliente', r: 0.055, oculto: true, puntos: [[-0.85, EJE_G, z], [-0.3, y, z]] },
            { id: `cede${t}${y}a`, tren: t, grupo: 'hrsg', fluido: 'caliente', r: 0.05, oculto: true, puntos: [[-0.3, y, z], [0.8, y, z]] },
            { id: `cede${t}${y}b`, tren: t, grupo: 'hrsg', fluido: 'tibio', r: 0.05, oculto: true, puntos: [[0.8, y, z], [1.9, y, z]] },
            { id: `cede${t}${y}c`, tren: t, grupo: 'hrsg', fluido: 'frio', r: 0.05, oculto: true, puntos: [[1.9, y, z], [3.05, 1.7, z]] },
        ]),
        { id: `chim${t}`, tren: t, grupo: 'chimenea', fluido: 'frio', r: 0.08, puntos: [[X.chim, 1.7, z], [X.chim, ALTO_CHIM - 0.05, z]] },
        { id: `paso${t}`, tren: t, grupo: 'paso', fluido: 'caliente', r: 0.09, puntos: [[-1.12, 1.9, z], [-1.12, ALTO_PASO - 0.05, z]] },
        { id: `ap${t}`, tren: t, grupo: 'vapor', fluido: 'vapor', r: 0.03, puntos: [[X_DOMOS.ap, 3.5, z + s * 0.85], [1.4, 3.72, z + s * 0.85], [3, 3.72, z + s * 0.85], [3.9, 2.7, ST.z - s * 0.12], [4.3, ST.y + 0.3, ST.z - s * 0.12]] },
        { id: `rh${t}`, tren: t, grupo: 'vapor', fluido: 'vapor', r: 0.036, puntos: [[0.05, 3.2, z + s * 0.45], [0.2, 3.86, z + s * 0.45], [3, 3.86, z + s * 0.45], [4.2, 2.8, ST.z - s * 0.28], [5, ST.y + 0.38, ST.z - s * 0.2]] },
        { id: `frio${t}`, tren: t, grupo: 'vapor', fluido: 'vapor', r: 0.032, puntos: [[4.55, ST.y + 0.3, ST.z + s * 0.3], [4.2, 2.45, ST.z + s * 0.5], [3, 3.45, z + s * 0.62], [0.1, 3.45, z + s * 0.62], [-0.05, 3.2, z + s * 0.62]] },
        { id: `bp${t}`, tren: t, grupo: 'vapor', fluido: 'vapor', r: 0.03, puntos: [[X_DOMOS.bp, 3.5, z + s * 0.72], [2.7, 3.62, z + s * 0.72], [3.1, 3.62, z + s * 0.72], [4.3, 3.05, ST.z - s * 0.08], [5.9, 2.3, ST.z - s * 0.08], [5.9, ST.y + 0.62, ST.z - s * 0.08]] },
        { id: `alim${t}`, tren: t, grupo: 'agua', fluido: 'agua', r: 0.04, puntos: [[3.2, 0.12, -0.2], [2.5, 0.12, -0.2 + s * 0], [2.5, 0.42, z + s * 1.02]] },
    ];
};
// modos: se pide para todos; pose() dice cuánto corre por cada grupo.
export const LINEAS = [
    ...lineasTren('A', ZA),
    ...lineasTren('B', ZB),
    { id: 'gasEntra', grupo: 'gas', fluido: 'gas', r: 0.06, puntos: [[-7.2, 0.25, 3.65], [-6.85, 0.3, 3.65]] },
    { id: 'gasSale', grupo: 'gas', fluido: 'gas', r: 0.06, puntos: [[-4.3, 0.3, 3.62], [-3.32, 0.25, 3.3], [-3.32, 0.22, 2.75]] },
    { id: 'gasA', tren: 'A', grupo: 'gas', fluido: 'gas', r: 0.05, puntos: [[-3.32, 0.22, 2.75], [-3.32, 0.22, ZA + 0.55], [-3.32, 0.5, ZA + 0.55]] },
    { id: 'gasB', tren: 'B', grupo: 'gasB', fluido: 'gas', r: 0.05, puntos: [[-3.32, 0.22, 2.75], [-3.05, 0.14, 2.45], [-2.6, 0.14, 0.1], [-3.2, 0.2, ZB + 0.58], [-3.32, 0.5, ZB + 0.55]] },
    { id: 'cruce', grupo: 'vaporT', fluido: 'vapor', r: 0.055, puntos: [[5.1, ST.y + 0.34, ST.z], [5.3, ST.y + 0.78, ST.z], [5.75, ST.y + 0.78, ST.z], [5.9, ST.y + 0.6, ST.z]] },
    { id: 'alCondensador', grupo: 'vaporT', fluido: 'vapor', r: 0.13, puntos: [[5.9, ST.y - 0.62, ST.z], [5.9, 0.62, ST.z]] },
    { id: 'condensado', grupo: 'agua', fluido: 'agua', r: 0.045, puntos: [[5.3, 0.14, ST.z - 0.5], [5.05, 0.14, -0.3], [4.85, 0.14, -0.3]] },
    { id: 'alimenta', grupo: 'agua', fluido: 'agua', r: 0.05, puntos: [[4.62, 0.14, -0.3], [3.9, 0.12, -0.2], [3.2, 0.12, -0.2]] },
    { id: 'torreVa', grupo: 'torre', fluido: 'torre', r: 0.09, puntos: [[6.5, 0.28, ST.z - 0.6], [6.95, 0.28, -0.75], [6.95, 0.28, -1.5], [6.95, 1.5, -2], [6.95, 1.5, -2.3]] },
    { id: 'torreVuelve', grupo: 'torre', fluido: 'torre', r: 0.09, puntos: [[6.2, 0.14, -2], [6.2, 0.14, -1.2], [6.2, 0.2, ST.z - 0.65]] },
    { id: 'gen1A', tren: 'A', grupo: 'gen1', fluido: 'elec', r: 0.028, puntos: [[-6.25, 0.8, ZA + 0.42], [-6.25, 0.14, ZA + 0.85], [-6.2, 0.1, 2.75], [-0.9, 0.1, 2.75], [-0.6, 0.3, 3.1]] },
    { id: 'gen1B', tren: 'B', grupo: 'gen1', fluido: 'elec', r: 0.028, puntos: [[-6.25, 0.8, ZB + 0.42], [-7.1, 0.12, ZB + 0.9], [-7.1, 0.1, 2.5], [0.35, 0.1, 2.5], [0.5, 0.3, 3.1]] },
    { id: 'gen2', grupo: 'gen2', fluido: 'elec', r: 0.028, puntos: [[7, 0.82, ST.z + 0.42], [7.1, 0.12, ST.z + 0.9], [7.1, 0.1, 2.45], [2.1, 0.1, 2.5], [1.6, 0.3, 3.1]] },
    { id: 'trafoPortA', tren: 'A', grupo: 'gen1', fluido: 'elec', r: 0.016, puntos: [[-0.6, 1.2, 3.62], [0.8, 2.25, 3.56], [2.35, 2.4, 3.56]] },
    { id: 'trafoPortB', tren: 'B', grupo: 'gen1', fluido: 'elec', r: 0.016, puntos: [[0.5, 1.2, 3.62], [1.4, 2.1, 3.65], [2.35, 2.3, 3.65]] },
    { id: 'trafoPortC', grupo: 'gen2', fluido: 'elec', r: 0.016, puntos: [[1.6, 1.2, 3.62], [2.05, 1.95, 3.74], [2.35, 2.2, 3.74]] },
    { id: 'rnt', grupo: 'red', fluido: 'elec', r: 0.016, cable: true, puntos: unir(catenaria([2.55, 2.58, 3.65], puntasTorre[0], 0.2), catenaria(puntasTorre[0], puntasTorre[1], 0.35), catenaria(puntasTorre[1], [7, 1.56, 3.15], 0.12)) },
    { id: 'rgd', grupo: 'red', fluido: 'elec', r: 0.014, cable: true, puntos: unir(catenaria([6.7, 1.05, 3.2], [6.4, 0.97, 3.35], 0.03, 3), catenaria([6.4, 0.97, 3.35], [5.9, 0.75, 3.3], 0.05, 3)) },
];

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
export const PARTES = [
    { id: 'gas', ancla: [-5.6, 0.95, 3.6], vista: { az: -18, el: 24, tam: 4.2, mira: [-5.75, 0.25, 3.5] } },
    { id: 'compresor', ancla: [-4.3, EJE_G + 0.72, ZA], vista: { az: -18, el: 16, tam: 4.5, mira: [-4.8, 1.75, ZA] } },
    { id: 'combustion', ancla: [-3.32, EJE_G + 0.82, ZA + 0.2], vista: { az: 10, el: 14, tam: 3, mira: [-3.32, EJE_G, ZA] } },
    { id: 'turbinaGas', ancla: [-2.65, EJE_G + 0.8, ZA], vista: { az: 12, el: 12, tam: 2.9, mira: [-2.2, EJE_G, ZA] } },
    { id: 'gen1', ancla: [-6.25, EJE_G + 0.62, ZA], vista: { az: -28, el: 14, tam: 2.6, mira: [-6.25, EJE_G, ZA] } },
    { id: 'recuperador', ancla: [1.2, 3.75, ZA], vista: { az: 10, el: 16, tam: 5.4, mira: [1.1, 1.75, ZA] } },
    { id: 'turbinaVapor', ancla: [5, ST.y + 0.86, ST.z], vista: { az: 6, el: 14, tam: 4.2, mira: [5.25, ST.y + 0.05, ST.z] } },
    { id: 'gen2', ancla: [7.03, ST.y + 0.7, ST.z], vista: { az: 22, el: 14, tam: 2.6, mira: [7, ST.y, ST.z] } },
    { id: 'condensador', ancla: [5.9, 0.42, ST.z + 0.74], vista: { az: -22, el: 20, tam: 3.1, mira: [5.75, 0.55, ST.z] } },
    { id: 'enfriamiento', ancla: [5.85, 2.5, -2.8], vista: { az: 150, el: 22, tam: 5.4, mira: [5.85, 1.2, -2.8] } },
    { id: 'chimenea', ancla: [X.chim, ALTO_CHIM + 0.18, ZA], vista: { az: -20, el: 10, tam: 7.2, mira: [2.4, 2.9, ZA] } },
    { id: 'subestacion', ancla: [0.6, 1.72, 3.65], vista: { az: -10, el: 18, tam: 5, mira: [0.8, 0.8, 3.6] } },
    { id: 'red', ancla: [7.55, 3.55, 4.3], vista: { az: 14, el: 16, tam: 6.4, mira: [5.6, 1.1, 3.6] } },
];

// ------------------------------------------------------------------ la pose
/** Todo lo que necesita posar(): lecturas, cuánto corre por cada tubo (0–1) y la cámara. */
export function pose({ modo = 'combinado', planta = null, carga = 1, tAire = DEF.tAire, altitud = DEF.altitud, humedad = DEF.humedad, enfriar = false, dos = true, min = 0, tipo = 'caliente', noche = 0, adentro = 0, desarme = 0, encendido = 1, verDos = dos ? 1 : 0, t = 0, dt = 0, camara = null } = {}) {
    const lectura = calcular({ modo, planta, carga, tAire, altitud, humedad, enfriar, dos, min, tipo });
    const c = lectura.c;
    const Wmax = EQUIPO.potenciaTG;
    const tg = lectura.carga;
    const sube = clamp01(tg * 3);
    const ab = c.abierto;
    const vp = clamp01(c.parte * (lectura.cargaVapor ** 0.5));
    const fg = {
        aire: tg > 0 ? 0.35 + 0.65 * tg : 0,
        gas: tg,
        gasB: dos ? tg : 0,
        gases: tg > 0 ? 0.3 + 0.7 * tg : 0,
        hrsg: tg > 0 ? (0.3 + 0.7 * tg) * (1 - ab) : 0,
        chimenea: tg > 0 ? (0.3 + 0.7 * tg) * (1 - ab) : 0,
        paso: tg > 0 ? (0.3 + 0.7 * tg) * ab : 0,
        vapor: vp,
        vaporT: vp,
        agua: vp,
        torre: vp > 0.01 ? 0.3 + 0.7 * vp : 0,
        gen1: clamp01(c.g.W / Wmax) * (tg > 0 ? 1 : 0),
        gen2: clamp01(c.brutaVapor / (c.n * 150)),
        red: clamp01(lectura.neta / EQUIPO.dosPorUno),
    };
    const flujos = {};
    for (const L of LINEAS) flujos[L.id] = L.tren === 'B' && !dos ? 0 : (fg[L.grupo] ?? 0);
    const activo = {
        tg: clamp01(tg), tv: vp, red: fg.red, gen1: fg.gen1, gen2: fg.gen2, llama: tg > 0 ? 0.25 + 0.75 * tg : 0, hrsg: fg.hrsg, chimenea: fg.chimenea, paso: fg.paso, torre: fg.torre, gas: fg.gas, enfriar: enfriar ? clamp01(tg * 3) : 0, encendido: sube,
    };
    const cam = camara || { mira: [0.3, 1.5, 0], az: -16, el: 20, d: 38 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, sol: 1 - clamp01(noche), lectura, flujos, activo, abierto: ab, verDos, dos, tEscape: c.g.tEscape,
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'combinado', noche: clamp01((t - 7) / 2), adentro: clamp01((t - 3) / 2) * (1 - clamp01((t - 5.5) / 1)), camara: { mira: [0.3, 1.4, 0], az: lerp(-26, -8, t / DURACION), el: 20, d: 38 } });
}
export function posicionCamara({ mira, az, el, d }) {
    return [mira[0] + d * Math.cos(el) * Math.sin(az), mira[1] + d * Math.sin(el), mira[2] + d * Math.cos(el) * Math.cos(az)];
}

// ------------------------------------------------------------------ revisiones
const dentro = (p, c, h = 0.05) => p[0] >= c[0] - h && p[0] <= c[1] + h && p[1] >= c[2] - h && p[1] <= c[3] + h && p[2] >= c[4] - h && p[2] <= c[5] + h;
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
            const enTubo = LINEAS.some(o => o !== L && o.puntos.some((q, i) => i > 0 && distSeg(p, o.puntos[i - 1], q) < 0.06));
            if (!enEquipo && !enTorre && !enTubo) sueltas.push(`${L.id} (${nombre})`);
        }
    }
    return sueltas;
}
/** Revisión de cifras contra lo publicado de estos equipos. */
export function revisar() {
    const p = [];
    const lejos = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // 1. la turbina de gas, a 15 °C y nivel del mar (Siemens, 2016)
    const g = turbinaGas();
    lejos(g.W, 293, 299, 'MW de la turbina de gas (Siemens: 296)');
    lejos(g.eficiencia, 0.395, 0.408, 'eficiencia en ciclo abierto (Siemens: 40 %)');
    lejos(g.mEsc, 632, 648, 'kg/s de gases (Siemens: 640)');
    lejos(g.tEscape, 622, 638, 'gases de escape en °C (Siemens: 630)');
    lejos(g.rp, 18, 22, 'relación de presión (Siemens Energy: 21; DOE: las pesadas, cerca de 20)');
    lejos(g.tEntra, 1250, 1450, 'gases al entrar a la turbina en °C (DOE: hasta 1,427 en las avanzadas)');
    // 2. el ciclo combinado
    const c2 = central();
    const c1 = central({ dos: false });
    lejos(c1.neta, 432, 448, 'MW en 1×1 (Siemens: 440)');
    lejos(c2.neta, 868, 892, 'MW en 2×1 (Siemens: 880)');
    lejos(c2.eficiencia, 0.595, 0.615, 'eficiencia neta (Siemens: más de 60 %)');
    lejos(c2.brutaVapor, 285, 325, 'MW de la turbina de vapor (Doosan Skoda: clase de 300)');
    lejos(c2.brutaVapor / c2.brutaGas, 0.48, 0.55, 'vapor entre gas (JICA: 0.53)');
    lejos(c2.r.tChim, 75, 110, 'gases en la chimenea en °C (JICA: 101)');
    lejos(c2.st.pC, 0.03, 0.07, 'presión del condensador en bar');
    lejos(c2.st.xSale, 0.85, 0.96, 'calidad a la salida de la turbina de vapor');
    lejos(c2.reparto.gas + c2.reparto.vapor + c2.reparto.torre + c2.reparto.chimenea, 0.97, 1.0, 'reparto del calor');
    lejos(c2.co2MWh, 0.3, 0.36, 't de CO₂ por MWh en ciclo combinado');
    const ab = central({ abierto: 1 });
    lejos(ab.neta, 2 * 296 * (1 - AUX) - 5, 2 * 296 * (1 - AUX) + 5, 'MW en ciclo abierto');
    lejos(ab.co2MWh / c2.co2MWh, 1.4, 1.6, 'CO₂ del ciclo abierto entre el combinado');
    lejos(c2.Qgas / ab.neta / (c2.Qgas / c2.neta), 1.4, 1.6, 'gas por MWh, abierto entre combinado (EIA: 10,000 contra 7,146 Btu/kWh: 1.4)');
    // 3. Empalme I (CFE: 770 MW) es de este equipo; las fuentes no dicen a qué temperatura se midió. El modelo llega a esa cifra con calor de Sonora.
    lejos(tEnQueDa(EQUIPO.empalme1), 28, 42, 'temperatura a la que el modelo da los 770 MW de Empalme I');
    lejos(tEnQueDa(EQUIPO.empalme2), 22, 38, 'temperatura a la que el modelo da los 791 MW de Empalme II');
    // 4. clima: JICA, de 10 a 35 °C
    const [c10, c35, c45] = [10, 35, 45].map(t => central({ tAire: t, humedad: 65 }));
    lejos(c35.neta / c10.neta, 0.85, 0.89, 'potencia de 10 a 35 °C (JICA: -13 %)');
    lejos(c10.eficiencia - c35.eficiencia, 0.004, 0.022, 'puntos de eficiencia de 10 a 35 °C (JICA: 1.4)');
    lejos(c45.neta / c10.neta, 0.78, 0.84, 'potencia a 45 °C (JICA: cerca de -18 %)');
    const t2240 = central({ altitud: 2240 });
    lejos(1 - t2240.neta / c2.neta, 0.2, 0.27, 'pérdida a 2,240 m (Power Engineering: 3.5 % cada 1,000 pies, 25.7 %)');
    lejos(1 - turbinaGas({ tAire: 38 }).W / g.W, 0.1, 0.24, 'turbina de gas a 38 °C');
    const sinF = turbinaGas({ tAire: 40, humedad: 28 });
    const conF = turbinaGas({ tAire: 40, humedad: 28, enfriar: true });
    lejos(aireEntrada({ tAire: 40, humedad: 28 }) - conF.tAireC, 10, 14, 'grados que quita el enfriador en clima seco (Power Engineering: 12)');
    lejos(conF.W / sinF.W - 1, 0.06, 0.13, 'lo que recupera el enfriador (Power Engineering: 8.5 %)');
    // 5. arranque
    lejos(ARRANQUES.caliente.total, 30, 30, 'minutos en caliente (Siemens)');
    lejos(ARRANQUES.frio.total, 240, 240, 'minutos en frío (JICA, máximo)');
    lejos((296 / RAMPA_MW_MIN), 9.5, 10.5, 'minutos para subir la turbina a 30 MW/min (Siemens)');
    lejos(arranque(30, 'caliente').tg + arranque(30, 'caliente').vapor, 2, 2, 'al final del arranque van las dos');
    // 6. carga parcial
    const m50 = central({ carga: 0.5 });
    lejos(m50.eficiencia, 0.5, 0.59, 'eficiencia a media carga');
    lejos(central({ carga: 0.5 }).neta / c2.neta, 0.47, 0.56, 'potencia a media carga');
    const ss = puntasSueltas();
    if (ss.length) p.push(`Tubos con una punta suelta: ${ss.join(', ')}`);
    return p;
}
/** A qué temperatura da la central esos MW netos. */
export function tEnQueDa(mw, o = {}) {
    let [a, b] = [0, 55];
    for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (central({ tAire: m, ...o }).neta > mw) a = m; else b = m; }
    return (a + b) / 2;
}
