// El modelo del transformador: puro, sin three.js ni DOM. Lo leen la escena, el tablero, las gráficas y las pruebas, así que una cifra
// sale de un solo lugar. La máquina es el banco de autotransformadores AT42 de la Subestación Santa Cruz de la CFE, que une los anillos de
// 400 y 230 kV de la Ciudad de México: tres unidades de una fase, de 110 MVA cada una, con los datos que da una tesis de la UNAM. Lo que
// debe aguantar sale de la especificación CFE K0000-06; cómo se protege, del procedimiento CFE G0100-07; la corriente al energizarlo, de
// los apuntes de Rodríguez Pozueta (Universidad de Cantabria). Lo que no viene en las fuentes está marcado como «de ejemplo».
//
// Cinco formas de verlo: cómo cambia el voltaje (y el flujo del núcleo), por qué es autotransformador, con carga, al energizarlo y una falla.
import { D2R, clamp, clamp01, lerp } from '../planta-comun/ayudas.js';

const R3 = Math.sqrt(3);

// ------------------------------------------------------------------ el banco (tesis UNAM, Subestación Santa Cruz)
/** S en MVA (Su, de cada unidad), voltajes en kV entre fases, z por unidad de 330 MVA. La fase C es la unidad AT421C. */
export const BANCO = { sub: 'Santa Cruz', nombre: 'AT42', unidad: 'AT421C', unidades: 3, Su: 110, S: 330, alta: 400, baja: 230, z: 0.1111, posicion: 17, f: 60 };
/** La relación de transformación: 400 ÷ 230. */
export const A = BANCO.alta / BANCO.baja;
/** Cada unidad va entre una fase y el neutro: kV de cada lado. */
export const FASE = { alta: BANCO.alta / R3, baja: BANCO.baja / R3 };
/** Corriente nominal de cada unidad, en A, de cada lado. */
export const IN = { alta: (BANCO.Su * 1e3) / FASE.alta, baja: (BANCO.Su * 1e3) / FASE.baja };
/** La impedancia base del lado de 400 kV y la del banco en ohms. */
export const ZBASE = BANCO.alta ** 2 / BANCO.S;
/** Prueba de corriente de excitación de la fase C, en la posición 17 del cambiador (la nominal): 10 kV, 18.672 mA, 95.425 W. */
export const PRUEBA = { kV: 10, mA: 18.672, W: 95.425 };

// ------------------------------------------------------------------ las reglas
/**
 * CFE K0000-06: la impedancia de un autotransformador puede diferir ±10 % de la garantizada; debe aguantar una falla externa 2 s sin que
 * el cobre pase de 250 °C; se diseña con X/R = 14, que da un factor de asimetría de 2.55; tabla 6, niveles de falla de diseño; pruebas
 * a 90, 100 y 110 % del voltaje; cambiador bajo carga de ±10 % en 16 pasos de 0.625 % o 10 de 1 %; elevaciones de temperatura.
 */
export const NORMA = {
    zTol: 0.1, falla: { s: 2, cobre: 250 }, xr: 14, asimetria: 2.55,
    diseno: [{ kV: 245, kA: 40, MVA: 17000 }, { kV: 420, kA: 40, MVA: 30000 }],
    pruebas: [90, 100, 110], cambiador: { banda: 10, pasos: [[16, 0.625], [10, 1]] },
    subida: { promedio: 55, caliente: 65, ambiente: 40 },
};
/** CFE G0100-07: la diferencial se bloquea con 12 % de segunda armónica al energizar por alta (15 % en grupo) y con 35 % de quinta; sin restricción, 16 veces. */
export const DIF = { h2: 12, h2Grupo: 15, h5: 35, sinRestriccion: 16 };
/** Rodríguez Pozueta: al conectarlo, el flujo puede llegar al doble más lo que quedó (hasta la mitad): 2.5 veces; la corriente, 5 a 8 veces la nominal. */
export const CONEXION = { doble: 2, remanente: 0.5, veces: [5, 8] };

// ------------------------------------------------------------------ de ejemplo
/**
 * Pérdidas con carga del banco a 330 MVA (kW), la curva del núcleo (dónde está el codo, qué tan brusco es, la reactancia cuando ya se
 * saturó), cuánto tarda en apagarse la corriente al energizarlo, el arranque de la diferencial (de cada 1 de la nominal) y en cuánto
 * despeja una falla adentro: de ejemplo.
 */
export const EJ = { pc: 500, codo: 1.25, nitidez: 25, xAire: 0.24, tau: 1.0, arranque: 0.3, despeje: 0.08, ventiladores: 0.7 };
/** Pérdidas del núcleo del banco (kW): la prueba de 10 kV llevada al voltaje nominal con el cuadrado del voltaje. Estimación. */
export const P0 = (BANCO.unidades * PRUEBA.W * (FASE.alta / PRUEBA.kV) ** 2) / 1000;
/** Corriente de excitación a voltaje nominal, por unidad de la nominal: la de la prueba, en proporción al voltaje. */
export const I0 = ((PRUEBA.mA / 1000) * (FASE.alta / PRUEBA.kV)) / IN.alta;
/** Resistencia y reactancia del banco, por unidad: la resistencia sale de las pérdidas con carga. */
export const RPU = EJ.pc / (BANCO.S * 1000);
export const XPU = Math.sqrt(BANCO.z ** 2 - RPU ** 2);

