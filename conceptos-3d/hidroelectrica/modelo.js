// La central hidroeléctrica como cifras puras: cuánta energía trae el agua según el nivel del embalse, cuánto le saca la turbina, cómo se reparte el agua
// en un día y en un año, y qué pasa si la línea se cae y hay que cerrar. Sin three.js ni DOM. El tablero, las gráficas y las partículas leen calcular(),
// así no pueden contradecirse.
//
// Central de ejemplo con las cifras de La Yesca (Ing. Alfredo Elías Ayub, CFE), en el río Santiago. No es el plano de esa central ni un simulador de operación.
// - Unidad: 380.32 MW, caída de diseño de 163.35 m, 150 vueltas por minuto, 249.22 m³/s, cierre en 9 s (tesina UNAM, Celis 2016, tabla 5.1).
// - Niveles: NAME 578, NAMO 575, NAMINO 518, distribuidor 381.7, lecho 392, corona 579 m sobre el mar (misma tabla).
// - Agua: aprovechable, 2,955.5 millones de m³ al año, 93.7 m³/s en promedio; de julio a octubre, cerca de 75 % (tesis UNAM, Cano 2013).
// - Embalse: V = 2,392 · ((z − 392) / 186)^2.5. Se ajustó a tres cifras publicadas y da la cuarta: capacidad al NAME, útil, y área de 3,348 ha.
// - Presión y velocidad al cerrar: columna de agua rígida y rotor con inercia de 8.01 s. La misma tesina da 10 a 18 % y 34 a 41 %.
// - De ejemplo, para ver la tendencia: el nivel del río abajo (395 m), la forma de la curva de la turbina, el reparto por mes, la curva de la demanda,
//   la regla de operación del embalse, el voltaje de salida y el vaivén de la galería.

const clamp01 = x => Math.min(1, Math.max(0, x));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const suave = x => { const k = clamp01(x); return k * k * (3 - 2 * k); };
const D2R = Math.PI / 180;

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const MES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// ------------------------------------------------------------------ la central
export const G = 9.81;
export const RHO = 1000;
export const UNIDAD = { Pmax: 380.32, nominal: 375, Qd: 249.22, Hd: 163.35, rpm: 150, polos: 48, rodete: 5.3, perdida: 2, a: 1480.61, L: 241.72, D1: 7.7, D2: 5.48, Lreduce: 32, cierre: 9, Ta: 8.01, Kr: 1.79, velPermitida: 0.6, presionPermitida: [0.3, 0.35], D2R };
export const CENTRAL = { nombre: 'La Yesca', mw: 750, unidades: 2, cortina: 210, cortinaLecho: 188, corona: 579, largo: 623, areaHa: 3348, gwh: [1210, 1228], factor: 0.19, vida: 50, vertedor: { compuertas: 6, ancho: 12, alto: 22.4, avenida: 15915, descarga: 15110 }, cuenca: 51900, galeria: [16, 62.5, 60.5], desfogue: { ancho: 13, alto: 14, largo: 231 } };
export const NIVEL = { NAME: 578, NAMO: 575, NAMINO: 518, rio: 392, abajo: 395, tomaSup: 514, tomaCentro: 503.4, tomaMin: 494.26, distribuidor: 381.7, cimacio: 549 };
export const AGUA = { publicada: 3088.2, historica: 3765, util: 2955.5, promedio: 93.7, lluvias: 0.75 };
// Cuánta agua llega cada mes, de cada 100. Solo la suma de julio a octubre está publicada; el resto sigue la forma de la lluvia de NASA POWER en el sitio, con un mes de retraso.
export const REPARTO_MES = [2.7, 2, 1.5, 1, 1.1, 5.7, 14.5, 22, 24, 14.5, 7.5, 3.5];
export const LLUVIA_NASA = [0.43, 0.65, 0.26, 0.03, 0.34, 4.82, 8.61, 8.57, 8, 2.81, 0.63, 0.39]; // mm al día
export const TIPOS = { seco: { nombre: 'Año seco', k: 0.6, plan: 0.75 }, normal: { nombre: 'Año normal', k: 1, plan: 1 }, lluvioso: { nombre: 'Año lluvioso', k: 1.5, plan: 1.15 } };
export const HORAS_TOPE = 12; // de ejemplo: lo más que trabajan al día antes de verter
export const ETA = { pico: 0.96, apertura: 0.87, generador: 0.985, transformador: 0.995 };
export const DEF = { a: 87, nivel: 560, hora: 20, aguaDia: AGUA.promedio, mes: 9, tipo: 'normal', tc: UNIDAD.cierre };
export const LIMITES = { a: [0, 100], nivel: [NIVEL.NAMINO, NIVEL.NAMO], hora: [0, 24], aguaDia: [30, 220], mes: [1, 12], tc: [1, 30] };

// ------------------------------------------------------------------ el embalse
const Z0 = 392;
const VNAME = 2392;
const EXP = 2.5;
/** Millones de m³ guardados con el agua a esa elevación. */
export const volumen = z => (z <= Z0 ? 0 : VNAME * ((z - Z0) / (NIVEL.NAME - Z0)) ** EXP);
/** Elevación con ese volumen. */
export const nivelDe = v => Z0 + (NIVEL.NAME - Z0) * (Math.max(0, v) / VNAME) ** (1 / EXP);
/** Área del agua en km², con el agua a esa elevación. */
export const areaKm2 = z => (VNAME * EXP * ((z - Z0) / (NIVEL.NAME - Z0)) ** (EXP - 1)) / (NIVEL.NAME - Z0);
export const VOL_UTIL = () => volumen(NIVEL.NAMO) - volumen(NIVEL.NAMINO);

