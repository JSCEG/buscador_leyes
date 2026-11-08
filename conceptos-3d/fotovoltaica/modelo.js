// La central fotovoltaica como cifras puras: dónde está el sol, cuánta luz llega al módulo, qué tan caliente va la celda, cuánta corriente
// directa sale, qué hace el inversor, qué entrega a la red y qué guarda el SAE. Sin three.js ni DOM. El tablero, las gráficas y las partículas
// leen calcular(), así no pueden contradecirse.
//
// Central de ejemplo: el sol y el clima son los de Puerto Peñasco, Sonora (NASA POWER), y el tamaño es el que anuncia la CFE para esa central:
// 1,000 MW de módulos. No es el plano de esa central ni un simulador de operación. Las fuentes no dicen qué módulos, seguidores ni inversores
// usa, así que esas piezas salen de fichas técnicas públicas:
// - Módulo de 550 W (ficha de JinkoSolar): 40.90 V, 13.45 A, 49.62 V en circuito abierto, 14.03 A en corto; −0.35 %/°C. La ficha también da lo
//   que entrega a 800 W/m² con 20 °C de aire (409 W): revisar() lo comprueba.
// - Sol: masa de aire de Kasten y Young; luz directa de Meinel, 1.353 × 0.7^(AM^0.678) kW/m²; la difusa, cerca de 10 % de la directa
//   (PVEducation). Cada mes se escala para dar la luz medida por NASA POWER en el sitio.
// - Temperatura de la celda: aire + (NOCT − 20) ÷ 800 × luz (PVEducation).
// - Seguidor de un eje norte–sur que regresa al amanecer y al atardecer para no hacerse sombra (fórmula de pvlib).
// - Inversor central: 1,500 V y cerca de 99 % de rendimiento máximo (ficha de Sungrow). La forma de su curva es de ejemplo.
// - Lo de ejemplo, para ver la tendencia: pérdidas en cables, reparto de la nube, curva del inversor y la manera de cargar el SAE.

const D2R = Math.PI / 180;
const clamp01 = x => Math.min(1, Math.max(0, x));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;

// ------------------------------------------------------------------ el sitio y el clima
export const SITIO = { nombre: 'Puerto Peñasco, Sonora', lat: 31.33, lon: -113.53, altura: 0.055 };
export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const MES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
// el día que representa a cada mes (Klein)
const DIA_DEL_MES = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];
// NASA POWER, promedios de muchos años en lat 31.33, lon −113.53. kWh/m² al día sobre un plano horizontal; temperatura del aire a 2 m, °C.
export const CLIMA = {
    ghi: [3.74, 4.72, 6.13, 7.47, 8.2, 8.34, 7.55, 7.11, 6.25, 5.16, 3.96, 3.38],
    despejado: [4.17, 5.27, 6.62, 7.82, 8.5, 8.64, 8.09, 7.5, 6.61, 5.5, 4.36, 3.81],
    t: [14.39, 15.45, 18.11, 20.73, 24, 27.97, 31.12, 31.63, 30.31, 25.3, 19.77, 14.59],
    ghiAnual: 6.01,
    tMax: 43.47,
};
// lo que da PVGIS (JRC) en el mismo punto con 14 % de pérdidas: kWh al año por cada kW de módulos
export const PVGIS = { fija: 1924.31, seguidor: 2521.3 };

// ------------------------------------------------------------------ los equipos
export const MODULO = { pmp: 550, vmp: 40.9, imp: 13.45, voc: 49.62, isc: 14.03, ef: 0.2133, gP: -0.0035, gV: -0.0028, gI: 0.00048, noct: 45, largo: 2.274, ancho: 1.134, celdas: 144, enSerie: 72, vSistema: 1500, degrada: 0.0055, pNoct: 409 };
export const T_MIN = 0; // °C. El aire más frío para el que se revisa el voltaje de la cadena, de ejemplo
export const POR_CADENA = Math.floor(MODULO.vSistema / (MODULO.voc * (1 + MODULO.gV * (T_MIN - 25))));
export const CADENAS_POR_FILA = 3; // de ejemplo: una fila de seguidor con tres cadenas
export const CENTRAL = { mwCA: 800, ilr: 1.25, mwMayo: 1000 };
export const INVERSOR = { mw: 4.4, rMax: 0.989, v: 1500 }; // ficha de Sungrow; los mismos 1,500 V del módulo
export const PERDIDAS = { cables: 0.03, trafo: 0.01, linea: 0.01, propio: 0.002 };
export const GCR = 0.4; // ancho de la fila entre distancia de fila a fila. La figura la dibuja igual: 0.62 de ancho y 1.55 entre filas
export const GIRO_MAX = 55; // grados
export const ALBEDO = 0.25; // suelo de desierto, de ejemplo
export const POLVO_DEF = 3.5; // % (IEA PVPS: en el mundo, por lo menos 3 a 4 % al año)
export const SAE_DEF = { pct: 30, horas: 3, ida: 0.82 }; // EIA: las baterías de la red regresan 82 %
export const DEF = { hora: 12, mes: 6, tAire: null, polvo: POLVO_DEF, seguidor: true, inclinacion: 31, ilr: CENTRAL.ilr, sae: SAE_DEF.pct };
export const LIMITES = { hora: [0, 24], mes: [1, 12], tAire: [0, 50], polvo: [0, 15], inclinacion: [0, 60], ilr: [1, 1.6], sae: [0, 40] };