export const DEF = { v: 100, f: 60, s: 0.8, ang: 25.84, alfa: 0, rem: 0.5, scc: 30000 };
export const LIMITES = { v: [0, 125], f: [54, 63], s: [0, 1.3], ang: [-40, 40], alfa: [0, 180], rem: [-0.5, 0.5], scc: [2000, 40000] };

// ------------------------------------------------------------------ el núcleo
const suave = z => (z > 30 ? z : Math.log1p(Math.exp(z)));
const saturado = x => suave((x - EJ.codo) * EJ.nitidez) / EJ.nitidez / EJ.xAire;
const PENDIENTE = I0 - saturado(1);
/**
 * La curva del núcleo: la corriente que pide (por unidad de la nominal) para cada flujo (por unidad del de 400 kV y 60 Hz). Recta y casi
 * nada hasta el codo; pasado el codo el acero se satura y cada poco de flujo pide mucha corriente, como si no hubiera núcleo. De ejemplo,
 * ajustada a la prueba.
 */
export function magnet(phi) {
    const x = Math.abs(phi);
    return Math.sign(phi) * (PENDIENTE * x + saturado(x));
}
/** Lo que se calienta el núcleo (kW): crece con el cuadrado del flujo; con la frecuencia, mitad en proporción y mitad con su cuadrado. De ejemplo. */
export const nucleo = (phi, f = BANCO.f) => P0 * phi * phi * (0.5 * (f / BANCO.f) + 0.5 * (f / BANCO.f) ** 2);

// ------------------------------------------------------------------ cómo cambia el voltaje
/** Con un voltaje (de cada 100 de 400 kV) y una frecuencia: el otro lado, el flujo (V/Hz) y lo que pide el núcleo. */
export function relacion({ v = DEF.v, f = DEF.f } = {}) {
    const phi = v / 100 / (f / BANCO.f);
    const i = magnet(phi);
    return { v, f, kVa: (v / 100) * BANCO.alta, kVb: (v / 100) * BANCO.baja, phi, vhz: phi * 100, i, iA: i * IN.alta, veces: i / I0, p0: nucleo(phi, f), satura: phi > 1.12, probado: phi <= NORMA.pruebas[2] / 100 + 1e-9 };
}

// ------------------------------------------------------------------ por qué es autotransformador
/** De cada 1 que pasa, la parte que pasa por el núcleo: 1 − 1/a. El resto pasa directo por el cobre. */
export const parteNucleo = (a = A) => (a > 1 ? 1 - 1 / a : 0);
/** Con una carga (de cada 1 de 330 MVA): la corriente de cada lado y la de cada devanado, por fase, y cómo se reparte la potencia. */
export function auto({ s = DEF.s } = {}) {
    const Ia = s * IN.alta;
    const Ib = s * IN.baja;
    const S = s * BANCO.S;
    return { s, S, Ia, Ib, serie: Ia, comun: Ib - Ia, kVserie: FASE.alta - FASE.baja, kVcomun: FASE.baja, nucleo: S * parteNucleo(), cobre: S / A, parte: parteNucleo(), veces: 1 / parteNucleo() };
}

// ------------------------------------------------------------------ con carga
/**
 * Con la red de 400 kV fija en su voltaje: la carga (de cada 1 de 330 MVA) y el ángulo del factor de potencia (positivo, en atraso). El
 * voltaje del lado de 230 kV sale de V1 = V2 + I × (R + jX); las pérdidas, del núcleo (fijas) y del cobre (con el cuadrado de la corriente).
 */
export function carga({ s = DEF.s, ang = DEF.ang } = {}) {
    const c = Math.cos(ang * D2R);
    const sn = Math.sin(ang * D2R);
    let v = 1;
    for (let k = 0; k < 40; k++) {
        const q = s / Math.max(v, 0.3);
        const re = q * (RPU * c + XPU * sn);
        const im = q * (XPU * c - RPU * sn);
        v = Math.sqrt(Math.max(0, 1 - im * im)) - re;
    }
    const i = s / v;
    const pc = EJ.pc * i * i;
    const P = s * c * BANCO.S;
    const perd = pc + P0;
    const caida = (1 - v) * 100;
    const paso = NORMA.cambiador.pasos[0][1];
    return { s, ang, fp: c, atraso: ang > 0.5, adelanto: ang < -0.5, v, kV: v * BANCO.baja, caida, i, I: i * IN.baja, pc, p0: P0, perd, P, Q: s * sn * BANCO.S, eficiencia: P > 0 ? P / (P + perd / 1000) : 0, pasos: Math.ceil(Math.abs(caida) / paso - 1e-9), mejor: Math.sqrt(P0 / EJ.pc), ventiladores: i > EJ.ventiladores };
}