// ------------------------------------------------------------------ la turbina y el generador
/** Qué parte de la energía del agua pasa a la flecha, según cuánto abre el distribuidor (0–1). Forma de ejemplo, con su mejor punto cerca de 87 %. */
export function etaTurbina(a) {
    const k = a - ETA.apertura;
    const c = k < 0 ? 0.99 : 0.45;
    const b = ETA.pico * (1 - c * k * k);
    const vacio = a <= 0.1 ? 0 : 1 - (0.1 / a) ** 3;
    return Math.max(0, b * vacio);
}
/** Una unidad con el distribuidor abierto en a (0–1) y el embalse en z. Sin tope: lo que daría. */
function unidadLibre(a, z) {
    const Hb = Math.max(1, z - NIVEL.abajo);
    let Hn = Hb;
    let Q = 0;
    for (let i = 0; i < 4; i++) {
        Q = a * UNIDAD.Qd * Math.sqrt(Hn / UNIDAD.Hd);
        Hn = Hb - UNIDAD.perdida * (Q / UNIDAD.Qd) ** 2;
    }
    const eta = etaTurbina(a);
    const flecha = (RHO * G * Q * Hn * eta) / 1e6;
    return { a, z, Q, Hb, Hn, eta, flecha, P: flecha * ETA.generador };
}
/** Una unidad, con el tope de su generador: el regulador no abre más de lo que el generador aguanta. */
export function unidad(a, z = DEF.nivel) {
    let u = unidadLibre(clamp01(a), z);
    let tope = false;
    if (u.P > UNIDAD.Pmax) {
        tope = true;
        let [x0, x1] = [0, clamp01(a)];
        for (let i = 0; i < 26; i++) { const m = (x0 + x1) / 2; if (unidadLibre(m, z).P > UNIDAD.Pmax) x1 = m; else x0 = m; }
        u = unidadLibre(x0, z);
    }
    const frac = u.P / UNIDAD.Pmax;
    return { ...u, tope, frac, aspera: u.a > 0.3 && u.a < 0.62 };
}
/** Lo más que da una unidad con ese nivel. */
export const potenciaMax = z => unidad(1, z).P;
/** Qué apertura da esa potencia, con ese nivel. */
export function aperturaPara(P, z) {
    if (P <= 0) return 0;
    let [x0, x1] = [0.1, 1];
    for (let i = 0; i < 22; i++) { const m = (x0 + x1) / 2; if (unidad(m, z).P < P) x0 = m; else x1 = m; }
    return (x0 + x1) / 2;
}
/** kWh que deja un metro cúbico que cae desde esa elevación, en su mejor punto. */
export function kwhPorM3(z) {
    const u = unidad(ETA.apertura, z);
    return u.Q > 0 ? (u.P * 1000) / (u.Q * 3600) : 0;
}
/** De cada 100 de la energía del agua que cae, a dónde va. */
export function reparto(u) {
    if (u.Q <= 0.01) return { rozamiento: 0, turbina: 0, generador: 0, transformador: 0, red: 0, hay: false };
    const agua = RHO * G * u.Q * u.Hb / 1e6;
    const roz = (agua - RHO * G * u.Q * u.Hn / 1e6) / agua;
    const enNeta = (RHO * G * u.Q * u.Hn / 1e6) / agua;
    const tur = enNeta * (1 - u.eta);
    const flecha = enNeta * u.eta;
    const gen = flecha * (1 - ETA.generador);
    const sale2 = flecha * ETA.generador;
    const tra = sale2 * (1 - ETA.transformador);
    return { rozamiento: roz, turbina: tur, generador: gen, transformador: tra, red: sale2 * ETA.transformador, hay: true };
}

// ------------------------------------------------------------------ un día
export const DEMANDA = [0.8, 0.77, 0.75, 0.74, 0.74, 0.75, 0.77, 0.79, 0.82, 0.85, 0.87, 0.88, 0.88, 0.88, 0.89, 0.9, 0.91, 0.92, 0.94, 0.97, 1, 1, 0.97, 0.9, 0.8];
export const demandaEn = h => { const x = clamp(h, 0, 24); const i = Math.min(23, Math.floor(x)); return lerp(DEMANDA[i], DEMANDA[i + 1], x - i); };
/** Cuántas unidades conviene usar y cuánta agua pasa para dar esa potencia. */
function reparteUnidades(P, z) {
    const Pm = potenciaMax(z);
    if (P <= 0) return { n: 0, a: 0, Q: 0 };
    const n = P > Pm * 0.95 ? 2 : 1;
    const a = aperturaPara(Math.min(P / n, Pm), z);
    return { n, a, Q: unidad(a, z).Q * n };
}
const memoDia = new Map();
/** Reparte el agua de un día entre sus horas: primero las de más demanda. agua: m³/s en promedio. */
export function dia({ agua = DEF.aguaDia, z = DEF.nivel } = {}) {
    const clave = `${agua.toFixed(1)}|${z.toFixed(0)}`;
    if (memoDia.has(clave)) return memoDia.get(clave);
    const Pm = potenciaMax(z);
    const Ptot = 2 * Pm;
    const Vdia = agua * 86400;
    const potenciaH = (h, th) => { const P = Ptot * clamp01((demandaEn(h) - th) / Math.max(1 - th, 1e-3)); return P < Pm * 0.35 ? 0 : P; };
    const usa = th => { let v = 0; for (let h = 0; h < 24; h += 0.25) v += reparteUnidades(potenciaH(h + 0.125, th), z).Q * 900; return v; };
    let [a, b] = [0, 0.995];
    for (let i = 0; i < 20; i++) { const m = (a + b) / 2; if (usa(m) > Vdia) a = m; else b = m; }
    const th = (a + b) / 2;
    const P = h => potenciaH(h, th);
    let mwh = 0;
    let punta = 0;
    for (let h = 0; h < 24; h += 0.25) { const p = P(h + 0.125) * 0.25; mwh += p; if (h >= 18 && h < 23) punta += p; }
    const usado = usa(th);
    const r = { agua, z, umbral: th, P, Ptot, mwh, punta: mwh > 0 ? punta / mwh : 0, usado, horasTope: usado / (2 * unidad(1, z).Q * 3600), bajaM: (usado / 1e6) / areaKm2(z), parejo: unidad(clamp01(agua / 2 / UNIDAD.Qd), z).P * 2 };
    memoDia.set(clave, r);
    return r;
}
/** La central a esa hora. */
export function enHora(h, { agua = DEF.aguaDia, z = DEF.nivel } = {}) {
    const D = dia({ agua, z });
    const P = D.P(h);
    const R = reparteUnidades(P, z);
    return { P, n: R.n, a: R.a, Q: R.Q, demanda: demandaEn(h), D };
}

// ------------------------------------------------------------------ un año
const memoAno = new Map();
/**
 * El año del embalse, mes por mes. Regla de ejemplo: cada mes pasa por las turbinas una parte igual del agua aprovechable; si el embalse se llena, trabajan más
 * hasta su tope de horas y lo que aún sobra sale por el vertedor; si baja al NAMINO, se turbina solo lo que entra.
 */
