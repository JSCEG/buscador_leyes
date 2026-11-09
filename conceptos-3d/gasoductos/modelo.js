// El gasoducto, en cifras. Un solo modelo: de aquí salen el tablero, las gráficas y lo que corre por el tubo. Sin three.js, para probarlo con Vitest.
// Las cifras del ducto son de Los Ramones Fase II Norte; las reglas de válvulas y profundidad, de la NOM-020-ASEA-2024. Ver fuentes.js.
//
// La física: gas a temperatura pareja por un tubo largo. Con la fórmula de Darcy y la ley de los gases sale
//   P1² − P2² = f · (L / D) · Z R T · (m / A)²
// Por eso la presión cae cada vez más rápido, y el doble de gas cuesta cuatro veces la caída. Lo que no está aquí: las subidas del terreno y el calor que el gas gana o pierde.
import { clamp, clamp01, lerp } from '../planta-comun/ayudas.js';

const D2R = Math.PI / 180;
export const PSI_BAR = 0.0689476;
export const PIE3 = 0.0283168; // m³ por pie cúbico
export const DUCTO = { nombre: 'Los Ramones Fase II Norte', km: 447, pulgadas: 42, capacidad: 1430, capacidadCenagas: 1363, psi: 1200 };
export const PMOP = DUCTO.psi * PSI_BAR; // presión máxima de operación, en bar
export const P_ENTREGA = 60; // de ejemplo: la presión que debe tener el gas al llegar
export const P_PISO = 20; // abajo de esto, el tubo ya no deja pasar más
export const GAS = { G: 0.6, rhoStd: 0.735, Z: 0.87, T: 293, k: 1.3, etaC: 0.82, etaT: 0.33, pci: 48e6 }; // densidad relativa de 0.6 (fuente: 0.58 a 0.79); lo demás, de ejemplo
const R = 8314.46 / (GAS.G * 28.96);
export const ZRT = GAS.Z * R * GAS.T;
// el espesor sale de la ecuación de la norma: P D / (2 S F), con acero de 483 MPa (de ejemplo) y factor de 0.72
export const ACERO = { S: 483e6, F: 0.72 };
export const D_EXT = DUCTO.pulgadas * 0.0254;
export const PARED = (PMOP * 1e5 * D_EXT) / (2 * ACERO.S * ACERO.F);
export const D = D_EXT - 2 * PARED;
export const AREA = (Math.PI / 4) * D * D;
export const F_DARCY = 0.0112; // de ejemplo: ajustado para que dé la capacidad publicada con sus dos estaciones
export const ESTACIONES = [{ km: 150, nombre: 'Villagrán' }, { km: 300, nombre: 'Doctor Arroyo' }]; // los lugares son de la fuente; los kilómetros, de ejemplo
export const VALVULAS_NOM = [{ clase: 'Clase 1 y 2', km: 32, nota: 'Campo, poca gente' }, { clase: 'Clase 3', km: 24, nota: 'Más casas alrededor' }, { clase: 'Clase 4', km: 16, nota: 'Ciudad' }, { clase: 'Clase 5', km: 8, nota: 'Mucha gente reunida' }];
export const PROFUNDIDAD_NOM = [['Clase 1, 2 y 3', 60, 45], ['Clase 4 y 5', 75, 60], ['Cruce con carretera', 90, 60], ['Cruce de ferrocarril', 120, 120], ['Río o cuerpo de agua', 180, 60]];
export const DEF = { q: 1000, est: 2, pico: 30, oferta: 1000, media: 1000, hora: 20.5, corte: false, horaCorte: 6, tc: 10, clase: 0, rompe: false };
export const LIMITES = { q: [0, 1800], pico: [0, 60], oferta: [600, 1430], hora: [0, 24], tc: [1, 30] };

// ------------------------------------------------------------------ el tubo
/** kg/s de gas para un flujo en millones de pies cúbicos al día. */
export const masa = q => (q * 1e6 * PIE3 * GAS.rhoStd) / 86400;
/** Lo que baja P² (bar²) en un tramo de L km con ese flujo. */
export const caida2 = (q, km) => (F_DARCY * ((km * 1e3) / D) * ZRT * (masa(q) / AREA) ** 2) / 1e10;
/** Densidad del gas (kg/m³) a esa presión (bar). */
export const densidad = P => (P * 1e5) / ZRT;
/** Velocidad del gas (m/s). */
export const velocidad = (q, P) => (P > 0.1 ? masa(q) / AREA / densidad(P) : 0);
/** Cuánto cabe a esa presión contra la presión normal: el gas se aprieta. */
export const apretado = P => densidad(P) / GAS.rhoStd;

