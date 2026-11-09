// El modelo de la subestación: puro, sin three.js ni DOM. Lo leen la escena, el tablero, las gráficas y las pruebas, así que una cifra
// sale de un solo lugar. Tiene el diseño que se hizo para la CFE de la subestación Coatepec, en Veracruz (tesis UNAM, 1993): llega la línea
// Jalapa I–Jalapa II en 115 kV, un transformador de 12/16/20 MVA la baja a 13.8 kV y cuatro circuitos la llevan a la ciudad. Lo que no viene
// en esa tesis está marcado como «de ejemplo».
//
// Cuatro formas de verla: un día de carga (el transformador se calienta y prende sus ventiladores), el voltaje (cambiador de derivaciones y
// capacitores), una falla (relevador, interruptor y recierre) y un mantenimiento (cambiar un interruptor sin dejar a nadie sin luz).
import { D2R, clamp, clamp01, lerp } from '../planta-comun/ayudas.js';

const RAIZ3 = Math.sqrt(3);

// ------------------------------------------------------------------ la subestación (tesis UNAM, 1993)
export const SUB = { nombre: 'Coatepec', estado: 'Veracruz', alta: 115, media: 13.8, lineas: 2, circuitos: 4, altura: 1300, desde: 'Jalapa I – Jalapa II' };
/** Transformador: 12/16/20 MVA sin ventiladores, con un paso y con dos (OA/FA1/FA2). z: 9 % sobre 12 MVA, dentro del 8 a 9.5 % de la tesis. */
export const TRAFO = { etapas: [12, 16, 20], conexion: 'delta–estrella', z: 0.09, xr: 15, subida: 55, subidaCaliente: 65 };
/** Calor (norma IEC 60076-7): x y R de su tabla para transformadores en aceite; la constante de tiempo y el reparto entre aceite y devanado son de ejemplo. */
export const CALOR = { aceite: 50, gradiente: 15, R: 5, x: 0.8, y: 1.3, tau: 3, tauDevanado: 1 / 6 };
export const VENT = { enciende: [65, 75], margen: 5 }; // °C del aceite de arriba en que entra cada paso de ventiladores: de ejemplo
export const LIMITE = { aceite: 105, caliente: 120, referencia: 98 }; // operación normal, y temperatura con la que el aislamiento envejece a ritmo normal
export const ICC = 10.041; // kA de falla en 115 kV con que se diseñó la red de tierras
export const SCC = RAIZ3 * SUB.alta * ICC; // MVA de cortocircuito de la red que llega
export const INTERRUPTOR = { alta: { kV: 123, A: 1250, kA: 25, ms: 50 }, media: { kV: 15.5, A: 1250, ms: 60 } };
export const TC = 600; // A del lado de la red en los transformadores de corriente de cada circuito (600/5)
export const CAPACITOR = { mvar: 1.2, unidad: 0.2, unidades: 6 };
export const APARTARRAYOS = { vn: 96, kA: 20, descarga: 241, frente: 275, aguanta: 550, aguantaAqui: 470.25 }; // kV; el equipo aguanta 550 kV, 470 a 1,300 m
export const TIERRA = { metros: 1051, ohm: 0.4886, potencial: 3908.4, toque: 873.98, paso: 3008.03, varilla: 3, grava: 0.1, calibre: '4/0', rho1: 31.93, rho2: 84.98, capa: 3.83, segundos: 0.5 };
/** Conductor de los circuitos: ACSR de 336.4 kcmil, resistencia a 60 Hz y 75 °C y reactancia, Ω por km (catálogo). Usarlo aquí es de ejemplo. */
export const CABLE = { R: 0.205, X: 0.377 };
/** Cambiador de derivaciones bajo carga: 33 posiciones de 0.625 %, ±10 %. Consigna, banda y esperas, de ejemplo. */
export const CAMBIADOR = { pasos: 16, paso: 0.00625, consigna: 1.02, banda: 0.01, espera: 6, entre: 2.5 };
/** Relevador de sobrecorriente muy inverso (IEC): t = TMS × 13.5 ÷ (M − 1). Arranque y TMS de ejemplo. */
export const RELE = { k: 13.5, a: 1, arranque: 480, tms: 0.15 };
/** Recierre: el primero a los 2 s y el segundo a los 12 s, dentro de lo usual en distribución; dos intentos son de ejemplo. */
export const RECIERRE = { esperas: [2, 12] };
export const FP = 0.9; // factor de potencia de la carga, de ejemplo
const TANFI = Math.tan(Math.acos(FP));
/** Cómo se reparte la carga entre los cuatro circuitos: de ejemplo. */
export const REPARTO = [0.32, 0.36, 0.18, 0.14];
/** Forma de la carga de un día, de cada 1 de su máximo, hora por hora: de ejemplo, con la punta en la noche. */
export const FORMA = [0.62, 0.58, 0.55, 0.54, 0.55, 0.6, 0.68, 0.74, 0.78, 0.8, 0.82, 0.84, 0.85, 0.84, 0.83, 0.83, 0.85, 0.88, 0.94, 1, 0.99, 0.93, 0.82, 0.7];

export const DEF = { pico: 15, Tmax: 30, hora: 12, vent: true, P: 15, km: 10, cap: true, auto: true, d: 4, tipo: 'pasajera', paso: 0 };
export const LIMITES = { pico: [4, 24], Tmax: [10, 42], P: [0, 24], km: [1, 20], d: [0.2, 20], hora: [0, 24] };

