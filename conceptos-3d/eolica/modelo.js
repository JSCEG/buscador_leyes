// La central eólica como cifras puras: cuánto viento hay a la altura del buje, cuánto le saca el rotor, cómo responden el paso y la orientación,
// qué le queda al aerogenerador de atrás y qué da en un año. Sin three.js ni DOM. El tablero, las gráficas y las partículas leen calcular(), así
// no pueden contradecirse.
//
// Central de ejemplo con el aerogenerador y el tamaño del Parque Eólico Reynosa, Tamaulipas: 123 Vestas V136 de 3.45 MW, 424 MW. No es el plano de
// esa central ni un simulador de operación.
// - Aerogenerador: 3.45 MW y rotor de 136 m, con buje de 82, 112, 132 o 149 m (base de datos abierta OEDB).
// - Potencia = ½ · densidad · área · Cp · v³. El Cp sale de una fórmula común (Heier), con máximo cerca de 0.48, y se comprueba: con rotor de 126 m
//   debe dar la curva publicada de la V126-3.45, que sí está en OEDB. Sin curva pública de la V136, esa es la prueba.
// - Arranca a 3 m/s y para a 22.5 m/s, donde acaba esa curva. Más arriba, paso de las aspas.
// - Viento: NASA POWER a 50 m en cada sitio, llevado a la altura del buje con el exponente 1/7 (ley de potencia).
// - Estela: modelo de Jensen. A 7 diámetros, lo común en un parque desarrollado.
// - De ejemplo, para ver la tendencia: el resto de las pérdidas, la forma de Weibull, la velocidad de punta, cuánto tarda en responder, y
//   el voltaje de la línea.
import { apoyo, cablesSueltos as revisarCables, lineaAerea } from '../planta-comun/lineas.js';

const D2R = Math.PI / 180;
const clamp01 = x => Math.min(1, Math.max(0, x));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const MES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// ------------------------------------------------------------------ los sitios
// NASA POWER: viento medio a 50 m y aire a 2 m, promedios de muchos años.
export const SITIOS = {
    reynosa: { nombre: 'Reynosa, Tamaulipas', corto: 'Reynosa', lat: 26.05, lon: -98.3, m: 41, ws50: [6.79, 7.15, 7.58, 7.79, 7.66, 6.95, 7.13, 6.25, 5.51, 6.17, 6.51, 6.61], anual: 6.84, t: [15.9, 18.41, 21.8, 25.41, 28.05, 29.97, 29.66, 30.17, 28.04, 25.23, 20.59, 16.85] },
    istmo: { nombre: 'La Venta, Oaxaca', corto: 'Istmo', lat: 16.58, lon: -94.82, m: 272, ws50: [9.74, 8.62, 8.26, 7.23, 6.38, 5.39, 5.91, 5.77, 5.42, 7.79, 9.68, 9.27], anual: 7.45, t: [21.27, 23.11, 25.07, 27.46, 28.22, 26.56, 26.05, 25.89, 25.45, 24.45, 22.53, 21.72] },
};
export const K_WEIBULL = 2.2; // de ejemplo: qué tan parejo sopla el viento
export const CORTE_VIENTO = 1 / 7; // ley de potencia

// ------------------------------------------------------------------ el aerogenerador
export const TURBINA = { mw: 3.45, D: 136, area: 14525, buje: 112, bujes: [82, 112, 132, 149], Varranque: 3, Vparo: 22.5, Vregresa: 20, punta: 80, rpmMin: 5, multiplica: 115, polos: 6 };
export const PARQUE = { n: 123, mw: 424, hectareas: null };
// la curva publicada de la V126-3.45 (OEDB): m/s, kW. Con ella se comprueba la física.
export const CURVA_V126 = { D: 126, mw: 3.45, puntos: [[4, 184], [5, 404], [6, 725], [7, 1172], [8, 1760], [9, 2482], [10, 3187], [11, 3433], [12, 3450], [15, 3450], [20, 3450]] };
export const RENDIMIENTO = 0.94; // multiplicadora, generador y convertidor
export const CONSUMO = 12; // kW: lo que gasta la máquina andando, de ejemplo
export const OTRAS = { estela: 0.08, disponibilidad: 0.03, electricas: 0.02 }; // de ejemplo
export const FACTOR_OTRAS = (1 - OTRAS.estela) * (1 - OTRAS.disponibilidad) * (1 - OTRAS.electricas);
export const CT_MAX = 0.8; // de ejemplo: el empuje del rotor sobre el aire
export const K_ESTELA = 0.075; // de ejemplo: qué tan rápido se abre la estela en tierra
export const SEPARACION = 7; // diámetros: lo común en un parque desarrollado
export const BETZ = 16 / 27;
export const DEF = { v: 9, mes: 4, sitio: 'reynosa', buje: TURBINA.buje, separacion: SEPARACION, paso: 0, desvio: 0 };
export const LIMITES = { v: [0, 30], mes: [1, 12], buje: [60, 165], separacion: [3, 12], paso: [0, 90], desvio: [0, 45] };