// ------------------------------------------------------------------ el sol
/** Vector al sol en la escena: x al este, y arriba, z al sur. mes: 1–12 (fracciones no: se usa su día). hora solar. */
export function solEn(hora, mes = DEF.mes) {
    const n = DIA_DEL_MES[clamp(Math.round(mes), 1, 12) - 1];
    const dec = 23.45 * D2R * Math.sin((2 * Math.PI * (284 + n)) / 365);
    const w = 15 * (hora - 12) * D2R;
    const fi = SITIO.lat * D2R;
    const y = Math.sin(fi) * Math.sin(dec) + Math.cos(fi) * Math.cos(dec) * Math.cos(w);
    const x = -Math.cos(dec) * Math.sin(w);
    const z = Math.sin(fi) * Math.cos(dec) * Math.cos(w) - Math.cos(fi) * Math.sin(dec);
    return { x, y, z, elev: Math.asin(clamp(y, -1, 1)) / D2R };
}
/** Luz de un día despejado, W/m²: directa al sol y difusa. */
export function luzDespejada(s) {
    if (s.y <= 0.002) return { dni: 0, dhi: 0, ghi: 0, am: Infinity };
    const z = Math.acos(s.y) / D2R;
    const am = 1 / (s.y + 0.50572 * (96.07995 - z) ** -1.6364);
    const a = 0.14;
    const dni = 1353 * ((1 - a * SITIO.altura) * 0.7 ** (am ** 0.678) + a * SITIO.altura);
    const dhi = 0.1 * dni;
    return { dni, dhi, ghi: dni * s.y + dhi, am };
}
const memoDespejado = {};
/** kWh/m² de un día despejado, según este modelo. */
export function ghiDespejadoDia(mes) {
    if (memoDespejado[mes] !== undefined) return memoDespejado[mes];
    let e = 0;
    for (let h = 0.125; h < 24; h += 0.25) e += luzDespejada(solEn(h, mes)).ghi * 0.25;
    memoDespejado[mes] = e / 1000;
    return memoDespejado[mes];
}
/** Lo que deja pasar el cielo promedio de ese mes: 1 sería siempre despejado. Hace que el modelo dé la luz medida en el sitio. */
export const cieloDelMes = mes => CLIMA.ghi[mes - 1] / ghiDespejadoDia(mes);
/** Temperatura del aire a esa hora: el promedio del mes, con su vuelta diaria. */
export const aireEn = (hora, mes) => CLIMA.t[mes - 1] + 7.5 * Math.cos(((hora - 15) * 2 * Math.PI) / 24);

// ------------------------------------------------------------------ el seguidor
/** Cuánto gira la fila, en grados: positivo mira al este. Con regreso: no se hace sombra entre filas al amanecer y al atardecer. */
export function giroSeguidor(s, { regresa = true, gcr = GCR, max = GIRO_MAX } = {}) {
    if (s.y <= 0) return 0;
    const ideal = Math.atan2(s.x, s.y);
    let g = ideal;
    if (regresa) {
        const k = Math.abs(Math.cos(ideal)) / gcr;
        if (k < 1) g = ideal - Math.sign(ideal) * Math.acos(k);
    }
    return clamp(g / D2R, -max, max);
}
export const normalDeFila = g => ({ x: Math.sin(g * D2R), y: Math.cos(g * D2R), z: 0 });
export const normalFija = b => ({ x: 0, y: Math.cos(b * D2R), z: Math.sin(b * D2R) });
/** La luz que le llega al plano del módulo, W/m². k: cuánto deja pasar el cielo. */
export function luzEnPlano(s, n, k = 1) {
    const L = luzDespejada(s);
    const c = Math.max(0, s.x * n.x + s.y * n.y + s.z * n.z);
    // el vidrio refleja más mientras más de lado llega la luz (de ejemplo, ASHRAE con b = 0.05)
    const refleja = c > 0.05 ? clamp01(1 - 0.05 * (1 / c - 1)) : 0;
    const directa = L.dni * c;
    const difusa = (L.dhi * (1 + n.y)) / 2 + (L.ghi * ALBEDO * (1 - n.y)) / 2;
    return { total: k * (directa + difusa), util: k * (directa * refleja + difusa), coseno: c, directa: k * directa, difusa: k * difusa };
}

// ------------------------------------------------------------------ el módulo
export const tCelda = (tAire, luz, noct = MODULO.noct) => tAire + ((noct - 20) / 800) * luz;
/** Lo que da un módulo en su mejor punto, W. */
export const potenciaModulo = (luz, tc) => Math.max(0, MODULO.pmp * (luz / 1000) * (1 + MODULO.gP * (tc - 25)));
/** Sus puntos de corriente y voltaje a esa luz y temperatura. */
export function puntosModulo(luz, tc) {
    const r = Math.max(luz, 0) / 1000;
    const dT = tc - 25;
    const isc = MODULO.isc * r * (1 + MODULO.gI * dT);
    const imp = MODULO.imp * r * (1 + MODULO.gI * dT);
    const voc = r > 0.001 ? Math.max(0, MODULO.voc * (1 + MODULO.gV * dT) + MODULO.enSerie * 1.2 * 0.0257 * Math.log(r)) : 0;
    const pmp = potenciaModulo(luz, tc);
    const vmp = imp > 0 ? pmp / imp : 0;
    return { isc, imp, voc, vmp, pmp };
}
/** La curva del módulo, I(V), con la forma de Xiao: pasa justo por el corto, el mejor punto y el circuito abierto. */
export function curvaModulo(luz, tc) {
    const p = puntosModulo(luz, tc);
    if (p.isc <= 0 || p.voc <= 0) return { ...p, i: () => 0 };
    const c2 = (p.vmp / p.voc - 1) / Math.log(1 - p.imp / p.isc);
    const c1 = (1 - p.imp / p.isc) * Math.exp(-p.vmp / (c2 * p.voc));
    return { ...p, i: v => (v >= p.voc ? 0 : Math.max(0, p.isc * (1 - c1 * (Math.exp(v / (c2 * p.voc)) - 1)))) };
}