// ------------------------------------------------------------------ corrientes
export const amperes = (mva, kV) => (mva * 1000) / (RAIZ3 * kV);
export const formaEn = h => { const x = ((h % 24) + 24) % 24; const i = Math.floor(x); return lerp(FORMA[i], FORMA[(i + 1) % 24], x - i); };
/** MVA que pasan por el transformador: la carga y su parte reactiva, menos lo que dan los capacitores. */
export const mvaDe = (P, cap = true, v = 1) => Math.hypot(P, P * TANFI - (cap ? CAPACITOR.mvar * v * v : 0));
export const aireEn = (h, Tmax) => Tmax - 9 * (0.5 - 0.5 * Math.cos((2 * Math.PI * (h - 15)) / 24)); // de ejemplo: 9 °C menos a las 3 de la mañana

// ------------------------------------------------------------------ el calor del transformador (IEC 60076-7)
export const subidaAceite = K => CALOR.aceite * ((1 + CALOR.R * K * K) / (1 + CALOR.R)) ** CALOR.x;
export const gradiente = K => CALOR.gradiente * K ** CALOR.y;
/** Ritmo al que envejece el aislamiento: 1 a 98 °C, el doble cada 6 °C más. */
export const envejece = th => 2 ** ((th - LIMITE.referencia) / 6);
const etapaDe = (aceite, antes, vent) => {
    if (!vent) return 0;
    let e = antes;
    for (let i = 0; i < 2; i++) {
        if (aceite >= VENT.enciende[i]) e = Math.max(e, i + 1);
        else if (aceite <= VENT.enciende[i] - VENT.margen) e = Math.min(e, i);
    }
    return e;
};
let cacheDia = { k: '', v: null };
/** Un día entero, cada 3 minutos. Corre dos días antes para empezar ya en su ritmo de todos los días. */
export function dia({ pico = DEF.pico, Tmax = DEF.Tmax, vent = DEF.vent, cap = true } = {}) {
    const k = JSON.stringify([pico, Tmax, vent, cap]);
    if (cacheDia.k === k) return cacheDia.v;
    const dt = 0.05;
    const n = Math.round(24 / dt);
    let aceite = aireEn(0, Tmax) + 20;
    let grad = 0;
    let etapa = 0;
    const R = { h: [], P: [], S: [], aire: [], aceite: [], caliente: [], etapa: [], K: [], V: [] };
    for (let d = 0; d < 3; d++) {
        for (let i = 0; i < n; i++) {
            const h = i * dt;
            const P = pico * formaEn(h);
            const S = mvaDe(P, cap);
            const aire = aireEn(h, Tmax);
            etapa = etapaDe(aceite, etapa, vent);
            const K = S / TRAFO.etapas[etapa];
            const meta = aire + subidaAceite(K);
            aceite += (meta - aceite) * (1 - Math.exp(-dt / CALOR.tau));
            grad += (gradiente(K) - grad) * (1 - Math.exp(-dt / CALOR.tauDevanado));
            if (d === 2) {
                const caliente = aceite + grad;
                R.h.push(h); R.P.push(P); R.S.push(S); R.aire.push(aire); R.aceite.push(aceite); R.caliente.push(caliente); R.etapa.push(etapa); R.K.push(K); R.V.push(envejece(caliente));
            }
        }
    }
    R.h.push(24);
    for (const c of ['P', 'S', 'aire', 'aceite', 'caliente', 'etapa', 'K', 'V']) R[c].push(R[c][0]);
    R.vida = R.V.slice(0, n).reduce((s, v) => s + v * dt, 0); // horas de vida «normal» que gasta en el día
    R.dias = R.vida / 24;
    R.max = { S: Math.max(...R.S), aceite: Math.max(...R.aceite), caliente: Math.max(...R.caliente) };
    R.en = (c, h) => { const x = clamp(h, 0, 24) / dt; const i = Math.min(n - 1, Math.floor(x)); return c === 'etapa' ? R.etapa[i] : lerp(R[c][i], R[c][i + 1], x - i); };
    cacheDia = { k, v: R };
    return R;
}

// ------------------------------------------------------------------ el voltaje
const ZB = SUB.media ** 2; // kV²: entre MVA da ohms
export const XS = ZB / SCC; // la red que llega, vista desde 13.8 kV
export const ZT = (() => { const z = (TRAFO.z * ZB) / TRAFO.etapas[0]; const r = z / Math.hypot(1, TRAFO.xr); return { R: r, X: r * TRAFO.xr, Z: z }; })();
/** Voltajes en las barras de 13.8 kV y al final del circuito 1, con una posición del cambiador. kV, MW, MVAr. */
export function tension({ P = DEF.P, km = DEF.km, cap = DEF.cap, tap = 0 } = {}) {
    const V0 = SUB.media * (1 + tap * CAMBIADOR.paso);
    let Vb = V0;
    let Qc = 0;
    for (let i = 0; i < 4; i++) {
        Qc = cap ? CAPACITOR.mvar * (Vb / SUB.media) ** 2 : 0;
        const Q = P * TANFI - Qc;
        Vb = V0 - (P * ZT.R + Q * (ZT.X + XS)) / V0;
    }
    const P1 = P * REPARTO[0];
    const caida = (P1 * CABLE.R * km + P1 * TANFI * CABLE.X * km) / (2 * Vb); // la carga, repartida a lo largo del circuito
    const Vf = Vb - caida;
    const S = Math.hypot(P, P * TANFI - Qc);
    return { Vb, Vf, pb: Vb / SUB.media, pf: Vf / SUB.media, Qc, S, I: amperes(S, Vb), fp: S > 0.01 ? P / S : 1, caida };
}
/** La posición del cambiador que deja las barras más cerca de la consigna. */
export function tapIdeal(o = {}) {
    let mejor = 0;
    let dif = Infinity;
    for (let n = -CAMBIADOR.pasos; n <= CAMBIADOR.pasos; n++) {
        const d = Math.abs(tension({ ...o, tap: n }).pb - CAMBIADOR.consigna);
        if (d < dif - 1e-9) { dif = d; mejor = n; }
    }
    return mejor;
}