// ------------------------------------------------------------------ el aire y el viento
/** Densidad del aire, kg/m³, a esa altura sobre el mar y esa temperatura. Con 15 °C y nivel del mar da 1.225. */
export function densidad(m = 0, t = 15) {
    const p = 101325 * (1 - 2.25577e-5 * m) ** 5.25588;
    return p / (287.05 * (t + 273.15));
}
/** Viento a esa altura, sabiendo el de 50 m. */
export const vientoA = (v50, h) => v50 * (h / 50) ** CORTE_VIENTO;

// ------------------------------------------------------------------ el rotor
/** Qué parte del viento toma el rotor, según su velocidad de punta y el paso de las aspas (forma de Heier). */
export function cp(lambda, beta = 0) {
    if (lambda <= 0.3) return 0;
    const inv = 1 / (lambda + 0.08 * beta) - 0.035 / (beta ** 3 + 1);
    const c = 0.5176 * (116 * inv - 0.4 * beta - 5) * Math.exp(-21 * inv) + 0.0068 * lambda;
    return Math.max(0, c);
}
const memoOpt = {};
function lambdaOptima(beta = 0) {
    if (memoOpt[beta] !== undefined) return memoOpt[beta];
    let [mej, val] = [8, 0];
    for (let l = 2; l < 14; l += 0.02) { const c = cp(l, beta); if (c > val) { val = c; mej = l; } }
    memoOpt[beta] = mej;
    return mej;
}
export const LAMBDA_OPT = lambdaOptima(0);
export const CP_MAX = cp(LAMBDA_OPT, 0);

/**
 * El aerogenerador con un viento dado, ya acomodado. o: { D, mw, rho, desvio (grados), paso (grados: si viene, manda el usuario) }.
 * Devuelve MW a la salida, rpm, paso y en qué zona trabaja.
 */
export function aerogenerador(v, { D = TURBINA.D, mw = TURBINA.mw, rho = 1.225, desvio = 0, paso = null } = {}) {
    const R = D / 2;
    const A = Math.PI * R * R;
    const rpmMax = (TURBINA.punta / R) * (60 / (2 * Math.PI));
    const ve = v * Math.cos(desvio * D2R);
    const Pviento = 0.5 * rho * A * v ** 3 / 1e6; // MW
    if (v < TURBINA.Varranque || v >= TURBINA.Vparo) {
        return { v, ve, zona: v >= TURBINA.Vparo ? 'paro' : 'calma', mw: 0, rpm: 0, beta: v >= TURBINA.Vparo ? 90 : 0, cp: 0, lambda: 0, Pviento, A, Ct: 0, rendimiento: RENDIMIENTO, Pmax: mw };
    }
    const lambdaIdeal = LAMBDA_OPT;
    const rpmMeta = clamp(((lambdaIdeal * ve) / R) * (60 / (2 * Math.PI)), TURBINA.rpmMin, rpmMax);
    const w = (rpmMeta * 2 * Math.PI) / 60;
    const lambda = ve > 0.1 ? (w * R) / ve : 0;
    const Pve = 0.5 * rho * A * ve ** 3 / 1e6;
    const consumo = CONSUMO / 1000;
    const nominal = mw;
    // manda el usuario
    if (paso !== null) {
        const c = cp(lambda, paso);
        const bruto = Math.max(0, Pve * c * RENDIMIENTO - consumo);
        return { v, ve, zona: 'manual', mw: Math.min(nominal, bruto), rpm: rpmMeta, beta: paso, cp: c, lambda, Pviento, A, Ct: Math.min(CT_MAX, (c / Math.max(CP_MAX, 0.01)) * CT_MAX), rendimiento: RENDIMIENTO, Pmax: mw };
    }
    const c0 = cp(lambda, 0);
    const libre = Math.max(0, Pve * c0 * RENDIMIENTO - consumo);
    // al acercarse a su tamaño, la máquina redondea la curva: se ve en todas las curvas publicadas
    const n = 8;
    const conTope = libre > 0 ? (libre ** -n + nominal ** -n) ** (-1 / n) : 0;
    let beta = 0;
    if (libre > conTope * 1.0005) {
        // busca el paso que deja justo esa potencia
        let [a, b] = [0, 45];
        for (let i = 0; i < 24; i++) {
            const m = (a + b) / 2;
            if (Pve * cp(lambda, m) * RENDIMIENTO - consumo > conTope) a = m; else b = m;
        }
        beta = (a + b) / 2;
    }
    const cUsado = Pve > 0 ? (conTope + consumo) / (Pve * RENDIMIENTO) : 0;
    const zona = libre < nominal * 0.9 ? 'sube' : beta > 0.5 ? 'nominal' : 'sube';
    // arriba de su tamaño, el rotor empuja menos: la estela también se debilita
    const Ct = Math.min(CT_MAX, CT_MAX * (cUsado / Math.max(CP_MAX, 0.01)));
    return { v, ve, zona, mw: conTope, rpm: rpmMeta, beta, cp: cUsado, lambda, Pviento, A, Ct, rendimiento: RENDIMIENTO, Pmax: mw };
}
/** De cada 100 de energía del viento que cruza el rotor, a dónde va. */
export function reparto(a) {
    if (a.Pviento <= 0.0001) return { sigue: 0, aspas: 0, suelta: 0, maquina: 0, red: 0, hay: false };
    const red = a.mw / a.Pviento;
    const convertido = a.cp;
    const maquina = Math.max(0, convertido - red);
    const posible = Math.min(BETZ, CP_MAX);
    const aspas = posible - Math.min(posible, CP_MAX);
    const noToma = Math.max(0, posible - convertido);
    return { sigue: 1 - BETZ, aspas: (BETZ - CP_MAX) + aspas, suelta: noToma, maquina, red, hay: a.mw > 0 };
}