// ------------------------------------------------------------------ el inversor
/** De corriente directa a alterna. dc y nominal en MW. Lo que pasa del tamaño del inversor se recorta. */
export function inversor(dc, nominal) {
    if (dc <= 0) return { ca: 0, recorte: 0, rendimiento: 0 };
    const x = dc / nominal;
    // pérdidas de ejemplo con la forma de siempre: una base fija, y lo demás crece con la carga. Máximo cerca de lo que da la ficha.
    const perdida = nominal * (0.0022 + 0.0048 * x + 0.0044 * x * x);
    const sinTope = Math.max(0, dc - perdida);
    const ca = Math.min(sinTope, nominal);
    return { ca, recorte: Math.max(0, sinTope - nominal), rendimiento: sinTope / dc };
}

// ------------------------------------------------------------------ la central a una hora
/** Todo lo que da la central. k: lo que deja pasar el cielo (1 despejado). polvo, en %. tAire null: el del mes a esa hora. */
export function central({ hora = DEF.hora, mes = DEF.mes, tAire = null, polvo = DEF.polvo, seguidor = true, inclinacion = DEF.inclinacion, ilr = DEF.ilr, k = 1, regresa = true } = {}) {
    const s = solEn(hora, mes);
    const giro = seguidor ? giroSeguidor(s, { regresa }) : 0;
    const n = seguidor ? normalDeFila(giro) : normalFija(inclinacion);
    const luz = luzEnPlano(s, n, k);
    const ta = tAire ?? aireEn(hora, mes);
    const tc = tCelda(ta, luz.total);
    const limpio = 1 - polvo / 100;
    const luzCelda = luz.util * limpio;
    const pm = potenciaModulo(luzCelda, tc);
    const mwCD0 = CENTRAL.mwCA * ilr;
    const dc = mwCD0 * (pm / MODULO.pmp) * (1 - PERDIDAS.cables);
    const inv = inversor(dc, CENTRAL.mwCA);
    const fRed = 1 - PERDIDAS.trafo - PERDIDAS.linea;
    const propio = s.y > 0 ? CENTRAL.mwCA * PERDIDAS.propio : 0;
    const red = Math.max(0, inv.ca * fRed - propio);
    const pu = puntosModulo(luzCelda, tc);
    const haySol = pm > 0.5;
    const modulos = (mwCD0 * 1e6) / MODULO.pmp;
    // de cada 100 de la luz que llega a los módulos, a dónde va
    const baseMW = (modulos * MODULO.largo * MODULO.ancho * luz.total) / 1e6;
    let reparto = { reflejo: 0, polvo: 0, calor: 0, cables: 0, inversor: 0, transporte: 0, red: 0 };
    if (baseMW > 1) {
        const enModulo = (modulos * pm) / 1e6;
        reparto = {
            reflejo: 1 - luz.util / luz.total,
            polvo: (luz.util * (polvo / 100)) / luz.total,
            calor: (luzCelda * MODULO.largo * MODULO.ancho * (modulos / 1e6) - enModulo) / baseMW,
            cables: (enModulo - dc) / baseMW,
            inversor: (dc - inv.ca) / baseMW,
            transporte: (inv.ca - red) / baseMW,
            red: red / baseMW,
        };
    }
    return {
        s, giro, normal: n, luz, tAire: ta, tCelda: tc, luzCelda, pm, mwCD0, modulos, dc, ca: inv.ca, recorte: inv.recorte, rendimientoInv: inv.rendimiento, red, carga: dc / CENTRAL.mwCA,
        v: haySol ? pu.vmp : 0, i: haySol ? pu.imp : 0, vCadena: haySol ? pu.vmp * POR_CADENA : 0, iCadena: haySol ? pu.imp : 0, puntos: pu, reparto, redMax: CENTRAL.mwCA * fRed - CENTRAL.mwCA * PERDIDAS.propio,
    };
}