// ------------------------------------------------------------------ una falla en el circuito 1
/** Corriente de una falla entre las tres fases a d km de la subestación, en kA. */
export function fallaEn(d) {
    const R = ZT.R + CABLE.R * d;
    const X = XS + ZT.X + CABLE.X * d;
    return SUB.media / (RAIZ3 * Math.hypot(R, X));
}
/** Segundos que tarda el relevador con una corriente en A. */
export const tRele = I => { const M = I / RELE.arranque; return M > 1 ? (RELE.tms * RELE.k) / (M ** RELE.a - 1) : Infinity; };
/** Lo que pasa, tramo por tramo: falla, abierto, normal o bloqueado. tipo: 'pasajera' | 'permanente'. */
export function secuencia({ d = DEF.d, tipo = DEF.tipo } = {}) {
    const I = fallaEn(d) * 1000;
    const abre = tRele(I) + INTERRUPTOR.media.ms / 1000;
    const tramos = [];
    let t = 0;
    const intentos = tipo === 'pasajera' ? 1 : RECIERRE.esperas.length + 1;
    for (let k = 0; k < intentos; k++) {
        tramos.push({ t0: t, t1: t + abre, estado: 'falla', intento: k });
        t += abre;
        if (k < RECIERRE.esperas.length) {
            tramos.push({ t0: t, t1: t + RECIERRE.esperas[k], estado: 'abierto', intento: k });
            t += RECIERRE.esperas[k];
        }
    }
    if (tipo === 'pasajera') tramos.push({ t0: t, t1: t + 1e9, estado: 'normal', intento: 1 });
    else tramos.push({ t0: t, t1: t + 1e9, estado: 'bloqueado', intento: intentos });
    return { I, abre, tramos, fin: t, sinLuz: tipo === 'pasajera' ? RECIERRE.esperas[0] : Infinity };
}
export const enSecuencia = (S, t) => S.tramos.find(x => t >= x.t0 && t < x.t1) ?? S.tramos.at(-1);

// ------------------------------------------------------------------ el mantenimiento
/** Pasos para dar mantenimiento al interruptor del circuito 2 sin cortarle la luz: la barra de interconexión lo pasa al interruptor del 1. */
export const PASOS = [
    { texto: 'Todo en servicio', boton: 'Cerrar la cuchilla de paso del circuito 1' },
    { texto: 'Cuchilla de paso del 1, cerrada', boton: 'Cerrar la cuchilla de paso del circuito 2' },
    { texto: 'Los dos circuitos, unidos por la barra de interconexión', boton: 'Abrir el interruptor del circuito 2' },
    { texto: 'Interruptor 2 abierto: el 1 lleva a los dos', boton: 'Abrir las cuchillas del interruptor 2' },
    { texto: 'Interruptor 2 aislado: se ve la abertura', boton: 'Cerrar sus cuchillas de tierra' },
    { texto: 'Aterrizado: ya se puede trabajar', boton: null },
];
/** Corrientes del mantenimiento. paso: 0 a 5, puede ir entre dos (se está moviendo). */
export function maniobra({ P = DEF.P, paso = 0 } = {}) {
    const S = mvaDe(P);
    const I = amperes(S, SUB.media);
    const [I1, I2] = [I * REPARTO[0], I * REPARTO[1]];
    const pasa = paso >= 3;
    const Ibr1 = pasa ? I1 + I2 : I1;
    return { S, I, I1, I2, Ibr1, Ibr2: pasa ? 0 : I2, Ipaso: pasa ? I2 : 0, cabe: I1 + I2 <= TC, maxMW: maxManiobra() };
}
/** La demanda más alta con que el interruptor 1 puede llevar a los dos circuitos sin pasar los 600 A de sus transformadores de corriente. */
export function maxManiobra() {
    let [a, b] = [0, 40];
    for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (amperes(mvaDe(m), SUB.media) * (REPARTO[0] + REPARTO[1]) <= TC) a = m; else b = m; }
    return a;
}
/** Si se puede dar este paso. Devuelve null o la razón. */
export function bloqueo(paso, siguiente, P = DEF.P) {
    if (siguiente === 3 && paso === 2 && !maniobra({ P }).cabe) return `Con ${Math.round(P)} MW, los dos circuitos juntos pasarían de los ${TC} A del interruptor 1: hay que esperar a que baje la demanda.`;
    return null;
}