const tramosDe = est => {
    const paradas = ESTACIONES.filter((_, i) => est[i]).map(e => e.km);
    const cortes = [0, ...paradas, DUCTO.km];
    return cortes.slice(1).map((km, i) => ({ de: cortes[i], a: km, largo: km - cortes[i] }));
};
const lista = est => (Array.isArray(est) ? est : [est >= 1, est >= 2]);
/** El flujo con el que la presión cae hasta Pmin en el tramo más largo. */
export function capacidad(est = 2, Pmin = P_ENTREGA) {
    const largo = Math.max(...tramosDe(lista(est)).map(t => t.largo));
    return Math.sqrt((PMOP ** 2 - Pmin ** 2) / caida2(1, largo));
}
/** Presión a lo largo del ducto. Cada estación encendida regresa el gas a la presión máxima. */
export function perfil(q, est = 2) {
    const on = lista(est);
    const real = Math.min(q, capacidad(on, P_PISO));
    const tramos = tramosDe(on).map(t => {
        const fin = Math.sqrt(Math.max(0, PMOP ** 2 - caida2(real, t.largo)));
        return { ...t, fin };
    });
    const pEn = km => {
        const t = tramos.find(x => km <= x.a) ?? tramos.at(-1);
        return Math.sqrt(Math.max(0, PMOP ** 2 - caida2(real, clamp(km - t.de, 0, t.largo))));
    };
    return { q: real, pedido: q, tramos, pEn, fin: tramos.at(-1).fin, succion: tramos.slice(0, -1).map(t => t.fin), on };
}
/** Integra algo a lo largo del ducto. */
const aLoLargo = (P, f, n = 240) => {
    let s = 0;
    const dk = DUCTO.km / n;
    for (let i = 0; i < n; i++) s += f(P.pEn((i + 0.5) * dk)) * dk;
    return s;
};
/** Horas que tarda el gas en recorrer todo el ducto. */
export function viaje(q, est = 2) {
    const P = perfil(q, est);
    if (P.q < 1) return Infinity;
    return aLoLargo(P, p => 1000 / velocidad(P.q, p)) / 3600;
}
/** El gas que hay dentro del tubo, en millones de pies cúbicos. */
export const aPies = kg => kg / GAS.rhoStd / PIE3 / 1e6;
export const deKg = kg => kg;
export function empaque(q, est = 2) {
    const P = perfil(q, est);
    return aPies(aLoLargo(P, p => densidad(p) * AREA * 1000));
}

// ------------------------------------------------------------------ la estación
/** Lo que hace una estación: de la presión que llega a la que sale. */
export function compresion(q, Ps, Pd = PMOP) {
    const r = Ps > 1 ? Math.max(1, Pd / Ps) : 1;
    const n = (GAS.k - 1) / GAS.k;
    const sube = r ** n - 1;
    const w = (ZRT * sube) / n / GAS.etaC; // J/kg
    const m = masa(q);
    const MW = (w * m) / 1e6;
    const combustible = (MW * 1e6) / GAS.etaT / GAS.pci; // kg/s
    return { r, MW, hp: MW * 1341, sale: GAS.T * (1 + sube / GAS.etaC) - 273.15, entra: GAS.T - 273.15, combustible, pct: m > 0 ? (combustible / m) * 100 : 0, sube: Pd - Ps };
}