// ------------------------------------------------------------------ al energizarlo
const W = 2 * Math.PI * BANCO.f;
/**
 * El flujo (por unidad) t segundos después de cerrar, si el voltaje valía sen(α) al cerrar y en el núcleo quedaba un flujo φr: la parte
 * que pide la red más una que empieza igual y contraria y se apaga despacio. Si se cierra con el voltaje en cero, llega a 2 + φr.
 */
export function flujoEn(t, alfa = DEF.alfa, rem = DEF.rem) {
    const a = alfa * D2R;
    return -Math.cos(W * t + a) + (Math.cos(a) + rem) * Math.exp(-t / EJ.tau);
}
export const corrienteEn = (t, alfa, rem) => magnet(flujoEn(t, alfa, rem));
/** Las armónicas de un ciclo de la corriente, desde t0: la fundamental (60 Hz) y la segunda (120 Hz), por unidad de la nominal. */
function armonicas(f, t0 = 0, n = 256) {
    let a1 = 0, b1 = 0, a2 = 0, b2 = 0;
    for (let k = 0; k < n; k++) {
        const t = t0 + k / (n * BANCO.f);
        const y = f(t);
        const th = (2 * Math.PI * k) / n;
        a1 += y * Math.cos(th); b1 += y * Math.sin(th); a2 += y * Math.cos(2 * th); b2 += y * Math.sin(2 * th);
    }
    return { h1: (2 / n) * Math.hypot(a1, b1), h2: (2 / n) * Math.hypot(a2, b2) };
}
/** Al cerrar el interruptor: el pico de la corriente (veces el pico nominal), la segunda armónica y si la diferencial dispararía. */
export function energizar({ alfa = DEF.alfa, rem = DEF.rem, restriccion = true } = {}) {
    const f = t => corrienteEn(t, alfa, rem);
    let pico = 0;
    let phiMax = 0;
    for (let k = 0; k <= 400; k++) { const t = k / (400 * BANCO.f); pico = Math.max(pico, Math.abs(f(t))); phiMax = Math.max(phiMax, Math.abs(flujoEn(t, alfa, rem))); }
    const { h1, h2 } = armonicas(f);
    const pct2 = h1 > 0 ? (h2 / h1) * 100 : 0;
    const opera = h1 > EJ.arranque;
    const bloquea = restriccion && pct2 >= DIF.h2;
    const sinRestr = h1 >= DIF.sinRestriccion;
    return { alfa, rem, restriccion, pico, A: pico * IN.alta * Math.SQRT2, phiMax, h1, h2, pct2, opera, bloquea, dispara: (opera && !bloquea) || sinRestr, sinRestr, sinTransitorio: Math.abs(Math.cos(alfa * D2R) + rem) < 0.05 };
}
/** El pico de cada ciclo durante unos segundos, para ver cómo se apaga. */
export function picoCiclo(k, alfa = DEF.alfa, rem = DEF.rem) {
    let p = 0;
    for (let j = 0; j <= 80; j++) p = Math.max(p, Math.abs(corrienteEn((k + j / 80) / BANCO.f, alfa, rem)));
    return p;
}

// ------------------------------------------------------------------ una falla
/**
 * Una falla trifásica en la barra de 230 kV, con la red de 400 kV detrás (su potencia de cortocircuito, en MVA): la corriente la limitan la
 * red y la impedancia del banco. Por unidad de la nominal; en kA del lado de 230 kV. El primer pico, con el factor de 2.55 de la norma.
 */
export function falla({ scc = DEF.scc, dentro = false, z = BANCO.z } = {}) {
    const zs = BANCO.S / scc;
    const i = 1 / (zs + z);
    const kA = (i * IN.baja) / 1000;
    const sinRed = 1 / z;
    return { scc, dentro, z, zs, i, kA, kAalta: (i * IN.alta) / 1000, pico: NORMA.asimetria * kA, fuerza: i * i, sinRed, kAsinRed: (sinRed * IN.baja) / 1000, dispara: dentro, diferencial: dentro ? i : 0, buchholz: dentro, caidaPlena: carga({ s: 1, ang: DEF.ang }).caida };
}
/** La corriente de falla (kA en 230 kV) con otra impedancia, para comparar. */
export const fallaConZ = (z, scc = DEF.scc) => falla({ scc, z }).kA;