// ------------------------------------------------------------------ un día y un año
const PASO = 0.25;
/** La central hora por hora. Devuelve arreglos cada 15 minutos y lo que suma el día. */
export function dia(o = {}) {
    const f = [];
    let [mwh, recorte, kWhm2] = [0, 0, 0];
    for (let h = 0; h <= 24 + 1e-6; h += PASO) {
        const c = central({ ...o, hora: h });
        f.push({ h, dc: c.dc, ca: c.ca, red: c.red, luz: c.luz.total, tc: c.tCelda, giro: c.giro, recorte: c.recorte });
        if (h < 24) { mwh += c.red * PASO; recorte += c.recorte * PASO; kWhm2 += (c.luz.total * PASO) / 1000; }
    }
    return { filas: f, mwh, recorte, kWhm2, pico: Math.max(...f.map(x => x.red)) };
}
/** Lee el valor de un arreglo de dia() en cualquier hora. */
export function enHora(filas, h, campo) {
    const x = clamp(h, 0, 24) / PASO;
    const i = Math.min(filas.length - 2, Math.floor(x));
    return lerp(filas[i][campo], filas[i + 1][campo], x - i);
}
const memoAnual = new Map();
/** El año entero: un día de cada mes, con el cielo promedio de ese mes. */
export function anual(o = {}) {
    const clave = JSON.stringify([o.seguidor ?? true, o.inclinacion ?? DEF.inclinacion, o.ilr ?? DEF.ilr, o.polvo ?? DEF.polvo, o.regresa ?? true]);
    if (memoAnual.has(clave)) return memoAnual.get(clave);
    const meses = [];
    let [gwh, recorte, luz] = [0, 0, 0];
    for (let m = 1; m <= 12; m++) {
        const d = dia({ ...o, mes: m, k: cieloDelMes(m) });
        const e = (d.mwh * DIAS[m - 1]) / 1000;
        meses.push({ mes: m, gwh: e, kWhm2: d.kWhm2, pico: d.pico });
        gwh += e;
        recorte += (d.recorte * DIAS[m - 1]) / 1000;
        luz += d.kWhm2 * DIAS[m - 1];
    }
    const mwCD = CENTRAL.mwCA * (o.ilr ?? DEF.ilr);
    const r = { meses, gwh, recorte, luz, factorCA: gwh / (CENTRAL.mwCA * 8.76), factorCD: gwh / (mwCD * 8.76), porKw: (gwh * 1000) / mwCD, recorteFrac: recorte / Math.max(gwh, 1) };
    memoAnual.set(clave, r);
    return r;
}

// ------------------------------------------------------------------ el SAE
/**
 * Un día con Sistema de Almacenamiento de Energía. Se carga con lo solar a media mañana y entrega cuando el sol ya casi no alcanza.
 * pct: su potencia, en % de lo que puede dar la central. horas: cuánto dura a plena potencia.
 */
export function diaConSAE({ pct = SAE_DEF.pct, horas = SAE_DEF.horas, ida = SAE_DEF.ida, ...o } = {}) {
    const d = dia(o);
    const mw = (CENTRAL.mwCA * pct) / 100;
    const cap = mw * horas;
    const filas = d.filas.map(f => ({ ...f, carga: 0, descarga: 0, soc: 0, total: f.red }));
    let e = 0;
    let [cargado, entregado] = [0, 0];
    const tarde = d.filas.findIndex(f => f.h > 13 && f.red < mw * 1.15);
    filas.forEach((f, i) => {
        // carga: toma potencia de lo solar en las horas fuertes
        if (mw > 0 && f.h >= 9.5 && f.red > mw * 1.5 && (i < tarde || tarde < 0) && e < cap) {
            const c = Math.min(mw, ((cap - e) / ida) / PASO);
            f.carga = c;
            e += c * PASO * ida;
            cargado += c * PASO;
        } else if (mw > 0 && tarde >= 0 && i >= tarde && e > 0.001) {
            // sostiene la salida mientras lo solar se apaga
            const s = Math.min(mw, e / PASO, Math.max(0, mw - f.red));
            f.descarga = s;
            e -= s * PASO;
            entregado += s * PASO;
        }
        f.soc = cap > 0 ? e / cap : 0;
        f.total = f.red - f.carga + f.descarga;
    });
    return { ...d, filas, mw, cap, cargado, entregado, filasSolar: d.filas };
}

// ------------------------------------------------------------------ el tiempo: lo que tarda en moverse
export const NUBE = { dura: 16, baja: 0.78 };
export const estadoPlanta = ({ giro = 0, fija = 0 } = {}) => ({ giro, fija, nube: 1, polvoAnim: DEF.polvo });
/** Cuánto tapa la nube a lo largo de su paso, 0–1. */
export const nubeTapa = u => (u >= 1 || u <= 0 ? 0 : Math.exp(-(((u - 0.5) / 0.17) ** 2)));
/** Un paso del tiempo. m: { giro meta, seguidor, nube: pide que pase }. Función pura, independiente de la velocidad de los cuadros. */
export function pasoPlanta(s, m, dt) {
    const pasos = Math.max(1, Math.ceil(dt / 0.05));
    const h = dt / pasos;
    const n = { ...s };
    for (let i = 0; i < pasos; i++) {
        n.giro += clamp(m.giro - n.giro, -24 * h, 24 * h);
        n.fija += clamp((m.seguidor ? 0 : 1) - n.fija, -h / 1.6, h / 1.6);
        if (n.nube < 1) n.nube = Math.min(1, n.nube + h / NUBE.dura);
    }
    return n;
}