// ------------------------------------------------------------------ un día: el empaque
/** La demanda del día: mayor en la noche, cuando la central eléctrica trabaja más. Forma de ejemplo. Promedio: 0; máximo: 1. */
const forma = h => {
    const g = (c, w) => Math.exp(-(((h - c + 36) % 24 - 12) ** 2) / (2 * w * w));
    return g(20.5, 2.6) + 0.42 * g(8.5, 2.2) - 0.36;
};
const MAX_FORMA = (() => { let m = 0; for (let h = 0; h < 24; h += 0.05) m = Math.max(m, forma(h)); return m; })();
const MEDIA_FORMA = (() => { let s = 0; for (let h = 0; h < 24; h += 0.05) s += forma(h) * 0.05; return s / 24; })();
export const demandaEn = (h, { media = DEF.media, pico = DEF.pico } = {}) => media * (1 + ((pico / 100) * (forma(h) - MEDIA_FORMA)) / (MAX_FORMA - MEDIA_FORMA));
const V_TUBO = AREA * DUCTO.km * 1000; // m³
const K_TRAMO = q => caida2(q, DUCTO.km / 3);
/** Del gas guardado y el flujo, las presiones de un tramo: la del principio y la de la entrega. */
export function presionesDe(kg, q) {
    const prom = (kg * ZRT) / V_TUBO / 1e5;
    const c = K_TRAMO(q);
    const media = (a, b) => (2 / 3) * (a + b - (a * b) / (a + b));
    let [lo, hi] = [1, prom * 1.4];
    for (let i = 0; i < 30; i++) {
        const p2 = (lo + hi) / 2;
        if (media(Math.sqrt(p2 * p2 + c), p2) > prom) hi = p2;
        else lo = p2;
    }
    const p2 = (lo + hi) / 2;
    const sale = Math.sqrt(p2 * p2 + c);
    // la estación no puede pasar de la presión máxima: lo que falta se nota al llegar
    return sale > PMOP ? { sale: PMOP, llega: Math.sqrt(Math.max(1, PMOP * PMOP - c)), prom } : { sale, llega: p2, prom };
}
const PASO_H = 0.05;
function correrDia(kg0, { oferta, pico, media, corte, horaCorte }) {
    const n = Math.round(24 / PASO_H);
    const out = { h: [], demanda: [], entra: [], sale: [], kg: [], pSale: [], pLlega: [] };
    let kg = kg0;
    for (let i = 0; i <= n; i++) {
        const h = i * PASO_H;
        const d = demandaEn(h, { media, pico });
        const P = presionesDe(kg, d);
        let entra = corte && h >= horaCorte ? 0 : oferta;
        if (P.sale >= PMOP && entra > d) entra = d; // ya no cabe más
        const sale = d * clamp01((P.llega - P_PISO * 1.5) / 10);
        out.h.push(h);
        out.demanda.push(d);
        out.entra.push(entra);
        out.sale.push(sale);
        out.kg.push(kg);
        out.pSale.push(P.sale);
        out.pLlega.push(P.llega);
        kg += (masa(entra) - masa(sale)) * PASO_H * 3600;
    }
    return { out, kg };
}
/** Un día: lo que entra, lo que sale y lo que el tubo guarda. */
export function dia({ oferta = DEF.oferta, pico = DEF.pico, media = DEF.media, corte = false, horaCorte = DEF.horaCorte } = {}) {
    let kg = (densidad(72) * V_TUBO);
    for (let d = 0; d < 5; d++) kg = correrDia(kg, { oferta, pico, media, corte: false }).kg;
    const { out } = correrDia(kg, { oferta, pico, media, corte, horaCorte });
    const en = (h, a) => a[clamp(Math.round(h / PASO_H), 0, a.length - 1)];
    const lleno = densidad(PMOP) * V_TUBO;
    let falta = null;
    for (let i = 0; i < out.h.length; i++) if (out.pLlega[i] < P_ENTREGA) { falta = out.h[i]; break; }
    return {
        ...out,
        en,
        demandaEn: h => en(h, out.demanda),
        entraEn: h => en(h, out.entra),
        saleEn: h => en(h, out.sale),
        llegaEn: h => en(h, out.pLlega),
        saleP: h => en(h, out.pSale),
        kgEn: h => en(h, out.kg),
        guardado: h => aPies(en(h, out.kg)),
        lleno: aPies(lleno),
        falta,
        horasCorte: corte && falta !== null ? Math.max(0, falta - horaCorte) : null,
        min: aPies(Math.min(...out.kg)),
        max: aPies(Math.max(...out.kg)),
    };
}
/** Si dejara de entrar gas con el tubo como está: cuántas horas alcanza a entregar la demanda con la presión debida. */
export function horasQueAlcanza(q = DEF.media, kg = densidad(72) * V_TUBO) {
    const c = K_TRAMO(q);
    const p1 = Math.sqrt(P_ENTREGA ** 2 + c);
    const prom = (2 / 3) * (p1 + P_ENTREGA - (p1 * P_ENTREGA) / (p1 + P_ENTREGA));
    return Math.max(0, kg - densidad(prom) * V_TUBO) / Math.max(1, masa(q)) / 3600;
}

// ------------------------------------------------------------------ una fuga
export const X_FUGA = 0.45; // de ejemplo: el lugar de la rotura, entre sus dos válvulas
export const KM_FUGA = 78;
/** Una rotura entre dos válvulas. Mientras no cierren, sigue llegando gas de los dos lados; luego, el tramo se vacía. Modelo de ejemplo, para ver la tendencia. */
export function fuga({ tc = DEF.tc, clase = DEF.clase, q = DEF.q } = {}) {
    const L = VALVULAS_NOM[clase].km * 1000;
    const P0 = perfil(q, 2).pEn(KM_FUGA);
    const V = AREA * L;
    const m0 = densidad(P0) * V;
    const tau = L * Math.sqrt((F_DARCY * (L / 2)) / D / ZRT) / 60; // minutos
    const lejos = 75e3; // de ejemplo: de dónde llega el gas, antes de que cierren
    const entra = 2 * AREA * ((P0 * 1e5) / Math.sqrt((F_DARCY * lejos * ZRT) / D));
    const paso = 0.25;
    const fin = Math.max(tc + 5 * tau, 30);
    const [t, P, perdido] = [[], [], []];
    let [M, per] = [m0, 0];
    for (let x = 0; x <= fin; x += paso) {
        t.push(x);
        P.push((M * ZRT) / V / 1e5);
        perdido.push(aPies(per));
        const sale = (M / tau) / 60; // kg/s
        const llega = x < tc ? entra : 0;
        M = Math.max(0, M + (llega - sale) * paso * 60);
        per += sale * paso * 60;
    }
    return { t, P, perdido, tc, fin, tau, L, P0, entraKgS: entra, tramo: aPies(m0), total: perdido.at(-1) + aPies(M) };
}
export const enFuga = (R, x) => {
    const i = clamp(Math.round(x / 0.25), 0, R.t.length - 1);
    return { t: x, P: R.P[i], perdido: R.perdido[i], cerrada: x >= R.tc, vacia: R.P[i] < 5 };
};
/** Lo que queda abajo de la rotura sigue entregando con lo que guarda el tubo. */
export function horasAbajo(q = DEF.q) {
    const kmAbajo = DUCTO.km - KM_FUGA;
    const P = perfil(q, 2);
    let kg = 0;
    for (let km = KM_FUGA; km < DUCTO.km; km += 2) kg += Math.max(0, densidad(P.pEn(km)) - densidad(P_ENTREGA)) * AREA * 2000;
    return { horas: q > 1 ? kg / masa(q) / 3600 : Infinity, kmAbajo };
}