// ------------------------------------------------------------------ el tiempo de la escena
export const estadoPlanta = () => ({ t: 0, tap: tapIdeal(), espera: 0, ev: null, rayo: 0, paso: 0, anim: 0, arco: 0, cambios: 0 });
/** Un paso del tiempo. m: { modo, P, km, cap, auto, falla, tipo, d, paso, rayo, arco }. Función pura, independiente de la velocidad de los cuadros. */
export function pasoPlanta(s, m, dt) {
    const n = { ...s };
    n.t += dt;
    // el cambiador busca la consigna: espera, y después da un paso cada tanto mientras siga fuera de la banda
    if (m.modo === 'voltaje' && m.auto) {
        const v = tension({ P: m.P, km: m.km, cap: m.cap, tap: n.tap });
        const lejos = v.pb - CAMBIADOR.consigna;
        if (Math.abs(lejos) > CAMBIADOR.banda) {
            n.espera += dt;
            const toca = n.cambios === 0 ? CAMBIADOR.espera : CAMBIADOR.entre;
            if (n.espera >= toca) {
                const nuevo = clamp(n.tap - Math.sign(lejos), -CAMBIADOR.pasos, CAMBIADOR.pasos);
                n.cambios = nuevo === n.tap ? n.cambios : n.cambios + 1;
                n.tap = nuevo;
                n.espera = 0;
            }
        } else { n.espera = 0; n.cambios = 0; }
    } else if (m.modo === 'voltaje' && !m.auto) { n.espera = 0; n.cambios = 0; }
    // la falla corre en segundos de verdad
    if (m.falla && n.ev === null) n.ev = 0;
    else if (!m.falla) n.ev = null;
    else n.ev += dt;
    n.rayo = m.rayo ? 1 : Math.max(0, n.rayo - dt / 1.6);
    n.arco = m.arco ? 1 : Math.max(0, n.arco - dt / 1.4);
    n.paso = m.paso ?? n.paso;
    n.anim += clamp(n.paso - n.anim, -dt / 1.1, dt / 1.1);
    return n;
}

// ------------------------------------------------------------------ las lecturas
/** Lo que mide la subestación. modo: 'carga' | 'voltaje' | 'falla' | 'maniobra'. */
export function calcular({ modo = 'carga', planta = null, pico = DEF.pico, Tmax = DEF.Tmax, hora = DEF.hora, vent = DEF.vent, P = DEF.P, km = DEF.km, cap = DEF.cap, auto = DEF.auto, d = DEF.d, tipo = DEF.tipo } = {}) {
    const L = { modo };
    if (modo === 'carga') {
        const D = dia({ pico, Tmax, vent });
        Object.assign(L, { D, pico, Tmax, hora, vent });
        L.P = D.en('P', hora);
        L.S = D.en('S', hora);
        L.aire = D.en('aire', hora);
        L.aceite = D.en('aceite', hora);
        L.caliente = D.en('caliente', hora);
        L.etapa = D.en('etapa', hora);
        L.V = envejece(L.caliente);
        L.uso = L.S / TRAFO.etapas[2];
        L.Ia = amperes(L.S, SUB.alta);
        L.Im = amperes(L.S, SUB.media);
        L.vb = 1;
    } else if (modo === 'voltaje') {
        const tap = planta ? planta.tap : tapIdeal({ P, km, cap });
        const v = tension({ P, km, cap, tap });
        Object.assign(L, { P, km, cap, auto, tap, ...v, ideal: tapIdeal({ P, km, cap }) });
        L.S = v.S;
        L.Ia = amperes(v.S, SUB.alta);
        L.Im = v.I;
        L.espera = planta ? planta.espera : 0;
        L.vb = v.pb;
    } else if (modo === 'falla') {
        const S = secuencia({ d, tipo });
        const t = planta && planta.ev !== null ? planta.ev : null;
        const tramo = t === null ? null : enSecuencia(S, t);
        Object.assign(L, { d, tipo, F: S, t, tramo });
        L.P = DEF.P;
        L.S = mvaDe(DEF.P);
        L.carga1 = amperes(L.S, SUB.media) * REPARTO[0];
        L.Ia = amperes(L.S, SUB.alta);
        L.Im = amperes(L.S, SUB.media);
        L.estado = tramo ? tramo.estado : 'normal';
        L.rayo = planta ? planta.rayo : 0;
        L.vb = 1;
    } else {
        const paso = planta ? planta.paso : 0;
        const anim = planta ? planta.anim : paso;
        Object.assign(L, { P, paso, anim, ...maniobra({ P, paso }) });
        L.Ia = amperes(L.S, SUB.alta);
        L.Im = L.I;
        L.arco = planta ? planta.arco : 0;
        L.vb = 1;
    }
    return L;
}