// ------------------------------------------------------------------ las lecturas
/** Lo que mide la central en cada modo. modo: 'dia' | 'calor' | 'seguidor' | 'inversor' | 'sae'. */
export function calcular({ modo = 'dia', planta = null, hora = DEF.hora, mes = DEF.mes, tAire = null, polvo = DEF.polvo, seguidor = true, inclinacion = DEF.inclinacion, ilr = DEF.ilr, sae = DEF.sae } = {}) {
    const tapa = planta ? nubeTapa(planta.nube) : 0;
    const k = 1 - NUBE.baja * tapa;
    const base = { hora, mes, polvo, inclinacion, ilr, tAire: modo === 'calor' ? tAire : null, seguidor: modo === 'seguidor' ? seguidor : true };
    const c = central({ ...base, k });
    const r = { modo, c, hora, mes, polvo, ilr, seguidor: base.seguidor, inclinacion, tapa, sae: 0, carga: 0, descarga: 0, soc: 0, red: c.red };
    if (modo === 'sae') {
        const D = memoSAE(sae, mes, polvo);
        const carga = enHora(D.filas, hora, 'carga');
        const descargaPlan = enHora(D.filas, hora, 'descarga');
        // si pasa una nube, el SAE tapa el hueco con lo que le quede
        const sinNube = enHora(D.filas, hora, 'red');
        const hueco = Math.max(0, sinNube - c.red);
        const ayuda = Math.min(Math.max(0, D.mw - descargaPlan), hueco) * (enHora(D.filas, hora, 'soc') > 0.02 ? 1 : 0);
        r.sae = D.mw;
        r.cap = D.cap;
        r.carga = hueco > 1 ? 0 : carga;
        r.descarga = descargaPlan + ayuda;
        r.soc = enHora(D.filas, hora, 'soc');
        r.red = Math.max(0, c.red - r.carga + r.descarga);
    }
    return r;
}
const memosSAE = new Map();
function memoSAE(pct, mes, polvo) {
    const clave = `${pct.toFixed(1)}|${mes}|${polvo.toFixed(1)}`;
    if (!memosSAE.has(clave)) { if (memosSAE.size > 60) memosSAE.clear(); memosSAE.set(clave, diaConSAE({ pct, mes, polvo })); }
    return memosSAE.get(clave);
}