// ------------------------------------------------------------------ la estela
/** Qué tanto frena el aire un rotor, x diámetros detrás (Jensen). */
export const deficit = (x, Ct = CT_MAX, k = K_ESTELA) => (x <= 0 ? 0 : (1 - Math.sqrt(1 - clamp(Ct, 0, 0.99))) / (1 + 2 * k * x) ** 2);
/** Una fila de aerogeneradores alineados con el viento. Devuelve el viento y la potencia de cada uno. */
export function fila(v, n = 3, separacion = SEPARACION, o = {}) {
    const lista = [];
    for (let i = 0; i < n; i++) {
        let suma = 0;
        for (let j = 0; j < i; j++) suma += deficit((i - j) * separacion, lista[j].Ct) ** 2;
        const u = v * (1 - Math.sqrt(suma));
        const a = aerogenerador(u, o);
        lista.push({ u, mw: a.mw, Ct: a.Ct, rpm: a.rpm, beta: a.beta });
    }
    const uno = aerogenerador(v, o).mw;
    return { lista, total: lista.reduce((s, t) => s + t.mw, 0), sinEstela: uno * n, perdida: uno > 0 ? 1 - lista.reduce((s, t) => s + t.mw, 0) / (uno * n) : 0 };
}

// ------------------------------------------------------------------ un año
const gamma1 = 1 / K_WEIBULL;
// Γ(1 + 1/k), con la aproximación de Stirling-Lanczos para este k
function gammaF(x) {
    const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x;
    const t = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
    let s = 1.000000000190015;
    for (const c of g) { y += 1; s += c / y; }
    return Math.exp(-t + Math.log((2.5066282746310005 * s) / x));
}
const G1 = gammaF(1 + gamma1);
/** Qué tan seguido sopla cada viento, por m/s (Weibull), con ese viento medio. */
export const weibull = (v, media, k = K_WEIBULL) => {
    if (v <= 0 || media <= 0) return 0;
    const A = media / G1;
    return (k / A) * (v / A) ** (k - 1) * Math.exp(-((v / A) ** k));
};
const memoAno = new Map();
/** El año de un aerogenerador y del parque. o: { sitio, buje, D, sinOtras }. */
export function anual({ sitio = DEF.sitio, buje = DEF.buje, D = TURBINA.D, mw = TURBINA.mw } = {}) {
    const clave = `${sitio}|${buje}|${D}|${mw}`;
    if (memoAno.has(clave)) return memoAno.get(clave);
    const S = SITIOS[sitio];
    const meses = [];
    let [gwh, horas] = [0, 0];
    for (let i = 0; i < 12; i++) {
        const media = vientoA(S.ws50[i], buje);
        const rho = densidad(S.m + buje, S.t[i]);
        let e = 0;
        for (let v = 0.25; v < 30; v += 0.5) e += weibull(v, media) * 0.5 * aerogenerador(v, { D, mw, rho }).mw;
        const h = DIAS[i] * 24;
        const g = (e * h * FACTOR_OTRAS) / 1000; // GWh por aerogenerador
        meses.push({ mes: i + 1, media, gwh: g, rho, factor: g / ((mw * h) / 1000) });
        gwh += g;
        horas += h;
    }
    const factor = gwh / ((mw * horas) / 1000);
    const r = { meses, gwh, factor, parque: gwh * PARQUE.n, media: vientoA(S.anual, buje) };
    memoAno.set(clave, r);
    return r;
}