// ------------------------------------------------------------------ el tiempo de la escena
export const estadoPlanta = () => ({ t: 0, tc: -1, cerrado: false, falla: 0, disparo: false });
/** Un paso. Al energizar, el tiempo desde que se cierra corre en cámara lenta: 100 ms en unos 2.5 s. */
export function pasoPlanta(s, m, dt) {
    const n = { ...s };
    n.t += dt;
    if (m.modo === 'energizar') {
        // si se cambia el momento de cerrar o el flujo guardado, se vuelve a energizar
        if (n.cerrado && (m.alfa !== n.alfa || m.rem !== n.rem)) n.cerrado = false;
        if (m.cerrar && !n.cerrado) { n.cerrado = true; n.tc = 0; n.disparo = false; n.alfa = m.alfa; n.rem = m.rem; }
        if (!m.cerrar) { n.cerrado = false; n.tc = -1; n.disparo = false; }
        if (n.cerrado && n.tc >= 0) {
            n.tc = Math.min(0.1, n.tc + dt * 0.04);
            const e = energizar({ alfa: m.alfa, rem: m.rem, restriccion: m.restriccion });
            if (e.dispara && n.tc > 0.025) n.disparo = true;
        }
    } else { n.cerrado = true; n.tc = -1; n.disparo = false; }
    if (m.modo === 'falla' && m.falla) n.falla = Math.min(1, n.falla + dt * 2);
    else n.falla = Math.max(0, n.falla - dt * 1.5);
    return n;
}

// ------------------------------------------------------------------ las lecturas
export function calcular({ modo = 'relacion', planta = null, v = DEF.v, f = DEF.f, s = DEF.s, ang = DEF.ang, alfa = DEF.alfa, rem = DEF.rem, restriccion = true, scc = DEF.scc, dentro = false, falla: hayFalla = false } = {}) {
    const L = { modo };
    if (modo === 'relacion') Object.assign(L, relacion({ v, f }));
    else if (modo === 'auto') Object.assign(L, auto({ s }));
    else if (modo === 'carga') Object.assign(L, carga({ s, ang }));
    else if (modo === 'energizar') {
        Object.assign(L, energizar({ alfa, rem, restriccion }));
        const tc = planta?.tc ?? -1;
        L.tc = tc;
        L.cerrado = planta?.cerrado ?? false;
        L.disparo = planta?.disparo ?? false;
        L.ahora = L.cerrado && tc >= 0 && !L.disparo ? corrienteEn(tc, alfa, rem) : 0;
        L.flujoAhora = L.cerrado && tc >= 0 && !L.disparo ? flujoEn(tc, alfa, rem) : rem;
    } else Object.assign(L, falla({ scc, dentro }), { hay: hayFalla, fase: planta?.falla ?? 0 });
    return L;
}