// ------------------------------------------------------------------ el tiempo
export const estadoPlanta = ({ q = DEF.q, est = DEF.est } = {}) => ({ q, e1: est >= 1 ? 1 : 0, e2: est >= 2 ? 1 : 0, ev: null, pig: null });
const RAPIDEZ = { q: 420, est: 1 / 2.5, pig: 1 / 26, ev: 2 };
/** Un paso del tiempo. m: { q, est, rompe, diablo }. Función pura, independiente de la velocidad de los cuadros. */
export function pasoPlanta(s, m, dt) {
    const n = { ...s };
    n.q += clamp(m.q - n.q, -RAPIDEZ.q * dt, RAPIDEZ.q * dt);
    n.e1 += clamp((m.est >= 1 ? 1 : 0) - n.e1, -RAPIDEZ.est * dt, RAPIDEZ.est * dt);
    n.e2 += clamp((m.est >= 2 ? 1 : 0) - n.e2, -RAPIDEZ.est * dt, RAPIDEZ.est * dt);
    if (m.rompe && n.ev === null) n.ev = 0;
    else if (!m.rompe) n.ev = null;
    else n.ev = Math.min(n.ev + RAPIDEZ.ev * dt, 240);
    if (m.diablo && n.pig === null) n.pig = 0;
    else if (n.pig !== null) {
        n.pig += RAPIDEZ.pig * dt;
        if (n.pig >= 1) n.pig = null;
    }
    return n;
}

// ------------------------------------------------------------------ las lecturas
let cacheDia = { k: '', v: null };
let cacheFuga = { k: '', v: null };
const diaDe = o => {
    const k = JSON.stringify(o);
    if (cacheDia.k !== k) cacheDia = { k, v: dia(o) };
    return cacheDia.v;
};
const fugaDe = o => {
    const k = JSON.stringify(o);
    if (cacheFuga.k !== k) cacheFuga = { k, v: fuga(o) };
    return cacheFuga.v;
};
/** Lo que mide el gasoducto. modo: 'presion' | 'estacion' | 'empaque' | 'fuga'. */
export function calcular({ modo = 'presion', planta = null, q = DEF.q, est = DEF.est, pico = DEF.pico, oferta = DEF.oferta, hora = DEF.hora, corte = false, horaCorte = DEF.horaCorte, tc = DEF.tc, clase = DEF.clase } = {}) {
    const qq = planta ? planta.q : q;
    const on = planta ? [planta.e1 > 0.5, planta.e2 > 0.5] : lista(est);
    const n = on.filter(Boolean).length;
    const L = { modo, q: qq, est: n, on, hora, corte };
    if (modo === 'empaque') {
        const D_ = diaDe({ oferta, pico, media: DEF.media, corte, horaCorte });
        L.D = D_;
        L.h = hora;
        L.entra = D_.entraEn(hora);
        L.demanda = D_.demandaEn(hora);
        L.sale = D_.saleEn(hora);
        L.llega = D_.llegaEn(hora);
        L.salePresion = D_.saleP(hora);
        L.guardado = D_.guardado(hora);
        L.q = L.sale;
        L.P = perfil(Math.max(L.sale, 1), 2);
        L.pct = clamp01((L.guardado - aPies(densidad(P_ENTREGA) * V_TUBO)) / (D_.lleno - aPies(densidad(P_ENTREGA) * V_TUBO)));
        L.alcanza = horasQueAlcanza(Math.max(L.demanda, 1), D_.kgEn(hora));
        return L;
    }
    const P = perfil(qq, on);
    L.P = P;
    L.q = P.q;
    L.pedido = P.pedido;
    L.viaje = viaje(P.q, on);
    L.empaque = empaque(P.q, on);
    L.vIni = velocidad(P.q, PMOP);
    L.vFin = velocidad(P.q, P.fin);
    L.C = on.map((v, i) => (v ? compresion(P.q, P.tramos[on.slice(0, i).filter(Boolean).length].fin) : null));
    L.capacidad = capacidad(on);
    L.corta = P.q < P.pedido - 1;
    if (modo === 'fuga') {
        const R = fugaDe({ tc, clase, q: DEF.q });
        L.R = R;
        L.ev = planta ? planta.ev : null;
        L.F = L.ev === null ? null : enFuga(R, L.ev);
        L.abajo = horasAbajo(DEF.q);
        L.clase = clase;
        L.tc = tc;
    }
    return L;
}