// ------------------------------------------------------------------ el tiempo: lo que tarda en responder
export const RAPIDEZ = { tauRpm: 3.5, paso: 8, desvio: 6, viento: 1.4 }; // paso: grados por segundo
export const estadoPlanta = ({ v = DEF.v } = {}) => { const a = aerogenerador(v); return { v, rpm: a.rpm, beta: a.beta, parado: false, desvio: 0, tormenta: 1 }; };
/** Viento durante una tormenta, u de 0 a 1: sube, pasa de 22.5 m/s, baja. */
export const vientoTormenta = (u, base) => lerp(base, 29, Math.sin(Math.PI * clamp01(u)) ** 1.3);
/** Un paso del tiempo. m: { v, desvio, paso (o null) }. Función pura, independiente de la velocidad de los cuadros. */
export function pasoPlanta(s, m, dt) {
    const pasos = Math.max(1, Math.ceil(dt / 0.05));
    const h = dt / pasos;
    const n = { ...s };
    for (let i = 0; i < pasos; i++) {
        if (n.tormenta < 1) n.tormenta = Math.min(1, n.tormenta + h / 16);
        const meta = n.tormenta < 1 ? vientoTormenta(n.tormenta, m.v) : m.v;
        n.v += clamp(meta - n.v, -RAPIDEZ.viento * 6 * h, RAPIDEZ.viento * 6 * h);
        // con mucho viento para y no regresa hasta que baja bastante
        if (n.v >= TURBINA.Vparo) n.parado = true;
        else if (n.parado && n.v < TURBINA.Vregresa) n.parado = false;
        const a = aerogenerador(n.parado ? TURBINA.Vparo : n.v, { desvio: n.desvio, paso: m.paso ?? null });
        // sin fuerza del viento (aspas de canto), el rotor se va frenando solo
        const rpmMeta = n.parado ? 0 : m.paso != null ? a.rpm * clamp01(a.cp / 0.06) : a.rpm;
        const betaMeta = n.parado ? 90 : m.paso ?? a.beta;
        n.rpm += (rpmMeta - n.rpm) * (1 - Math.exp(-h / RAPIDEZ.tauRpm));
        n.beta += clamp(betaMeta - n.beta, -RAPIDEZ.paso * h, RAPIDEZ.paso * h);
        n.desvio += clamp((m.desvio ?? 0) - n.desvio, -RAPIDEZ.desvio * h, RAPIDEZ.desvio * h);
    }
    return n;
}

// ------------------------------------------------------------------ las lecturas
/** Lo que mide la central. modo: 'viento' | 'control' | 'ano' | 'estela'. */
export function calcular({ modo = 'viento', planta = null, v = DEF.v, mes = DEF.mes, sitio = DEF.sitio, buje = DEF.buje, separacion = DEF.separacion, paso = DEF.paso, desvio = DEF.desvio } = {}) {
    const S = SITIOS[sitio];
    const m = clamp(Math.round(mes), 1, 12) - 1;
    const vientoAno = vientoA(S.ws50[m], buje);
    const vReal = modo === 'ano' ? vientoAno : planta ? planta.v : v;
    const rho = modo === 'ano' ? densidad(S.m + buje, S.t[m]) : 1.225;
    const desvioReal = modo === 'control' ? (planta ? planta.desvio : desvio) : 0;
    const manual = modo === 'control' ? (planta ? planta.beta : paso) : null;
    const parado = planta ? planta.parado : vReal >= TURBINA.Vparo;
    let a = parado ? aerogenerador(TURBINA.Vparo, { rho }) : aerogenerador(vReal, { rho, desvio: desvioReal, paso: manual });
    // Las aspas tardan en regresar: mientras sigan más giradas de lo que toca, dan menos.
    if (planta && !parado && manual === null && planta.beta > a.beta + 0.5) a = aerogenerador(vReal, { rho, paso: planta.beta });
    const F = fila(vReal, 3, separacion, { rho });
    const r = {
        modo, a, v: vReal, rho, mw: parado ? 0 : a.mw, rpm: planta ? planta.rpm : a.rpm, beta: planta ? planta.beta : a.beta, desvio: desvioReal, parado, reparto: reparto(a), sitio, S, buje, mes: m + 1, separacion, fila: F, tormenta: planta ? planta.tormenta : 1,
    };
    r.rpmGen = r.rpm * TURBINA.multiplica;
    r.frecuencia = (TURBINA.polos * r.rpmGen) / 120;
    r.parque = r.mw * PARQUE.n;
    if (modo === 'estela') { r.mwFila = F.total; }
    return r;
}

