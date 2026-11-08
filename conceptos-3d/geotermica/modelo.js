// La central geotérmica como cifras puras: la termodinámica de cada ciclo, el acomodo de la central y qué corre por cada tubo.
// Sin three.js ni DOM. El tablero, las gráficas y las partículas leen calcular(), así no pueden contradecirse.
//
// Central de ejemplo, con cifras típicas; no es una central real. Su tamaño es el de las unidades de flasheo de México
// (Los Azufres y Los Humeros: 26.3 MW; Cerro Prieto IV: 26.95 MW brutos, 25 netos):
// - Cuatro pozos de 55 kg/s (unas 200 t/h de agua y vapor, de las que unas 50 son vapor). Los Azufres dio 40 t/h de vapor por pozo en 2017.
// - Ciclo principal, vapor flasheado: el yacimiento es agua líquida saturada a T. En el separador, a menor presión, una
//   fracción x se vuelve vapor: x = (hf(T) − hf(Ts)) / hfg(Ts). El vapor se expande en la turbina hasta el condensador.
//   Con la regla de Baumann, la turbina rinde menos mientras más húmedo sale el vapor: η = 0.85 · (1 + x) / 2.
// - Vapor seco: el pozo da vapor sin agua. Entre más presión se pide en la boca del pozo, menos vapor da (curva de entrega
//   elíptica, de ejemplo).
// - Ciclo binario: el agua caliente hierve isopentano en un circuito cerrado que se enfría con aire.
// - A 30 años: el yacimiento es un solo tanque con recarga natural (modelo de parámetros agrupados). Es para ver la tendencia,
//   no para pronosticar un campo: un campo real además perfora pozos nuevos.
//
// Tablas de saturación: IAPWS-IF97 para el agua e Isopentano de Helmholtz, calculadas con CoolProp 8.
// Cada cifra se compara en revisar() con lo publicado: casos de Gicquel (2007) y consumos de Flores-Armenta et al. (2014).

export const DURACION = 12;
export const FPS = 60;
const D2R = Math.PI / 180;
const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;