// ------------------------------------------------------------------ acomodo (no está a escala)
export const BLOQUE = { x: [-8.8, 8.8], z: [-3.4, 3.4], y: [-0.4, 0] };
/** Las tres unidades, a lo largo de x: fases A, B y C. La C (AT421C) es la que se abre. */
export const UX = [-3.3, 0, 3.3];
export const TANQUE = { w: 2.2, d: 1.6, y0: 0.35, y1: 2.35 };
const C = UX[2];
/** Dónde va cada cosa respecto al centro de su unidad (x, z) y a qué altura. */
export const SITIO = {
    at: { dx: -0.55, z: -0.35, h: 1.9 }, bt: { dx: 0.35, z: -0.35, h: 1.25 }, neutro: { dx: 0.8, z: 0.45, h: 0.5 }, terciario: { dx: -0.15, z: 0.45, h: 0.42 },
    conservador: { dx: 0.1, y: 3.05, z: -0.75, r: 0.22, largo: 1.5 }, buchholz: { dx: 0.62 }, radiador: { z: [-0.85, -1.5], x: [-0.9, 0.9] }, cambiador: { dx: 0.55, z: 0.8 },
    interruptor: { x: -6.0 }, portico400: -8.4, portico230: 8.4, y400: 4.6, y230: 3.95, z400: [-1.45, -0.8, -0.15], z230: [-1.25, -1.6, -1.95],
    diferencial: [-5.4, 2.5], delta: { y: 3.0, z: 0.45 },
};
/** El núcleo y los devanados de la unidad C, por dentro: un núcleo de tres piernas con los devanados en la de en medio. */
export const NUCLEO = { x: C, y0: 0.55, y1: 2.05, ancho: 1.8, pierna: 0.24, fondo: 0.3, yugo: 0.2 };
export const DEVANADO = { y0: 0.82, y1: 1.78, terciario: [0.27, 0.33], comun: [0.36, 0.48], serie: [0.51, 0.64] };
export const FLUIDOS = {
    elec: { nombre: 'Energía que pasa', color: '#f2b233' },
    flujo: { nombre: 'Flujo magnético del núcleo', color: '#7e57c2' },
    aceite: { nombre: 'Aceite que se enfría', color: '#d08a2e' },
};
const yA = TANQUE.y1 + SITIO.at.h;
const yB = TANQUE.y1 + SITIO.bt.h;
const lin400 = (k) => {
    const xb = UX[k] + SITIO.at.dx;
    const zc = SITIO.z400[k];
    const xi = SITIO.interruptor.x;
    return { id: `alta${'ABC'[k]}`, fluido: 'elec', r: 0.025, cable: true, puntos: [[SITIO.portico400, SITIO.y400, zc], [xi - 0.45, SITIO.y400 - 0.2, zc], [xi + 0.45, SITIO.y400 - 0.2, zc], [lerp(xi, xb, 0.5), SITIO.y400 + 0.05, zc], [xb, SITIO.y400, zc], [xb, yA + 0.12, SITIO.at.z]] };
};
const lin230 = (k) => {
    const xb = UX[k] + SITIO.bt.dx;
    const zc = SITIO.z230[k];
    return { id: `baja${'ABC'[k]}`, fluido: 'elec', r: 0.022, cable: true, puntos: [[xb, yB + 0.1, SITIO.bt.z], [xb + 0.05, SITIO.y230, zc], [lerp(xb, SITIO.portico230, 0.5), SITIO.y230 + 0.08, zc], [SITIO.portico230, SITIO.y230, zc]] };
};
const DY = DEVANADO;
export const LINEAS = [
    lin400(0), lin400(1), lin400(2), lin230(0), lin230(1), lin230(2),
    // por dentro de la unidad C: lo que pasa directo por el cobre (de la boquilla de 400 kV, por el devanado serie, a la de 230 kV)
    { id: 'cobre', fluido: 'elec', r: 0.03, oculto: true, puntos: [[C + SITIO.at.dx, TANQUE.y1 - 0.05, SITIO.at.z], [C - 0.3, DY.y1 + 0.12, 0.25], [C, DY.y1 - 0.05, DY.serie[1] + 0.03], [C + 0.25, (DY.y0 + DY.y1) / 2, DY.serie[1] + 0.03], [C + SITIO.bt.dx, TANQUE.y1 - 0.05, SITIO.bt.z]] },
    // el flujo da la vuelta por el núcleo: sube por la pierna de en medio y baja por las de los lados
    { id: 'flujo', fluido: 'flujo', r: 0.035, oculto: true, puntos: [[C + 0.02, NUCLEO.y0 + 0.12, 0.27], [C + 0.02, NUCLEO.y1 - 0.12, 0.27], [C + 0.45, NUCLEO.y1 - 0.1, 0.23], [C + NUCLEO.ancho / 2 - 0.1, NUCLEO.y1 - 0.12, 0.23], [C + NUCLEO.ancho / 2 - 0.1, NUCLEO.y0 + 0.12, 0.23], [C + 0.12, NUCLEO.y0 + 0.1, 0.25]] },
    // el aceite caliente sale por arriba a los radiadores y regresa frío por abajo
    { id: 'aceiteSale', fluido: 'aceite', r: 0.045, puntos: [[C + 0.32, TANQUE.y1 - 0.25, -TANQUE.d / 2 + 0.05], [C + 0.32, TANQUE.y1 - 0.15, -0.95], [C + 0.32, TANQUE.y1 - 0.25, -1.15]] },
    { id: 'aceiteBaja', fluido: 'aceite', r: 0.03, oculto: true, puntos: [[C + 0.32, TANQUE.y1 - 0.3, -1.18], [C, (TANQUE.y0 + TANQUE.y1) / 2, -1.18], [C - 0.32, TANQUE.y0 + 0.3, -1.18]] },
    { id: 'aceiteRegresa', fluido: 'aceite', r: 0.045, puntos: [[C - 0.32, TANQUE.y0 + 0.3, -1.15], [C - 0.32, TANQUE.y0 + 0.2, -0.95], [C - 0.32, TANQUE.y0 + 0.3, -TANQUE.d / 2 + 0.05]] },
];
export const REMATE = new Set(['altaA (inicio)', 'altaB (inicio)', 'altaC (inicio)', 'bajaA (fin)', 'bajaB (fin)', 'bajaC (fin)']); // las líneas siguen más allá de los pórticos
/** Cajas de los equipos: x0, x1, y0, y1, z0, z1. */
const caja = (x, z, w, d, y0, y1) => [x - w / 2, x + w / 2, y0, y1, z - d / 2, z + d / 2];
export const EQUIPOS = {
    ...Object.fromEntries(UX.map((x, k) => [`unidad${'ABC'[k]}`, [x - TANQUE.w / 2, x + TANQUE.w / 2, 0, TANQUE.y1, -TANQUE.d / 2, TANQUE.d / 2]])),
    ...Object.fromEntries(UX.map((x, k) => [`at${'ABC'[k]}`, caja(x + SITIO.at.dx, SITIO.at.z, 0.4, 0.4, TANQUE.y1, yA + 0.2)])),
    ...Object.fromEntries(UX.map((x, k) => [`bt${'ABC'[k]}`, caja(x + SITIO.bt.dx, SITIO.bt.z, 0.4, 0.4, TANQUE.y1, yB + 0.2)])),
    radiadorC: [C + SITIO.radiador.x[0], C + SITIO.radiador.x[1], TANQUE.y0, TANQUE.y1, SITIO.radiador.z[1], SITIO.radiador.z[0]],
    nucleoC: [C - NUCLEO.ancho / 2, C + NUCLEO.ancho / 2, NUCLEO.y0, NUCLEO.y1, -0.2, 0.2],
};