// ------------------------------------------------------------------ acomodo (no está a escala)
export const BLOQUE = { x: [-8.4, 8.4], z: [-3, 3], y: [-0.55, 0] };
export const CERCA = { x: [-7.35, 3.25], z: [-2.85, 2.85] };
export const ZL = [-1.3, 1.3]; // las dos líneas de 115 kV
export const ZF = [1.65, 0.55, -0.55, -1.65]; // los cuatro circuitos: el 1 adelante, el que va a la colonia
export const FASE_A = [-0.24, 0, 0.24]; // separación de las fases en 115 kV
export const FASE_M = [-0.13, 0, 0.13]; // y en 13.8 kV
export const X = {
    torre: -7.95, marco: -6.95, apartarrayos: -6.6, cuchillaLinea: -6.05, tc: -5.5, interruptor: -4.9, cuchillaBarra: -4.3, barra: [-3.95, -3.75, -3.55],
    cuchillaBanco: -3.15, interruptorBanco: -2.55, trafo: -1.25, boqAlta: -1.56, boqBaja: -0.94, interruptorBaja: -0.15, barra13: [0.45, 0.55, 0.65],
    cuchilla13: 0.95, interruptor13: 1.45, cuchillaSal: 1.95, interconexion: [2.2, 2.3, 2.4], apartarrayos13: 2.78, postes: [3.55, 4.45, 5.35, 6.25, 7.15, 8.05],
};
export const Y = { torre: 1.95, marco: 1.45, contacto: 1.2, barra: 1.45, boqAlta: 1.4, boqBaja: 1.16, barra13: 1.0, contacto13: 0.95, interconexion: 1.3, poste: 1.12 };
export const CAPAC = { x: 1.5, z: -2.48 };
export const CASETA = { x: [-2, -0.35], z: [-2.72, -2.08], h: 0.56 };
export const COLONIA = { x: [5.6, 8.3] };
/** Dónde cae la rama: el circuito 1 corre de la subestación al último poste, de 0 a 20 km. No está a escala. */
export const xFalla = d => lerp(X.postes[0] + 0.2, X.postes.at(-1) - 0.2, clamp01(d / LIMITES.d[1]));