// ------------------------------------------------------------------ tablas: T °C, P bar, hf, hg kJ/kg, sf, sg kJ/kg·K
export const AGUA = {
    nombre: 'agua', cpVapor: 2,
    filas: [[20, 0.0234, 83.9, 2537.4, 0.2965, 8.666], [30, 0.0425, 125.7, 2555.5, 0.4368, 8.452], [40, 0.0738, 167.5, 2573.5, 0.5724, 8.2555], [45, 0.0959, 188.4, 2582.4, 0.6386, 8.1633], [50, 0.1235, 209.3, 2591.3, 0.7038, 8.0748], [60, 0.1995, 251.2, 2608.8, 0.8313, 7.9081], [70, 0.312, 293.1, 2626.1, 0.9551, 7.754], [80, 0.4741, 335, 2643, 1.0756, 7.6111], [90, 0.7018, 377, 2659.5, 1.1929, 7.4781], [100, 1.0142, 419.2, 2675.6, 1.3072, 7.3541], [110, 1.4338, 461.4, 2691.1, 1.4188, 7.2381], [120, 1.9867, 503.8, 2705.9, 1.5279, 7.1291], [130, 2.7028, 546.4, 2720.1, 1.6346, 7.0264], [140, 3.6154, 589.2, 2733.4, 1.7392, 6.9293], [150, 4.7616, 632.2, 2745.9, 1.8418, 6.8371], [160, 6.1823, 675.5, 2757.4, 1.9426, 6.7491], [170, 7.9219, 719.1, 2767.9, 2.0417, 6.665], [180, 10.0281, 763.1, 2777.2, 2.1392, 6.584], [190, 12.5524, 807.4, 2785.3, 2.2355, 6.5059], [200, 15.5493, 852.3, 2792, 2.3305, 6.4302], [210, 19.0767, 897.6, 2797.3, 2.4245, 6.3563], [220, 23.1959, 943.6, 2800.9, 2.5177, 6.284], [230, 27.9709, 990.2, 2802.9, 2.6101, 6.2128], [240, 33.4693, 1037.6, 2803, 2.702, 6.1423], [250, 39.7617, 1085.8, 2800.9, 2.7935, 6.0721], [260, 46.9226, 1135, 2796.6, 2.8849, 6.0016], [270, 55.0299, 1185.3, 2789.7, 2.9765, 5.9304], [280, 64.1658, 1236.9, 2779.9, 3.0685, 5.8579], [290, 74.4178, 1290, 2766.7, 3.1612, 5.7834], [300, 85.879, 1345, 2749.6, 3.2552, 5.7059], [310, 98.6505, 1402.2, 2727.9, 3.351, 5.6244], [320, 112.8429, 1462.2, 2700.6, 3.4494, 5.5372], [330, 128.5805, 1525.9, 2666, 3.5518, 5.4422], [340, 146.0068, 1594.5, 2621.8, 3.6601, 5.3356], [350, 165.2942, 1670.9, 2563.6, 3.7784, 5.211], [360, 186.6601, 1761.7, 2481.5, 3.9167, 5.0536], [370, 210.4356, 1890.7, 2334.5, 4.1112, 4.8012]],
    critico: [373.95, 220.64, 2084.3, 2084.3, 4.407, 4.407],
};
export const ISOPENTANO = {
    nombre: 'isopentano', cpVapor: 1.8,
    filas: [[20, 0.7666, -17.8, 331.5, -0.0597, 1.1316], [30, 1.0917, 5, 346.6, 0.0165, 1.1433], [40, 1.5151, 28.3, 361.9, 0.0919, 1.1573], [50, 2.0551, 52.2, 377.4, 0.1666, 1.1731], [60, 2.7313, 76.6, 393, 0.2408, 1.1906], [70, 3.564, 101.7, 408.7, 0.3145, 1.2092], [80, 4.5748, 127.4, 424.4, 0.3878, 1.2289], [90, 5.7861, 153.8, 440.1, 0.4608, 1.2493], [100, 7.2214, 180.9, 455.6, 0.5337, 1.2701], [110, 8.9052, 208.8, 471, 0.6066, 1.291], [120, 10.8638, 237.5, 486, 0.6796, 1.3117], [130, 13.1249, 267.2, 500.4, 0.753, 1.3316], [140, 15.719, 297.9, 514.1, 0.8271, 1.3503], [150, 18.6804, 330, 526.6, 0.9022, 1.3669], [160, 22.0493, 363.8, 537.3, 0.9792, 1.3799], [170, 25.8762, 400, 544.8, 1.0597, 1.3864], [180, 30.2334, 441.1, 545, 1.1488, 1.378]],
    critico: [187.2, 33.78, 503.6, 503.6, 1.2827, 1.2827],
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
export const POZOS = 4;
export const KGS_POZO = 55; // kg/s de agua y vapor por pozo
export const M_TOTAL = POZOS * KGS_POZO;
export const T_COND = 50; // °C en el condensador: 0.12 bar, como en Gicquel (2007), por los gases que trae el vapor
export const ETA_GEN = 0.98;
export const AUX_FLASH = 0.07; // bombas, ventiladores y extracción de gases: Cerro Prieto IV da 26.95 MW brutos y 25 netos
export const AUX_BINARIO = 0.15; // Berlín, El Salvador: 9.2 MW brutos y 7.8 netos
export const FRAC_GASES = 0.014; // gases en el vapor: 1.4 % en peso en Cerro Prieto
export const T_REF = 50; // °C: la eficiencia se mide contra regresar toda el agua a 50 °C (Gicquel, 2007)
const FRAC_EVAP = 0.8; // parte del calor de la torre que se va evaporando agua; lo demás calienta el aire
const CP_AGUA = 4.25; // kJ/kg·K entre 75 y 200 °C
export const DEF = { tempYac: 280, pSep: 8, pSeco: 8, tempBin: 150, reinyecta: 0.83, anio: 0 };
export const LIMITES = { tempYac: [200, 340], pSep: [1.5, 25], pSeco: [2, 25], tempBin: [100, 200] };

/** Expansión en la turbina desde vapor saturado a Tin hasta Tc, con la regla de Baumann. */
export function turbina(Tin, Tc = T_COND) {
    const e = sat(AGUA, Tin);
    const c = sat(AGUA, Tc);
    const h3 = e.hg;
    const s3 = e.sg;
    const hfg = c.hg - c.hf;
    const xs = (s3 - c.sf) / (c.sg - c.sf);
    const h4s = c.hf + xs * hfg;
    const A = 0.425 * (h3 - h4s);
    const h4 = (h3 - A * (1 - c.hf / hfg)) / (1 + A / hfg);
    const x4 = (h4 - c.hf) / hfg;
    return { h3, s3, h4, h4s, x4, dh: h3 - h4, eta: (h3 - h4) / (h3 - h4s), s4: c.sf + x4 * (c.sg - c.sf) };
}
function balanceTorre(mv, t, cond) {
    const Qtorre = mv * (t.h4 - cond.hf); // kW
    const a30 = sat(AGUA, 30);
    const evap = (FRAC_EVAP * Qtorre) / (a30.hg - a30.hf);
    return { Qtorre, evap, excedente: Math.max(0, mv - evap), enfriamiento: Qtorre / (4.18 * 10) };
}
/** Vapor flasheado: agua saturada a tempYac, separador a pSep bar, m kg/s. */
export function flash({ tempYac = DEF.tempYac, pSep = DEF.pSep, m = M_TOTAL } = {}) {
    const Ts = tSat(AGUA, pSep);
    const y = sat(AGUA, tempYac);
    const s = sat(AGUA, Ts);
    const cond = sat(AGUA, T_COND);
    const x = Math.max(0, (y.hf - s.hf) / (s.hg - s.hf));
    const mv = x * m;
    const mb = m - mv;
    const t = turbina(Ts);
    const bruta = (mv * t.dh * ETA_GEN) / 1000;
    const neta = bruta * (1 - AUX_FLASH);
    const torre = balanceTorre(mv, t, cond);
    const Qref = m * (y.hf - cond.hf);
    const regresa = mb + torre.excedente;
    return {
        tempYac, pSep, Ts, m, x, mv, mb, t, bruta, neta, Qref, ...torre, regresa, rMax: m > 0 ? regresa / m : 0,
        pYac: y.P, eficiencia: Qref > 0 ? (bruta * 1000) / Qref : 0, consumo: bruta > 0 ? (mv * 3.6) / bruta : 0, gases: mv * FRAC_GASES,
        reparto: Qref > 0 ? { electricidad: (bruta * 1000) / Qref, torre: torre.Qtorre / Qref, regresa: (mb * (s.hf - cond.hf)) / Qref } : { electricidad: 0, torre: 0, regresa: 0 },
    };
}
/** El separador que da más potencia para un yacimiento: se busca, no se supone. */
export function pSepOptimo(tempYac) {
    let mejor = [DEF.pSep, -1];
    for (let p = LIMITES.pSep[0]; p <= LIMITES.pSep[1]; p += 0.1) {
        const w = flash({ tempYac, pSep: p }).bruta;
        if (w > mejor[1]) mejor = [p, w];
    }
    return mejor[0];
}
export const SECO = { pozoMax: 25, pMax: 30 }; // kg/s por pozo con la válvula abierta; bar con el pozo cerrado
/** Vapor seco: el pozo entrega menos vapor mientras más presión se le pide. */
export function seco({ pSeco = DEF.pSeco } = {}) {
    const Ts = tSat(AGUA, pSeco);
    const cond = sat(AGUA, T_COND);
    const mv = POZOS * SECO.pozoMax * Math.sqrt(Math.max(0, 1 - (pSeco / SECO.pMax) ** 2));
    const t = turbina(Ts);
    const bruta = (mv * t.dh * ETA_GEN) / 1000;
    const torre = balanceTorre(mv, t, cond);
    const Qref = mv * (t.h3 - cond.hf);
    return { pSeco, Ts, mv, m: mv, x: 1, mb: 0, t, bruta, neta: bruta * (1 - AUX_FLASH), Qref, ...torre, regresa: torre.excedente, rMax: mv > 0 ? torre.excedente / mv : 0, eficiencia: Qref > 0 ? (bruta * 1000) / Qref : 0, consumo: bruta > 0 ? (mv * 3.6) / bruta : 0, gases: mv * FRAC_GASES, reparto: { electricidad: Qref > 0 ? (bruta * 1000) / Qref : 0, torre: Qref > 0 ? torre.Qtorre / Qref : 0, regresa: 0 } };
}
export const BIN = { tCond: 40, pinch: 5, tMinSalida: 70, etaTurb: 0.85 };
/** Ciclo binario con isopentano. Se busca la temperatura de ebullición que da más potencia, sin enfriar el agua abajo del límite. */
export function binario({ tempBin = DEF.tempBin, m = M_TOTAL, tMinSalida = BIN.tMinSalida } = {}) {
    const fl = ISOPENTANO;
    const c = sat(fl, BIN.tCond);
    let mejor = null;
    for (let Te = 55; Te <= Math.min(tempBin - BIN.pinch - 2, 170); Te += 1) {
        const e = sat(fl, Te);
        const Tpp = Te + BIN.pinch;
        const hLiq = c.hf + ((e.P - c.P) * 100 * 0.0016); // el líquido sale de la bomba: 1.6 L/kg
        let mf = (m * CP_AGUA * (tempBin - Tpp)) / (e.hg - e.hf);
        let Tout = Tpp - (mf * (e.hf - hLiq)) / (m * CP_AGUA);
        if (Tout < tMinSalida) {
            // no se puede enfriar más: baja el isopentano
            mf = (m * CP_AGUA * (tempBin - tMinSalida)) / (e.hg - hLiq);
            Tout = tMinSalida;
        }
        const ds = e.sg - c.sg;
        const h4s = c.hg + fl.cpVapor * (BIN.tCond + 273.15) * (Math.exp(Math.max(0, ds) / fl.cpVapor) - 1);
        const dh = BIN.etaTurb * (e.hg - h4s);
        const bruta = (mf * dh * ETA_GEN) / 1000;
        if (!mejor || bruta > mejor.bruta) mejor = { Te, Tpp, mf, Tout, dh, bruta, h4s, hLiq, e, c, h4: e.hg - dh };
    }
    const a = sat(AGUA, tempBin);
    const r = sat(AGUA, T_REF);
    const Qref = m * (a.hf - r.hf);
    if (!mejor) return { tempBin, m, mf: 0, Te: 0, Tout: tempBin, bruta: 0, neta: 0, Qref, eficiencia: 0, evap: 0, regresa: m, rMax: 1, gases: 0, reparto: { electricidad: 0, torre: 0, regresa: 1 } };
    const qIn = m * CP_AGUA * (tempBin - mejor.Tout);
    return { tempBin, m, ...mejor, neta: mejor.bruta * (1 - AUX_BINARIO), Qref, qIn, eficiencia: (mejor.bruta * 1000) / Qref, cicloEf: (mejor.bruta * 1000) / qIn, evap: 0, regresa: m, rMax: 1, gases: 0, reparto: { electricidad: (mejor.bruta * 1000) / Qref, torre: (qIn - mejor.bruta * 1000) / Qref, regresa: (Qref - qIn) / Qref } };
}

// ------------------------------------------------------------------ a 30 años: un tanque con recarga natural
export const TANQUE = { sigma: M_TOTAL / 30, tau: 12, caidaMax: 45, tRuptura: 12, dTmax: 15, tauT: 25 };
const cacheAnios = new Map();
/** Lo que pasa cada trimestre durante 30 años, si regresa la fracción R de lo que se saca. */
export function treintaAnios(R = DEF.reinyecta, tempYac = DEF.tempYac, pSep = DEF.pSep) {
    const clave = `${R.toFixed(3)}|${tempYac}|${pSep}`;
    if (cacheAnios.has(clave)) return cacheAnios.get(clave);
    const { sigma, tau, caidaMax, tRuptura, dTmax, tauT } = TANQUE;
    const paso = 0.25;
    const filas = [];
    let dp = 0;
    for (let i = 0; i <= 30 / paso; i++) {
        const anio = i * paso;
        const m = M_TOTAL * Math.max(0.1, 1 - dp / caidaMax);
        const T = tempYac - (anio > tRuptura ? dTmax * R * (1 - Math.exp(-(anio - tRuptura) / tauT)) : 0);
        const f = flash({ tempYac: T, pSep, m });
        filas.push({ anio, dp, m, T, mw: f.neta, mv: f.mv, regresa: m * R });
        dp += (paso * (m * (1 - R) - sigma * dp)) / (sigma * tau);
    }
    if (cacheAnios.size > 200) cacheAnios.clear();
    cacheAnios.set(clave, filas);
    return filas;
}
/** La fila de cualquier año, con los valores entre trimestres. */
export function enAnio(anio, R, tempYac, pSep) {
    const filas = treintaAnios(R, tempYac, pSep);
    const u = Math.min(30, Math.max(0, anio)) / 0.25;
    const i = Math.min(filas.length - 2, Math.floor(u));
    const [a, b] = [filas[i], filas[i + 1]];
    const k = u - i;
    const r = {};
    for (const c of Object.keys(a)) r[c] = lerp(a[c], b[c], k);
    return r;
}

/**
 * Las lecturas de la central. modo: 'flash' | 'seco' | 'binario' | 'anios'.
 */
export function calcular({ modo = 'flash', tempYac = DEF.tempYac, pSep = DEF.pSep, pSeco = DEF.pSeco, tempBin = DEF.tempBin, reinyecta = DEF.reinyecta, anio = DEF.anio } = {}) {
    const r = { modo, flash: null, seco: null, binario: null, anios: null };
    if (modo === 'flash') r.flash = flash({ tempYac, pSep });
    else if (modo === 'seco') r.seco = seco({ pSeco });
    else if (modo === 'binario') r.binario = binario({ tempBin });
    else {
        const rMax = flash({ tempYac, pSep }).rMax;
        const R = Math.min(reinyecta, rMax);
        const fila = enAnio(anio, R, tempYac, pSep);
        r.anios = { ...fila, R, rMax, f: flash({ tempYac: fila.T, pSep, m: fila.m }), caidaPct: fila.dp / TANQUE.caidaMax };
    }
    r.neta = (r.flash || r.seco || r.binario || r.anios.f).neta;
    return r;
}
/** Los puntos de un ciclo para el diagrama temperatura y entropía. */
export function puntosCiclo(L) {
    if (L.flash || L.anios) {
        const f = L.flash || L.anios.f;
        const y = sat(AGUA, f.tempYac);
        const s = sat(AGUA, f.Ts);
        const c = sat(AGUA, T_COND);
        const s2 = s.sf + f.x * (s.sg - s.sf);
        return { tabla: AGUA, ruta: [[y.sf, y.T], [s2, f.Ts], [s.sg, f.Ts], [f.t.s4, T_COND], [c.sf, T_COND]], puntos: [{ n: 1, nombre: 'Yacimiento', T: y.T, s: y.sf, P: y.P, h: y.hf }, { n: 2, nombre: 'Entra al separador', T: f.Ts, s: s2, P: s.P, h: y.hf }, { n: 3, nombre: 'Vapor a la turbina', T: f.Ts, s: s.sg, P: s.P, h: s.hg }, { n: 4, nombre: 'Sale de la turbina', T: T_COND, s: f.t.s4, P: c.P, h: f.t.h4 }, { n: 5, nombre: 'Agua del condensador', T: T_COND, s: c.sf, P: c.P, h: c.hf }, { n: 6, nombre: 'Agua separada', T: f.Ts, s: s.sf, P: s.P, h: s.hf }], otra: [[s2, f.Ts], [s.sf, f.Ts]] };
    }
    if (L.seco) {
        const f = L.seco;
        const s = sat(AGUA, f.Ts);
        const c = sat(AGUA, T_COND);
        return { tabla: AGUA, ruta: [[s.sg, f.Ts], [f.t.s4, T_COND], [c.sf, T_COND]], puntos: [{ n: 1, nombre: 'Vapor a la turbina', T: f.Ts, s: s.sg, P: s.P, h: s.hg }, { n: 2, nombre: 'Sale de la turbina', T: T_COND, s: f.t.s4, P: c.P, h: f.t.h4 }, { n: 3, nombre: 'Agua del condensador', T: T_COND, s: c.sf, P: c.P, h: c.hf }], otra: null };
    }
    const f = L.binario;
    if (!f.e) return { tabla: ISOPENTANO, ruta: [], puntos: [], otra: null };
    const s4 = f.c.sg + ISOPENTANO.cpVapor * Math.log(1 + Math.max(0, f.h4 - f.c.hg) / (ISOPENTANO.cpVapor * (BIN.tCond + 273.15)));
    return { tabla: ISOPENTANO, ruta: [[f.c.sf, BIN.tCond], [f.e.sf, f.Te], [f.e.sg, f.Te], [s4, BIN.tCond + (f.h4 - f.c.hg) / ISOPENTANO.cpVapor], [f.c.sg, BIN.tCond], [f.c.sf, BIN.tCond]], puntos: [{ n: 1, nombre: 'Isopentano líquido', T: BIN.tCond, s: f.c.sf, P: f.c.P, h: f.c.hf }, { n: 2, nombre: 'Empieza a hervir', T: f.Te, s: f.e.sf, P: f.e.P, h: f.e.hf }, { n: 3, nombre: 'Vapor a la turbina', T: f.Te, s: f.e.sg, P: f.e.P, h: f.e.hg }, { n: 4, nombre: 'Sale de la turbina', T: BIN.tCond + (f.h4 - f.c.hg) / ISOPENTANO.cpVapor, s: s4, P: f.c.P, h: f.h4 }], otra: null };
}

// ------------------------------------------------------------------ acomodo: bloque de tierra, equipos y tubos
export const BLOQUE = { x: [-6, 6], z: [-4.2, 3.3], y: [-5, 0] };
export const KM = 1.25; // unidades por kilómetro en el corte; la planta de arriba no está a esa escala
// Las fronteras entre capas, onduladas para que se lean como roca. Las usan la geometría y el dibujo del corte.
export const FRONTERA = {
    sello: x => -1.02 - 0.09 * Math.sin(x * 0.7 + 1) - 0.05 * Math.sin(x * 1.9),
    yacimiento: x => -1.86 - 0.12 * Math.sin(x * 0.55 + 0.4) - 0.05 * Math.sin(x * 2.3 + 1),
    roca: x => -3.76 - 0.1 * Math.sin(x * 0.8 + 2) - 0.04 * Math.sin(x * 2.1),
};
export const FLUIDOS = {
    caliente: { nombre: 'Agua caliente del pozo', color: '#ff5a36' },
    vapor: { nombre: 'Vapor', color: '#e0457b' },
    separada: { nombre: 'Agua separada', color: '#b8772a' },
    enfriamiento: { nombre: 'Agua de enfriamiento', color: '#16a9d4' },
    regresa: { nombre: 'Agua que regresa', color: '#3558e8' },
    gases: { nombre: 'Gases', color: '#8a8f55' },
    isopentano: { nombre: 'Isopentano', color: '#9b5de5' },
    elec: { nombre: 'Electricidad', color: '#ffb000' },
};
export const X_PRODUCTORES = [-5.2, -4.4, -3.6, -2.8];
export const X_INYECTORES = [3.2, 4.4];
const FONDO_P = [[-5.5, -3.3], [-4.6, -3.45], [-3.3, -3.25], [-2.1, -3.4]];
const FONDO_R = [[3.55, -3.3], [4.95, -3.2]];
const Z_CORTE = 3.32;
const Z_POZO = 3.14;
// Cada caja: x0, x1, y0, y1, z0, z1. Las pinta planta.js y con ellas se revisa que cada tubo llegue a un equipo.
export const EQUIPOS = {
    yacimiento: [-6, 6, -3.9, -1.75, 3, 3.4],
    ...Object.fromEntries(X_PRODUCTORES.map((x, i) => [`pozo${i + 1}`, [x - 0.16, x + 0.16, -0.2, 0.9, 2.95, 3.3]])),
    ...Object.fromEntries(X_INYECTORES.map((x, i) => [`inyector${i + 1}`, [x - 0.16, x + 0.16, -0.2, 0.7, 2.95, 3.3]])),
    silenciador: [-3.82, -2.98, 0, 1.1, 0.93, 1.77],
    separador: [-2.42, -1.58, 0, 2.4, 0.18, 1.02],
    turbina: [-0.1, 1.4, 1.1, 1.85, -1.25, -0.55],
    generador: [1.4, 2.45, 1.1, 1.85, -1.25, -0.55],
    condensador: [-0.05, 1.25, 0.05, 0.95, -1.3, -0.5],
    extractor: [0.15, 0.65, 0.85, 1.05, -1.6, -1.3],
    torre: [3, 5.6, 0, 1.9, -3, -1.2],
    bomba: [2.2, 2.6, 0, 0.45, 2.42, 2.82],
    laguna: [4.75, 5.85, -0.02, 0.2, -0.7, 3],
    evaporador: [-5.05, -3.75, 0.2, 0.85, -0.48, 0],
    turbinaBin: [-3.63, -2.85, 0.2, 0.75, -0.98, -0.5],
    aire: [-4.85, -2.75, 0.5, 1.25, -1.48, -1.05],
    bombaBin: [-4.15, -3.85, 0, 0.3, -0.9, -0.6],
    trafo: [2.95, 3.85, 0, 1.2, 0.25, 1.45],
    portico: [4.05, 4.55, 0, 1.95, 0.6, 1.2],
    reductora: [-3.5, -2.7, 0, 1.6, -3.95, -3.2],
    pueblo: [-5.7, -4.2, 0, 1, -4, -2.6],
};
const catenaria = (a, b, flecha, n = 5) => Array.from({ length: n + 1 }, (_, i) => { const k = i / n; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - flecha * 4 * k * (1 - k), lerp(a[2], b[2], k)]; });
const unir = (...tramos) => tramos.reduce((acc, t) => acc.concat(acc.length ? t.slice(1) : t), []);
export const TORRES = [[5.72, -0.92], [5.5, -3.72], [2.3, -3.82], [-0.8, -3.82]];
const ALTO_TORRE = 2.9;
const puntasTorre = TORRES.map(([x, z]) => [x, ALTO_TORRE, z]);
const MODOS = ['flash', 'seco', 'binario', 'anios'];
const VAPOR = ['flash', 'seco', 'anios'];
const FLASH = ['flash', 'anios'];
// modos: en cuáles corre. fluido: de qué color va; porModo lo cambia (los pozos dan vapor en vapor seco).
export const LINEAS = [
    ...X_PRODUCTORES.map((x, i) => ({ id: `pozo${i + 1}`, grupo: 'pozos', fluido: 'caliente', porModo: { seco: 'vapor' }, modos: MODOS, r: 0.05, bajoTierra: true, puntos: [[FONDO_P[i][0], FONDO_P[i][1], Z_CORTE], [lerp(FONDO_P[i][0], x, 0.45), -2.1, Z_CORTE], [lerp(FONDO_P[i][0], x, 0.85), -1, Z_CORTE], [x, -0.08, Z_CORTE], [x, 0.03, Z_POZO + 0.08], [x, 0.1, Z_POZO], [x, 0.55, Z_POZO]] })),
    ...X_PRODUCTORES.map((x, i) => ({ id: `ramal${i + 1}`, grupo: 'pozos', fluido: 'caliente', porModo: { seco: 'vapor' }, modos: MODOS, r: 0.04, puntos: [[x, 0.55, Z_POZO], [x, 0.55, 2.45]] })),
    { id: 'colector', grupo: 'pozos', fluido: 'caliente', porModo: { seco: 'vapor' }, modos: MODOS, r: 0.06, puntos: [[-5.2, 0.55, 2.45], [-2, 0.55, 2.45], [-2, 0.55, 1.75], [-1.92, 1.5, 1.4], [-1.72, 1.5, 0.98]] },
    { id: 'silencio', grupo: 'quieto', fluido: 'caliente', porModo: { seco: 'vapor' }, modos: [], r: 0.035, puntos: [[-3.4, 0.55, 2.45], [-3.4, 0.55, 1.7]] },
    { id: 'vaporSep', grupo: 'vaporSep', fluido: 'vapor', modos: FLASH, r: 0.06, puntos: [[-2, 2.34, 0.6], [-2, 2.62, 0.6], [-1.35, 2.62, 0.6], [-1.35, 1.1, 0.6]] },
    { id: 'directo', grupo: 'directo', fluido: 'vapor', modos: ['seco'], r: 0.06, puntos: [[-2, 0.55, 1.9], [-1.28, 0.62, 1.72], [-1.2, 0.9, 1.1], [-1.35, 1.1, 0.6]] },
    { id: 'vaporducto', grupo: 'vapor', fluido: 'vapor', modos: VAPOR, r: 0.06, puntos: [[-1.35, 1.1, 0.6], [-1.35, 1.1, -0.35], [-1.12, 1.1, -0.35], [-1.12, 1.1, -1.3], [-0.72, 1.1, -1.3], [-0.72, 1.1, -0.35], [-0.42, 1.1, -0.35], [-0.32, 1.72, -0.42], [-0.08, 1.74, -0.72], [0.02, 1.7, -0.9]] },
    { id: 'escape', grupo: 'vapor', fluido: 'vapor', modos: VAPOR, r: 0.1, puntos: [[1.1, 1.14, -0.9], [1.1, 0.9, -0.9]] },
    { id: 'separada', grupo: 'separada', fluido: 'separada', modos: FLASH, r: 0.055, puntos: [[-1.75, 0.2, 0.85], [-1.35, 0.2, 1.3], [-1.35, 0.2, 2.62], [2.25, 0.2, 2.62]] },
    { id: 'reinyeccion', grupo: 'regreso', fluido: 'regresa', modos: MODOS, r: 0.055, puntos: [[2.55, 0.2, 2.62], [4.4, 0.2, 2.62]] },
    { id: 'inyecta1', grupo: 'regreso', fluido: 'regresa', modos: MODOS, r: 0.04, puntos: [[3.2, 0.2, 2.62], [3.2, 0.2, Z_POZO]] },
    { id: 'inyecta2', grupo: 'regreso', fluido: 'regresa', modos: MODOS, r: 0.04, puntos: [[4.4, 0.2, 2.62], [4.4, 0.2, Z_POZO]] },
    ...X_INYECTORES.map((x, i) => ({ id: `abajo${i + 1}`, grupo: 'regreso', fluido: 'regresa', modos: MODOS, r: 0.05, bajoTierra: true, puntos: [[x, 0.2, Z_POZO], [x, 0.1, Z_POZO], [x, 0.03, Z_POZO + 0.08], [x, -0.08, Z_CORTE], [lerp(x, FONDO_R[i][0], 0.15), -1, Z_CORTE], [lerp(x, FONDO_R[i][0], 0.55), -2.1, Z_CORTE], [FONDO_R[i][0], FONDO_R[i][1], Z_CORTE]] })),
    { id: 'aLaguna', grupo: 'laguna', fluido: 'separada', modos: ['anios'], r: 0.04, puntos: [[4.4, 0.2, 2.62], [4.6, 0.16, 2.5], [4.86, 0.1, 2.45]] },
    { id: 'aTorre', grupo: 'torre', fluido: 'enfriamiento', modos: VAPOR, r: 0.06, puntos: [[1.2, 0.3, -0.62], [2.2, 0.25, -0.3], [2.72, 0.25, -0.3], [2.85, 0.7, -0.6], [2.85, 1.25, -1.3], [3.25, 1.25, -1.6]] },
    { id: 'deTorre', grupo: 'torre', fluido: 'enfriamiento', modos: VAPOR, r: 0.06, puntos: [[3.1, 0.18, -1.9], [2.6, 0.18, -1.9], [2.6, 0.18, -1.1], [1.2, 0.2, -1.1]] },
    { id: 'purga', grupo: 'purga', fluido: 'regresa', modos: VAPOR, r: 0.04, puntos: [[4.5, 0.15, -1.25], [4.64, 0.15, -0.9], [4.64, 0.15, 2.3], [4.4, 0.2, 2.62]] },
    { id: 'gases1', grupo: 'gases', fluido: 'gases', modos: VAPOR, r: 0.03, puntos: [[0.4, 0.88, -1.2], [0.4, 0.92, -1.4]] },
    { id: 'gases2', grupo: 'gases', fluido: 'gases', modos: VAPOR, r: 0.03, puntos: [[0.4, 0.98, -1.55], [0.4, 1, -2.1], [3.3, 1, -2.1]] },
    { id: 'aBinaria', grupo: 'binaria', fluido: 'caliente', modos: ['binario'], r: 0.055, puntos: [[-4.6, 0.55, 2.45], [-4.6, 0.55, 0.6], [-4.6, 0.55, -0.04]] },
    { id: 'deBinaria', grupo: 'binaria', fluido: 'regresa', modos: ['binario'], r: 0.055, puntos: [[-3.8, 0.3, -0.2], [-3.55, 0.2, -0.2], [-2.7, 0.2, -0.15], [-1.2, 0.2, -0.15], [-1.2, 0.2, 1.1], [-1.35, 0.2, 1.3]] },
    { id: 'aBomba', grupo: 'binaria', fluido: 'regresa', modos: ['binario'], r: 0.056, puntos: [[-1.35, 0.2, 1.3], [-1.35, 0.2, 2.62], [2.25, 0.2, 2.62]] },
    { id: 'iso1', grupo: 'iso', fluido: 'isopentano', modos: ['binario'], r: 0.035, puntos: [[-3.85, 0.78, -0.35], [-3.55, 0.78, -0.48], [-3.4, 0.7, -0.72]] },
    { id: 'iso2', grupo: 'iso', fluido: 'isopentano', modos: ['binario'], r: 0.035, puntos: [[-3.05, 0.6, -0.9], [-3.05, 0.62, -1.12]] },
    { id: 'iso3', grupo: 'iso', fluido: 'isopentano', modos: ['binario'], r: 0.03, puntos: [[-3.95, 0.52, -1.3], [-3.97, 0.25, -1.1], [-3.99, 0.2, -0.86]] },
    { id: 'iso4', grupo: 'iso', fluido: 'isopentano', modos: ['binario'], r: 0.03, puntos: [[-4, 0.2, -0.64], [-4.15, 0.26, -0.4]] },
    { id: 'gen', grupo: 'generador', fluido: 'elec', modos: VAPOR, r: 0.04, puntos: [[2.42, 1.5, -0.9], [2.82, 1.5, -0.5], [3.2, 1.15, 0.7]] },
    { id: 'genBin', grupo: 'binariaE', fluido: 'elec', modos: ['binario'], r: 0.03, puntos: [[-2.9, 0.4, -0.8], [-2.7, 0.12, -0.35], [-1.1, 0.12, 0.12], [2.6, 0.12, 0.12], [3.05, 0.2, 0.6]] },
    { id: 'trafoPortico', grupo: 'red', fluido: 'elec', modos: MODOS, r: 0.03, puntos: [[3.82, 1.1, 0.85], [4.1, 1.72, 0.9]] },
    { id: 'rnt', grupo: 'red', fluido: 'elec', modos: MODOS, r: 0.016, cable: true, puntos: unir(catenaria([4.3, 1.9, 0.9], puntasTorre[0], 0.12), catenaria(puntasTorre[0], puntasTorre[1], 0.35), catenaria(puntasTorre[1], puntasTorre[2], 0.35), catenaria(puntasTorre[2], puntasTorre[3], 0.35), catenaria(puntasTorre[3], [-3.1, 1.55, -3.55], 0.22)) },
    { id: 'rgd', grupo: 'red', fluido: 'elec', modos: MODOS, r: 0.014, cable: true, puntos: unir(catenaria([-3.15, 1.1, -3.55], [-3.8, 0.95, -3.35], 0.04, 3), catenaria([-3.8, 0.95, -3.35], [-4.42, 0.6, -3.3], 0.05, 3)) },
];
// Por dónde viaja el agua dentro del yacimiento, de los inyectores a los productores: se calienta en el camino.
export const CIRCULACION = [
    [[3.55, -3.3], [2, -3.55], [0.4, -3.1], [-1.2, -3.35], [-2.1, -3.4]],
    [[4.95, -3.2], [3.1, -2.75], [1.2, -2.6], [-0.9, -2.8], [-3.3, -3.25]],
    [[3.55, -3.3], [1.8, -2.25], [-0.6, -2.3], [-2.6, -2.55], [-4.6, -3.45]],
    [[4.95, -3.2], [2.4, -3.45], [-0.4, -3.55], [-3, -3.55], [-5.5, -3.3]],
];

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
export const PARTES = [
    { id: 'roca', ancla: [-1, -4.35, 3.3], vista: { az: -6, el: 6, tam: 5.4, mira: [-1, -3.15, 3.3] } },
    { id: 'yacimiento', ancla: [0.2, -2.75, 3.3], vista: { az: -6, el: 8, tam: 7.2, mira: [0.3, -1.55, 3.3] } },
    { id: 'pozo', ancla: [-4, 0.95, 3], vista: { az: -22, el: 22, tam: 5.6, mira: [-3.7, -0.35, 2.3] } },
    { id: 'separador', ancla: [-2, 2.55, 0.6], vista: { az: 14, el: 16, tam: 3.9, mira: [-1.75, 1.2, 0.2] } },
    { id: 'turbina', ancla: [0.65, 1.95, -0.9], vista: { az: 8, el: 18, tam: 2.7, mira: [0.65, 1.42, -0.9] } },
    { id: 'generador', ancla: [1.95, 1.95, -0.9], vista: { az: -14, el: 18, tam: 2.3, mira: [1.95, 1.42, -0.9] } },
    { id: 'condensador', ancla: [0.6, 0.55, -0.45], vista: { az: 10, el: 8, tam: 2.5, mira: [0.6, 0.55, -0.9] } },
    { id: 'torre', ancla: [4.3, 2.1, -2.1], vista: { az: -14, el: 30, tam: 4.3, mira: [4.3, 0.9, -2.1] } },
    { id: 'reinyeccion', ancla: [3.82, -1.25, 3.3], vista: { az: -18, el: 24, tam: 8, mira: [3.9, -1.05, 2.3] } },
    { id: 'binaria', ancla: [-3.75, 1.4, -1.2], vista: { az: -40, el: 28, tam: 3.5, mira: [-3.85, 0.55, -0.7] } },
    { id: 'subestacion', ancla: [3.6, 1.6, 0.9], vista: { az: -16, el: 20, tam: 3.3, mira: [3.7, 0.8, 0.9] } },
    { id: 'red', ancla: [0.8, 3.1, -3.82], vista: { az: 166, el: 22, tam: 11, mira: [0.3, 0.6, -3.6] } },
];