/** Puntos clave: dónde va el número y desde dónde se ve. */
export const PARTES = [
    { id: 'banco', ancla: [UX[0], TANQUE.y1 + 0.15, TANQUE.d / 2], vista: { az: 18, el: 22, tam: 9.5, mira: [0, 1.8, 0] } },
    { id: 'boquillaAT', ancla: [UX[1] + SITIO.at.dx, yA - 0.5, SITIO.at.z + 0.15], vista: { az: 26, el: 14, tam: 3.4, mira: [UX[1], 3.0, -0.2] } },
    { id: 'boquillaBT', ancla: [UX[1] + SITIO.bt.dx + 0.05, yB - 0.3, SITIO.bt.z + 0.15], vista: { az: -20, el: 14, tam: 3.0, mira: [UX[1] + 0.3, 2.9, -0.2] } },
    { id: 'nucleo', ancla: [C - NUCLEO.ancho / 2 + 0.1, NUCLEO.y1 - 0.05, 0.2], vista: { az: 12, el: 12, tam: 2.8, mira: [C, 1.3, 0] } },
    { id: 'serie', ancla: [C - 0.45, DY.y1 - 0.1, 0.4], vista: { az: 30, el: 16, tam: 2.4, mira: [C, 1.3, 0] } },
    { id: 'comun', ancla: [C + 0.25, DY.y0 + 0.2, 0.42], vista: { az: 34, el: 22, tam: 2.2, mira: [C, 1.25, 0] } },
    { id: 'terciario', ancla: [C + SITIO.terciario.dx, TANQUE.y1 + SITIO.terciario.h + 0.1, SITIO.terciario.z], vista: { az: 8, el: 30, tam: 4.4, mira: [UX[2] - 1.4, 2.6, 0.4] } },
    { id: 'neutro', ancla: [UX[1] + SITIO.neutro.dx, TANQUE.y1 + SITIO.neutro.h + 0.05, SITIO.neutro.z], vista: { az: -28, el: 18, tam: 2.6, mira: [UX[1] + 0.9, 1.7, 0.6] } },
    { id: 'cambiador', ancla: [UX[0] + SITIO.cambiador.dx, 1.6, SITIO.cambiador.z + 0.2], vista: { az: 18, el: 12, tam: 2.6, mira: [UX[0] + 0.5, 1.2, 0.9] } },
    { id: 'tanque', ancla: [UX[0] - 0.6, 1.3, TANQUE.d / 2 + 0.02], vista: { az: 30, el: 18, tam: 3.4, mira: [UX[0], 1.4, 0] } },
    { id: 'radiadores', ancla: [UX[1], 1.9, SITIO.radiador.z[1] - 0.1], vista: { az: 200, el: 16, tam: 3.6, mira: [UX[1], 1.3, -1.1] } },
    { id: 'conservador', ancla: [UX[1] + SITIO.conservador.dx - 0.4, SITIO.conservador.y + 0.3, SITIO.conservador.z], vista: { az: 150, el: 22, tam: 2.8, mira: [UX[1] + 0.3, 2.8, -0.6] } },
    { id: 'interruptor', ancla: [SITIO.interruptor.x, SITIO.y400 - 0.05, SITIO.z400[2] + 0.2], vista: { az: 34, el: 16, tam: 3.6, mira: [SITIO.interruptor.x, 3.4, -0.8] } },
    { id: 'diferencial', ancla: [SITIO.diferencial[0], 1.75, SITIO.diferencial[1] + 0.3], vista: { az: 14, el: 12, tam: 2.4, mira: [SITIO.diferencial[0], 0.9, SITIO.diferencial[1]] } },
];

