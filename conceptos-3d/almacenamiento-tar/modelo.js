// La terminal de almacenamiento, en cifras. Un solo modelo: de aquí salen el tablero, las gráficas y lo que se mueve en la escena. Sin three.js, para probarlo con Vitest.
// El tamaño es el de la Terminal de Almacenamiento y Reparto Añil, en la Ciudad de México. Las reglas de seguridad, de la NOM-006-ASEA-2017; lo que se evapora, de AP-42, sección 7.1.
// Cómo se reparte esa capacidad entre sus cinco tanques, y todo lo marcado «de ejemplo», no es de la fuente. Ver fuentes.js.
import { clamp, clamp01, lerp } from '../planta-comun/ayudas.js';

const D2R = Math.PI / 180;
export const BARRIL = 158.987; // litros
export const LITROS_GAL = 3.78541;
export const LB = 0.453592; // kg
export const TERMINAL = { nombre: 'TAR Añil', nominal: 235, operativa: 158, tanques: 5, superficie: 135748, entran: 13, salen: 11 }; // miles de barriles; pipas en una hora
export const OTRAS = [
    { nombre: '18 de Marzo (Azcapotzalco)', nominal: 1500, operativa: 1108, entran: 24, salen: 17 },
    { nombre: 'Añil', nominal: TERMINAL.nominal, operativa: TERMINAL.operativa, entran: TERMINAL.entran, salen: TERMINAL.salen },
    { nombre: 'Barranca del Muerto', nominal: 125, operativa: 92, entran: 15, salen: 7 },
];
export const NACIONAL = { pemex: 77, privadas: 14, nominal: 16.6, operativa: 11.97, autonomia: 2.9 };
export const POLITICA = { gasolina: 5, diesel: 5, turbosina: 3, srvLitros: 946353, emisionMg: 80 };
export const PIPA = { litros: 20000, grande: 44000 };
export const LLENADO = { lpm: 2000, maniobra: 15 }; // de ejemplo: litros por minuto de un brazo, y minutos de entrar, conectar, desconectar y salir
export const PRODUCTOS = {
    regular: { nombre: 'Regular', parte: 0.6, rho: 730 },
    premium: { nombre: 'Premium', parte: 0.12, rho: 745 },
    diesel: { nombre: 'Diésel', parte: 0.28, rho: 840 },
}; // cómo se reparte la venta y la densidad de premium y diésel son de ejemplo; 730 kg/m³ es la de la tabla de corrección de gasolina
export const ORDEN = ['regular', 'premium', 'diesel'];
export const TECHOS = {
    externo: { nombre: 'Techo flotante', corto: 'Flotante externo' },
    membrana: { nombre: 'Membrana interna', corto: 'Membrana interna' },
    fijo: { nombre: 'Techo fijo', corto: 'Techo fijo' },
};
// Los cinco tanques suman los 235 mil barriles de Añil. Cómo se reparten es de ejemplo. D y H, en metros.
export const TANQUES = [
    { id: 't1', prod: 'regular', mb: 70, techo: 'externo', D: 32.4, H: 13.5, x: -3.25, z: -1.8 },
    { id: 't2', prod: 'regular', mb: 60, techo: 'membrana', D: 30, H: 13.5, x: -1.55, z: -1.8 },
    { id: 't3', prod: 'premium', mb: 30, techo: 'membrana', D: 21.2, H: 13.5, x: 0.2, z: -1.8 },
    { id: 't4', prod: 'diesel', mb: 37.5, techo: 'fijo', D: 23.7, H: 13.5, x: -3.2, z: 0.75 },
    { id: 't5', prod: 'diesel', mb: 37.5, techo: 'fijo', D: 23.7, H: 13.5, x: -1.5, z: 0.75 },
];
export const T_MEZCLA = { id: 't6', mb: 1.5, D: 7, H: 6.2, x: -5, z: -1.9 }; // de ejemplo: no cuenta entre los cinco
export const ESCALA = 25; // metros por unidad de la escena, de lado. La altura se exagera
export const H_ESCENA = 0.72;
export const radioDe = t => t.D / 2 / ESCALA;
export const volumen = t => (Math.PI / 4) * t.D * t.D * t.H; // m³
export const USABLE = TERMINAL.operativa / TERMINAL.nominal;
export const FONDO = 0.12; // de ejemplo: lo que queda abajo, con las patas del techo y la succión de las bombas

export const DEF = { pipas: TERMINAL.salen, llenaderas: 6, entra: 33, corte: false, dia: 0, diaCorte: 1, nivel0: 0.75, km: 311, v: 1.5, T: 25, techo: 'externo', urv: true, agujero: 20, muro: 1.8, rompe: false, nivelTanque: 0.7 };
export const LIMITES = { pipas: [2, 40], entra: [0, 80], dia: [0, 10], km: [10, 311], v: [0.1, 2.5], T: [5, 40], agujero: [2, 60] };