// ------------------------------------------------------------------ la pose
/** Todo lo que necesita posar(): lecturas, cuánto corre por cada tubo (0–1) y la cámara. */
export function pose({ modo = 'flash', tempYac = DEF.tempYac, pSep = DEF.pSep, pSeco = DEF.pSeco, tempBin = DEF.tempBin, reinyecta = DEF.reinyecta, anio = DEF.anio, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null } = {}) {
    const lectura = calcular({ modo, tempYac, pSep, pSeco, tempBin, reinyecta, anio });
    const f = lectura.flash || lectura.seco || lectura.anios?.f || null;
    const b = lectura.binario;
    const fg = {
        pozos: f ? clamp01(f.m / M_TOTAL) : 1,
        vaporSep: f && modo !== 'seco' ? clamp01(f.mv / 90) : 0,
        directo: modo === 'seco' ? 1 : 0,
        vapor: f ? clamp01(f.mv / 90) : 0,
        separada: f && modo !== 'seco' ? clamp01(f.mb / 200) : 0,
        regreso: b ? 1 : f ? clamp01((modo === 'anios' ? lectura.anios.R * f.m : f.regresa) / 200) : 0,
        laguna: modo === 'anios' ? clamp01((lectura.anios.rMax - lectura.anios.R) / Math.max(0.01, lectura.anios.rMax)) : 0,
        torre: f ? clamp01(f.mv / 70) : 0,
        purga: f ? clamp01(f.excedente / 25) : 0,
        gases: f ? clamp01(f.mv / 70) : 0,
        binaria: b ? clamp01(0.2 + b.bruta / 15) : 0,
        iso: b ? clamp01(0.2 + b.bruta / 15) : 0,
        binariaE: b ? clamp01(0.2 + b.bruta / 15) : 0,
        generador: f ? clamp01(f.bruta / 30) : 0,
        red: clamp01(lectura.neta / 30),
        quieto: 0,
    };
    const flujos = {};
    for (const L of LINEAS) flujos[L.id] = L.modos.includes(modo) ? (fg[L.grupo] ?? 0) : 0;
    const activo = { flash: modo === 'flash' || modo === 'anios' ? 1 : 0, vapor: f ? clamp01(f.bruta / 30) : 0, binaria: b ? clamp01(0.2 + b.bruta / 15) : 0, torre: f ? clamp01(f.mv / 70) : 0, separador: f && modo !== 'seco' ? clamp01(f.m / M_TOTAL) : 0, red: clamp01(lectura.neta / 30) };
    const T = modo === 'binario' ? tempBin : modo === 'seco' ? 240 : (lectura.anios?.T ?? tempYac);
    const c = camara || { mira: [0, -0.7, 0], az: -16, el: 20, d: 34 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, sol: 1 - clamp01(noche), lectura, flujos, activo, tempYacimiento: T,
        frio: lectura.anios ? lectura.anios.R : (b || f) ? 0.8 : 0,
        caida: lectura.anios ? lectura.anios.caidaPct : 0,
        camara: { mira: c.mira, az: c.az * D2R, el: c.el * D2R, d: c.d, fov: c.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'flash', noche: clamp01((t - 7) / 2), adentro: clamp01((t - 3) / 2) * (1 - clamp01((t - 5.5) / 1)), camara: { mira: [0, -0.7, 0], az: lerp(-26, -8, t / DURACION), el: 20, d: 34 } });
}
export function posicionCamara({ mira, az, el, d }) {
    return [mira[0] + d * Math.cos(el) * Math.sin(az), mira[1] + d * Math.sin(el), mira[2] + d * Math.cos(el) * Math.cos(az)];
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
            const enTubo = LINEAS.some(o => o !== L && o.puntos.some((q, i) => i > 0 && distSeg(p, o.puntos[i - 1], q) < 0.05));
            if (!enEquipo && !enTorre && !enTubo) sueltas.push(`${L.id} (${nombre})`);
        }
    }
    return sueltas;
}
/** Revisión de cifras contra lo publicado de estos equipos. */
export function revisar() {
    const p = [];
    const lejos = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(3)}, se esperaba entre ${a} y ${b}`); };
    // 1. tablas: valores de referencia
    lejos(sat(AGUA, 100).P, 1.0, 1.03, 'presión del agua a 100 °C');
    lejos(tSat(AGUA, 10), 179, 181, 'temperatura del agua a 10 bar');
    // 2. caso de flasheo de Gicquel (2007): 760 kg/s a 230 °C, flasheo a 6 bar → x = 0.15, 57 MW mecánicos, 9.6 %
    const g = flash({ tempYac: 230, pSep: 6, m: 760 });
    lejos(g.x, 0.145, 0.16, 'Gicquel: fracción de vapor');
    lejos(g.bruta, 50, 60, 'Gicquel: MW');
    lejos(g.eficiencia, 0.085, 0.102, 'Gicquel: eficiencia');
    // 3. caso binario de Gicquel: 310 kg/s a 169 °C → 18.9 MW, 12 % (butano; aquí, isopentano)
    const gb = binario({ tempBin: 169, m: 310 });
    lejos(gb.bruta, 14, 22, 'Gicquel binario: MW');
    lejos(gb.eficiencia, 0.09, 0.14, 'Gicquel binario: eficiencia');
    // 4. caso de vapor directo de Gicquel: 111 kg/s a 5.5 bar → 57.3 MW mecánicos (con 50 °C de sobrecalentamiento)
    const t55 = turbina(tSat(AGUA, 5.5));
    lejos((111 * t55.dh) / 1000, 46, 60, 'Gicquel vapor directo: MW');
    // 5. consumo de vapor: Cerro Prieto reporta de 6.81 a 10.6 t/MWh por unidad
    const f = flash();
    lejos(f.consumo, 6.81, 8.5, 't/MWh de la central');
    lejos(f.x, 0.2, 0.3, 'fracción de vapor de la central');
    lejos(f.mv * 3.6 / POZOS, 40, 60, 't/h de vapor por pozo');
    lejos(f.neta, 23, 28, 'MW netos de la central');
    lejos(f.t.eta, 0.72, 0.85, 'rendimiento de la turbina');
    lejos(f.t.x4, 0.82, 0.92, 'calidad a la salida de la turbina');
    lejos(f.eficiencia, 0.1, 0.14, 'eficiencia de la central');
    lejos(f.rMax, 0.75, 0.9, 'parte que se puede reinyectar');
    lejos(1 - f.rMax, 0.14, 0.3, 'parte que se evapora');
    lejos(f.reparto.electricidad + f.reparto.torre + f.reparto.regresa, 0.97, 1.01, 'reparto del calor');
    // 6. la mejor presión de separación queda a media temperatura entre yacimiento y condensador
    const op = pSepOptimo(280);
    lejos(tSat(AGUA, op), 150, 180, 'temperatura óptima del separador');
    lejos(flash({ tempYac: 200, pSep: 25 }).x, 0, 0, 'flasheo con separador más caliente que el pozo');
    // 7. binario: rinde como Berlín y se enfría a un valor real
    const bb = binario();
    lejos(bb.neta, 3, 8, 'MW netos de la binaria a 150 °C');
    lejos(bb.cicloEf, 0.09, 0.15, 'eficiencia del ciclo binario');
    lejos(bb.Tout, 70, 95, 'temperatura de salida de la binaria');
    lejos(binario({ tempBin: 200 }).bruta / binario({ tempBin: 120 }).bruta, 2.5, 12, 'binaria: más temperatura, más potencia');
    // Berlín, El Salvador: 300 kg/s de agua a 180 °C, sin bajar de 130 °C por la sílice → 9.2 MW brutos
    lejos(binario({ tempBin: 180, m: 300, tMinSalida: 130 }).bruta, 8, 12, 'Berlín: MW brutos');
    // 8. a 30 años: sin reinyección cae mucho más
    const sin = treintaAnios(0).at(-1);
    const con = treintaAnios(f.rMax).at(-1);
    lejos(sin.mw / f.neta, 0.45, 0.72, 'potencia a 30 años sin reinyección');
    lejos(con.mw / f.neta, 0.78, 0.95, 'potencia a 30 años con reinyección');
    lejos(sin.dp, 12, 25, 'caída de presión sin reinyección');
    lejos(con.dp, 1, 8, 'caída de presión con reinyección');
    lejos(sin.T, 279.9, 280, 'sin reinyección no llega agua fría');
    lejos(280 - con.T, 3, 10, 'enfriamiento con reinyección');
    // 9. geometría
    const s = puntasSueltas();
    if (s.length) p.push(`Tubos con una punta suelta: ${s.join(', ')}`);
    return p;
}