// ------------------------------------------------------------------ la pose
export function pose({ modo = 'relacion', planta = null, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, planta, ...resto });
    const cerrado = modo === 'energizar' ? L.cerrado && !L.disparo : !(modo === 'falla' && L.hay && L.dentro && L.fase > 0.6);
    // cuánto pasa por el banco, de cada 1
    const s = modo === 'auto' || modo === 'carga' ? L.s : modo === 'relacion' ? 0.25 * clamp01(L.v / 100) : modo === 'falla' ? (L.hay ? 1 : 0.6) : 0;
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    for (const k of 'ABC') flujos[`alta${k}`] = flujos[`baja${k}`] = cerrado ? clamp01(0.08 + 0.8 * s) : 0;
    flujos.cobre = cerrado ? clamp01(0.06 + 0.9 * s * (1 - parteNucleo())) : 0;
    const phi = modo === 'relacion' ? L.phi : modo === 'energizar' ? (cerrado && L.tc >= 0 ? Math.abs(L.flujoAhora) / 2.5 : 0) : cerrado ? 1 : 0;
    flujos.flujo = cerrado ? clamp01(0.15 + 0.6 * phi) : 0;
    const calor = modo === 'carga' ? clamp01((L.i - 0.3) / 0.9) : modo === 'relacion' ? clamp01((L.phi - 1) * 4) : 0.25;
    flujos.aceiteSale = flujos.aceiteBaja = flujos.aceiteRegresa = 0.15 + 0.6 * calor;
    const cam = camara || { mira: [0, 1.8, 0], az: 18, el: 22, d: 34 };
    const inrush = modo === 'energizar' && cerrado && L.tc >= 0 ? clamp01(Math.abs(L.ahora) / 6) : 0;
    const fallaVis = modo === 'falla' ? L.fase : 0;
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, cerrado,
        // cuánto tiemblan los devanados: con la fuerza de la falla (que crece con el cuadrado de la corriente)
        tiembla: modo === 'falla' && L.hay ? clamp01(L.fuerza / 80) * fallaVis : 0,
        ventiladores: modo === 'carga' ? (L.ventiladores ? 1 : 0) : 0,
        activo: {
            elec: cerrado ? 1 : 0,
            satura: modo === 'relacion' ? clamp01((L.phi - 1.05) * 6) : inrush,
            serie: modo === 'auto' || modo === 'carga' ? clamp01(L.s) : 0,
            comun: modo === 'auto' ? clamp01(L.s * (1 - 1 / A) * 1.6) : modo === 'carga' ? clamp01(L.s * 0.7) : 0,
            calor: modo === 'carga' ? clamp01((L.i - 0.85) * 3) : 0,
            falla: fallaVis * (modo === 'falla' && !L.dentro ? 1 : 0),
            fallaDentro: fallaVis * (modo === 'falla' && L.dentro ? 1 : 0),
            disparo: (modo === 'energizar' && L.disparo) || (modo === 'falla' && L.dentro && fallaVis > 0.3) ? 1 : 0,
            bloqueo: modo === 'energizar' && L.cerrado && L.bloquea && L.opera && !L.disparo ? 1 : 0,
        },
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'auto', s: 0.8, camara: { mira: [0, 1.8, 0], az: lerp(10, 26, t / 12), el: 22, d: 34 } });
}

