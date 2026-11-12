// El modelo de la cogeneración: cuánto combustible gasta producir juntos electricidad y vapor contra hacerlo por separado, la cuenta de
// la regla para saber si es eficiente y cuánta energía libre de combustible le toca, la energía obligada y la despachable de cada hora,
// y lo que da el bagazo de un ingenio en la zafra. Puro: sin three.js. Las cifras están en datos.js y el lugar de cada cosa en lugar.js.
import { CEL, CICLO_NUEVO, ETA_MIN, INGENIOS, MW_POR_TH, NACIONAL, PLANTA, REF_E_ANTERIOR, REF_H, etaMin, fp, refE } from './datos.js';
import { BLOQUE, EQUIPOS, LINEAS, PARTES, REMATE } from './lugar.js';

export { BLOQUE, FLUIDOS, LINEAS, PARTES, SITIO } from './lugar.js';
export { CEL, CICLO_NUEVO, ETA_MIN, FP, INGENIOS, MW_POR_TH, NACIONAL, PLANTA, REALES, REF_E, REF_E_ANTERIOR, REF_H, etaMin, fp, refE } from './datos.js';

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const clamp01 = x => clamp(x, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;
const suma = a => a.reduce((s, x) => s + x, 0);

// ------------------------------------------------------------------ la planta, hora por hora (MW)
/** La turbina pierde eficiencia a media carga: a 50 % da tres cuartos de su eficiencia (catálogo de la EPA: 32.8 % → 24.8 %). */
export const etaCarga = carga => PLANTA.etaE * (1 - 0.5 * (1 - clamp(carga, 0, 1)));
const QREC_PLENA = (PLANTA.mw / PLANTA.etaE) * (1 - PLANTA.etaE - PLANTA.perdidasTurbina);
/** Qué parte del calor del escape se vuelve vapor útil: la que da 500 t/h a plena carga. */
export const ETA_RECUPERADOR = (PLANTA.vaporBase * MW_POR_TH) / QREC_PLENA;

/** La turbina a una carga y la fábrica pidiendo cierto vapor (t/h): combustible, electricidad, vapor útil, postcombustión y lo que se tira. */
export function operar({ carga = 1, vapor = PLANTA.vaporBase } = {}) {
    const L = clamp(carga, 0, 1);
    const E = PLANTA.mw * L;
    const Fgt = E > 0 ? E / etaCarga(L) : 0;
    const recuperable = Fgt * (1 - etaCarga(L) - PLANTA.perdidasTurbina) * ETA_RECUPERADOR;
    const pide = clamp(vapor, 0, PLANTA.vaporMax) * MW_POR_TH;
    const H = Math.min(pide, recuperable + Math.max(0, PLANTA.vaporMax * MW_POR_TH - recuperable));
    const deEscape = Math.min(H, recuperable);
    const post = Math.max(0, H - recuperable);
    const Fpost = post / PLANTA.etaPostcombustion;
    const tirado = Math.max(0, recuperable - deEscape);
    const F = Fgt + Fpost;
    const perdidas = F - E - H;
    return { carga: L, E, Fgt, Fpost, F, H, recuperable, deEscape, post, tirado, perdidas, vaporTh: H / MW_POR_TH, etaE: E / F, etaH: H / F, total: (E + H) / F };
}

/**
 * La cuenta de la regla (RES/1838/2016 con A/018/2023): lo que costaría producir lo mismo por separado (EP), el ahorro (AEP), la energía
 * libre de combustible (ELC) y su porcentaje. `ref` cambia la eficiencia eléctrica de referencia: la de la regla o la de un ciclo nuevo.
 */
export function cuenta({ E, H, F }, { ref = 'regla', mw = PLANTA.mw, kv = PLANTA.kv } = {}) {
    const RefE = ref === 'nuevo' ? CICLO_NUEVO : refE(mw);
    const RefE2 = RefE * fp(kv);
    const EP = E / RefE2 + H / REF_H.vapor;
    const AEP = EP - F;
    const ELC = AEP * RefE;
    // la prueba del régimen anterior (RES/003/2011): ahorro sobre el combustible de la electricidad
    const Fh = H / REF_H.vapor;
    const Fe = F - Fh;
    const AEPant = E / (REF_E_ANTERIOR * fp(kv)) + Fh - F;
    const h = Fe > 0 ? AEPant / Fe : Infinity;
    return { RefE, RefE2, EP, AEP, APEP: EP > 0 ? AEP / EP : 0, ELC, pctELC: E > 0 ? ELC / E : 0, eficiente: ELC > 0, h, hMin: etaMin(mw), cumpleAnterior: h >= etaMin(mw), separadoE: E / RefE2, separadoH: H / REF_H.vapor };
}
/** La carga más baja de la turbina con la que su escape da el vapor que se pide (sin bajar del mínimo técnico). */
export function cargaParaVapor(vapor) {
    const pide = Math.min(vapor, PLANTA.vaporBase) * MW_POR_TH;
    if (operar({ carga: PLANTA.minimo, vapor }).recuperable >= pide) return PLANTA.minimo;
    let a = PLANTA.minimo;
    let b = 1;
    for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (operar({ carga: m, vapor }).recuperable >= pide) b = m; else a = m; }
    return b;
}
/** Con cuánto vapor (t/h) deja de ahorrar combustible la planta a plena carga. */
export function vaporMinimo(ref = 'regla') {
    let a = 0;
    let b = PLANTA.vaporMax;
    for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (cuenta(operar({ vapor: m }), { ref }).AEP > 0) b = m; else a = m; }
    return b;
}