// ------------------------------------------------------------------ acomodo de la central (no está a escala)
export const BLOQUE = { x: [-7.6, 7.6], z: [-4.2, 4.4], y: [-1.1, 0] };
const DIR = 55 * D2R;
/** Hacia dónde sopla el viento en la escena, y hacia dónde mira el rotor. */
export const VIENTO = { x: Math.sin(DIR), z: -Math.cos(DIR) };
export const ROTOR = { yaw: Math.atan2(-VIENTO.x, -VIENTO.z), R: 2.25, H: 3.55, zBuje: 0.92 };
export const SEP_VISTA = 4.6;
const T0 = { x: -5.4, z: 2.4 };
export const AEROS = [T0, { x: T0.x + SEP_VISTA * VIENTO.x, z: T0.z + SEP_VISTA * VIENTO.z }, { x: T0.x + 2 * SEP_VISTA * VIENTO.x, z: T0.z + 2 * SEP_VISTA * VIENTO.z }];
export const MASTIL = { x: -1.45, z: 3.45, h: 2.75 };
export const TORRES = [[7.32, -0.2], [7.32, 4.05]];
export const ALTO_TORRE = 3.3;
const puntasTorre = TORRES.map(([x, z]) => [x, ALTO_TORRE, z]);
/** La subestación: el transformador elevador (x, z y su escala), el marco donde llegan sus fases y el pórtico de salida. */
export const SUBESTACION = { x: 4.55, z: 1.45, esc: 1.35, marco: 5.92, yMarco: 1.25 };
export const PORTICO = { x: 6.48, z: 1.55, alto: 2.55, aislador: 0.16 };
export const REDUCTORA = { x: 7.1, z: 3.18, alto: 1.28 };
/** Postes de madera de la RGD: x, z y alto; los conductores van sobre sus aisladores de perno. */
export const POSTES = [[6.45, 3.4, 1], [5.95, 3.35, 0.78]];
/** La caja de cables de media tensión, pegada atrás del transformador elevador: x0, x1, y0, y1, z0, z1. */
export const CAJA_MT = [4.04, 4.44, 0, 0.42, 0.823, 0.963];
export const FLUIDOS = {
    aire: { nombre: 'Viento', color: '#7fb2d6' },
    ca: { nombre: 'Electricidad', color: '#ffb000' },
};
const CAJA_BASE = 0.32;
const base = i => [AEROS[i].x + 0.42, AEROS[i].z + 0.42];
// Cada caja: x0, x1, y0, y1, z0, z1. Las pinta planta.js y con ellas se revisa que cada cable llegue a un equipo.
export const EQUIPOS = {
    ...Object.fromEntries(AEROS.map((_, i) => { const [x, z] = base(i); return [`base${i}`, [x - CAJA_BASE / 2, x + CAJA_BASE / 2, 0, 0.42, z - CAJA_BASE / 2, z + CAJA_BASE / 2]]; })),
    ...Object.fromEntries(AEROS.map((t, i) => [`torre${i}`, [t.x - 0.2, t.x + 0.2, 0, ROTOR.H, t.z - 0.2, t.z + 0.2]])),
    subestacion: [3.95, 6.05, 0, 1.3, 0.55, 2.45],
    portico: [6.15, 6.81, 0, 2.62, 1.2, 1.9],
    reductora: [6.75, 7.45, 0, 1.3, 2.85, 3.5],
    pueblo: [4.1, 6.5, 0, 0.9, 2.85, 4.1],
};
const [b0, b1, b2] = [base(0), base(1), base(2)];
const [mx0, , , , mz0] = CAJA_MT;
const cruceta = ([x, z]) => [x, ALTO_TORRE * 0.92, z];
const { x: rx, z: rz } = REDUCTORA;
/** Los bornes donde se conecta cada cable o cada apoyo de línea; deben coincidir con lo que modela planta.js. */
export const BORNES = {
    // en cada aerogenerador: el cable sale de la góndola, baja por dentro de la torre y entra por atrás al transformador del pie
    ...Object.fromEntries(AEROS.map((t, i) => [`gondola${i}`, [t.x + 0.06, ROTOR.H, t.z - 0.06]])),
    ...Object.fromEntries(AEROS.map((t, i) => [`trafoPie${i}`, [base(i)[0], 0.05, base(i)[1] - CAJA_BASE / 2 - 0.01]])),
    salida0: [b0[0], 0.05, b0[1] + CAJA_BASE / 2 - 0.01],
    salida1: [b1[0], 0.05, b1[1] + CAJA_BASE / 2 - 0.01],
    salida2: [b2[0] + CAJA_BASE / 2 - 0.01, 0.05, b2[1]],
    // la caja de cables de media tensión del transformador elevador
    cajaMT0: [mx0, 0.05, 0.92],
    cajaMT1: [mx0, 0.05, 0.86],
    cajaMT2: [4.36, 0.05, mz0],
    // alta tensión: boquillas, marco, pórtico, torres, la reductora y los postes
    boqAlta: [SUBESTACION.x, (0.68 + 0.32) * SUBESTACION.esc, SUBESTACION.z],
    marco: [SUBESTACION.marco, SUBESTACION.yMarco, SUBESTACION.z],
    portico: [PORTICO.x, PORTICO.alto, PORTICO.z],
    porticoAmarre: [PORTICO.x, PORTICO.alto - PORTICO.aislador, PORTICO.z],
    torre1: cruceta(TORRES[0]),
    torre2: cruceta(TORRES[1]),
    remateReductora: [rx, REDUCTORA.alto, rz + 0.26],
    altaReductora: [rx + 0.02, 0.66, rz + 0.12],
    bajaReductora: [rx - 0.11, 0.57, rz - 0.06],
    ...Object.fromEntries(POSTES.map(([x, z, h], i) => [`poste${i + 1}`, [x, h + 0.02, z]])),
};
/** Puntas que salen por la orilla del sitio: aquí ninguna, la RGD termina en el último poste del pueblo. */
export const REMATE = new Set();
/** Un cable de piso: delgado y oscuro, por la zanja; sube pegado al equipo solo en sus puntas. */
const cable = (id, grupo, parte, puntos) => ({ id, grupo, parte, fluido: 'ca', r: 0.02, cable: true, puntos });
const yP = 0.03;
export const LINEAS = [
    // de la góndola al pie de cada torre: baja por dentro y sale por el piso al transformador
    ...AEROS.map((t, i) => cable(`baja${i}`, `t${i}`, i === 0 ? 'torre' : 'estela', [BORNES[`gondola${i}`], [t.x + 0.06, yP, t.z - 0.06], [base(i)[0], yP, t.z - 0.06], BORNES[`trafoPie${i}`]])),
    // la red interna del parque: un cable por aerogenerador, por la zanja hasta la caja del transformador elevador
    cable('col0', 't0', 'subestacion', [BORNES.salida0, [b0[0], yP, 3.04], [3.67, yP, 3.04], [3.67, yP, 0.92], BORNES.cajaMT0]),
    cable('col1', 't1', 'subestacion', [BORNES.salida1, [b1[0], yP, 2.92], [3.55, yP, 2.92], [3.55, yP, 0.86], BORNES.cajaMT1]),
    cable('col2', 't2', 'subestacion', [BORNES.salida2, [4.48, yP, b2[1]], [4.48, yP, 0.62], [4.36, yP, 0.62], BORNES.cajaMT2]),
    // las líneas aéreas no llevan tubo: la página dibuja sus tres conductores; aquí va la fase de en medio, por donde corre la electricidad
    lineaAerea('alta', [apoyo(BORNES.marco, [0, 0, -0.5]), apoyo(BORNES.portico, [0.2, 0, 0], PORTICO.aislador)], { grupo: 'red', parte: 'subestacion', fluido: 'ca' }),
    lineaAerea('rnt', [
        apoyo(BORNES.porticoAmarre, [0.2, 0, 0]),
        apoyo(BORNES.torre1, [0.25, 0, 0], 0.08),
        apoyo(BORNES.torre2, [0.25, 0, 0], 0.08),
        apoyo(BORNES.remateReductora, [0.18, 0, 0], 0.1),
        apoyo(BORNES.altaReductora, [0.09, 0, 0]),
    ], { grupo: 'red', parte: 'red', fluido: 'ca' }),
    lineaAerea('rgd', [apoyo(BORNES.bajaReductora, [0, 0, 0.09]), apoyo(BORNES.poste1, [0, 0, 0.1]), apoyo(BORNES.poste2, [0, 0, 0.1])], { grupo: 'red', parte: 'red', fluido: 'ca' }),
];

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
const C = { x: T0.x + ROTOR.zBuje * -VIENTO.x, z: T0.z + ROTOR.zBuje * -VIENTO.z };
const H = ROTOR.H;
export const PARTES = [
    { id: 'viento', ancla: [MASTIL.x, MASTIL.h + 0.25, MASTIL.z], vista: { az: -24, el: 12, tam: 8.6, mira: [-1.8, 2.4, 1.4] } },
    { id: 'aspas', ancla: [C.x, H + 1.6, C.z], vista: { az: -38, el: 6, tam: 6.6, mira: [C.x + 0.5, H - 0.2, C.z] } },
    { id: 'paso', ancla: [C.x, H + 0.32, C.z], vista: { az: -28, el: 12, tam: 1.9, mira: [C.x, H, C.z] } },
    { id: 'eje', ancla: [T0.x - 0.3 * VIENTO.x, H + 0.5, T0.z - 0.3 * VIENTO.z], vista: { az: 35, el: 14, tam: 2.1, mira: [T0.x - 0.3 * VIENTO.x, H + 0.12, T0.z - 0.3 * VIENTO.z] } },
    { id: 'multiplicadora', ancla: [T0.x + 0.06 * VIENTO.x, H + 0.52, T0.z + 0.06 * VIENTO.z], vista: { az: 35, el: 14, tam: 2, mira: [T0.x, H + 0.12, T0.z] } },
    { id: 'generador', ancla: [T0.x + 0.48 * VIENTO.x, H + 0.52, T0.z + 0.48 * VIENTO.z], vista: { az: 35, el: 14, tam: 2, mira: [T0.x + 0.4 * VIENTO.x, H + 0.12, T0.z + 0.4 * VIENTO.z] } },
    { id: 'convertidor', ancla: [b0[0], 0.62, b0[1]], vista: { az: 35, el: 16, tam: 5.4, mira: [T0.x + 0.2, 2, T0.z + 0.2] } },
    { id: 'orientacion', ancla: [T0.x, H + 0.86, T0.z], vista: { az: 35, el: 20, tam: 2.4, mira: [T0.x + 0.2 * VIENTO.x, H + 0.2, T0.z + 0.2 * VIENTO.z] } },
    { id: 'torre', ancla: [T0.x + 0.28, 1.9, T0.z + 0.1], vista: { az: -6, el: 10, tam: 5.2, mira: [T0.x, 1.9, T0.z] } },
    { id: 'cimentacion', ancla: [T0.x - 0.75, 0.42, T0.z + 0.6], vista: { az: -24, el: 16, tam: 3.6, mira: [T0.x, 0.55, T0.z] } },
    { id: 'estela', ancla: [AEROS[1].x, H + 1.5, AEROS[1].z], vista: { az: -24, el: 34, tam: 11.5, mira: [-0.5, 1.8, 0] } },
    { id: 'subestacion', ancla: [5, 1.58, 1.5], vista: { az: -14, el: 22, tam: 4.4, mira: [4.7, 0.75, 1.6] } },
    { id: 'red', ancla: [7.32, 3.55, 4.05], vista: { az: 18, el: 16, tam: 6.6, mira: [5.8, 1.35, 2.8] } },
];