export function anual({ tipo = DEF.tipo } = {}) {
    if (memoAno.has(tipo)) return memoAno.get(tipo);
    const k = TIPOS[tipo].k;
    const Vmax = volumen(NIVEL.NAMO);
    const Vmin = volumen(NIVEL.NAMINO);
    const plan = (AGUA.util * TIPOS[tipo].plan) / 365;
    const paso = v0 => {
        let V = v0;
        const meses = [];
        for (let i = 0; i < 12; i++) {
            const m = (i + 10) % 12; // empieza en noviembre, con el embalse recién lleno
            const entra = (AGUA.publicada * k * REPARTO_MES[m]) / 100;
            const zIni = nivelDe(V);
            let turbina = plan * DIAS[m];
            const tope = (2 * UNIDAD.Qd * 3600 * HORAS_TOPE * DIAS[m]) / 1e6;
            let fin = V + entra - turbina;
            let vierte = 0;
            if (fin > Vmax) {
                const mas = Math.min(fin - Vmax, Math.max(0, tope - turbina));
                turbina += mas;
                fin -= mas;
                if (fin > Vmax) { vierte = fin - Vmax; fin = Vmax; }
            } else if (fin < Vmin) {
                turbina = Math.max(0, turbina - (Vmin - fin));
                fin = Vmin;
            }
            const zFin = nivelDe(fin);
            const zMedio = (zIni + zFin) / 2;
            const u = unidad(ETA.apertura, zMedio);
            const gwh = (((turbina * 1e6) * (u.P / u.Q)) / 3.6e6) * ETA.transformador; // P / Q: MJ por cada m³
            meses[m] = { mes: m + 1, entra, turbina, vierte, zIni, zFin, zMedio, gwh, Qmedio: (turbina * 1e6) / (DIAS[m] * 86400), horas: (turbina * 1e6) / (2 * u.Q * 3600 * DIAS[m]) };
            V = fin;
        }
        return { meses, V };
    };
    let r = paso(Vmax);
    for (let i = 0; i < 7; i++) r = paso(r.V); // hasta que un año se parece al siguiente
    const gwh = r.meses.reduce((s, x) => s + x.gwh, 0);
    const R = { tipo, k, meses: r.meses, gwh, factor: gwh / ((CENTRAL.mw * 8760) / 1000), vierte: r.meses.reduce((s, x) => s + x.vierte, 0), turbina: r.meses.reduce((s, x) => s + x.turbina, 0), zMin: Math.min(...r.meses.map(x => x.zFin)), zMax: Math.max(...r.meses.map(x => x.zFin)) };
    memoAno.set(tipo, R);
    return R;
}
/** Elevación del embalse a la mitad de ese mes; m puede tener decimales: de 1 a 13. */
export function nivelEnMes(m, tipo = DEF.tipo) {
    const A = anual({ tipo });
    const x = ((m - 0.5) % 12 + 12) % 12; // 0: mitad de enero
    const i = Math.floor(x);
    const u = x - i;
    const [a, b] = [A.meses[i], A.meses[(i + 1) % 12]];
    return u < 0.5 ? lerp(a.zMedio, a.zFin, u * 2) : lerp(a.zFin, b.zMedio, (u - 0.5) * 2);
}

// ------------------------------------------------------------------ si se cae la línea
// Tubería de 7.7 m que se reduce a 5.48 m en sus últimos 32 m: lo que cuenta es la suma de largo entre área.
const LA = (UNIDAD.L - UNIDAD.Lreduce) / ((Math.PI * UNIDAD.D1 ** 2) / 4) + (4 / Math.PI) * (UNIDAD.Lreduce / (UNIDAD.D1 * UNIDAD.D2));
export const TW = (LA * UNIDAD.Qd) / (G * UNIDAD.Hd); // segundos que tarda el agua en arrancar
export const V0 = UNIDAD.Qd / ((Math.PI * 7.53 ** 2) / 4); // la tesina usa un diámetro equivalente de 7.53 m
export const VIAJE = (2 * UNIDAD.L) / UNIDAD.a; // ida y vuelta de la onda de presión
export const GOLPE_M = (UNIDAD.a * V0) / G; // metros de presión si se cerrara de un solo golpe
export const FIN_EVENTO = 26;
const PASO_SERIE = 0.1; // las series guardan un valor cada décima de segundo
const FLUJO_BAJA = 0.42; // de ejemplo: con el rodete desbocado pasa menos agua
const ARRASTRE = 0.012; // de ejemplo: lo que frena el rotor sin carga
// la galería de oscilación: un vaivén lento, de ejemplo. Con los dos grupos cerrando al mismo tiempo.
const AG = CENTRAL.galeria[0] * CENTRAL.galeria[1];
const AT = CENTRAL.desfogue.ancho * CENTRAL.desfogue.alto;
export const VAIVEN = { periodo: 2 * Math.PI * Math.sqrt((CENTRAL.desfogue.largo * AG) / (G * AT)), m: ((2 * UNIDAD.Qd) / AT) * Math.sqrt((CENTRAL.desfogue.largo * AT) / (G * AG)) };
const memoEvento = new Map();
/** Rechazo de carga: la línea se cae con la unidad a tope, y el distribuidor cierra en tc segundos. Columna rígida, tiempos y cifras por unidad. */
export function rechazo({ tc = UNIDAD.cierre, z = DEF.nivel } = {}) {
    const clave = `${tc.toFixed(2)}|${z.toFixed(0)}`;
    if (memoEvento.has(clave)) return memoEvento.get(clave);
    const Hb = z - NIVEL.abajo;
    const hSt = Hb / UNIDAD.Hd;
    const fr = UNIDAD.perdida / UNIDAD.Hd;
    const dt = 0.01;
    let q = Math.sqrt(hSt);
    for (let i = 0; i < 6; i++) q = Math.sqrt(Math.max(0.01, hSt - fr * q * q));
    let n = 1;
        const s = { t: [], y: [], q: [], h: [], n: [], gal: [] };
    let [hMax, nMax, tH, tN, hMin] = [0, 1, 0, 0, 9];
    const h0 = q * q;
    for (let i = 0; i <= FIN_EVENTO / dt; i++) {
        const t = i * dt;
        const y = t >= tc ? 0 : 1 - t / tc;
        const g = Math.max(0.2, 1 - FLUJO_BAJA * (n - 1));
        const kq = y * g;
        // se resuelve de forma implícita para que sea estable aun cerca del cierre: TW (kq·√h − q) / dt = hSt − h − fr q²
        const A = (TW * kq) / dt;
        const C = hSt - fr * q * q + (TW * q) / dt;
        const raiz = (-A + Math.sqrt(A * A + 4 * Math.max(0, C))) / 2;
        const qN = kq * raiz;
        const h = raiz * raiz;
        const eta = 1 - ((n - 1) / (UNIDAD.Kr - 1)) ** 2;
        const Pm = (qN * h * eta * RHO * G * UNIDAD.Qd * UNIDAD.Hd * etaTurbina(1)) / (UNIDAD.Pmax * 1e6);
        n += (dt * (Pm - ARRASTRE * n ** 3)) / (UNIDAD.Ta * n);
        q = y > 0 ? qN : 0;
        const hVal = y > 0 ? h : hSt;
        if (i % 10 === 0) {
            s.t.push(t);
            s.y.push(y);
            s.q.push(q);
            s.h.push(hVal);
            s.n.push(n);
            s.gal.push(-Math.sin((2 * Math.PI * Math.max(0, t - tc / 2)) / VAIVEN.periodo) * Math.exp(-t / 140));
        }
        if (hVal > hMax) { hMax = hVal; tH = t; }
        if (hVal < hMin) hMin = hVal;
        if (n > nMax) { nMax = n; tN = t; }
    }
    const r = { tc, ...s, hMax, nMax, tH, tN, h0, sobrePresion: hMax / h0 - 1, sobreVelocidad: nMax - 1, metros: (hMax - h0) * UNIDAD.Hd };
    memoEvento.set(clave, r);
    return r;
}
/** El valor de una de las series de rechazo() a los t segundos. */
export function enSerie(c, t) {
    const x = clamp(t, 0, FIN_EVENTO - 0.01) / PASO_SERIE;
    const i = Math.floor(x);
    return lerp(c[i], c[Math.min(i + 1, c.length - 1)], x - i);
}
/** Lo que pasa t segundos después de que cae la línea. */
export function enEvento(R, t) {
    return { t: clamp(t, 0, FIN_EVENTO), y: enSerie(R.y, t), q: enSerie(R.q, t), h: enSerie(R.h, t), n: enSerie(R.n, t), gal: enSerie(R.gal, t) };
}