// ------------------------------------------------------------------ acomodo (no está a escala)
export const BLOQUE = { x: [-8.4, 8.4], z: [-2.6, 3.4], y: [-1.35, 0] };
export const Z_DUCTO = 3.18;
export const Z_FONDO = 2.96; // la cara de atrás del corte
export const X_RIO = -1.05;
export const FLUIDOS = {
    alta: { nombre: 'Gas a alta presión', color: '#2d7fb8' },
    baja: { nombre: 'Gas a menos presión', color: '#7fb6d8' },
    caliente: { nombre: 'Gas recién comprimido', color: '#d9792c' },
    olor: { nombre: 'Gas con olor', color: '#d9a62c' },
    combustible: { nombre: 'Gas para la turbina', color: '#9b6fc2' },
};
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/** La altura del terreno: llano, con un río que cruza, y lomas atrás. */
export function terreno(x, z) {
    const rio = -0.3 * (1 - smooth(0.26, 0.62, Math.abs(x - X_RIO)));
    const lomas = 0.5 * smooth(-0.5, -2.6, z) * (0.55 + 0.45 * Math.sin(x * 0.72 + 0.8) * Math.cos(x * 0.31)) * (1 - smooth(4.4, 5.6, x));
    return rio + lomas * (1 - 0.8 * (1 - smooth(0.2, 0.8, Math.abs(x - X_RIO))));
}
/** La profundidad del ducto: va más hondo abajo del río. */
export const yDucto = x => -0.46 - 0.5 * (1 - smooth(0.42, 1.0, Math.abs(x - X_RIO)));
const TABLA_KM = [[-120, -8.4], [0, -7.0], [150, -3.2], [300, 0.6], [447, 5.0]];
export function xDeKm(km) {
    for (let i = 1; i < TABLA_KM.length; i++) if (km <= TABLA_KM[i][0]) return lerp(TABLA_KM[i - 1][1], TABLA_KM[i][1], (km - TABLA_KM[i - 1][0]) / (TABLA_KM[i][0] - TABLA_KM[i - 1][0]));
    return TABLA_KM.at(-1)[1];
}
export function kmDeX(x) {
    for (let i = 1; i < TABLA_KM.length; i++) if (x <= TABLA_KM[i][1]) return lerp(TABLA_KM[i - 1][0], TABLA_KM[i][0], (x - TABLA_KM[i - 1][1]) / (TABLA_KM[i][1] - TABLA_KM[i - 1][1]));
    return TABLA_KM.at(-1)[0];
}
export const X_ESTACION = ESTACIONES.map(e => xDeKm(e.km));
export const X_ERM = 5.0;
export const XV = { v0: -6.15, v1: -4.72, v2: 3.0 }; // válvulas de seccionamiento
export const X_ROTURA = -5.42;
export const HUECO_ANODOS = { x: [2.1, 2.62], y: [-1.22, -0.8] };