// ------------------------------------------------------------------ la energía obligada y la despachable de un día
/** El vapor que pide el complejo industrial de ejemplo, hora por hora (t/h): más en el turno de día. */
export const VAPOR_DIA = Array.from({ length: 24 }, (_, h) => Math.round(330 + 110 * clamp01((h - 6) / 3) * clamp01((22 - h) / 3) + 25 * Math.sin((h / 24) * 2 * Math.PI)));
/** Una hora del día: lo que exige el vapor (obligada) y lo que puede vender si el mercado lo pide (despachable), como en el transitorio
 * tercero de las Disposiciones de Cogeneración. */
export function hora({ h = DEF.hora, maximo = false } = {}) {
    const vapor = VAPOR_DIA[clamp(Math.floor(h), 0, 23)];
    const cargaVapor = cargaParaVapor(vapor);
    const propio = PLANTA.consumoFabrica + PLANTA.auxiliares;
    const generaVapor = PLANTA.mw * cargaVapor;
    const obligada = Math.max(0, generaVapor - propio);
    const minimoRed = Math.max(PLANTA.mw * PLANTA.minimo - propio, obligada);
    const maximoRed = PLANTA.mw - propio;
    const aRed = maximo ? maximoRed : minimoRed;
    const carga = (aRed + propio) / PLANTA.mw;
    const op = operar({ carga, vapor });
    return { h, vapor, obligada, despachable: maximoRed - obligada, minimoRed, maximoRed, aRed, propio, carga, op, k: cuenta(op) };
}
export const dia = maximo => Array.from({ length: 24 }, (_, h) => hora({ h, maximo }));

// ------------------------------------------------------------------ el ingenio
const POR_INGENIO = INGENIOS.zafra.caniaT / INGENIOS.zafra.ingenios;
/** Un ingenio de ejemplo del tamaño promedio de la zafra 2025/26: caña, bagazo, vapor y electricidad de un día de cierto mes. */
export function ingenio({ mes = DEF.mes, excedente = DEF.excedente } = {}) {
    const m = clamp(Math.round(mes), 0, 11);
    const caniaDia = (POR_INGENIO / INGENIOS.zafra.dias) * INGENIOS.meses[m];
    const t = INGENIOS.porTonelada;
    const genera = (caniaDia * t.kwh) / 1000;
    const vende = (caniaDia * excedente) / 1000;
    const nacional = (INGENIOS.zafra.caniaT * excedente) / 1e6;
    return {
        mes: m, zafra: INGENIOS.meses[m] > 0, caniaDia, bagazoDia: caniaDia * t.bagazo, vaporTh: (caniaDia * t.vapor) / 24, generaMWh: genera, mwPromedio: genera / 24,
        vendeMWh: vende, mwVende: vende / 24, excedente, nacionalGWh: nacional, porIngenio: POR_INGENIO, pctELC: 1,
    };
}

// ------------------------------------------------------------------ cada modo
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const DEF = { vapor: 500, ref: 'regla', separado: false, horasAnio: PLANTA.horasAnio, hora: 12, maximo: false, mes: 1, excedente: 0 };
export const LIMITES = { vapor: [0, 800], horasAnio: [1000, 8760], hora: [0, 23.99], mes: [0, 11], excedente: [0, 72] };