// ------------------------------------------------------------------ acomodo de la central (no está a escala, pero la fila sí guarda sus proporciones)
export const BLOQUE = { x: [-7.6, 7.6], z: [-4.2, 4.4], y: [-1.1, 0] };
export const FILAS = { x: [-6.7, -5.15, -3.6, -2.05, -0.5, 1.05], z: [-3.85, 1.15], y: 0.56, ancho: 0.62, modulos: 16 };
export const ZANJA_Z = 1.72;
export const CENTRO_SOL = [0.3, 0.3, -0.9];
export const RADIO_SOL = 5.5;
export const TORRES = [[7.32, -0.2], [7.32, 4.05]];
const ALTO_TORRE = 3.3;
const puntasTorre = TORRES.map(([x, z]) => [x, ALTO_TORRE, z]);
export const FLUIDOS = {
    luz: { nombre: 'Luz del sol', color: '#ffc61a' },
    cd: { nombre: 'Corriente directa', color: '#e0457b' },
    ca: { nombre: 'Corriente alterna', color: '#ffb000' },
    sae: { nombre: 'Carga y descarga del SAE', color: '#19a974' },
};
// Cada caja: x0, x1, y0, y1, z0, z1. Las pinta planta.js y con ellas se revisa que cada cable llegue a un equipo.
export const EQUIPOS = {
    caja0: [-5.2, -4.8, 0, 0.6, 1.92, 2.18],
    caja1: [-0.95, -0.55, 0, 0.6, 1.92, 2.18],
    inversor: [2.1, 3.5, 0, 0.95, -0.85, 0.25],
    trafoMT: [2.2, 3.4, 0, 0.95, 0.35, 1.15],
    subestacion: [3.95, 6.05, 0, 1.3, 0.55, 2.45],
    portico: [6.28, 6.68, 0, 2.62, 1.2, 1.9],
    sae0: [4.1, 5.5, 0, 0.8, -3.7, -2.95],
    sae1: [4.1, 5.5, 0, 0.8, -2.65, -1.9],
    sae2: [5.85, 7.25, 0, 0.8, -3.7, -2.95],
    sae3: [5.85, 7.25, 0, 0.8, -2.65, -1.9],
    saeConv: [4.1, 5.5, 0, 0.8, -1.55, -0.85],
    reductora: [6.75, 7.45, 0, 1.3, 2.85, 3.5],
    celda: [-3.82, -2.58, 0, 1.1, 2.43, 3.67],
    pueblo: [4.1, 6.5, 0, 0.9, 2.85, 4.1],
};
const catenaria = (a, b, flecha, n = 5) => Array.from({ length: n + 1 }, (_, i) => { const k = i / n; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - flecha * 4 * k * (1 - k), lerp(a[2], b[2], k)]; });
const unir = (...tramos) => tramos.reduce((acc, t) => acc.concat(acc.length ? t.slice(1) : t), []);
const Z1 = FILAS.z[1];
const lineasFilas = FILAS.x.map((x, i) => {
    const caja = i < 3 ? EQUIPOS.caja0 : EQUIPOS.caja1;
    const xc = (caja[0] + caja[1]) / 2 + (i % 3 - 1) * 0.1;
    return [
        { id: `cadena${i}`, grupo: 'cd', parte: 'cadena', fluido: 'cd', r: 0.012, puntos: [[x, 0.48, FILAS.z[0] + 0.05], [x, 0.48, Z1 + 0.06], [x, 0.14, Z1 + 0.22]] },
        { id: `fila${i}`, grupo: 'cd', parte: 'cadena', fluido: 'cd', r: 0.014, puntos: [[x, 0.14, Z1 + 0.22], [x, 0.05, ZANJA_Z], [xc, 0.05, ZANJA_Z], [xc, 0.12, 2]] },
    ];
}).flat();
export const LINEAS = [
    ...lineasFilas,
    { id: 'circuito', grupo: 'cd', parte: 'celda', fluido: 'cd', r: 0.012, puntos: [[-2.62, 0.74, 3.05], [-2.3, 0.98, 3.05], [-2.18, 1.04, 3.05]] },
    { id: 'circuito2', grupo: 'cd', parte: 'celda', fluido: 'cd', r: 0.012, puntos: [[-2.18, 1.04, 3.05], [-2.1, 0.6, 3.05], [-2.3, 0.34, 3.05], [-2.62, 0.34, 3.05]] },
    { id: 'troncoA', grupo: 'cd', parte: 'caja', fluido: 'cd', r: 0.026, puntos: [[-4.86, 0.12, 2.05], [-4.86, 0.05, 1.56], [1.75, 0.05, 1.56], [1.95, 0.08, 0.1], [2.15, 0.3, -0.3]] },
    { id: 'troncoB', grupo: 'cd', parte: 'caja', fluido: 'cd', r: 0.026, puntos: [[-0.62, 0.12, 2.05], [-0.62, 0.05, 1.66], [1.85, 0.05, 1.66], [2.05, 0.08, 0.2], [2.15, 0.3, 0]] },
    { id: 'inv-trafo', grupo: 'ca', parte: 'trafoMT', fluido: 'ca', r: 0.024, puntos: [[2.8, 0.5, 0.2], [2.8, 0.5, 0.3], [2.8, 0.5, 0.42]] },
    { id: 'mt', grupo: 'ca', parte: 'subestacion', fluido: 'ca', r: 0.024, puntos: [[3.38, 0.25, 0.75], [3.7, 0.05, 0.85], [4.02, 0.3, 0.95]] },
    { id: 'saeBus', grupo: 'sae', parte: 'sae', fluido: 'sae', r: 0.024, puntos: [[4.8, 0.28, -0.88], [4.8, 0.06, -0.3], [4.5, 0.06, 0.2], [4.5, 0.3, 0.6]] },
    { id: 'sae0v', grupo: 'sae', parte: 'sae', fluido: 'sae', r: 0.018, puntos: [[4.6, 0.25, -2.98], [3.92, 0.05, -2.8], [3.92, 0.05, -1.7], [4.15, 0.2, -1.5]] },
    { id: 'sae1v', grupo: 'sae', parte: 'sae', fluido: 'sae', r: 0.018, puntos: [[4.7, 0.25, -1.93], [4.7, 0.2, -1.52]] },
    { id: 'sae2v', grupo: 'sae', parte: 'sae', fluido: 'sae', r: 0.018, puntos: [[6.5, 0.25, -2.98], [5.68, 0.05, -2.8], [5.68, 0.05, -1.3], [5.45, 0.2, -1.25]] },
    { id: 'sae3v', grupo: 'sae', parte: 'sae', fluido: 'sae', r: 0.018, puntos: [[6.4, 0.25, -1.93], [6.2, 0.05, -1.7], [5.75, 0.05, -1.15], [5.45, 0.2, -1.1]] },
    { id: 'alta', grupo: 'red', parte: 'subestacion', fluido: 'ca', r: 0.016, puntos: [[5.92, 1.22, 1.55], [6.15, 1.95, 1.55], [6.4, 2.4, 1.55]] },
    { id: 'rnt', grupo: 'red', parte: 'red', fluido: 'ca', r: 0.016, cable: true, puntos: unir(catenaria([6.48, 2.58, 1.55], puntasTorre[0], 0.06), catenaria(puntasTorre[0], puntasTorre[1], 0.34), catenaria(puntasTorre[1], [7.1, 1.28, 3.25], 0.1)) },
    { id: 'rgd', grupo: 'red', parte: 'red', fluido: 'ca', r: 0.014, cable: true, puntos: unir(catenaria([6.9, 0.95, 3.25], [6.45, 0.97, 3.4], 0.03, 3), catenaria([6.45, 0.97, 3.4], [5.95, 0.75, 3.35], 0.05, 3)) },
];

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
const X2 = FILAS.x[2];
export const MUESTRA = { x: -6.05, z: 3.05, y: 0.62 };
export const CELDA = { x: -3.2, z: 3.05, y: 0.42 };
export const PARTES = [
    { id: 'sol', ancla: [0.3, 5.5, 0], vista: { az: -16, el: 16, tam: 12.5, mira: [0, 2.3, 0] } },
    { id: 'celda', ancla: [CELDA.x, 1.32, CELDA.z], vista: { az: -12, el: 20, tam: 3, mira: [CELDA.x, 0.95, CELDA.z] } },
    { id: 'modulo', ancla: [MUESTRA.x, 1.5, MUESTRA.z], vista: { az: -14, el: 24, tam: 3.6, mira: [MUESTRA.x, 0.95, MUESTRA.z] } },
    { id: 'cadena', ancla: [X2, 0.92, -1.2], vista: { az: -26, el: 34, tam: 6.2, mira: [X2, 0.45, -1.3] } },
    { id: 'seguidor', ancla: [FILAS.x[0], 0.86, -1.35], vista: { az: -58, el: 11, tam: 2.6, mira: [FILAS.x[0], 0.42, -1.35] } },
    { id: 'caja', ancla: [EQUIPOS.caja1[0] + 0.2, 0.86, 2.05], vista: { az: -18, el: 24, tam: 3.2, mira: [-0.7, 0.3, 1.8] } },
    { id: 'inversor', ancla: [2.8, 1.2, -0.3], vista: { az: -58, el: 30, tam: 3, mira: [2.75, 0.5, -0.3] } },
    { id: 'trafoMT', ancla: [2.8, 1.18, 0.75], vista: { az: 18, el: 20, tam: 2.8, mira: [2.8, 0.5, 0.75] } },
    { id: 'clima', ancla: [-1.65, 1.72, 2.95], vista: { az: -24, el: 20, tam: 4.6, mira: [-1.8, 0.8, 1.8] } },
    { id: 'sae', ancla: [5.65, 1.08, -2.4], vista: { az: -42, el: 34, tam: 5, mira: [5.6, 0.35, -2.2] } },
    { id: 'subestacion', ancla: [5, 1.58, 1.5], vista: { az: -14, el: 22, tam: 4.4, mira: [4.7, 0.75, 1.6] } },
    { id: 'red', ancla: [7.32, 3.55, 4.05], vista: { az: 18, el: 16, tam: 6.6, mira: [5.8, 1.35, 2.8] } },
];