// ------------------------------------------------------------------ la reserva y las pipas
/** Miles de barriles al día que sacan tantas pipas por hora. */
export const ventaDe = pipas => (pipas * 24 * PIPA.litros) / BARRIL / 1000;
/** Cuántas pipas por hora atiende cada llenadera. */
export const minutosPipa = () => PIPA.litros / LLENADO.lpm + LLENADO.maniobra;
export const pipasPorHora = llenaderas => (llenaderas * 60) / minutosPipa();
/** Lo que cabe de cada producto, en miles de barriles. */
export const nominalDe = prod => TANQUES.filter(t => t.prod === prod).reduce((s, t) => s + t.mb, 0);
export const operativaDe = prod => nominalDe(prod) * USABLE;
/** Días que alcanza lo que hay si no entra nada. */
export const diasDe = (miles, pipas) => (pipas > 0 ? miles / ventaDe(pipas) : Infinity);
const PASO_DIA = 0.05;
/** Diez días de la terminal. Si el ducto se corta, sale lo que hay hasta que se acaba. */
export function reserva({ pipas = DEF.pipas, llenaderas = DEF.llenaderas, entra = DEF.entra, corte = false, diaCorte = DEF.diaCorte, nivel0 = DEF.nivel0 } = {}) {
    const sale = Math.min(pipas, pipasPorHora(llenaderas));
    const venta = ventaDe(sale);
    const n = Math.round(LIMITES.dia[1] / PASO_DIA);
    const I = Object.fromEntries(ORDEN.map(p => [p, [operativaDe(p) * nivel0]]));
    const dias = [0];
    const seAcaba = Object.fromEntries(ORDEN.map(p => [p, null]));
    for (let i = 1; i <= n; i++) {
        const d = i * PASO_DIA;
        dias.push(d);
        const llega = corte && d >= diaCorte ? 0 : entra;
        for (const p of ORDEN) {
            const antes = I[p][i - 1];
            const parte = PRODUCTOS[p].parte;
            const v = clamp(antes + (llega * parte - venta * parte) * PASO_DIA, 0, operativaDe(p));
            I[p].push(v);
            if (v <= 0 && seAcaba[p] === null && llega * parte < venta * parte) seAcaba[p] = d;
        }
    }
    const en = (d, a) => a[clamp(Math.round(d / PASO_DIA), 0, n)];
    const total = dias.map((_, i) => ORDEN.reduce((s, p) => s + I[p][i], 0));
    return {
        dias, I, total, sale, venta, seAcaba, en,
        totalEn: d => en(d, total),
        de: (p, d) => en(d, I[p]),
        diasEn: (p, d) => {
            const vp = venta * PRODUCTOS[p].parte;
            return vp > 0 ? en(d, I[p]) / vp : 0;
        },
        primero: ORDEN.reduce((m, p) => (seAcaba[p] !== null && (m === null || seAcaba[p] < m) ? seAcaba[p] : m), null),
    };
}
/** Cuántas pipas esperan después de tantas horas. */
export const filaEn = (pipas, llenaderas, horas) => Math.max(0, (pipas - pipasPorHora(llenaderas)) * horas);