export const FLUIDOS = {
    alta: { nombre: 'Alta tensión, 115 kV', color: '#ffb000' },
    media: { nombre: 'Media tensión, 13.8 kV', color: '#2f9be0' },
    falla: { nombre: 'Corriente de una falla', color: '#e0302a' },
};
const camino = (z, xs) => xs.map(([x, y]) => [x, y, z]);
const lineaAlta = (z, i) => ({ id: `l${i + 1}`, grupo: `l${i + 1}`, parte: 'lineas', fluido: 'alta', r: 0.02, cable: true, oculto: true, puntos: [[X.torre, Y.torre - 0.08, z], [X.marco, Y.marco - 0.03, z], [X.apartarrayos + 0.12, Y.contacto, z], [X.cuchillaLinea, Y.contacto + 0.02, z], [X.tc, Y.contacto - 0.06, z], [X.interruptor, Y.contacto - 0.04, z], [X.cuchillaBarra, Y.contacto + 0.02, z], [X.barra[1] - 0.05, Y.barra - 0.03, z]] });
const circuito = (z, i) => ({ id: `a${i + 1}`, grupo: `a${i + 1}`, parte: 'alimentadores', fluido: 'media', r: 0.016, cable: true, oculto: true, puntos: [[X.barra13[1], Y.barra13, z], [X.cuchilla13, Y.contacto13, z], [X.interruptor13, Y.contacto13 - 0.04, z], [X.cuchillaSal, Y.contacto13, z], [X.apartarrayos13, Y.contacto13, z], [X.postes[0], Y.poste, z], ...(i === 0 ? X.postes.slice(1).map(x => [x, Y.poste, z]) : [[X.postes[1], Y.poste, z], [X.postes[2], Y.poste, z]])] });
export const LINEAS = [
    ...ZL.map(lineaAlta),
    { id: 'b1', grupo: 'l1', parte: 'barras', fluido: 'alta', r: 0.02, cable: true, oculto: true, puntos: [[X.barra[1], Y.barra, ZL[0]], [X.barra[1], Y.barra, 0]] },
    { id: 'b2', grupo: 'l2', parte: 'barras', fluido: 'alta', r: 0.02, cable: true, oculto: true, puntos: [[X.barra[1], Y.barra, ZL[1]], [X.barra[1], Y.barra, 0]] },
    { id: 'tr', grupo: 'tr', parte: 'transformador', fluido: 'alta', r: 0.02, cable: true, oculto: true, puntos: camino(0, [[X.barra[1], Y.barra], [X.cuchillaBanco, Y.contacto], [X.interruptorBanco, Y.contacto - 0.05], [X.boqAlta, Y.boqAlta]]) },
    { id: 'bt', grupo: 'bt', parte: 'transformador', fluido: 'media', r: 0.02, cable: true, oculto: true, puntos: camino(0, [[X.boqBaja, Y.boqBaja], [X.interruptorBaja, Y.contacto13], [X.barra13[1], Y.barra13]]) },
    { id: 'm1', grupo: 'm1', parte: 'barras13', fluido: 'media', r: 0.018, cable: true, oculto: true, puntos: [[X.barra13[1], Y.barra13, 0], [X.barra13[1], Y.barra13, ZF[0]]] },
    { id: 'm2', grupo: 'm2', parte: 'barras13', fluido: 'media', r: 0.018, cable: true, oculto: true, puntos: [[X.barra13[1], Y.barra13, 0], [X.barra13[1], Y.barra13, ZF[3]]] },
    ...ZF.map(circuito),
    { id: 'paso', grupo: 'paso', parte: 'barras13', fluido: 'media', r: 0.016, cable: true, oculto: true, puntos: [[X.interconexion[1], Y.contacto13, ZF[0]], [X.interconexion[1], Y.interconexion, ZF[0]], [X.interconexion[1], Y.interconexion, ZF[1]], [X.interconexion[1], Y.contacto13, ZF[1]]] },
    { id: 'cap', grupo: 'cap', parte: 'capacitores', fluido: 'media', r: 0.016, cable: true, oculto: true, puntos: [[X.barra13[1], Y.barra13, ZF[3]], [X.barra13[1], Y.barra13, -2.2], [CAPAC.x - 0.3, 0.86, CAPAC.z], [CAPAC.x, 0.8, CAPAC.z]] },
    { id: 'falla', grupo: 'falla', parte: 'alimentadores', fluido: 'falla', r: 0.02, cable: true, oculto: true, puntos: [[X.barra13[1], Y.barra13, 0], [X.barra13[1], Y.barra13, ZF[0]], [X.cuchilla13, Y.contacto13, ZF[0]], [X.interruptor13, Y.contacto13 - 0.04, ZF[0]], [X.cuchillaSal, Y.contacto13, ZF[0]], [X.apartarrayos13, Y.contacto13, ZF[0]], [X.postes[0], Y.poste, ZF[0]]] },
];
export const REMATE = new Set(['l1 (inicio)', 'l2 (inicio)']); // las líneas vienen de fuera del dibujo
const caja = (x, y, z, w, h, d) => [x - w / 2, x + w / 2, y, y + h, z - d / 2, z + d / 2];
export const EQUIPOS = {
    ...Object.fromEntries(ZL.map((z, i) => [`marco${i}`, caja(X.marco, 0, z, 0.2, Y.marco + 0.05, 1)])),
    barra115: [X.barra[0] - 0.05, X.barra[2] + 0.05, Y.barra - 0.06, Y.barra + 0.06, -2.3, 2.3],
    boqAlta: caja(X.boqAlta, Y.boqAlta - 0.45, 0, 0.12, 0.5, 0.6),
    boqBaja: caja(X.boqBaja, Y.boqBaja - 0.3, 0, 0.12, 0.35, 0.4),
    barra13: [X.barra13[0] - 0.05, X.barra13[2] + 0.05, Y.barra13 - 0.06, Y.barra13 + 0.06, -2.3, 2.3],
    interconexion: [X.interconexion[0] - 0.05, X.interconexion[2] + 0.05, Y.contacto13 - 0.06, Y.interconexion + 0.06, ZF[3] - 0.3, ZF[0] + 0.3],
    capacitores: caja(CAPAC.x, 0, CAPAC.z, 0.9, 0.95, 0.56),
    ...Object.fromEntries(X.postes.flatMap((x, k) => ZF.map((z, i) => [`poste${k}_${i}`, caja(x, 0, z, 0.12, Y.poste + 0.12, 0.4)]))),
    ...Object.fromEntries(ZF.map((z, i) => [`circ${i}`, caja((X.cuchilla13 + X.apartarrayos13) / 2, 0, z, X.apartarrayos13 - X.cuchilla13 + 0.2, 1.05, 0.4)])),
};

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
export const PARTES = [
    { id: 'lineas', ancla: [X.torre, 2.15, ZL[0]], vista: { az: -42, el: 18, tam: 3.6, mira: [-7.3, 0.9, -0.2] } },
    { id: 'apartarrayos', ancla: [X.apartarrayos, 1.42, ZL[1] + 0.24], vista: { az: 16, el: 20, tam: 2.2, mira: [X.apartarrayos, 0.75, ZL[1]] } },
    { id: 'cuchillas', ancla: [X.cuchillaLinea, 1.42, ZL[1] + 0.24], vista: { az: 12, el: 34, tam: 2.1, mira: [X.cuchillaLinea, 0.9, ZL[1]] } },
    { id: 'interruptor', ancla: [X.interruptor, 1.38, ZL[1] + 0.24], vista: { az: 22, el: 22, tam: 2, mira: [X.interruptor, 0.7, ZL[1]] } },
    { id: 'medicion', ancla: [X.tc, 1.32, ZL[1] + 0.24], vista: { az: 14, el: 18, tam: 1.8, mira: [X.tc, 0.75, ZL[1]] } },
    { id: 'barras', ancla: [X.barra[1], 1.78, -2], vista: { az: 30, el: 26, tam: 3.4, mira: [X.barra[1], 1.05, -0.3] } },
    { id: 'transformador', ancla: [X.trafo, 1.62, 0.35], vista: { az: 18, el: 20, tam: 2.4, mira: [X.trafo, 0.6, 0] } },
    { id: 'cambiador', ancla: [-0.72, 1.0, -0.16], vista: { az: 42, el: 34, tam: 1.8, mira: [-0.8, 0.45, -0.05] } },
    { id: 'barras13', ancla: [X.interconexion[1], 1.62, 1.1], vista: { az: 36, el: 24, tam: 2.8, mira: [1.5, 0.85, 0.9] } },
    { id: 'alimentadores', ancla: [X.interruptor13, 1.24, ZF[0]], vista: { az: 18, el: 20, tam: 2, mira: [X.interruptor13, 0.7, ZF[0]] } },
    { id: 'capacitores', ancla: [CAPAC.x, 1.22, CAPAC.z], vista: { az: 168, el: 22, tam: 1.7, mira: [CAPAC.x, 0.55, CAPAC.z] } },
    { id: 'caseta', ancla: [-1.17, 0.9, -2.4], vista: { az: 176, el: 18, tam: 2.2, mira: [-1.17, 0.35, -2.4] } },
    { id: 'tierras', ancla: [-5.4, 0.42, 2.4], vista: { az: -10, el: 34, tam: 3.2, mira: [-5.2, -0.05, 2.1] } },
    { id: 'colonia', ancla: [6.9, 0.95, 2.1], vista: { az: 24, el: 22, tam: 3.6, mira: [6.4, 0.45, 1.6] } },
];