// ------------------------------------------------------------------ la pose
/** Todo lo que necesita posar(): lecturas, cuánto corre por cada cable (0–1), dónde está el sol, y la cámara. */
export function pose({ modo = 'dia', planta = null, hora = DEF.hora, mes = DEF.mes, tAire = null, polvo = DEF.polvo, seguidor = true, inclinacion = DEF.inclinacion, ilr = DEF.ilr, sae = DEF.sae, adentro = 0, desarme = 0, encendido = 1, limpia = 0, t = 0, dt = 0, camara = null } = {}) {
    const lectura = calcular({ modo, planta, hora, mes, tAire, polvo, seguidor, inclinacion, ilr, sae });
    const c = lectura.c;
    const s = c.s;
    const noche = clamp01(1 - (s.elev + 4) / 10);
    const cd = clamp01(c.dc / (CENTRAL.mwCA * 1.2));
    const ca = clamp01(c.ca / CENTRAL.mwCA);
    const grupos = { cd, ca, red: clamp01(lectura.red / c.redMax), sae: clamp01(Math.max(lectura.carga, lectura.descarga) / Math.max(1, lectura.sae)) };
    const flujos = {};
    for (const L of LINEAS) flujos[L.id] = grupos[L.grupo] ?? 0;
    const activo = { luz: clamp01(c.luz.total / 1000), cd, ca, red: grupos.red, sae: grupos.sae, carga: lectura.carga > 1 ? 1 : 0, descarga: lectura.descarga > 1 ? 1 : 0, recorte: clamp01(c.recorte / 60), encendido: 1 };
    const cam = camara || { mira: [0, 1.6, 0], az: -18, el: 26, d: 38 };
    const solR = [CENTRO_SOL[0] + RADIO_SOL * s.x, CENTRO_SOL[1] + RADIO_SOL * Math.max(s.y, -0.08), CENTRO_SOL[2] + RADIO_SOL * s.z];
    return {
        t, dt, modo, noche, adentro, desarme, encendido, sol: 1 - noche, lectura, flujos, activo, solDir: s, solPos: solR, giro: planta ? planta.giro : c.giro, fija: planta ? planta.fija : seguidor ? 0 : 1, inclinacion, polvo, mes, tapa: lectura.tapa, nubeU: planta ? planta.nube : 1, limpia, soc: lectura.soc, sae,
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'dia', hora: lerp(6, 19, clamp01(t / 12)), camara: { mira: [0, 1.6, 0], az: lerp(-26, -8, t / 12), el: 26, d: 38 } });
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
/** Cada punta de cada cable debe tocar un equipo, una fila de módulos u otro cable. Devuelve las que quedan al aire. */
export function puntasSueltas() {
    const sueltas = [];
    const filas = FILAS.x.map(x => [x - 0.32, x + 0.32, 0.3, 0.8, FILAS.z[0], FILAS.z[1] + 0.1]);
    for (const L of LINEAS) {
        for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
            const enEquipo = Object.values(EQUIPOS).some(c => dentro(p, c)) || filas.some(c => dentro(p, c));
            const enTorre = puntasTorre.some(q => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 0.05);
            const enTubo = LINEAS.some(o => o !== L && o.puntos.some((q, i) => i > 0 && distSeg(p, o.puntos[i - 1], q) < 0.06));
            if (!enEquipo && !enTorre && !enTubo) sueltas.push(`${L.id} (${nombre})`);
        }
    }
    return sueltas;
}
/** Revisión de cifras contra lo publicado. */
export function revisar() {
    const p = [];
    const lejos = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // 1. el módulo contra su ficha
    lejos(potenciaModulo(1000, 25), 549.9, 550.1, 'W del módulo a 1,000 W/m² y 25 °C (ficha: 550)');
    lejos(potenciaModulo(800, tCelda(20, 800)), 404, 414, 'W del módulo con 800 W/m² y 20 °C de aire (ficha: 409)');
    lejos(MODULO.pmp / (MODULO.largo * MODULO.ancho * 1000), 0.211, 0.215, 'eficiencia con sus medidas (ficha: 21.33 %)');
    const pn = puntosModulo(800, tCelda(20, 800));
    lejos(pn.isc, 11.2, 11.45, 'corriente de corto a 800 W/m² (ficha: 11.33 A)');
    lejos(pn.voc, 45.8, 47.3, 'voltaje abierto a 800 W/m² (ficha: 46.84 V)');
    const cv = curvaModulo(1000, 25);
    lejos(cv.i(0), 14, 14.06, 'la curva empieza en la corriente de corto (14.03 A)');
    lejos(cv.i(MODULO.vmp) * MODULO.vmp, 548, 552, 'la curva pasa por su mejor punto (550 W)');
    lejos(POR_CADENA, 26, 30, 'módulos por cadena sin pasar de 1,500 V con frío');
    // 2. la luz contra NASA POWER, en el sitio
    let dEne = 0;
    for (let m = 1; m <= 12; m++) {
        const r = ghiDespejadoDia(m) / CLIMA.despejado[m - 1];
        // Meinel es sencillo: se queda corto con el sol bajo. Cada mes se escala a la luz medida, y por eso aquí basta con que ande cerca.
        lejos(r, 0.85, 1.08, `día despejado de ${MESES[m - 1]}, modelo entre NASA`);
        dEne += CLIMA.ghi[m - 1];
    }
    lejos(dEne / 12, 5.95, 6.1, 'luz promedio de NASA POWER en el sitio (6.01 kWh/m² al día)');
    const verano = solEn(12, 6);
    lejos(verano.elev, 80, 83, 'el sol en junio al mediodía (90 − 31.33 + 23.4)');
    lejos(solEn(12, 12).elev, 34, 37, 'el sol en diciembre al mediodía');
    lejos(luzDespejada(solEn(12, 6)).dni, 880, 1000, 'luz directa de un mediodía de junio');
    lejos(luzDespejada({ x: 0, y: 1 / 1.5, z: 0.74, elev: 41.8 }).dni, 830, 870, 'luz directa con masa de aire 1.5 (Meinel: cerca de 850 W/m²)');
    // 3. el año contra PVGIS: mismo lugar, sin recorte y con pérdidas parecidas a las de PVGIS
    const fijaA = anual({ seguidor: false, ilr: 1 });
    const seguA = anual({ seguidor: true, ilr: 1 });
    lejos(fijaA.porKw / PVGIS.fija, 0.92, 1.12, 'kWh por kW con mesa fija, modelo entre PVGIS');
    lejos(seguA.porKw / PVGIS.seguidor, 0.88, 1.06, 'kWh por kW con seguidor, modelo entre PVGIS');
    lejos(seguA.porKw / fijaA.porKw, 1.15, 1.33, 'lo que gana el seguidor (LBNL: de 25 a 29 %, +16 %; PVGIS en el sitio: +31 %)');
    // 4. la central contra lo que se publica de centrales grandes
    const A = anual();
    lejos(A.factorCA, 0.28, 0.37, 'factor de planta en CA (LBNL: hasta 36 %; Puerto Peñasco III y IV: 1,650 GWh con 580 MW, 32.5 %)');
    lejos(A.recorteFrac, 0.001, 0.08, 'energía recortada con 1.25: poca, porque en el desierto la celda va muy caliente al mediodía');
    const r = [1.05, 1.1, 1.45, 1.5].map(x => anual({ ilr: x }).factorCA);
    lejos((r[3] - r[2]) / (r[1] - r[0]), 0.1, 0.99, 'sobredimensionar rinde cada vez menos (LBNL: 1.00 contra 0.73)');
    lejos(anual({ ilr: 1.5 }).recorteFrac, A.recorteFrac, 0.3, 'con más módulos por inversor se recorta más');
    // 5. inversor
    const inv = inversor(CENTRAL.mwCA * 0.5, CENTRAL.mwCA);
    lejos(inv.rendimiento, 0.982, 0.992, 'rendimiento del inversor a media carga (ficha: máximo 98.9 %)');
    lejos(Math.max(...[0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(x => inversor(CENTRAL.mwCA * x, CENTRAL.mwCA).rendimiento)), 0.985, 0.992, 'rendimiento máximo del inversor (ficha: 98.9 %)');
    lejos(inversor(CENTRAL.mwCA * 1.3, CENTRAL.mwCA).ca, CENTRAL.mwCA, CENTRAL.mwCA, 'el inversor no entrega más que su tamaño');
    // 6. calor y polvo
    const c25 = central({ hora: 12, tAire: 25 });
    const c45 = central({ hora: 12, tAire: 45 });
    lejos(c45.pm / c25.pm, 0.92, 0.94, 'de 25 a 45 °C (ficha: −0.35 % por grado, −7 %)');
    lejos(central({ hora: 12, polvo: 10 }).pm / central({ hora: 12, polvo: 0 }).pm, 0.895, 0.905, 'con 10 % de polvo');
    // 7. el SAE: lo que entrega es lo que se cargó menos sus pérdidas
    const S = diaConSAE();
    lejos(S.entregado / S.cargado, SAE_DEF.ida - 0.02, SAE_DEF.ida + 0.02, 'el SAE regresa lo que dice la EIA (82 %)');
    lejos(S.entregado, S.cap * 0.95, S.cap * 1.01, 'en un día despejado entrega toda su energía');
    const rj = central({ hora: 12 }).reparto;
    lejos(rj.reflejo + rj.polvo + rj.calor + rj.cables + rj.inversor + rj.transporte + rj.red, 0.999, 1.001, 'el reparto de la luz suma 100');
    lejos(rj.red, 0.13, 0.2, 'de cada 100 de luz, lo que llega a la red');
    // 8. la superficie: la CFE habla de 2,000 hectáreas para 1,000 MW
    const moduloM2 = CENTRAL.mwMayo * 1e6 / MODULO.pmp * MODULO.largo * MODULO.ancho;
    lejos(moduloM2 / 2e7, 0.15, 0.4, 'parte del terreno cubierta de módulos, con caminos y equipos');
    const ss = puntasSueltas();
    if (ss.length) p.push(`Cables con una punta suelta: ${ss.join(', ')}`);
    return p;
}