export function modoJuntos({ vapor = DEF.vapor, ref = DEF.ref, separado = DEF.separado } = {}) {
    const op = operar({ vapor });
    const k = cuenta(op, { ref });
    const regla = ref === 'regla' ? k : cuenta(op, { ref: 'regla' });
    return { modo: 'juntos', vapor, ref, separado, op, k, regla, minimo: vaporMinimo(ref) };
}
export function modoEficiente({ vapor = DEF.vapor, horasAnio = DEF.horasAnio } = {}) {
    const op = operar({ vapor });
    const k = cuenta(op);
    const cel = Math.max(0, k.ELC) * horasAnio;
    return { modo: 'eficiente', vapor, horasAnio, op, k, cel, mwh: op.E * horasAnio, minimo: vaporMinimo('regla') };
}
export function modoDespacho({ hora: hh = DEF.hora, maximo = DEF.maximo } = {}) {
    const ahora = hora({ h: hh, maximo });
    return { modo: 'despacho', hora: hh, maximo, ahora, dia: dia(maximo), diaMin: dia(false), diaMax: dia(true) };
}
export function modoIngenio({ mes = DEF.mes, excedente = DEF.excedente } = {}) {
    return { modo: 'ingenio', ...ingenio({ mes, excedente }), anio: MESES.map((_, m) => ingenio({ mes: m, excedente })) };
}
export function calcular({ modo = 'juntos', ...p } = {}) {
    if (modo === 'eficiente') return modoEficiente(p);
    if (modo === 'despacho') return modoDespacho(p);
    if (modo === 'ingenio') return modoIngenio(p);
    return modoJuntos(p);
}
export const estadoPlanta = () => ({ t: 0 });
export function pasoPlanta(s, m, dt) { return { ...s, t: s.t + dt }; }

// ------------------------------------------------------------------ la pose
export function pose({ modo = 'juntos', noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, ...resto });
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    const s = x => (x > 0.01 ? 0.15 + 0.8 * clamp01(x) : 0);
    const activo = { turbina: 0, generador: 0, escape: 0, chimenea: 0.3, proceso: 0, caldera: 0, zafra: 0, pila: 0.5 };
    let op = null;
    if (modo === 'juntos' && L.separado) {
        // por separado: la caldera da el vapor y la red da la electricidad
        activo.caldera = 1;
        activo.proceso = clamp01(L.vapor / PLANTA.vaporMax);
        activo.chimenea = 0.2;
        flujos.gasoducto = s(0.6);
        flujos.gasCaldera = s(L.vapor / PLANTA.vaporMax);
        flujos.vaporCaldera = s(L.vapor / PLANTA.vaporMax);
        flujos.rnt = s(0.6);
        flujos.aRed = s(0.5);
        flujos.aFabrica = s(0.5);
    } else if (modo !== 'ingenio') {
        op = modo === 'despacho' ? L.ahora.op : L.op;
        activo.turbina = op.carga;
        activo.generador = op.carga;
        activo.escape = clamp01(op.deEscape / 400 + op.post / 300);
        activo.chimenea = 0.25 + 0.75 * clamp01(op.tirado / 300);
        activo.proceso = clamp01(op.H / (PLANTA.vaporMax * MW_POR_TH));
        flujos.gasoducto = s(op.F / 1100);
        flujos.gasTurbina = s(op.Fgt / 820);
        flujos.vapor = s(op.H / (PLANTA.vaporMax * MW_POR_TH));
        flujos.retorno = flujos.vapor * 0.8;
        flujos.elec = s(op.carga);
        flujos.aFabrica = s(0.6);
        const red = modo === 'despacho' ? L.ahora.aRed / (PLANTA.mw - PLANTA.consumoFabrica) : (op.E - PLANTA.consumoFabrica) / PLANTA.mw;
        flujos.aRed = s(red);
        flujos.rnt = s(red);
        flujos.senal = modo === 'despacho' ? 0.5 : 0.3;
    }
    if (modo === 'ingenio') {
        activo.zafra = L.zafra ? 1 : 0;
        activo.pila = L.zafra ? 0.85 : 0.2;
        flujos.molinos = s(L.zafra ? 0.8 : 0);
        flujos.banda = s(L.zafra ? 0.8 : 0);
        flujos.vaporIngenio = s(L.zafra ? 0.8 : 0);
        flujos.ingenioRed = s(L.mwVende / 5);
        flujos.rnt = s(0.4);
        activo.chimenea = 0.1;
    } else {
        flujos.molinos = 0;
        activo.zafra = 0.25;
        activo.pila = 0.6;
    }
    const cam = camara || { mira: [0, 0.6, -0.3], az: 18, el: 30, d: 34 };
    return { t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, activo, camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 } };
}
export function estado(t) {
    return pose({ t, modo: 'juntos', camara: { mira: [0, 0.6, -0.3], az: lerp(10, 24, t / 12), el: 30, d: 34 } });
}

// ------------------------------------------------------------------ revisiones
const dentroDe = (p, c, h = 0.1) => p[0] >= c[0] - h && p[0] <= c[1] + h && p[1] >= c[2] - h && p[1] <= c[3] + h && p[2] >= c[4] - h && p[2] <= c[5] + h;
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
        if (REMATE.has(`${L.id} (${nombre})`)) continue;
        if (!Object.values(EQUIPOS).some(c => dentroDe(p, c))) sueltas.push(`${L.id} (${nombre})`);
    }
    return sueltas;
}
export const partesFuera = () => PARTES.filter(p => p.ancla[0] < BLOQUE.x[0] || p.ancla[0] > BLOQUE.x[1] || p.ancla[2] < BLOQUE.z[0] || p.ancla[2] > BLOQUE.z[1]).map(p => p.id);