export function pose({ modo = 'carga', planta = null, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, planta, ...resto });
    const carga = clamp01((L.S ?? 0) / TRAFO.etapas[2]);
    // los interruptores: 1 cerrado, 0 abierto
    const int = { l1: 1, l2: 1, tr: 1, bt: 1, a1: 1, a2: 1, a3: 1, a4: 1, cap: modo === 'voltaje' ? (L.cap ? 1 : 0) : 1 };
    const cuch = { a2b: 1, a2l: 1 };
    const paso = { a1: 0, a2: 0 };
    let tierra = 0;
    let luz1 = 1;
    let chispa = 0;
    let rama = 0;
    if (modo === 'falla' && L.tramo) {
        const e = L.tramo.estado;
        int.a1 = e === 'falla' || e === 'normal' ? 1 : 0;
        luz1 = e === 'normal' ? 1 : e === 'falla' ? 0.35 : 0;
        chispa = e === 'falla' ? 1 : 0;
        rama = L.tipo === 'pasajera' && L.t > L.F.abre ? 1 : 0;
    }
    if (modo === 'maniobra') {
        const a = L.anim;
        paso.a1 = clamp01(a);
        paso.a2 = clamp01(a - 1);
        int.a2 = 1 - clamp01(a - 2);
        cuch.a2b = cuch.a2l = 1 - clamp01(a - 3);
        tierra = clamp01(a - 4);
    }
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    for (const id of ['l1', 'l2', 'b1', 'b2']) flujos[id] = 0.15 + 0.4 * carga;
    flujos.tr = 0.2 + 0.7 * carga;
    flujos.bt = flujos.tr;
    flujos.m1 = flujos.m2 = 0.2 + 0.6 * carga;
    ZF.forEach((z, i) => { flujos[`a${i + 1}`] = int[`a${i + 1}`] ? 0.2 + 2.4 * carga * REPARTO[i] : 0; });
    if (modo === 'maniobra') {
        flujos.paso = L.Ipaso > 0 ? 0.2 + 2.4 * carga * REPARTO[1] : 0;
        if (int.a2 < 0.5) flujos.a2 = 0;
        flujos.a1 = 0.2 + 2.4 * carga * (REPARTO[0] + (L.Ipaso > 0 ? REPARTO[1] : 0));
    }
    if (modo === 'falla') {
        flujos.falla = chispa ? 1 : 0;
        if (chispa) flujos.a1 = 0;
        if (!int.a1) flujos.a1 = 0;
    }
    flujos.cap = int.cap ? 0.3 : 0;
    const etapa = modo === 'carga' ? L.etapa : 0;
    const calor = modo === 'carga' ? clamp01((L.aceite - 55) / 45) : 0.15;
    const luzCasas = luz1 * (modo === 'voltaje' ? clamp01((L.pf - 0.85) / 0.17) : 1);
    const cam = camara || { mira: [-0.4, 0.7, 0], az: 16, el: 28, d: 38 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos,
        int, cuch, paso, tierra, etapa, calor, tap: modo === 'voltaje' ? L.tap : 0, luz1: luzCasas, chispa, rama, rayo: L.rayo ?? 0, arco: L.arco ?? 0,
        xFalla: modo === 'falla' ? xFalla(L.d) : null,
        activo: { energia: 1, vent: etapa / 2, falla: chispa, rayo: L.rayo ?? 0, arco: L.arco ?? 0, luz: luzCasas },
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'carga', camara: { mira: [-0.4, 0.7, 0], az: lerp(10, 26, t / 12), el: 28, d: 38 } });
}
export function posicionCamara({ mira, az, el, d }) {
    return [mira[0] + d * Math.cos(el) * Math.sin(az), mira[1] + d * Math.sin(el), mira[2] + d * Math.cos(el) * Math.cos(az)];
}