// ------------------------------------------------------------------ el tiempo: lo que tarda en responder
export const RAPIDEZ = { apertura: 0.05, nivel: 18, vuelve: 7, cadaEvento: FIN_EVENTO + 12 }; // apertura: por segundo; nivel: metros por segundo, para ver el cambio
export const estadoPlanta = ({ a = DEF.a / 100, z = DEF.nivel } = {}) => ({ a1: a, a2: a, z, n: 1, n2: 1, ev: null, regreso: 0, gal: 0, vierte: 0 });
/**
 * Un paso del tiempo. m: { a1, a2, z, vierte, lentitud (del evento), tc }. Función pura, independiente de la velocidad de los cuadros.
 * Si hay evento, manda él: la cifra sale de rechazo(); después la unidad regresa a la red poco a poco.
 */
export function pasoPlanta(s, m, dt) {
    const pasos = Math.max(1, Math.ceil(dt / 0.05));
    const h = dt / pasos;
    const n = { ...s };
    for (let i = 0; i < pasos; i++) {
        n.z += clamp(m.z - n.z, -RAPIDEZ.nivel * h, RAPIDEZ.nivel * h);
        n.vierte += ((m.vierte ?? 0) - n.vierte) * (1 - Math.exp(-h / 1.2));
        if (n.ev !== null) {
            n.ev += h * (m.lentitud ?? 1);
            const R = rechazo({ tc: m.tc ?? UNIDAD.cierre, z: n.z });
            const E = enEvento(R, n.ev);
            n.a1 = E.y;
            n.a2 = E.y;
            n.n = E.n;
            n.n2 = E.n;
            n.gal = E.gal;
            if (n.ev >= FIN_EVENTO) { n.ev = null; n.regreso = 1; }
            continue;
        }
        // vuelve a la red o sigue lo que se pide
        // tras la falla, primero baja a su velocidad; ya sincronizada, abre poco a poco
        const espera = n.regreso > 0 && n.n > 1.02;
        if (n.regreso > 0 && !espera) n.regreso = Math.max(0, n.regreso - h / 8);
        const vel = n.regreso > 0 ? RAPIDEZ.apertura * 0.5 : RAPIDEZ.apertura;
        const [meta1, meta2] = espera ? [0, 0] : [m.a1 ?? 0, m.a2 ?? 0];
        n.a1 += clamp(meta1 - n.a1, -vel * h * 5, vel * h * 5);
        n.a2 += clamp(meta2 - n.a2, -vel * h * 5, vel * h * 5);
        const tau = n.regreso > 0 ? RAPIDEZ.vuelve / 2 : RAPIDEZ.vuelve;
        n.n += ((m.a1 > 0.01 ? 1 : 0) - n.n) * (1 - Math.exp(-h / tau));
        n.n2 += ((m.a2 > 0.01 ? 1 : 0) - n.n2) * (1 - Math.exp(-h / tau));
        n.gal += (0 - n.gal) * (1 - Math.exp(-h / 8));
    }
    return n;
}

// ------------------------------------------------------------------ las lecturas
/** Lo que mide la central. modo: 'agua' | 'dia' | 'ano' | 'cierre'. */
export function calcular({ modo = 'agua', planta = null, a = DEF.a, nivel = DEF.nivel, hora = DEF.hora, aguaDia = DEF.aguaDia, mes = DEF.mes, tipo = DEF.tipo, tc = DEF.tc } = {}) {
    const z = planta ? planta.z : modo === 'ano' ? nivelEnMes(mes, tipo) : nivel;
    const a1 = planta ? planta.a1 : a / 100;
    const a2 = planta ? planta.a2 : a / 100;
    const u1 = unidad(a1, z);
    const u2 = unidad(a2, z);
    const enLinea = !(planta && (planta.ev !== null || planta.n > 1.03));
    const P = enLinea ? u1.P + u2.P : 0;
    const Q = u1.Q + u2.Q;
    const r = { modo, z, a1: u1.a, a2: u2.a, u1, u2, P, Q, enLinea, reparto: reparto(u1), hora, mes, tipo, tc, V: volumen(z), util: volumen(z) - volumen(NIVEL.NAMINO), Hb: z - NIVEL.abajo, n: planta ? planta.n : 1, n2: planta ? planta.n2 : 1, gal: planta ? planta.gal : 0, kwh: kwhPorM3(z) };
    r.rpm = r.n * UNIDAD.rpm;
    r.frecuencia = (UNIDAD.polos * r.rpm) / 120;
    r.tiempoEvento = planta ? planta.ev : null;
    r.vierte = 0;
    if (modo === 'ano') {
        const A = anual({ tipo });
        const M = A.meses[clamp(Math.round(mes), 1, 12) - 1];
        r.anual = A;
        r.M = M;
        r.vierte = M.vierte / Math.max(1, (DIAS[M.mes - 1] * 86400) / 1e6); // m³/s
    }
    if (modo === 'dia') {
        const H = enHora(hora, { agua: aguaDia, z });
        r.H = H;
        r.D = H.D;
    }
    if (modo === 'cierre') {
        r.R = rechazo({ tc, z });
        if (planta && planta.ev !== null) { r.E = enEvento(r.R, planta.ev); r.h = r.E.h; }
    }
    return r;
}