// Lo que corre por arriba del suelo. Cada estación repite lo mismo.
const Y0_TUBO = yDucto(-3);
const lineasEstacion = (pre, xs, parteS, parteC, parteE) => {
    const g = `${pre}`;
    return [
        { id: `${pre}Sube`, grupo: g, parte: parteS, fluido: 'baja', r: 0.04, puntos: [[xs - 1.02, Y0_TUBO, Z_DUCTO - 0.1], [xs - 1.02, Y0_TUBO, 2.62], [xs - 1.02, 0.2, 2.62], [xs - 0.74, 0.2, 2.62], [xs - 0.74, 0.2, 2.42]] },
        { id: `${pre}Fil`, grupo: g, parte: parteS, fluido: 'baja', r: 0.03, puntos: [[xs - 0.74, 0.62, 2.1], [xs - 0.5, 0.62, 2.1], [xs - 0.5, 0.62, 1.2]] },
        { id: `${pre}C0`, grupo: g, parte: parteC, fluido: 'baja', r: 0.028, puntos: [[xs - 0.5, 0.62, 1.86], [xs - 0.5, 0.22, 1.86], [xs - 0.42, 0.22, 1.86]] },
        { id: `${pre}C1`, grupo: g, parte: parteC, fluido: 'baja', r: 0.028, puntos: [[xs - 0.5, 0.62, 1.2], [xs - 0.5, 0.22, 1.2], [xs - 0.42, 0.22, 1.2]] },
        { id: `${pre}S0`, grupo: g, parte: parteC, fluido: 'caliente', r: 0.028, puntos: [[xs + 0.46, 0.22, 1.86], [xs + 0.68, 0.22, 1.86], [xs + 0.68, 0.34, 1.86]] },
        { id: `${pre}S1`, grupo: g, parte: parteC, fluido: 'caliente', r: 0.028, puntos: [[xs + 0.46, 0.22, 1.2], [xs + 0.68, 0.22, 1.2], [xs + 0.68, 0.34, 1.2]] },
        { id: `${pre}Baja`, grupo: g, parte: parteE, fluido: 'alta', r: 0.04, puntos: [[xs + 0.92, 0.4, 2.2], [xs + 0.92, 0.2, 2.62], [xs + 1.02, 0.2, 2.62], [xs + 1.02, Y0_TUBO, 2.62], [xs + 1.02, Y0_TUBO, Z_DUCTO - 0.1]] },
        { id: `${pre}Comb`, grupo: g, parte: parteC, fluido: 'combustible', r: 0.012, puntos: [[xs + 0.42, 0.1, 0.52], [xs + 0.3, 0.1, 0.9], [xs + 0.02, 0.1, 1.02]] },
    ];
};
const [XE1, XE2] = X_ESTACION;
export const LINEAS = [
    { id: 'lanza', grupo: 'siempre', parte: 'diablos', fluido: 'alta', r: 0.03, puntos: [[-6.25, 0.24, 2.36], [-6.05, 0.24, 2.36], [-6.02, Y0_TUBO, 2.36], [-6.02, Y0_TUBO, Z_DUCTO - 0.1]] },
    { id: 'mide', grupo: 'siempre', parte: 'llegada', fluido: 'alta', r: 0.03, puntos: [[-7.72, Y0_TUBO, Z_DUCTO - 0.1], [-7.72, Y0_TUBO, 2.36], [-7.72, 0.24, 2.36], [-7.42, 0.24, 2.36]] },
    ...lineasEstacion('e1', XE1, 'filtros', 'compresor', 'enfriador'),
    ...lineasEstacion('e2', XE2, 'estacion2', 'estacion2', 'estacion2'),
    // medición y regulación
    { id: 'ermSube', grupo: 'erm', parte: 'medicion', fluido: 'baja', r: 0.04, puntos: [[X_ERM + 0.05, Y0_TUBO, Z_DUCTO - 0.1], [X_ERM + 0.05, Y0_TUBO, 2.5], [X_ERM + 0.05, 0.22, 2.5], [X_ERM + 0.22, 0.22, 2.5]] },
    { id: 'ermCal', grupo: 'erm', parte: 'medicion', fluido: 'baja', r: 0.032, puntos: [[X_ERM + 0.42, 0.22, 2.5], [X_ERM + 0.62, 0.22, 2.5]] },
    { id: 'ermCal2', grupo: 'erm', parte: 'medicion', fluido: 'baja', r: 0.032, puntos: [[X_ERM + 1.3, 0.22, 2.5], [X_ERM + 1.86, 0.22, 2.5]] },
    ...[0, 1, 2].map(i => ({ id: `ermR${i}`, grupo: 'erm', parte: 'medicion', fluido: 'baja', r: 0.024, puntos: [[X_ERM + 1.42 + i * 0.22, 0.22, 2.5], [X_ERM + 1.42 + i * 0.22, 0.22, 0.92]] })),
    { id: 'ermSale', grupo: 'erm', parte: 'medicion', fluido: 'baja', r: 0.03, puntos: [[X_ERM + 1.42, 0.22, 0.92], [X_ERM + 1.98, 0.22, 0.92]] },
    { id: 'aCentral', grupo: 'central', parte: 'entregas', fluido: 'baja', r: 0.03, puntos: [[X_ERM + 1.42, 0.22, 0.92], [X_ERM + 1.42, 0.12, 0.3], [X_ERM + 1.8, 0.12, -0.75]] },
    { id: 'aOlor', grupo: 'ciudad', parte: 'olor', fluido: 'baja', r: 0.024, puntos: [[X_ERM + 1.98, 0.22, 0.92], [X_ERM + 2.12, 0.22, 1.1]] },
    { id: 'aCiudad', grupo: 'ciudad', parte: 'entregas', fluido: 'olor', r: 0.024, puntos: [[X_ERM + 2.36, 0.16, 1.2], [X_ERM + 2.42, 0.1, 1.72]] },
];
const REMATE = new Set();
const X_C = X_ERM + 2.0;
// Cada caja: x0, x1, y0, y1, z0, z1. Las pinta planta.js, y con ellas se revisa que cada tubo llegue a un equipo.
const cajasEstacion = (pre, xs) => ({
    [`${pre}Filtros`]: [xs - 0.9, xs - 0.58, 0, 0.72, 1.1, 2.46],
    [`${pre}M0`]: [xs - 0.46, xs + 0.5, 0, 0.42, 1.62, 2.1],
    [`${pre}M1`]: [xs - 0.46, xs + 0.5, 0, 0.42, 0.96, 1.44],
    [`${pre}Enf`]: [xs + 0.62, xs + 1.16, 0.3, 0.56, 0.92, 2.26],
    [`${pre}Comb`]: [xs + 0.3, xs + 0.54, 0, 0.3, 0.4, 0.64],
});
export const EQUIPOS = {
    ducto: [-8.4, X_ERM + 0.2, -1.2, -0.3, Z_DUCTO - 0.16, Z_DUCTO + 0.16],
    lanzador: [-7.15, -6.2, 0.1, 0.4, 2.2, 2.52],
    medidor: [-7.46, -7.12, 0, 0.4, 2.18, 2.54],
    ...cajasEstacion('e1', XE1),
    ...cajasEstacion('e2', XE2),
    filtroERM: [X_ERM + 0.2, X_ERM + 0.44, 0, 0.6, 2.38, 2.62],
    calentador: [X_ERM + 0.6, X_ERM + 1.32, 0.04, 0.42, 2.34, 2.66],
    central: [X_C - 0.4, X_C + 1.3, 0, 0.8, -2.2, -0.7],
    odorizador: [X_ERM + 2.08, X_ERM + 2.42, 0, 0.42, 1.0, 1.32],
    ciudad: [X_ERM + 2.3, X_ERM + 2.54, 0, 0.3, 1.66, 1.92],
};

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
export const PARTES = [
    { id: 'llegada', ancla: [-7.72, 0.72, 2.36], vista: { az: -18, el: 18, tam: 3.2, mira: [-7.1, 0.05, 2.5] } },
    { id: 'diablos', ancla: [-6.7, 0.78, 2.36], vista: { az: -14, el: 18, tam: 2.9, mira: [-6.55, 0.05, 2.65] } },
    { id: 'valvula', ancla: [XV.v0, 0.86, Z_DUCTO], vista: { az: -6, el: 16, tam: 2.7, mira: [XV.v0 + 0.12, -0.05, 2.9] } },
    { id: 'tubo', ancla: [-5.42, 0.3, Z_DUCTO], vista: { az: 0, el: 8, tam: 2.3, mira: [-5.42, -0.34, 3.1] } },
    { id: 'filtros', ancla: [XE1 - 0.74, 1.05, 1.76], vista: { az: -28, el: 22, tam: 2.7, mira: [XE1 - 0.6, 0.32, 1.8] } },
    { id: 'compresor', ancla: [XE1, 1.0, 1.52], vista: { az: 12, el: 24, tam: 2.5, mira: [XE1 + 0.04, 0.2, 1.5] } },
    { id: 'enfriador', ancla: [XE1 + 0.9, 1.0, 1.6], vista: { az: 34, el: 26, tam: 2.4, mira: [XE1 + 0.86, 0.26, 1.6] } },
    { id: 'control', ancla: [XE1 - 0.6, 1.25, 0.46], vista: { az: -150, el: 18, tam: 2.8, mira: [XE1 - 0.45, 0.4, 0.5] } },
    { id: 'cruce', ancla: [X_RIO, 0.4, Z_DUCTO], vista: { az: 8, el: 10, tam: 2.8, mira: [X_RIO, -0.42, 2.9] } },
    { id: 'estacion2', ancla: [XE2 + 0.1, 1.82, 1.5], vista: { az: 22, el: 26, tam: 3.8, mira: [XE2 + 0.1, 0.32, 1.6] } },
    { id: 'catodica', ancla: [2.36, 0.82, 2.72], vista: { az: -8, el: 12, tam: 2.7, mira: [2.36, -0.32, 2.8] } },
    { id: 'medicion', ancla: [X_ERM + 1, 0.92, 1.8], vista: { az: 20, el: 30, tam: 3.3, mira: [X_ERM + 1.0, 0.2, 1.7] } },
    { id: 'olor', ancla: [X_ERM + 2.24, 0.82, 1.16], vista: { az: -24, el: 24, tam: 2.3, mira: [X_ERM + 2.14, 0.24, 1.12] } },
    { id: 'entregas', ancla: [X_C + 0.5, 1.9, -1.4], vista: { az: 38, el: 22, tam: 5.2, mira: [X_C + 0.25, 0.42, 0.1] } },
];