// ------------------------------------------------------------------ revisiones
const dentroDe = (p, c, h = 0.08) => p[0] >= c[0] - h && p[0] <= c[1] + h && p[1] >= c[2] - h && p[1] <= c[3] + h && p[2] >= c[4] - h && p[2] <= c[5] + h;
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
        if (REMATE.has(`${L.id} (${nombre})`)) continue;
        if (!Object.values(EQUIPOS).some(c => dentroDe(p, c))) sueltas.push(`${L.id} (${nombre})`);
    }
    return sueltas;
}
/** Revisión de cifras contra la tesis, las normas y lo que se sabe de estos equipos. */
export function revisar() {
    const p = [];
    const entre = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // la placa
    entre(A, 1.738, 1.74, 'la relación 400 ÷ 230');
    entre(IN.alta, 476, 477, 'la corriente de 110 MVA en 400/√3 kV');
    entre(IN.baja, 828, 829, 'y en 230/√3 kV: la tesis dice 828 A');
    entre(ZBASE, 484.8, 484.9, 'la impedancia base en 400 kV y 330 MVA');
    entre(BANCO.z * ZBASE, 53.8, 53.9, 'la impedancia del banco: 53.9 Ω del lado de 400 kV');
    entre(Math.acos(PRUEBA.W / (PRUEBA.kV * 1000 * (PRUEBA.mA / 1000))) / D2R, 59.2, 59.3, 'el ángulo de la prueba de excitación: 59.27°, como en la tesis');
    entre(P0, 150, 155, 'pérdidas del núcleo estimadas para el banco, en kW');
    entre(P0 / (BANCO.S * 10), 0.02, 0.06, 'el núcleo pierde unas cuantas centésimas de por ciento');
    entre(I0 * 100, 0.08, 0.1, 'la corriente de excitación, menos de 0.1 % de la nominal');
    entre(RPU / XPU, 0.005, 0.03, 'X/R del banco, de ejemplo, del orden de los grandes');
    // la curva del núcleo y V/Hz
    entre(relacion({}).i / I0, 0.999, 1.001, 'a voltaje nominal pide la corriente de la prueba');
    entre(relacion({}).kVb, 230, 230, 'con 400 kV, el otro lado da 230 kV');
    entre(relacion({ v: 50 }).kVb, 115, 115, 'con la mitad, la mitad');
    entre(relacion({ v: 110 }).veces, 2.5, 8, 'a 110 %, varias veces la corriente de excitación');
    entre(relacion({ v: 120 }).veces, 20, 80, 'a 120 %, el núcleo ya se saturó');
    entre(relacion({ v: 100, f: 57 }).vhz, 105, 105.4, 'con 57 Hz y el mismo voltaje, el flujo sube más de 5 %');
    entre(relacion({ v: 95, f: 57 }).vhz, 99.9, 100.1, 'si bajan juntos voltaje y frecuencia, el flujo no cambia');
    entre(relacion({ v: 110 }).probado ? 1 : 0, 1, 1, 'la norma pide probarlo a 110 %');
    // autotransformador
    const a = auto({ s: 1 });
    entre(a.comun, 351, 353, 'por el devanado común pasan solo 352 A');
    entre(a.parte, 0.42, 0.43, 'por el núcleo pasa el 42.5 %');
    entre(a.nucleo, 140, 141, 'unos 140 MVA de los 330');
    entre(a.kVserie, 98, 98.3, 'el devanado serie tiene 98 kV');
    entre(parteNucleo(2), 0.5, 0.5, 'con relación 2, la mitad');
    entre(parteNucleo(400 / 115), 0.71, 0.72, 'de 400 a 115 kV ya conviene menos');
    // con carga
    const f1 = carga({ s: 1, ang: 0 });
    const at = carga({ s: 1, ang: 25.84 });
    const ad = carga({ s: 1, ang: -25.84 });
    entre(f1.caida, 0.4, 1.2, 'con factor de potencia 1, el voltaje cae poco');
    entre(at.caida, 4, 7, 'con 0.9 en atraso, cae unos 5 a 6 %');
    entre(ad.caida, -6, -2, 'con 0.9 en adelanto, sube');
    entre(at.pasos, 6, 12, 'pasos de 0.625 % para corregirlo');
    entre(f1.eficiencia * 100, 99.75, 99.85, 'a plena carga pierde dos de cada mil');
    entre(f1.mejor, 0.5, 0.6, 'su mejor eficiencia, a poco más de media carga');
    entre(carga({ s: f1.mejor, ang: 0 }).eficiencia, f1.eficiencia, 1, 'y ahí es mayor que a plena carga');
    // al energizar
    const peor = energizar({ alfa: 0, rem: CONEXION.remanente });
    entre(peor.phiMax, 2.45, 2.5, 'cerrando con el voltaje en cero y medio flujo guardado: 2.5 veces el flujo');
    entre(peor.pico, CONEXION.veces[0], CONEXION.veces[1], 'y de 5 a 8 veces la corriente nominal');
    entre(peor.pct2, DIF.h2, 100, 'con bastante segunda armónica');
    entre(peor.dispara ? 1 : 0, 0, 0, 'la diferencial se bloquea y no dispara');
    entre(energizar({ alfa: 0, rem: 0.5, restriccion: false }).dispara ? 1 : 0, 1, 1, 'sin el bloqueo, dispararía');
    const pico = energizar({ alfa: 90, rem: 0 });
    entre(pico.pico, 0, 0.01, 'cerrando con el voltaje en su máximo y sin flujo guardado, no hay golpe');
    entre(pico.dispara ? 1 : 0, 0, 0, 'ni disparo');
    entre(energizar({ alfa: 180, rem: 0.5 }).pico, 0, peor.pico * 0.6, 'si el flujo guardado va a favor, el golpe es menor');
    entre(energizar({ alfa: 0, rem: 0 }).phiMax, 1.95, 2.0, 'sin flujo guardado, el doble');
    entre(picoCiclo(120) / picoCiclo(0), 0, 0.5, 'en dos segundos ya se apagó buena parte');
    // una falla
    const fa = falla({});
    entre(fa.i, 8.1, 8.3, 'con 30,000 MVA de red, unas 8.2 veces la nominal');
    entre(fa.kA, 6.7, 6.9, 'unos 6.8 kA en 230 kV');
    entre(fa.pico, 17, 17.6, 'el primer pico, con 2.55');
    entre(fa.fuerza, 64, 70, 'la fuerza, unas 67 veces la de plena carga');
    entre(fa.sinRed, 8.99, 9.01, 'con una red infinita, 1 ÷ 0.1111 = 9 veces');
    entre(fa.kA, 0, NORMA.diseno[0].kA, 'por debajo de los 40 kA de diseño de la barra');
    entre(fallaConZ(BANCO.z * 0.5), fa.kA * 1.6, fa.kA * 2.2, 'con la mitad de impedancia, casi el doble');
    entre(falla({ dentro: false }).dispara ? 1 : 0, 0, 0, 'una falla afuera no la dispara la diferencial');
    entre(falla({ dentro: true }).dispara ? 1 : 0, 1, 1, 'una adentro sí');
    entre(clamp(1, 0, 2), 1, 1, 'ayudas');
    return p;
}