// ------------------------------------------------------------------ la pose
/** Todo lo que necesita posar(): lecturas, cuánto corre por cada cable (0–1), cómo van los rotores, y la cámara. */
export function pose({ modo = 'viento', planta = null, v = DEF.v, mes = DEF.mes, sitio = DEF.sitio, buje = DEF.buje, separacion = DEF.separacion, paso = DEF.paso, desvio = DEF.desvio, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null } = {}) {
    const lectura = calcular({ modo, planta, v, mes, sitio, buje, separacion, paso, desvio });
    const L = lectura.fila.lista;
    const frac = i => (lectura.parado ? 0 : clamp01((modo === 'control' && i === 0 ? lectura.mw : L[i].mw) / TURBINA.mw));
    const grupos = { t0: frac(0), t1: frac(1), t2: frac(2), red: clamp01((frac(0) + frac(1) + frac(2)) / 3) };
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = grupos[l.grupo] ?? 0;
    const activo = { red: grupos.red, viento: clamp01(lectura.v / 15), rotor: clamp01(lectura.rpm / 10), paro: lectura.parado ? 1 : 0, gen: frac(0) };
    const rotores = [0, 1, 2].map(i => {
        if (i === 0 || !planta) return { rpm: lectura.rpm, beta: lectura.beta };
        const r = lectura.parado ? 0 : L[i].rpm;
        const b = lectura.parado ? 90 : L[i].beta;
        return { rpm: Math.min(r, lectura.rpm + 0.001), beta: b };
    });
    const cam = camara || { mira: [0, 1.8, 0], az: -24, el: 24, d: 38 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura, flujos, activo, rotores, desvio: lectura.desvio, u: L.map(x => x.u), v: lectura.v, separacion,
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'viento', v: lerp(4, 16, clamp01(t / 12)), camara: { mira: [0, 1.8, 0], az: lerp(-30, -14, t / 12), el: 24, d: 38 } });
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
/** Cada punta de cada cable debe tocar un equipo u otro cable. Devuelve las que quedan al aire. */
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
    return sueltas.concat(cablesSueltos());
}
/** Los cables cuelgan de algo: cada punta en un borne y cada punto de en medio en un borne o en el piso (planta-comun/lineas.js). */
export const cablesSueltos = () => revisarCables(LINEAS, BORNES, REMATE);
/** Revisión de cifras contra lo publicado. */
export function revisar() {
    const p = [];
    const lejos = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // 1. la física contra la curva publicada de la V126-3.45: mismo aire de referencia y mismo tamaño
    for (const [v, kw] of CURVA_V126.puntos) {
        const m = aerogenerador(v, { D: CURVA_V126.D, mw: CURVA_V126.mw, rho: 1.225 }).mw * 1000;
        lejos(m / kw, v < 5 ? 0.8 : 0.92, v < 5 ? 1.2 : 1.07, `V126-3.45 con ${v} m/s, modelo entre curva`);
    }
    lejos(aerogenerador(TURBINA.Varranque - 0.1).mw, 0, 0, 'sin viento no da nada');
    lejos(aerogenerador(TURBINA.Vparo).mw, 0, 0, 'con mucho viento se detiene');
    lejos(aerogenerador(15).mw, 3.44, 3.45, 'a 15 m/s da su tamaño');
    lejos(aerogenerador(15).beta, 5, 30, 'a 15 m/s suelta viento con el paso');
    lejos(aerogenerador(8).beta, 0, 0.1, 'a 8 m/s las aspas no sueltan nada');
    // 2. Betz y la velocidad de punta
    lejos(CP_MAX, 0.44, BETZ, 'lo más que toma el rotor (Betz: 59.3 %)');
    lejos(LAMBDA_OPT, 6, 9, 'velocidad de punta óptima');
    lejos(aerogenerador(7).cp, 0.42, 0.5, 'Cp con 7 m/s');
    // 3. el rotor y el aire
    lejos(Math.PI * (TURBINA.D / 2) ** 2, 14500, 14550, 'área del rotor de 136 m (OEDB: 14,525 m²)');
    lejos((TURBINA.mw * 1e6) / (Math.PI * (TURBINA.D / 2) ** 2), 235, 240, 'W por m² de rotor (OEDB: 237.5)');
    lejos(densidad(0, 15), 1.22, 1.23, 'aire de referencia');
    lejos(vientoA(10, 100) / 10, 1.09, 1.11, 'con el doble de altura, 10 % más viento (ley de potencia de 1/7)');
    lejos((TURBINA.polos * 1200) / 120, 60, 60, 'seis polos a 1,200 vueltas dan 60 Hz');
    const rpmMax = aerogenerador(15).rpm;
    lejos(rpmMax, 10, 13, 'vueltas por minuto del rotor');
    // 4. el viento contra NASA POWER, en cada sitio
    for (const k of Object.keys(SITIOS)) {
        const S = SITIOS[k];
        lejos(S.ws50.reduce((a, b, i) => a + b * DIAS[i], 0) / 365, S.anual - 0.06, S.anual + 0.06, `viento promedio de ${k} (NASA: ${S.anual})`);
    }
    // el Weibull integra 1 y da la media que se le pide
    let [suma, media] = [0, 0];
    for (let v = 0.05; v < 40; v += 0.1) { const f = weibull(v, 8); suma += f * 0.1; media += v * f * 0.1; }
    lejos(suma, 0.99, 1.01, 'Weibull integra 1');
    lejos(media, 7.9, 8.1, 'Weibull da su media');
    // 5. el año: factor de planta contra lo publicado
    const R = anual();
    lejos(R.factor, 0.33, 0.48, 'factor de planta de Reynosa con buje de 112 m (promedio de México, IMCO: 32.2 %; rotor grande para poco viento)');
    lejos(R.parque, 1200, 2100, 'GWh al año de los 123 aerogeneradores');
    const I = anual({ sitio: 'istmo' });
    lejos(I.meses[0].gwh / I.meses[8].gwh, 1.6, 4.5, 'en el Istmo, enero con «nortes» contra septiembre');
    // 6. la estela
    lejos(deficit(7), 0.1, 0.16, 'a 7 diámetros, el aire va más lento (Jensen)');
    const F = fila(9, 3, 7);
    lejos(F.lista[1].mw / F.lista[0].mw, 0.45, 0.8, 'lo que da el segundo aerogenerador, justo detrás');
    lejos(fila(9, 3, 12).perdida, 0, fila(9, 3, 3).perdida, 'más separados, menos pérdida');
    lejos(PARQUE.n * TURBINA.mw, 420, 428, '123 aerogeneradores de 3.45 MW (Reynosa: 424 MW)');
    const rp = reparto(aerogenerador(8));
    lejos(rp.sigue + rp.aspas + rp.suelta + rp.maquina + rp.red, 0.99, 1.01, 'el reparto del viento suma 100');
    const ss = puntasSueltas();
    if (ss.length) p.push(`Cables con una punta suelta: ${ss.join(', ')}`);
    return p;
}