// ------------------------------------------------------------------ acomodo de la central (no está a escala)
export const Y = z => (z - 392) / 40.4;
export const BLOQUE = { x: [-8.4, 8.4], z: [-2.5, 3.3], y: [-2.2, 0] };
export const LOSA = { x: [-4.93, 6.2], z: 2.55 }; // la rebanada de roca del frente, con sus huecos
export const TUBO = { z: 3.0, r: 0.15 };
export const MAQUINA = { x: 1.15, y: Y(NIVEL.distribuidor), z1: 2.52, z2: 1.25, Rc: 0.345 };
export const CAVERNA = { x: [0.28, 2.12], y: [-1.22, 1.36], z: [0.55, 3.29] };
export const GALERIA = { x: [2.62, 3.3], y: [-1.02, 1.2] };
export const CORTINA = { xU: -0.82, xD: -0.58, alto: Y(CENTRAL.corona), pend: 0.62, z: [BLOQUE.z[0], 0.5] };
CORTINA.xPieU = CORTINA.xU - CORTINA.pend * CORTINA.alto;
CORTINA.xPieD = CORTINA.xD + CORTINA.pend * CORTINA.alto;
export const VERTEDOR = { x: -0.85, z: 1.4, ancho: 0.76, cresta: Y(NIVEL.cimacio) };
export const YABAJO = Y(NIVEL.abajo);
const tabla = (pts, x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
        if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; return lerp(y0, y1, (x - x0) / (x1 - x0)); }
    }
    return pts.at(-1)[1];
};
const PERFIL_FRENTE = [[-8.4, 4.85], [-7.9, 4.42], [-6.6, 2.62], [-5.0, 2.5], [-4.94, 2.5], [-4.9, 5], [-2.7, 5], [-1.2, 4.25], [0.2, 3], [1.4, 1.92], [4.9, 1.9], [5.45, 1.15], [5.9, 0.45], [6.2, 0.26], [6.42, -0.12], [7.55, -0.12], [7.75, 0.36], [8.4, 0.6]];
const FONDO = [[-8.4, 4.85], [-7.9, 4.42], [-7.4, 2.9], [-6.2, 1.1], [-5, 0.08], [-3.7, 0], [2.3, 0], [3, 0.28], [8.4, 0.56]];
const CRESTA = [[-5, 5.02], [-0.72, 5.02], [0, 4.1], [0.5, 3.2], [1, 2.45], [1.5, 1.95], [1.7, 0]];
const RIO = [[2.05, -1.4], [3.4, -1.25], [4.6, -0.6], [5.7, 0.6], [6.6, 2], [7, 3.4]];
export const CAUCE = RIO;
const distRio = (x, z) => {
    let d = 9;
    for (let i = 1; i < RIO.length; i++) {
        const [ax, az] = RIO[i - 1];
        const [bx, bz] = RIO[i];
        const k = clamp01(((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2));
        d = Math.min(d, Math.hypot(x - lerp(ax, bx, k), z - lerp(az, bz, k)));
    }
    return d;
};
/** Dónde va el centro del vertedor, y a qué altura su piso. */
export const vertedorZ = x => VERTEDOR.z - 1.1 * suave((x - 0.2) / 2.6);
export const vertedorY = x => (x <= VERTEDOR.x ? VERTEDOR.cresta : tabla([[VERTEDOR.x, VERTEDOR.cresta], [-0.6, VERTEDOR.cresta - 0.08], [0.8, 2.35], [2, 1.85], [2.5, 1.4], [2.85, 1.02], [3, 1.12]], x));
export const FIN_VERTEDOR = 3;
const smax = (a, b, k = 0.22) => { const h = clamp01(0.5 + (0.5 * (b - a)) / k); return lerp(a, b, h) + k * h * (1 - h); };
/** La altura del terreno. */
export function terreno(x, z) {
    const P = tabla(PERFIL_FRENTE, x);
    const B = tabla(FONDO, x);
    let h = lerp(B, P, suave((z + 0.1) / 0.58));
    // entre la cortina y el vertedor queda una costilla de roca que la abraza
    if (x > CORTINA.xU && x < CORTINA.xPieD + 0.15 && z > 0.4 && z < 1.25) h = Math.max(h, x < CORTINA.xD ? CORTINA.alto + 0.08 : (CORTINA.xPieD + 0.12 - x) / CORTINA.pend + 0.08);
    // el cerro que cierra el embalse y abraza el extremo de la cortina
    const R = tabla(CRESTA, x);
    if (R > 0) {
        const w = z < 1.85 ? suave((z - 0.3) / 1.0) : 1 - suave((z - 2.08) / 0.42);
        h = smax(h, R * w);
    }
    // la entrada al vertedor y su canal
    if (x > -3.05 && x < -0.84 && z > 0.3 && z < VERTEDOR.z + 0.4) h = Math.min(h, VERTEDOR.cresta - 0.03);
    if (x >= -0.84 && x < 3.05) { const d = Math.abs(z - vertedorZ(x)); if (d < 0.4) h = Math.min(h, vertedorY(x) - 0.03); }
    // el río
    const d = distRio(x, z);
    h = lerp(-0.12, h, suave((d - 0.46) / 0.42));
    return h;
}

export const FLUIDOS = {
    agua: { nombre: 'Agua', color: '#3f9bd0' },
    ca: { nombre: 'Electricidad', color: '#ffb000' },
};
const T0 = [5.2, 1.4];
export const TORRES = [T0, [7.86, 0.7], [7.5, -1.55]];
const ALTO_TORRE = 2.7;
const TERR = (x, z) => terreno(x, z);
const puntasTorre = TORRES.map(([x, z]) => [x, TERR(x, z) + ALTO_TORRE, z]);
export const PUNTAS_TORRE = puntasTorre;
const YP = 1.92;
// Cada caja: x0, x1, y0, y1, z0, z1. Las pinta planta.js y con ellas se revisa que cada tubo y cable llegue a un equipo.
export const EQUIPOS = {
    embalse: [-8.4, -0.82, -0.2, 4.6, -2.5, 3.28],
    toma1: [-5.2, -4.62, 2.5, 5.2, 2.7, 3.28],
    caracol1: [MAQUINA.x - 0.55, MAQUINA.x + 0.55, MAQUINA.y - 0.2, MAQUINA.y + 0.2, 2, 3.2],
    aspira1: [MAQUINA.x - 0.32, MAQUINA.x + 0.32, -1.1, -0.35, 2.15, 2.8],
    galeria: [GALERIA.x[0], GALERIA.x[1], GALERIA.y[0], GALERIA.y[1], 2.55, 3.3],
    portal: [6.05, 6.3, -0.28, 0.3, 2.7, 3.3],
    generador1: [MAQUINA.x - 0.68, MAQUINA.x + 0.68, 0.45, 1.05, 1.8, 3.15],
    transformador: [2.82, 3.58, YP, YP + 0.92, 1.4, 2.3],
    blindada: [3.78, 4.7, YP, YP + 0.6, 1.25, 2.4],
    portico: [4.62, 4.92, YP, YP + 1.45, 1.7, 2.4],
    reductora: [7.1, 7.9, 0.4, 2, -2.1, -1.2],
    pueblo: [4.9, 7, 0.3, 1.1, -2.45, -1.4],
};
const catenaria = (a, b, flecha, n = 5) => Array.from({ length: n + 1 }, (_, i) => { const k = i / n; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - flecha * 4 * k * (1 - k), lerp(a[2], b[2], k)]; });
const unir = (...tramos) => tramos.reduce((acc, t) => acc.concat(acc.length ? t.slice(1) : t), []);
const YT = MAQUINA.y;
const PIE = [MAQUINA.x, -0.82, MAQUINA.z1];
const curvaRio = RIO.filter((_, i) => i > 0).map(([x, z]) => [x, YABAJO + 0.018, z]);
export const LINEAS = [
    { id: 'llega', grupo: 'rio', fluido: 'agua', r: 0.03, oculto: true, puntos: [[-8.38, 4.88, -1], [-7.9, 4.46, -1], [-7.4, 2.95, -1], [-6.2, 1.2, -0.95], [-5.2, 0.5, -0.8]] },
    { id: 'tubo', grupo: 'u1', parte: 'tuberia', fluido: 'agua', r: 0.05, oculto: true, puntos: [[-4.72, Y(NIVEL.tomaCentro), TUBO.z], [-4.25, Y(NIVEL.tomaCentro), TUBO.z], [-3.85, 2.58, TUBO.z], [-1.55, 0.14, TUBO.z], [-1.1, -0.16, TUBO.z], [-0.7, YT, TUBO.z], [MAQUINA.x, YT, TUBO.z]] },
    { id: 'caracol', grupo: 'u1', fluido: 'agua', r: 0.024, oculto: true, puntos: [[MAQUINA.x, YT, TUBO.z], ...[50, 110, 170, 230, 290].map(g => { const th = g * D2R; return [MAQUINA.x + Math.sin(th) * 0.42, YT, MAQUINA.z1 + Math.cos(th) * 0.42]; }), [MAQUINA.x - 0.05, YT - 0.05, MAQUINA.z1 + 0.12], [MAQUINA.x, -0.55, MAQUINA.z1], PIE] },
    { id: 'aspira', grupo: 'u1', parte: 'oscilacion', fluido: 'agua', r: 0.055, oculto: true, puntos: [PIE, [1.28, -0.98, 2.56], [1.75, -1, 2.8], [2.3, -0.85, TUBO.z], [2.7, -0.76, TUBO.z]] },
    { id: 'desfogue', grupo: 'u1', parte: 'desfogue', fluido: 'agua', r: 0.058, oculto: true, puntos: [[3.22, -0.55, TUBO.z], [4.4, -0.3, TUBO.z], [5.4, -0.08, TUBO.z], [6.18, 0.02, TUBO.z]] },
    { id: 'abajo', grupo: 'rioAbajo', fluido: 'agua', r: 0.024, oculto: true, puntos: [[2.25, YABAJO + 0.018, -1.4], ...curvaRio] },
    { id: 'vierte', grupo: 'vierte', fluido: 'agua', r: 0.05, oculto: true, puntos: [[-1.1, 4, VERTEDOR.z], [-0.72, VERTEDOR.cresta + 0.06, VERTEDOR.z], [-0.2, vertedorY(-0.2) + 0.05, vertedorZ(-0.2)], [0.8, vertedorY(0.8) + 0.05, vertedorZ(0.8)], [2, vertedorY(2) + 0.05, vertedorZ(2)], [2.85, vertedorY(2.85) + 0.05, vertedorZ(2.85)], [3.02, 1.2, vertedorZ(3) - 0.05], [3.45, 0.85, -0.45], [3.95, 0.1, -1.08]] },
    { id: 'bus', grupo: 'u1', parte: 'generador', fluido: 'ca', r: 0.018, cable: true, puntos: [[MAQUINA.x + 0.62, 0.75, MAQUINA.z1], [1.96, 0.95, 2.72], [1.96, 1.3, 2.86], [1.96, 1.94, 2.86], [2.5, 2.08, 2.5], [2.9, 2.42, 1.9]] },
    { id: 'alta', grupo: 'red', parte: 'subestacion', fluido: 'ca', r: 0.016, puntos: [[3.45, YP + 0.82, 1.85], [3.84, YP + 0.5, 1.82]] },
    { id: 'gis', grupo: 'red', parte: 'subestacion', fluido: 'ca', r: 0.016, puntos: [[4.6, YP + 0.45, 1.82], [4.77, YP + 1.32, 2.05]] },
    { id: 'rnt', grupo: 'red', parte: 'red', fluido: 'ca', r: 0.016, cable: true, puntos: unir(catenaria([4.77, YP + 1.38, 2.05], puntasTorre[0], 0.02, 2), catenaria(puntasTorre[0], puntasTorre[1], 0.3), catenaria(puntasTorre[1], puntasTorre[2], 0.22), catenaria(puntasTorre[2], [7.5, 1.72, -1.65], 0.04, 2)) },
    { id: 'rgd', grupo: 'red', parte: 'red', fluido: 'ca', r: 0.014, cable: true, puntos: unir(catenaria([7.2, 1.1, -1.7], [6.5, 1.05, -1.82], 0.03, 3), catenaria([6.5, 1.05, -1.82], [5.9, 0.85, -1.85], 0.05, 3)) },
];

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
export const PARTES = [
    { id: 'cuenca', ancla: [-7.9, 5.25, -0.95], vista: { az: -42, el: 22, tam: 7.4, mira: [-6.4, 3.4, -0.2] } },
    { id: 'embalse', ancla: [-6.9, Y(NIVEL.NAMO) - 0.32, 3.3], vista: { az: -28, el: 14, tam: 7.6, mira: [-6, 2.9, 1.1] } },
    { id: 'cortina', ancla: [-0.7, CORTINA.alto + 0.34, -2.3], vista: { az: 196, el: 14, tam: 8.6, mira: [-0.9, 2, -2.5] } },
    { id: 'vertedor', ancla: [-0.85, 5.02, 1.4], vista: { az: 34, el: 52, tam: 8.2, mira: [1.15, 2, 0.4] } },
    { id: 'toma', ancla: [-5.05, 5.45, 3.05], vista: { az: -36, el: 9, tam: 3.8, mira: [-4.95, 3.65, 3] } },
    { id: 'tuberia', ancla: [-3.55, 2.32, 3.2], vista: { az: -6, el: 6, tam: 6.8, mira: [-2.05, 1.25, 3] } },
    { id: 'distribuidor', ancla: [MAQUINA.x - 0.2, YT + 0.32, 3.05], vista: { az: 16, el: 28, tam: 2.3, mira: [MAQUINA.x, YT, MAQUINA.z1 + 0.1] } },
    { id: 'turbina', ancla: [MAQUINA.x + 0.22, YT - 0.42, 3.05], vista: { az: -14, el: 36, tam: 1.9, mira: [MAQUINA.x, YT - 0.05, MAQUINA.z1 + 0.1] } },
    { id: 'generador', ancla: [MAQUINA.x - 0.56, 1.1, 3], vista: { az: 18, el: 16, tam: 2.5, mira: [MAQUINA.x, 0.74, MAQUINA.z1] } },
    { id: 'casa', ancla: [1.98, 1.14, 3.25], vista: { az: 12, el: 5, tam: 4, mira: [1.2, 0.05, 2.5] } },
    { id: 'oscilacion', ancla: [2.96, 0.78, 3.2], vista: { az: 6, el: 8, tam: 3.5, mira: [2.55, 0.05, 3] } },
    { id: 'desfogue', ancla: [5.3, 0.26, 3.2], vista: { az: 18, el: 16, tam: 4.8, mira: [5.1, 0, 2.3] } },
    { id: 'subestacion', ancla: [3.75, 3.2, 1.8], vista: { az: -16, el: 22, tam: 4.4, mira: [3.7, 2.45, 1.9] } },
    { id: 'red', ancla: [7.86, TERR(7.86, 0.7) + ALTO_TORRE + 0.32, 0.7], vista: { az: 28, el: 16, tam: 7.4, mira: [6.4, 1.7, 0] } },
];