// ------------------------------------------------------------------ revisiones
const dentro = (p, c, h = 0.06) => p[0] >= c[0] - h && p[0] <= c[1] + h && p[1] >= c[2] - h && p[1] <= c[3] + h && p[2] >= c[4] - h && p[2] <= c[5] + h;
const distSeg = (p, a, b) => {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
    const u = clamp01((ab[0] * ap[0] + ab[1] * ap[1] + ab[2] * ap[2]) / Math.max(1e-9, ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2));
    return Math.hypot(ap[0] - ab[0] * u, ap[1] - ab[1] * u, ap[2] - ab[2] * u);
};
/** Cada punta de cada conductor debe tocar un equipo u otro conductor. Devuelve las que quedan al aire. */
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) {
        for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
            if (REMATE.has(`${L.id} (${nombre})`)) continue;
            const enEquipo = Object.values(EQUIPOS).some(c => dentro(p, c));
            const enTubo = LINEAS.some(o => o !== L && o.puntos.some((q, i) => i > 0 && distSeg(p, o.puntos[i - 1], q) < 0.05));
            if (!enEquipo && !enTubo) sueltas.push(`${L.id} (${nombre})`);
        }
    }
    return sueltas;
}
/** Revisión de cifras contra lo publicado. */
export function revisar() {
    const p = [];
    const lejos = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // la subestación
    lejos(amperes(10, SUB.media) / amperes(10, SUB.alta), 8.33, 8.34, 'del lado de 13.8 kV pasa 8.3 veces la corriente');
    lejos(SCC, 1990, 2010, 'MVA de cortocircuito con 10.041 kA en 115 kV');
    lejos(TRAFO.z, 0.08, 0.095, 'impedancia dentro de la tabla de la tesis');
    lejos(CAPACITOR.unidad * CAPACITOR.unidades, CAPACITOR.mvar - 1e-9, CAPACITOR.mvar + 1e-9, 'seis unidades de 200 kVAr');
    lejos(((APARTARRAYOS.aguantaAqui - APARTARRAYOS.frente) / APARTARRAYOS.frente) * 100, 70, 72, 'margen de protección de los apartarrayos (tesis: 71 %)');
    lejos(APARTARRAYOS.aguanta * 0.855, APARTARRAYOS.aguantaAqui - 0.01, APARTARRAYOS.aguantaAqui + 0.01, 'el aislamiento a 1,300 m: 550 × 0.855');
    // el calor
    lejos(subidaAceite(1), CALOR.aceite, CALOR.aceite, 'al 100 %, el aceite sube lo de su placa');
    lejos(subidaAceite(1) + gradiente(1), TRAFO.subidaCaliente, TRAFO.subidaCaliente, 'al 100 %, el punto más caliente sube 65 °C (tesis)');
    lejos(subidaAceite(1), 0, TRAFO.subida, 'el aceite de arriba no pasa de 55 °C sobre el aire (tesis)');
    lejos(envejece(98), 1, 1, 'a 98 °C envejece a ritmo normal');
    lejos(envejece(104), 2, 2, 'cada 6 °C, el doble');
    lejos(envejece(110), 4, 4, 'a 110 °C, cuatro veces');
    const D = dia();
    lejos(Math.max(...D.etapa), 1, 2, 'en un día normal sí entran los ventiladores');
    lejos(D.max.caliente, 60, LIMITE.caliente, 'en un día normal no pasa del límite');
    lejos(D.max.S, 0, TRAFO.etapas[2], 'en un día normal no pasa de 20 MVA');
    const Dsin = dia({ vent: false });
    lejos(Dsin.max.caliente - D.max.caliente, 5, 60, 'sin ventiladores se calienta más');
    lejos(Dsin.dias / D.dias, 2, 1000, 'sin ventiladores envejece mucho más rápido');
    // el voltaje
    lejos(CAMBIADOR.pasos * 2 + 1, 33, 33, 'el cambiador tiene 33 posiciones');
    lejos(CAMBIADOR.pasos * CAMBIADOR.paso, 0.1, 0.1, 'el cambiador mueve ±10 %');
    const v0 = tension({ tap: tapIdeal() });
    lejos(v0.pf, 0.95, 1.05, 'con el cambiador, al final del circuito llega más de 95 %');
    lejos(tension({ tap: 0, P: 22 }).pb, 0.85, 0.98, 'sin cambiador y con mucha carga, el voltaje baja');
    lejos(tension({ cap: true }).I, 0, tension({ cap: false }).I - 1, 'los capacitores bajan la corriente');
    lejos(tension({ cap: true }).pb, tension({ cap: false }).pb + 0.001, 2, 'los capacitores suben el voltaje');
    lejos(tension({ km: 20 }).pf, 0, tension({ km: 5 }).pf - 0.01, 'un circuito más largo pierde más voltaje');
    // la falla
    lejos(fallaEn(0), 4.8, 5.6, 'falla en las barras de 13.8 kV, kA');
    lejos(fallaEn(0) * 1000, 0, 56000, 'cabe en lo que puede abrir el interruptor');
    lejos(fallaEn(LIMITES.d[1]) * 1000, RELE.arranque * 1.2, 1e6, 'el relevador ve una falla hasta el final');
    lejos(tRele(fallaEn(0) * 1000), 0.05, 0.5, 'falla cerca: abre rápido');
    lejos(tRele(fallaEn(20) * 1000), 1, 10, 'falla lejos: tarda más');
    lejos(RECIERRE.esperas[0], 0.3, 5, 'primer recierre entre 0.3 y 5 s');
    lejos(RECIERRE.esperas[1], 10, 20, 'segundo recierre entre 10 y 20 s');
    lejos(REPARTO.reduce((s, x) => s + x, 0), 1 - 1e-9, 1 + 1e-9, 'el reparto suma 100 %');
    lejos(Math.max(...REPARTO.map(r => amperes(mvaDe(DEF.P), SUB.media) * r)), 0, RELE.arranque * 0.8, 'la carga normal no arranca al relevador');
    // el mantenimiento
    lejos(maniobra().Ibr1, 0, TC, 'con la demanda de siempre, cabe');
    lejos(maxManiobra(), DEF.P, 40, 'la maniobra se puede hasta más de lo de siempre');
    lejos(amperes(TRAFO.etapas[2], SUB.media), 0, INTERRUPTOR.media.A, 'el interruptor de 13.8 kV aguanta todo el transformador');
    return p;
}