// ------------------------------------------------------------------ las tandas por el poliducto
export const POLIDUCTO = { nombre: 'Tuxpan–Azcapotzalco', km: 311, pulgadas: 18, pared: 0.00635 }; // el diámetro y la pared son de ejemplo
export const D_DUCTO = POLIDUCTO.pulgadas * 0.0254 - 2 * POLIDUCTO.pared;
export const A_DUCTO = (Math.PI / 4) * D_DUCTO * D_DUCTO;
const NU = { regular: 0.6e-6, premium: 0.6e-6, diesel: 3.5e-6 }; // de ejemplo, m²/s
/** La mezcla se toma mitad y mitad, como recomienda la fuente. */
export const nuMezcla = (a, b) => Math.sqrt(NU[a] * NU[b]);
export const umbralRe = (D = D_DUCTO) => 10000 * Math.exp(2.75319 * Math.sqrt(D));
/** El largo de la mezcla (Austin y Palfrey, 1964). */
export function largoMezcla({ km = DEF.km, v = DEF.v, a = 'regular', b = 'diesel', D = D_DUCTO } = {}) {
    const Re = (v * D) / nuMezcla(a, b);
    const x = km * 1000;
    return Re > umbralRe(D) ? 11.75 * Re ** -0.1 * Math.sqrt(D * x) : 18419.9 * Re ** -0.9 * Math.sqrt(D * x) * Math.exp(2.19168 * Math.sqrt(D));
}
export function interfaz(o = {}) {
    const m = largoMezcla(o);
    const v = o.v ?? DEF.v;
    const vol = m * A_DUCTO;
    return { largo: m, vol, barriles: (vol * 1000) / BARRIL, Re: (v * D_DUCTO) / nuMezcla(o.a ?? 'regular', o.b ?? 'diesel'), minutos: m / v / 60 };
}
// Función de error, para la forma de la mezcla.
const erf = x => {
    const s = Math.sign(x);
    const a = Math.abs(x);
    const t = 1 / (1 + 0.5 * a);
    const r = 1 - t * Math.exp(-a * a - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return s * r;
};
export const Z_99 = 2.3263; // de 1 % a 99 % hay 2 × 2.3263 desviaciones. Tomar así el largo es de ejemplo
/** Cuánto hay del producto que viene atrás, a x metros del centro de la mezcla. */
export const mezclaEn = (x, largo) => 0.5 * (1 + erf(x / ((largo / (2 * Z_99)) * Math.SQRT2)));
export const densidadEn = (x, largo, a = 'regular', b = 'diesel') => { const c = mezclaEn(x, largo); return PRODUCTOS[a].rho * (1 - c) + PRODUCTOS[b].rho * c; };
// El tren que se ve en la escena: no está a escala. u: largo en unidades de la escena.
export const TREN = [{ p: 'regular', u: 7 }, { p: 'premium', u: 3.4 }, { p: 'regular', u: 7 }, { p: 'diesel', u: 5.6 }];
const LARGO_TREN = TREN.reduce((s, b) => s + b.u, 0);
/** Qué hay en un punto del tren. s: posición en unidades. anchos[i]: largo de la mezcla entre la tanda i y la siguiente. */
export function trenEn(s, anchoDe) {
    let u = ((s % LARGO_TREN) + LARGO_TREN) % LARGO_TREN;
    let i = 0;
    while (u >= TREN[i].u) { u -= TREN[i].u; i++; }
    const b = TREN[i];
    const sig = TREN[(i + 1) % TREN.length];
    const ant = TREN[(i + TREN.length - 1) % TREN.length];
    const anS = anchoDe(b.p, sig.p);
    const anA = anchoDe(ant.p, b.p);
    const aSig = u - b.u; // negativo: falta para la siguiente
    const aAnt = u;
    if (-aSig < anS / 2 + 1e-6) return { a: b.p, b: sig.p, c: mezclaEn(aSig, anS) };
    if (aAnt < anA / 2) return { a: ant.p, b: b.p, c: mezclaEn(aAnt, anA) };
    return { a: b.p, b: b.p, c: 0 };
}
/** A dónde manda lo que llega el múltiple: a su tanque, o al de mezcla si trae demasiado del otro. */
export function rutaDe({ a, b, c }, corte = 0.01) {
    if (a === b) return a;
    if (c < corte) return a;
    if (c > 1 - corte) return b;
    return 'mezcla';
}

// ------------------------------------------------------------------ lo que se evapora
// Con las constantes de AP-42, tabla 7.1-2: gasolina de RVP 7 y diésel. La presión de vapor, en libras por pulgada cuadrada absolutas.
export const STOCK = {
    gasolina: { A: 11.833, B: 5500.6, M: 68, WL: 5.6 },
    diesel: { A: 12.101, B: 8907, M: 130, WL: 7.1 },
};
export const PA_PSI = 11.17; // la atmósfera a 2,240 m de altura
const aR = T => T * 1.8 + 491.67;
export const presionVapor = (T, s = STOCK.gasolina) => Math.exp(s.A - s.B / aR(T));
/** kg de vapor por m³. */
export const densidadVapor = (T, s = STOCK.gasolina) => ((s.M * presionVapor(T, s)) / (10.731 * aR(T))) * 16.0185;
const LB_DIA = LB / 365;
const FT = 3.28084;
const DT_V = 7; // de ejemplo: cuánto sube y baja en el día la temperatura del vapor, en °C
const SELLO = { externo: { Ra: 1.6, Rb: 0.3, n: 1.6, viento: 5, F: 400 }, membrana: { Ra: 1.6, Rb: 0.3, n: 1.5, viento: 0, F: 300 } }; // tabla 7.1-8; viento y accesorios, de ejemplo
const CS = 0.0015; // tabla 7.1-10: gasolina, acero con poco óxido
const m3DiaDe = t => (ventaDe(DEF.pipas) * 1000 * BARRIL * PRODUCTOS[t.prod].parte * (t.mb / nominalDe(t.prod))) / 1000;
/** Lo que se evapora de un tanque, en kg al día. techo: el que se pruebe. */
export function evapora({ T = DEF.T, techo = 'fijo', tanque = TANQUES[0], stock = STOCK.gasolina, m3Dia = m3DiaDe(tanque), nivel = 0.5 } = {}) {
    const P = presionVapor(T, stock);
    const W = densidadVapor(T, stock);
    const Dft = tanque.D * FT;
    if (techo === 'fijo') {
        const vueltas = (m3Dia * 365) / volumen(tanque);
        const KN = vueltas > 36 ? (180 + vueltas) / (6 * vueltas) : 1;
        const trabajo = m3Dia * KN * W;
        // al respirar: el vapor se expande de día y se contrae de noche
        const outM = tanque.H * (1 - nivel) + tanque.D * 0.03;
        const Vv = (Math.PI / 4) * tanque.D * tanque.D * outM;
        const dP = presionVapor(T + DT_V / 2, stock) - presionVapor(T - DT_V / 2, stock);
        const KE = (DT_V * 1.8) / aR(T) + Math.max(0, dP - 0.06) / (PA_PSI - P);
        const KS = 1 / (1 + 0.053 * P * outM * FT);
        const respira = Vv * W * KE * KS;
        return { trabajo, respira, sello: 0, accesorios: 0, pared: 0, total: trabajo + respira, KN, KE, KS, P, W };
    }
    const f = SELLO[techo];
    const r = P / PA_PSI;
    const Ps = r / (1 + Math.sqrt(1 - r)) ** 2;
    const sello = (f.Ra + f.Rb * f.viento ** f.n) * Dft * Ps * stock.M * LB_DIA;
    const accesorios = f.F * Ps * stock.M * LB_DIA;
    const Q = (m3Dia * 1000 * 365) / BARRIL;
    const pared = ((0.943 * Q * CS * stock.WL) / Dft) * LB_DIA;
    return { trabajo: 0, respira: 0, sello, accesorios, pared, total: sello + accesorios + pared, Ps, P, W };
}
export const litrosDeKg = (kg, s = STOCK.gasolina) => kg / ((s.WL * LB) / LITROS_GAL);
/** AP-42, sección 5.2: kg de vapor por m³ cargado. S: 0.6 normal; 1 con balance de vapores. */
export const vaporCarga = (T, S = 1, s = STOCK.gasolina) => ((12.46 * S * presionVapor(T, s) * s.M) / aR(T)) * ((LB * 1000) / (1000 * LITROS_GAL));
export const CONTROL = { recupera: 0.95, captura: 0.987 }; // AP-42, sección 5.2, ejemplo de cálculo
export const pipaVapor = (T, urv = true, litros = PIPA.litros) => {
    const sin = (vaporCarga(T) * litros) / 1000;
    const con = sin * (1 - CONTROL.recupera * CONTROL.captura);
    return { sin, con, sale: urv ? con : sin, mgPorLitro: ((urv ? con : sin) / litros) * 1e6 };
};
// Corrección de volumen, de la tabla de Canadá para gasolina (54B, referencia 15 °C). En México, los petrolíferos se reportan a 20 °C.
const VCF = [[0, 1.0187], [5, 1.0125], [10, 1.0062], [15, 1], [20, 0.9937], [25, 0.9874], [30, 0.9811], [35, 0.9748], [40, 0.9684]];
export const vcf = T => {
    for (let i = 1; i < VCF.length; i++) if (T <= VCF[i][0]) return lerp(VCF[i - 1][1], VCF[i][1], (T - VCF[i - 1][0]) / (VCF[i][0] - VCF[i - 1][0]));
    return VCF.at(-1)[1];
};
export const litrosA20 = (litros, T) => (litros * vcf(T)) / vcf(20);

// ------------------------------------------------------------------ un derrame, y el dique
export const DIQUE = { area: 8600, lluvia: 0.1, tanques: ['t1', 't2', 't3'] }; // de ejemplo: m² y metros de lluvia. La escena no está a escala
const huella = id => { const t = TANQUES.find(x => x.id === id); return (Math.PI / 4) * t.D * t.D; };
const huellas = () => DIQUE.tanques.reduce((s, id) => s + huella(id), 0);
/** Lo que pide la norma: un tanque solo, 1.1 veces; varios, el mayor más la lluvia. */
export const pideDique = (ids = DIQUE.tanques, area = DIQUE.area) => {
    const lista = ids.map(id => volumen(TANQUES.find(t => t.id === id)));
    return lista.length === 1 ? lista[0] * 1.1 : Math.max(...lista) + DIQUE.lluvia * area;
};
export const cabeEnDique = (muro = DEF.muro, area = DIQUE.area) => (area - huellas()) * muro;
/** El terreno que pide el dique, según la altura del muro. */
export function areaDique(muro, ids = DIQUE.tanques) {
    const lista = ids.map(id => volumen(TANQUES.find(t => t.id === id)));
    const hu = ids.reduce((s, id) => s + huella(id), 0);
    if (lista.length === 1) return (lista[0] * 1.1) / muro + hu;
    return (Math.max(...lista) + muro * hu) / (muro - DIQUE.lluvia);
}
const CD = 0.6;
const PASO_H = 0.05;
/** Se abre un agujero al pie del tanque mayor. Sale hasta que el nivel de afuera iguala al de adentro. */
export function derrame({ agujero = DEF.agujero, nivelTanque = DEF.nivelTanque, muro = DEF.muro, tanque = TANQUES[0] } = {}) {
    const At = (Math.PI / 4) * tanque.D * tanque.D;
    const Ah = (Math.PI / 4) * (agujero / 100) ** 2;
    const An = DIQUE.area - huellas();
    const [t, h, hd, sale, escapa] = [[0], [nivelTanque * tanque.H], [0], [0], [0]];
    let [H, Hd, S, E] = [h[0], 0, 0, 0];
    let i = 0;
    while (i < 6000) {
        i++;
        const q = H > Hd ? CD * Ah * Math.sqrt(2 * 9.81 * (H - Hd)) * 3600 : 0; // m³/h
        const dv = Math.min(q * PASO_H, Math.max(0, H - Hd) * At * 0.9);
        H -= dv / At;
        S += dv;
        Hd += dv / An;
        if (Hd > muro) { E += (Hd - muro) * An; Hd = muro; }
        t.push(i * PASO_H);
        h.push(H);
        hd.push(Hd);
        sale.push(S);
        escapa.push(E);
        if (dv < 0.2) break;
    }
    return { t, h, hd, sale, escapa, fin: t.at(-1), Q0: CD * Ah * Math.sqrt(2 * 9.81 * h[0]) * 3600, total: S, seSale: E, muro };
}
export const enDerrame = (R, x) => {
    const i = clamp(Math.round(x / PASO_H), 0, R.t.length - 1);
    return { t: R.t[i], h: R.h[i], hd: R.hd[i], sale: R.sale[i], escapa: R.escapa[i], acabo: i >= R.t.length - 1 };
};
// La espuma: lo que pide un tanque de techo fijo, y un anillo de sello en uno flotante.
export const ESPUMA = { tasa: 4.1, minutos: 55, concentrado: 0.03, sello: 12, anillo: 0.6 };
export function espumaDe(t) {
    const area = (Math.PI / 4) * t.D * t.D;
    const flujo = area * ESPUMA.tasa;
    const anilloM2 = Math.PI * t.D * ESPUMA.anillo;
    return { area, flujo, total: (flujo * ESPUMA.minutos) / 1000, concentrado: (flujo * ESPUMA.minutos * ESPUMA.concentrado) / 1000, anilloM2, flujoSello: anilloM2 * ESPUMA.sello };
}

// ------------------------------------------------------------------ el tiempo
export const estadoPlanta = () => ({ s: 8, fila: 0, ev: null, espuma: 0, t: 0 });
const RAPIDEZ = { tren: 0.24, fila: 1 / 8, ev: 1 / 3.2, espuma: 1 / 7 };
/** Un paso del tiempo. m: { pipas, llenaderas, v, rompe, espuma, modo }. Función pura, independiente de la velocidad de los cuadros. */
export function pasoPlanta(s, m, dt) {
    const n = { ...s };
    n.t += dt;
    n.s += RAPIDEZ.tren * (m.v ?? DEF.v) * dt;
    const sobra = (m.pipas ?? DEF.pipas) - pipasPorHora(m.llenaderas ?? DEF.llenaderas);
    n.fila = clamp(n.fila + sobra * RAPIDEZ.fila * dt, 0, 24);
    if (m.rompe && n.ev === null) n.ev = 0;
    else if (!m.rompe) n.ev = null;
    else n.ev += (m.vel ?? RAPIDEZ.ev) * dt;
    if (m.espuma) n.espuma = 1;
    n.espuma = Math.max(0, n.espuma - RAPIDEZ.espuma * dt);
    return n;
}

// ------------------------------------------------------------------ las lecturas
let cacheRes = { k: '', v: null };
let cacheDer = { k: '', v: null };
const resDe = o => { const k = JSON.stringify(o); if (cacheRes.k !== k) cacheRes = { k, v: reserva(o) }; return cacheRes.v; };
const derDe = o => { const k = JSON.stringify(o); if (cacheDer.k !== k) cacheDer = { k, v: derrame(o) }; return cacheDer.v; };
export const anchoEscena = (a, b, km, v) => (a === b ? 0.01 : clamp(interfaz({ a, b, km, v }).largo / 600, 0.14, 3.6));
/** Lo que mide la terminal. modo: 'reserva' | 'tandas' | 'vapores' | 'derrame'. */
export function calcular({ modo = 'reserva', planta = null, pipas = DEF.pipas, llenaderas = DEF.llenaderas, entra = DEF.entra, corte = false, diaCorte = DEF.diaCorte, nivel0 = DEF.nivel0, dia = DEF.dia, km = DEF.km, v = DEF.v, T = DEF.T, techo = DEF.techo, urv = DEF.urv, agujero = DEF.agujero, muro = DEF.muro, nivelTanque = DEF.nivelTanque } = {}) {
    const L = { modo, pipas, llenaderas, capacidad: pipasPorHora(llenaderas), fila: planta ? planta.fila : 0 };
    if (modo === 'reserva') {
        const R = resDe({ pipas, llenaderas, entra, corte, diaCorte, nivel0 });
        L.R = R;
        L.dia = dia;
        L.total = R.totalEn(dia);
        L.venta = R.venta;
        L.dias = R.venta > 0 ? L.total / R.venta : 0;
        L.llenaTodo = TERMINAL.operativa / Math.max(R.venta, 0.01);
        L.entra = corte && dia >= diaCorte ? 0 : entra;
        L.corte = corte;
        L.porProd = Object.fromEntries(ORDEN.map(p => [p, R.diasEn(p, dia)]));
        L.niveles = Object.fromEntries(TANQUES.map(t => [t.id, FONDO + USABLE * clamp01(R.de(t.prod, dia) / operativaDe(t.prod))]));
    } else if (modo === 'tandas') {
        L.km = km;
        L.v = v;
        L.A = interfaz({ km, v, a: 'regular', b: 'diesel' });
        L.B = interfaz({ km, v, a: 'regular', b: 'premium' });
        L.anchoDe = (a, b) => anchoEscena(a, b, km, v);
        L.llega = planta ? trenEn(planta.s, L.anchoDe) : { a: 'regular', b: 'regular', c: 0 };
        L.ruta = rutaDe(L.llega);
        L.rho = PRODUCTOS[L.llega.a].rho * (1 - L.llega.c) + PRODUCTOS[L.llega.b].rho * L.llega.c;
        L.flujoM3h = v * A_DUCTO * 3600;
        L.horas = (km * 1000) / v / 3600;
        L.niveles = Object.fromEntries(TANQUES.map(t => [t.id, 0.56]));
    } else if (modo === 'vapores') {
        L.T = T;
        L.techo = techo;
        L.urv = urv;
        L.E = evapora({ T, techo });
        L.fijo = evapora({ T, techo: 'fijo' });
        L.externo = evapora({ T, techo: 'externo' });
        L.membrana = evapora({ T, techo: 'membrana' });
        L.diesel = evapora({ T, techo: 'fijo', tanque: TANQUES[3], stock: STOCK.diesel });
        L.P = presionVapor(T);
        L.Pd = presionVapor(T, STOCK.diesel);
        L.pipa = pipaVapor(T, urv);
        L.a20 = litrosA20(PIPA.litros, T);
        L.gasolinaDia = ventaDe(DEF.pipas) * 1000 * BARRIL * (PRODUCTOS.regular.parte + PRODUCTOS.premium.parte);
        L.niveles = Object.fromEntries(TANQUES.map(t => [t.id, 0.56]));
    } else {
        const R = derDe({ agujero, muro, nivelTanque });
        L.R = R;
        L.agujero = agujero;
        L.muro = muro;
        L.ev = planta ? planta.ev : null;
        L.F = L.ev === null ? null : enDerrame(R, L.ev);
        L.pide = pideDique();
        L.cabe = cabeEnDique(muro);
        L.niveles = Object.fromEntries(TANQUES.map(t => [t.id, 0.6]));
        L.niveles.t1 = L.F ? L.F.h / TANQUES[0].H : nivelTanque;
    }
    return L;
}

// ------------------------------------------------------------------ acomodo (no está a escala)
export const BLOQUE = { x: [-8.4, 8.4], z: [-3, 3.4], y: [-1.35, 0] };
export const Z_DUCTO = 3.18;
export const Z_FONDO = 2.96; // la cara de atrás del corte
export const Y_DUCTO = -0.5;
export const X_SUBE = -7; // donde el poliducto sube a la superficie
export const X_LANES = [3.5, 3.9, 4.3, 4.7, 5.1, 5.5];
export const FLUIDOS = {
    regular: { nombre: 'Gasolina regular', color: '#2f9e68' },
    premium: { nombre: 'Gasolina premium', color: '#c23a55' },
    diesel: { nombre: 'Diésel', color: '#caa02a' },
    mezcla: { nombre: 'Lo que llega por el ducto', color: '#7a86c9' },
    vapor: { nombre: 'Vapores de gasolina', color: '#a7b2bd' },
    aditivo: { nombre: 'Aditivo', color: '#d9792c' },
    agua: { nombre: 'Agua contra incendio', color: '#4d9fd0' },
    drenaje: { nombre: 'Drenaje aceitoso', color: '#6f6250' },
};
const Y2 = 0.07;
const [ZD, ZP, ZR] = [-0.33, -0.45, -0.57];
const [XPD, XPP, XPR] = [0.25, 0.5, 0.75];
const [ZHR, ZHP, ZHD] = [0.62, 0.74, 0.86];
const YH = 0.56;
const XH = 5.62;
const XALTA = 3.1;
const salida = (id, parte, x, zh) => [
    { id: `${id}Sale`, grupo: `${id}S`, parte, fluido: id === 'r' ? 'regular' : id === 'p' ? 'premium' : 'diesel', r: 0.022, puntos: [[x, 0.1, 0.32], [x, 0.12, zh], [XALTA, 0.12, zh], [XALTA, YH, zh], [XH, YH, zh]] },
];
const P0 = [-5.5, 0.26];
export const LINEAS = [
    { id: 'sube', grupo: 'entra', parte: 'poliducto', fluido: 'mezcla', r: 0.034, puntos: [[X_SUBE, Y_DUCTO, Z_DUCTO - 0.1], [X_SUBE, Y_DUCTO, 2.2], [X_SUBE, 0.2, 2.2]] },
    { id: 'aMedir', grupo: 'entra', parte: 'densimetro', fluido: 'mezcla', r: 0.028, puntos: [[-6.5, 0.2, 2.2], [-6.32, 0.2, 2.2]] },
    { id: 'aMultiple', grupo: 'entra', parte: 'densimetro', fluido: 'mezcla', r: 0.028, puntos: [[-5.88, 0.2, 2.2], [P0[0], 0.2, 2.2], [P0[0], P0[1], 2.1], [P0[0], P0[1], -0.2]] },
    { id: 'rIn', grupo: 'rIn', parte: 'densimetro', fluido: 'regular', r: 0.024, puntos: [[P0[0], P0[1], ZD], [P0[0], P0[1], ZR], [-1.45, P0[1], ZR], [-1.45, P0[1], -1.2]] },
    { id: 'rT1', grupo: 'rIn', parte: 'externo', fluido: 'regular', r: 0.022, puntos: [[-3.15, P0[1], ZR], [-3.15, P0[1], -1.17]] },
    { id: 'pIn', grupo: 'pIn', parte: 'densimetro', fluido: 'premium', r: 0.02, puntos: [[P0[0], P0[1], ZP], [0.3, P0[1], ZP], [0.3, P0[1], -1.39]] },
    { id: 'dIn', grupo: 'dIn', parte: 'densimetro', fluido: 'diesel', r: 0.022, puntos: [[P0[0], P0[1], -0.2], [P0[0], P0[1], ZD], [-1.4, P0[1], ZD], [-1.4, P0[1], 0.29]] },
    { id: 'dT4', grupo: 'dIn', parte: 'fijo', fluido: 'diesel', r: 0.02, puntos: [[-3.1, P0[1], ZD], [-3.1, P0[1], 0.29]] },
    { id: 'aMezcla', grupo: 'mIn', parte: 'mezcla', fluido: 'mezcla', r: 0.02, puntos: [[P0[0], P0[1], ZR], [P0[0], P0[1], -1.9], [-5.12, P0[1], -1.9]] },
    { id: 'rOut', grupo: 'rS', parte: 'bombas', fluido: 'regular', r: 0.024, puntos: [[-3.35, Y2, ZR], [XPR, Y2, ZR], [XPR, Y2, 0.0]] },
    { id: 'rT1o', grupo: 'rS', parte: 'externo', fluido: 'regular', r: 0.02, puntos: [[-3.35, Y2, -1.17], [-3.35, Y2, ZR]] },
    { id: 'rT2o', grupo: 'rS', parte: 'membrana', fluido: 'regular', r: 0.02, puntos: [[-1.65, Y2, -1.21], [-1.65, Y2, ZR]] },
    { id: 'pOut', grupo: 'pS', parte: 'bombas', fluido: 'premium', r: 0.02, puntos: [[0.1, 0.15, -1.39], [0.1, 0.15, -0.66], [0.1, Y2, ZP], [XPP, Y2, ZP], [XPP, Y2, 0.0]] },
    { id: 'dOut', grupo: 'dS', parte: 'bombas', fluido: 'diesel', r: 0.022, puntos: [[-3.3, Y2, ZD], [XPD, Y2, ZD], [XPD, Y2, 0.0]] },
    { id: 'dT4o', grupo: 'dS', parte: 'fijo', fluido: 'diesel', r: 0.02, puntos: [[-3.3, Y2, 0.29], [-3.3, Y2, ZD]] },
    { id: 'dT5o', grupo: 'dS', parte: 'fijo', fluido: 'diesel', r: 0.02, puntos: [[-1.6, Y2, 0.29], [-1.6, Y2, ZD]] },
    ...salida('r', 'llenaderas', XPR, ZHR),
    ...salida('p', 'llenaderas', XPP, ZHP),
    ...salida('d', 'llenaderas', XPD, ZHD),
    { id: 'aditivo', grupo: 'rS', parte: 'aditivos', fluido: 'aditivo', r: 0.012, puntos: [[1.7, 0.24, 1.12], [1.7, 0.24, ZHR], [1.7, 0.12, ZHR]] },
    { id: 'vaporA', grupo: 'vapor', parte: 'vapores', fluido: 'vapor', r: 0.02, puntos: [[XALTA + 0.2, 0.48, 0.14], [6.05, 0.48, 0.14], [6.05, 0.3, 0.14]] },
    { id: 'vaporB', grupo: 'vapor', parte: 'vapores', fluido: 'regular', r: 0.012, puntos: [[6.05, 0.42, 0.62], [XH, YH, ZHR]] },
    { id: 'dren', grupo: 'dren', parte: 'dique', fluido: 'drenaje', r: 0.016, puntos: [[-4.35, 0.03, 1.5], [-4.62, 0.03, 1.5]] },
];
export const REMATE = new Set();
const cajaT = t => { const r = radioDe(t); return [t.x - r, t.x + r, 0, H_ESCENA, t.z - r, t.z + r]; };
const R6 = radioDe(T_MEZCLA);
export const EQUIPOS = {
    ducto: [-7.2, 8.4, Y_DUCTO - 0.2, Y_DUCTO + 0.2, Z_DUCTO - 0.2, Z_DUCTO + 0.2],
    trampa: [-7.1, -6.46, 0.08, 0.34, 2.06, 2.34],
    densimetro: [-6.32, -5.88, 0, 0.46, 1.98, 2.42],
    ...Object.fromEntries(TANQUES.map(t => [t.id, cajaT(t)])),
    t6: [T_MEZCLA.x - R6, T_MEZCLA.x + R6, 0, 0.4, T_MEZCLA.z - R6, T_MEZCLA.z + R6],
    bombas: [0.05, 0.95, 0, 0.42, -0.1, 0.55],
    aditivos: [1.4, 2, 0, 0.42, 1.08, 1.56],
    urv: [5.92, 6.76, 0, 0.82, -0.14, 0.82],
    separador: [-5.02, -4.6, 0, 0.14, 1.28, 1.72],
    dique: [-4.4, -0.3, 0, 0.14, -0.28, 1.78],
    rack: [3.2, 5.72, 0, 0.66, -0.3, 1.14],
};
// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
export const PARTES = [
    { id: 'poliducto', ancla: [-7.3, 0.5, 2.7], vista: { az: -6, el: 13, tam: 3.3, mira: [-6.5, -0.12, 2.9] } },
    { id: 'densimetro', ancla: [-6.1, 0.82, 2.2], vista: { az: -18, el: 24, tam: 2.9, mira: [-5.95, 0.16, 1.7] } },
    { id: 'mezcla', ancla: [T_MEZCLA.x, 0.74, T_MEZCLA.z], vista: { az: -24, el: 24, tam: 2.3, mira: [-5.1, 0.14, -1.7] } },
    { id: 'externo', ancla: [TANQUES[0].x, 1.05, TANQUES[0].z], vista: { az: -14, el: 38, tam: 2.8, mira: [TANQUES[0].x, 0.34, TANQUES[0].z] } },
    { id: 'membrana', ancla: [TANQUES[1].x, 1.1, TANQUES[1].z], vista: { az: 6, el: 42, tam: 2.8, mira: [TANQUES[1].x + 0.4, 0.3, TANQUES[1].z] } },
    { id: 'fijo', ancla: [TANQUES[3].x, 1.1, TANQUES[3].z], vista: { az: -10, el: 22, tam: 2.7, mira: [TANQUES[3].x, 0.32, TANQUES[3].z] } },
    { id: 'medicion', ancla: [TANQUES[4].x + 0.1, 1.15, TANQUES[4].z], vista: { az: 12, el: 24, tam: 2.3, mira: [TANQUES[4].x + 0.05, 0.46, TANQUES[4].z + 0.1] } },
    { id: 'dique', ancla: [-4.55, 0.6, 1.5], vista: { az: -22, el: 26, tam: 3.5, mira: [-3.8, 0.1, 1.1] } },
    { id: 'bombas', ancla: [0.5, 0.82, 0.2], vista: { az: 14, el: 30, tam: 2.1, mira: [0.5, 0.14, 0.22] } },
    { id: 'aditivos', ancla: [1.7, 0.82, 1.32], vista: { az: 14, el: 26, tam: 2, mira: [1.7, 0.14, 1.1] } },
    { id: 'llenaderas', ancla: [4.5, 1.08, 0.3], vista: { az: 18, el: 26, tam: 4, mira: [4.5, 0.24, 0.5] } },
    { id: 'vapores', ancla: [6.34, 1.2, 0.34], vista: { az: 26, el: 22, tam: 2.5, mira: [6.1, 0.32, 0.34] } },
    { id: 'incendio', ancla: [2.35, 1.02, -2.2], vista: { az: -12, el: 26, tam: 3.3, mira: [1.7, 0.22, -1.9] } },
    { id: 'reparto', ancla: [7.4, 0.95, -1.2], vista: { az: 28, el: 24, tam: 3, mira: [7.3, 0.18, -1.3] } },
];

// ------------------------------------------------------------------ la pose
/** Todo lo que necesita posar(): lecturas, cuánto corre por cada tubo (0–1), niveles de los tanques y la cámara. */
export function pose({ modo = 'reserva', planta = null, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, planta, ...resto });
    const entra = modo === 'reserva' ? clamp01(L.entra / 60) : 0.8;
    const sale = modo === 'reserva' ? clamp01(L.venta / 60) : 0.55;
    const parar = modo === 'derrame' && L.F ? 0 : 1;
    const g = { entra, vapor: modo === 'reserva' ? sale : 0.6, dren: 0.3, rS: sale * 1.1, pS: sale * 0.5, dS: sale * 0.8 };
    if (modo === 'tandas') {
        g.rIn = L.ruta === 'regular' ? 0.9 : 0;
        g.pIn = L.ruta === 'premium' ? 0.9 : 0;
        g.dIn = L.ruta === 'diesel' ? 0.9 : 0;
        g.mIn = L.ruta === 'mezcla' ? 0.9 : 0;
    } else {
        g.rIn = entra * 0.9 * parar;
        g.pIn = entra * 0.45 * parar;
        g.dIn = entra * 0.7 * parar;
        g.mIn = 0;
        g.entra = entra * parar;
    }
    if (modo === 'vapores' && !resto.urv) g.vapor = 0;
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = g[l.grupo] ?? 0;
    const cam = camara || { mira: [0, 1.1, 0], az: 24, el: 26, d: 40 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, niveles: L.niveles, abre: resto.abre,
        activo: { carga: clamp01(L.pipas / Math.max(L.capacidad, 1)), urv: modo === 'vapores' && !resto.urv ? 0 : 1, espuma: planta ? clamp01(planta.espuma * 2) : 0, fuga: L.F ? clamp01(1 - L.F.t / Math.max(L.R.fin, 1)) : 0 },
        fila: planta ? planta.fila : 0,
        s: planta ? planta.s : 0,
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'reserva', camara: { mira: [0, 1.1, 0], az: lerp(14, 30, t / 12), el: 26, d: 40 } });
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
    // el tamaño
    lejos(TANQUES.reduce((s, t) => s + t.mb, 0), TERMINAL.nominal, TERMINAL.nominal, 'los cinco tanques suman su capacidad nominal');
    lejos(TANQUES.length, TERMINAL.tanques, TERMINAL.tanques, 'cinco tanques');
    for (const t of TANQUES) lejos((volumen(t) * 1000) / BARRIL / 1000, t.mb * 0.99, t.mb * 1.01, `medidas del tanque ${t.id}`);
    lejos((volumen(T_MEZCLA) * 1000) / BARRIL / 1000, T_MEZCLA.mb * 0.97, T_MEZCLA.mb * 1.03, 'medidas del tanque de mezcla');
    lejos(Object.values(PRODUCTOS).reduce((s, x) => s + x.parte, 0), 1, 1, 'la venta suma 100 %');
    // las pipas de una hora, todo el día, contra lo que cabe
    lejos(ventaDe(TERMINAL.salen), 33, 33.5, 'lo que venden 11 pipas por hora, en miles de barriles al día');
    lejos(TERMINAL.operativa / ventaDe(TERMINAL.salen), 4.6, 4.9, 'días que alcanza llena');
    lejos(pipasPorHora(DEF.llenaderas), TERMINAL.salen, 18, 'las llenaderas alcanzan para lo observado');
    // la norma: separación entre tanques y dique
    for (const [a, b] of [[0, 1], [1, 2], [3, 4]]) {
        const [A, B] = [TANQUES[a], TANQUES[b]];
        const hueco = (Math.hypot(A.x - B.x, A.z - B.z) - radioDe(A) - radioDe(B)) * ESCALA;
        lejos(hueco, (A.D + B.D) / 6, 200, `separación entre ${A.id} y ${B.id} (1/6 de la suma de diámetros)`);
    }
    lejos(cabeEnDique(1.8), pideDique(), 1e6, 'el dique con muros de 1.8 m cumple la norma');
    // AP-42: las presiones de vapor de su propia tabla
    lejos(presionVapor((60 - 32) / 1.8), 3.4, 3.6, 'gasolina RVP 7 a 60 °F: 3.5 psia');
    lejos(presionVapor((60 - 32) / 1.8, STOCK.diesel), 0.0055, 0.0065, 'diésel a 60 °F: 0.006 psia');
    lejos(presionVapor((60 - 32) / 1.8, { A: 11.724, B: 5237.3 }), 5.1, 5.3, 'gasolina RVP 10 a 60 °F: 5.2 psia');
    // AP-42 5.2, su ejemplo: 12.46 × 1 × 6.6 × 66 / 540 = 10.05 lb/1000 gal
    lejos((12.46 * 1 * 6.6 * 66) / 540, 10, 10.1, 'pérdida de carga del ejemplo de AP-42');
    lejos(CONTROL.recupera * CONTROL.captura, 0.93, 0.95, 'eficiencia total del ejemplo de AP-42: 94 %');
    lejos(pipaVapor(DEF.T).mgPorLitro, 0, POLITICA.emisionMg, 'con recuperación, por abajo del límite de la norma');
    lejos(pipaVapor(DEF.T, false).mgPorLitro, POLITICA.emisionMg, 5000, 'sin recuperación, por arriba del límite');
    // los techos
    const [F, E, M, Dz] = [evapora({ techo: 'fijo' }), evapora({ techo: 'externo' }), evapora({ techo: 'membrana' }), evapora({ techo: 'fijo', tanque: TANQUES[3], stock: STOCK.diesel })];
    lejos(1 - E.total / F.total, 0.95, 0.999, 'el techo flotante evita casi todo');
    lejos(M.total, 0, E.total, 'la membrana, sin viento, pierde menos que el externo');
    lejos(F.KN, 0.2, 1, 'el factor de vueltas de AP-42');
    lejos(Dz.total, 0, F.total / 50, 'el diésel casi no se evapora');
    lejos(presionVapor(DEF.T) / presionVapor(DEF.T, STOCK.diesel), 200, 1500, 'veces que la gasolina se evapora más que el diésel');
    lejos(ventaDe(DEF.pipas) * 1000 * BARRIL * (PRODUCTOS.regular.parte + PRODUCTOS.premium.parte), POLITICA.srvLitros, 1e8, 'la gasolina de la terminal pide sistema de recuperación');
    // el calor
    lejos(vcf(15), 1, 1, 'la tabla de corrección a 15 °C');
    lejos(vcf(20), 0.9937, 0.9937, 'la tabla a 20 °C');
    lejos(PIPA.litros - litrosA20(PIPA.litros, 30), 240, 270, 'litros de diferencia a 30 °C');
    // las tandas
    const I = interfaz();
    lejos(I.Re, umbralRe(), 1e7, 'en régimen de mucha turbulencia');
    lejos(I.largo, 500, 2000, 'largo de la mezcla, en metros');
    lejos(mezclaEn(I.largo / 2, I.largo), 0.985, 0.995, 'en la orilla de la mezcla queda 1 %');
    lejos(mezclaEn(0, I.largo), 0.5, 0.5, 'en medio de la mezcla, mitad y mitad');
    const u = umbralRe();
    const [a, b] = [largoMezcla({ v: (u * 0.999 * nuMezcla('regular', 'diesel')) / D_DUCTO }), largoMezcla({ v: (u * 1.001 * nuMezcla('regular', 'diesel')) / D_DUCTO })];
    lejos(a / b, 0.9, 1.1, 'las dos fórmulas casi coinciden en el cambio');
    lejos(largoMezcla({ km: 311 }) / largoMezcla({ km: 311 / 4 }), 1.99, 2.01, 'cuatro veces el camino, el doble de mezcla');
    // el derrame
    const R = derrame();
    lejos(R.h.at(-1) - R.hd.at(-1), -0.02, 0.05, 'al final, el nivel de adentro y el de afuera se igualan');
    lejos(R.total, 1000, volumen(TANQUES[0]), 'lo que sale');
    lejos(R.seSale, 0, 0, 'con muro de 1.8 m no se sale');
    lejos(derrame({ muro: 0.5 }).seSale, 1, 1e6, 'con muro de 0.5 m sí se sale');
    lejos(derrame({ agujero: 60 }).fin, 0, R.fin, 'un agujero mayor se vacía antes');
    return p;
}