// ------------------------------------------------------------------ la pose
/** Todo lo que necesita posar(): lecturas, cuánto corre por cada tubo (0–1), cómo van las unidades, y la cámara. */
export function pose({ modo = 'agua', planta = null, a = DEF.a, nivel = DEF.nivel, hora = DEF.hora, aguaDia = DEF.aguaDia, mes = DEF.mes, tipo = DEF.tipo, tc = DEF.tc, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null } = {}) {
    const lectura = calcular({ modo, planta, a, nivel, hora, aguaDia, mes, tipo, tc });
    const Qref = UNIDAD.Qd;
    const u1 = clamp01(lectura.u1.Q / Qref);
    const u2 = clamp01(lectura.u2.Q / Qref);
    const vierte = planta ? planta.vierte : lectura.vierte;
    const hayRed = lectura.enLinea && lectura.P > 1;
    const lluvia = modo === 'ano' ? clamp01(REPARTO_MES[((Math.round(mes) - 1) % 12 + 12) % 12] / 24) * TIPOS[tipo].k : 0.1;
    const grupos = { u1, u2, red: hayRed ? clamp01(lectura.P / (2 * UNIDAD.Pmax)) : 0, rio: 0.3 + 0.7 * clamp01(lluvia), rioAbajo: clamp01(Math.max(0.12, (u1 + u2) / 2 + vierte / 1500)), vierte: clamp01(vierte / 300) };
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = grupos[l.grupo] ?? 0;
    const activo = { red: grupos.red, gen: hayRed ? clamp01(lectura.u1.frac) : 0, gen2: hayRed ? clamp01(lectura.u2.frac) : 0, gira: clamp01(lectura.n), gira2: clamp01(lectura.n2), lluvia: clamp01(lluvia) };
    const cam = camara || { mira: [0, 1.6, 0.4], az: 24, el: 20, d: 38 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura, flujos, activo, lluvia, vierte, nivel: Y(lectura.z), n1: lectura.n, n2: lectura.n2, a1: lectura.a1, a2: lectura.a2, gal: lectura.gal,
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'agua', a: lerp(30, 100, clamp01(t / 12)), camara: { mira: [0, 1.6, 0.4], az: lerp(14, 30, t / 12), el: 20, d: 38 } });
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
/** Cada punta de cada tubo o cable debe tocar un equipo u otro tubo. Devuelve las que quedan al aire. Lo que sale a propósito al río o entra del río va marcado. */
const ABIERTAS = new Set(['llega (inicio)', 'abajo (inicio)', 'abajo (fin)', 'vierte (fin)', 'desfogue (fin)']);
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) {
        for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
            if (ABIERTAS.has(`${L.id} (${nombre})`)) continue;
            const enEquipo = Object.values(EQUIPOS).some(c => dentro(p, c));
            const enTorre = puntasTorre.some(q => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 0.05);
            const enTubo = LINEAS.some(o => o !== L && o.puntos.some((q, i) => i > 0 && distSeg(p, o.puntos[i - 1], q) < 0.06));
            if (!enEquipo && !enTorre && !enTubo) sueltas.push(`${L.id} (${nombre})`);
        }
    }
    return sueltas;
}
/** El agua no se sale: el terreno y la cortina deben quedar arriba del NAME a lo largo de la orilla que cierra el embalse. */
export function fugas() {
    const y = Y(NIVEL.NAME);
    const malas = [];
    for (let x = -4.86; x <= -1.1; x += 0.1) { if (Math.max(...[1.85, 1.9, 1.95, 2].map(z => terreno(x, z))) < y) malas.push(`cerro en x=${x.toFixed(1)}`); }
    for (let z = 1.5; z <= 3.25; z += 0.1) { if (terreno(-4.86, z) < y) malas.push(`pared en z=${z.toFixed(1)}`); }
    return malas;
}
/** Revisión de cifras contra lo publicado. */
export function revisar() {
    const p = [];
    const lejos = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // 1. la unidad en su punto de diseño: 249.22 m³/s y 163.35 m deben dar los 375 a 380 MW publicados
    const zd = NIVEL.abajo + UNIDAD.Hd + UNIDAD.perdida;
    const ud = unidad(1, zd);
    lejos(ud.Q, 249, 249.5, 'gasto de diseño (249.22 m³/s)');
    lejos(ud.Hn, 163.2, 163.5, 'caída de diseño (163.35 m)');
    lejos(ud.P, 372, UNIDAD.Pmax, 'potencia en el punto de diseño (375 a 380.32 MW)');
    lejos(unidadLibre(1, NIVEL.NAMO).flecha, 415, 450, 'turbina con la caída máxima (Turboatom: 434.6 MW)');
    lejos(unidad(1, NIVEL.NAMINO).P, 200, 300, 'con el embalse al NAMINO no llega a su tamaño');
    lejos(UNIDAD.polos * UNIDAD.rpm / 120, 60, 60, '48 polos a 150 vueltas dan 60 Hz');
    lejos(etaTurbina(ETA.apertura), 0.95, 0.965, 'mejor eficiencia de una Francis grande (más de 95 %)');
    lejos(etaTurbina(0.1), 0, 0.001, 'sin agua no hay trabajo');
    // 2. el embalse
    lejos(volumen(NIVEL.NAME), 2391, 2393, 'capacidad al NAME (2,392 millones de m³)');
    lejos(VOL_UTIL(), 1375, 1410, 'capacidad útil (1,392 millones de m³)');
    lejos(areaKm2(NIVEL.NAME), 31, 35.5, 'área al NAME (33.48 km²)');
    lejos(nivelDe(volumen(500)), 499.99, 500.01, 'la curva del embalse se invierte');
    // 3. el agua y el año
    lejos((AGUA.util * 1e6) / (365 * 86400), 93.5, 93.9, 'agua aprovechable en m³/s (93.7)');
    lejos(REPARTO_MES.reduce((a, b) => a + b, 0), 99.9, 100.1, 'el reparto por mes suma 100');
    lejos(REPARTO_MES.slice(6, 10).reduce((a, b) => a + b, 0), 74, 76, 'de julio a octubre (cerca de 75 %)');
    const A = anual();
    lejos(A.gwh, 1100, 1330, 'GWh al año (publicado: 1,210 a 1,228)');
    lejos(A.factor, 0.165, 0.205, 'factor de planta (diseño: 0.19)');
    lejos(A.zMax, NIVEL.NAMO - 0.5, NIVEL.NAMO, 'en un año normal se llena');
    lejos(A.zMin, NIVEL.NAMINO, 545, 'en estiaje baja sin pasar del NAMINO');
    lejos(anual({ tipo: 'seco' }).zMax, NIVEL.NAMINO, NIVEL.NAMO - 8, 'en un año seco no se llena');
    lejos(A.vierte, 0, 400, 'en un año normal casi no vierte (publicado: 133 de 3,088)');
    lejos(anual({ tipo: 'seco' }).gwh / A.gwh, 0.4, 0.85, 'un año seco da mucho menos');
    lejos(anual({ tipo: 'lluvioso' }).vierte, 100, 4000, 'un año lluvioso vierte');
    // 4. el día
    const D = dia();
    lejos(D.usado / (AGUA.promedio * 86400), 0.97, 1.03, 'el día usa su agua');
    lejos(D.horasTope, 3.8, 5.2, 'el agua promedio alcanza para unas horas a tope (factor de planta 0.19)');
    lejos(D.punta, 0.5, 1, 'casi toda la energía del día sale en la tarde y la noche');
    // 5. la presión y la velocidad al cerrar en 9 s, contra los tres métodos de la tesina
    const R = rechazo({ tc: UNIDAD.cierre, z: zd });
    lejos(VIAJE, 0.32, 0.34, 'ida y vuelta de la onda (0.33 s)');
    lejos(V0, 5.55, 5.65, 'velocidad del agua (5.60 m/s)');
    lejos((UNIDAD.a * V0) / (2 * G * UNIDAD.Hd), 2.55, 2.63, 'constante de Allievi ρ (2.59)');
    lejos(R.sobrePresion, 0.09, 0.2, 'presión de más al cerrar en 9 s (10 a 18.2 %)');
    lejos(R.sobreVelocidad, 0.3, 0.45, 'velocidad de más al cerrar en 9 s (34 a 41 %)');
    lejos(rechazo({ tc: 3, z: zd }).sobrePresion, 0.3, 0.7, 'cerrar en 3 s pasa de lo permitido');
    lejos(rechazo({ tc: 30, z: zd }).sobreVelocidad, 0.5, UNIDAD.Kr, 'cerrar muy lento se acerca al desboque');
    lejos(rechazo({ tc: 3, z: zd }).sobreVelocidad, 0, R.sobreVelocidad, 'cerrar rápido se acelera menos');
    lejos(R.h.at(-1), (zd - NIVEL.abajo) / UNIDAD.Hd - 0.01, (zd - NIVEL.abajo) / UNIDAD.Hd + 0.01, 'al final, solo la presión del embalse');
    lejos(VAIVEN.periodo, 60, 85, 'periodo del vaivén en la galería');
    // 6. Zimapán, con la misma fórmula
    lejos((RHO * G * 29.5 * 560 * 0.9) / 1e6, 130, 160, 'Zimapán con 29.5 m³/s y cerca de 560 m netos (146 MW)');
    // 7. el acomodo
    const ss = puntasSueltas();
    if (ss.length) p.push(`Puntas sueltas: ${ss.join(', ')}`);
    const fg = fugas();
    if (fg.length) p.push(`El agua se sale: ${fg.slice(0, 5).join(', ')}`);
    lejos(terreno(MAQUINA.x, 2.9), CAVERNA.y[1] + 0.2, 4, 'la caverna queda bajo tierra');
    for (let z = 0.3; z <= 1.08; z += 0.1) if (terreno(0, z) > 6) p.push('terreno de más');
    return p;
}