/** Revisión de cifras contra las fuentes y contra la física. */
export function revisar() {
    const p = [];
    const entre = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // la regla
    entre(refE(277), 0.47, 0.47, 'RefE de una central de 277 MW: 47 %');
    entre(refE(20), 0.41, 0.41, 'RefE de 15 a 50 MW: 41 %');
    entre(fp(115), 0.98, 0.98, 'factor de pérdidas a 115 kV: 0.98');
    entre(etaMin(277), 0.2, 0.2, 'prueba anterior, 100 MW o más: 20 %');
    // el ejemplo del agente con la regla vigente: F 100, E 30, H 50, 20 MW a 115 kV → ELC 41.3 %
    const ej = cuenta({ E: 30, H: 50, F: 100 }, { mw: 20, kv: 115 });
    entre(ej.pctELC, 0.41, 0.415, 'ejemplo de 20 MW: 41 % de energía libre de combustible');
    entre(ej.APEP, 0.23, 0.235, 'ejemplo de 20 MW: ahorra 23 % de energía primaria');
    // la planta: 277 MW y 500 t/h a plena carga; hasta 800 t/h con postcombustión
    const base = operar({ vapor: 500 });
    entre(base.E, 277, 277, 'plena carga: 277 MW');
    entre(base.vaporTh, 499.9, 500.1, 'plena carga: 500 t/h de vapor sin postcombustión');
    entre(base.post, 0, 0.01, 'sin postcombustión a 500 t/h');
    entre(operar({ vapor: 800 }).vaporTh, 799.9, 800.1, 'con postcombustión, 800 t/h');
    entre(base.total, 0.7, 0.85, 'aprovecha entre 70 y 85 % del combustible, como dice la EPA');
    entre(base.E + base.H + base.perdidas - base.F, -1e-6, 1e-6, 'la energía cuadra');
    entre(etaCarga(0.5) / etaCarga(1), 0.74, 0.76, 'a media carga, tres cuartos de la eficiencia (EPA)');
    const k = cuenta(base);
    entre(k.pctELC, 0.3, 0.4, 'la planta de ejemplo: entre 30 y 40 % de energía libre de combustible');
    entre(k.cumpleAnterior ? 1 : 0, 1, 1, 'pasa la prueba anterior');
    entre(cuenta(operar({ vapor: 0 })).eficiente ? 1 : 0, 0, 0, 'sin usar el vapor no es eficiente');
    entre(vaporMinimo('regla'), 200, 300, 'deja de ahorrar con menos de 200 a 300 t/h');
    entre(cuenta(base, { ref: 'nuevo' }).AEP, -400, cuenta(base).AEP, 'contra un ciclo combinado nuevo ahorra menos');
    // el día: la obligada nunca pasa de la capacidad
    for (const x of dia(false)) { entre(x.obligada, 0, PLANTA.mw, `obligada a las ${x.h}`); entre(x.aRed, x.obligada - 1e-9, PLANTA.mw, `a la red a las ${x.h}`); if (x.obligada > 0) entre(x.op.tirado, 0, 1, `con solo la obligada no se tira calor a las ${x.h}`); }
    // los ingenios
    entre(INGENIOS.zafra.caniaT / INGENIOS.zafra.ingenios / 1e6, 1.05, 1.06, 'un ingenio promedio muele 1.05 millones de toneladas');
    entre((INGENIOS.anterior.kwh / INGENIOS.anterior.caniaT), 22.1, 22.15, '22.1 kWh por tonelada en 2023/24');
    entre(suma(INGENIOS.meses.map(x => x * 30.4)), 240, 255, 'la zafra dura unos 247 días');
    entre(ingenio({ mes: 0, excedente: 72 }).nacionalGWh, 3500, 3600, 'con 72 kWh por tonelada, todo el país vendería unos 3,570 GWh');
    // el país
    entre(NACIONAL.mw.at(-1)[1] / NACIONAL.mwSen2024, 0.025, 0.026, 'cogeneración eficiente: 2.5 % de la capacidad');
    entre(NACIONAL.gwh2024 / NACIONAL.gwhLimpia2024, 0.047, 0.048, 'y 4.7 % de la generación limpia');
    entre(suma(NACIONAL.nuevas.map(n => n[1])), 2422, 2422, 'las nuevas de Pemex y CFE: 2,422 MW');
    entre(CEL.requisito2026, 0.139, 0.139, 'obligación de CEL de 2026: 13.9 %');
    // la figura
    entre(puntasSueltas().length, 0, 0, `líneas sueltas: ${puntasSueltas().join(', ')}`);
    entre(partesFuera().length, 0, 0, 'puntos clave fuera del sitio');
    return p;
}