// ------------------------------------------------------------------ la pose
/** Todo lo que necesita posar(): lecturas, cuánto corre por cada tubo (0–1), cómo van las estaciones, y la cámara. */
export function pose({ modo = 'presion', planta = null, q = DEF.q, est = DEF.est, pico = DEF.pico, oferta = DEF.oferta, hora = DEF.hora, corte = false, horaCorte = DEF.horaCorte, tc = DEF.tc, clase = DEF.clase, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null } = {}) {
    const L = calcular({ modo, planta, q, est, pico, oferta, hora, corte, horaCorte, tc, clase });
    const e1 = planta ? planta.e1 : lista(est)[0] ? 1 : 0;
    const e2 = planta ? planta.e2 : lista(est)[1] ? 1 : 0;
    const fq = clamp01(L.q / DUCTO.capacidad);
    const en = modo === 'empaque' ? { e1: 1, e2: 1 } : { e1, e2 };
    const grupos = { siempre: fq, e1: fq * en.e1, e2: fq * en.e2, erm: fq, central: fq * 0.62, ciudad: fq * 0.38 };
    const F = L.F ?? null;
    if (F) {
        // la rotura deja sin gas lo que sigue, poco a poco
        const queda = clamp01(1 - F.t / 240);
        for (const k of ['e1', 'e2', 'erm', 'central', 'ciudad']) grupos[k] *= F.cerrada ? queda : 1;
    }
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = grupos[l.grupo] ?? 0;
    const activo = { e1: en.e1 * clamp01(fq * 4), e2: en.e2 * clamp01(fq * 4), corre: fq };
    const cam = camara || { mira: [0, 1.1, 0], az: 24, el: 26, d: 40 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, activo, en, F,
        pig: planta ? planta.pig : null,
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'presion', q: lerp(600, 1300, clamp01(t / 12)), camara: { mira: [0, 1.1, 0], az: lerp(14, 30, t / 12), el: 26, d: 40 } });
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
/** Cada punta de cada tubo debe tocar un equipo u otro tubo. Devuelve las que quedan al aire. */
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
    lejos(PMOP, 82.6, 82.8, 'la presión máxima: 1,200 libras por pulgada cuadrada');
    lejos(capacidad(2), DUCTO.capacidad * 0.98, DUCTO.capacidad * 1.02, 'capacidad con dos estaciones (publicada: 1,430)');
    lejos(ESTACIONES[1].km - ESTACIONES[0].km, 80, 161, 'entre estaciones: de 50 a 100 millas (EIA)');
    const P = perfil(DUCTO.capacidad, 2);
    const C = compresion(DUCTO.capacidad, P.succion[0]);
    lejos(C.sube / PSI_BAR, 150, 450, 'lo que sube la presión en una estación, en libras (promedio en EE. UU.: 250)');
    lejos(C.hp / DUCTO.capacidad, 8, 30, 'caballos por millón de pies cúbicos (promedio en EE. UU.: unos 20)');
    lejos(C.pct, 0.1, 1, 'gas que quema una estación, en %');
    lejos(C.sale, 30, 70, 'temperatura al salir del compresor');
    lejos(velocidad(DUCTO.capacidad, PMOP), 4, 8, 'velocidad al salir de la estación');
    lejos(viaje(DUCTO.capacidad), 12, 22, 'horas de viaje');
    lejos(PARED * 1000, 10, 16, 'pared del tubo, en mm');
    lejos((PMOP * 1e5 * D_EXT) / (2 * PARED) / ACERO.S, 0.71, 0.73, 'el esfuerzo contra el factor de diseño');
    lejos(masa(DUCTO.capacidad) / GAS.rhoStd * 86400 / 1e6, 40, 41, 'la capacidad en millones de m³ al día');
    // sin estaciones pasa mucho menos
    lejos(capacidad(0) / capacidad(2), 0.5, 0.65, 'sin estaciones pasa cerca de 58 %');
    lejos(capacidad(1), capacidad(0), capacidad(2), 'con una estación, en medio');
    // la NOM
    lejos(VALVULAS_NOM[0].km, 32, 32, 'válvulas en clase 1 y 2');
    lejos(VALVULAS_NOM[3].km, 8, 8, 'válvulas en clase 5');
    // el empaque
    const D_ = dia();
    lejos(D_.lleno, 1100, 1400, 'el tubo lleno, en millones de pies cúbicos');
    lejos(D_.falta === null ? 1 : 0, 1, 1, 'en un día normal no le falta presión');
    lejos(horasQueAlcanza(), 2, 16, 'horas que alcanza si deja de entrar gas');
    // la fuga
    const F = fuga();
    lejos(F.P[0], F.P0 - 0.01, F.P0 + 0.01, 'la fuga parte de la presión del ducto');
    lejos(F.perdido.at(-1), F.tramo * 0.8, F.tramo * 3, 'se pierde al menos lo del tramo');
    lejos(fuga({ tc: 30 }).perdido.at(-1), F.perdido.at(-1), 1e9, 'cerrar tarde pierde más');
    lejos(fuga({ clase: 3 }).perdido.at(-1), 0, F.perdido.at(-1), 'válvulas más juntas pierden menos');
    // el acomodo
    for (const [k, v] of Object.entries(XV)) lejos(yDucto(v), -0.5, -0.4, `el ducto en la válvula ${k}`);
    lejos(yDucto(X_RIO), terreno(X_RIO, Z_DUCTO) - 0.8, terreno(X_RIO, Z_DUCTO) - 0.3, 'el ducto pasa bien abajo del río');
    return p;
}
