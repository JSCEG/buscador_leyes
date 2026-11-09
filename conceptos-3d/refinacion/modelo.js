// La refinería como cifras puras: qué trae cada crudo, qué se separa en las torres, qué se rompe en las plantas de conversión, a dónde va el azufre y cómo sube
// el octanaje. Sin three.js ni DOM. El tablero, las gráficas y las partículas leen calcular(), así no pueden contradecirse.
//
// Refinería de ejemplo con el tamaño y el crudo de Olmeca (Dos Bocas, Tabasco): 340 mil barriles al día de crudo Maya. No es el plano de esa refinería ni un simulador.
// - Crudos: análisis de Maya, Istmo y Olmeca publicados en Oil & Gas Journal (15 de mayo de 2000): cortes, densidad, azufre y octanaje de la nafta.
// - Calidad: NOM-016-CRE-2016: índice de octano de 87 y 91, azufre de 30 y 80 mg/kg en gasolina, 15 mg/kg en diésel.
// - Plantas: coque de 18 a 30 % del residuo, 480 a 505 °C en el horno de la coquizadora, 300 a 400 °C y 30 a 130 atm en la hidrodesulfuración, 715 °C en el regenerador
//   y unos 500 °C en la reformadora (Wikipedia, con sus referencias).
// - Diseño: 173 mil barriles de gasolina y 125 mil de diésel al día (Energía a Debate). Con ellos se comprueba el modelo.
// - De ejemplo, para ver la tendencia: cuánto rinde cada planta, lo que se queda en cada corriente, el hidrógeno, la curva de la reformadora y del azufre, y el acomodo.

const clamp01 = x => Math.min(1, Math.max(0, x));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const D2R = Math.PI / 180;

// ------------------------------------------------------------------ los crudos
const CORTES_C = [30, 177, 274, 344, 538, 800]; // °C: 351, 526, 651 y 1,000 °F
export const NOMBRES_CORTE = { gas: 'Gas', nafta: 'Nafta', keroseno: 'Queroseno', ligero: 'Gasóleo ligero', pesado: 'Gasóleo pesado', residuo: 'Residuo' };
export const LISTA_CORTES = ['gas', 'nafta', 'keroseno', 'ligero', 'pesado', 'residuo'];
export const CRUDOS = {
    maya: { nombre: 'Maya', api: 21.5, s: 3.4, ccr: 10.8, metales: 330.4, v: { gas: 0.3, nafta: 15.3, keroseno: 13.8, ligero: 9.4, pesado: 24.3, residuo: 36.9 }, apis: { nafta: 60.4, keroseno: 40.3, ligero: 29.7, pesado: 20.6, residuo: 4 }, ss: { nafta: 0.1, keroseno: 1.2, ligero: 2.46, pesado: 3.25, residuo: 5.3 }, ron: 50.7 },
    istmo: { nombre: 'Istmo', api: 32.9, s: 1.4, ccr: 4.5, metales: 46.3, v: { gas: 1.3, nafta: 25.2, keroseno: 18.3, ligero: 11.9, pesado: 26.7, residuo: 16.6 }, apis: { nafta: 65.3, keroseno: 42.9, ligero: 33.4, pesado: 23.1, residuo: 6.1 }, ss: { nafta: 0.025, keroseno: 0.27, ligero: 1.04, pesado: 1.81, residuo: 3.5 }, ron: 46.5 },
    olmeca: { nombre: 'Olmeca', api: 38.9, s: 0.93, ccr: 2.8, metales: 10.5, v: { gas: 1.8, nafta: 29, keroseno: 19.2, ligero: 14.8, pesado: 24.9, residuo: 10.3 }, apis: { nafta: 66.5, keroseno: 43.2, ligero: 33.7, pesado: 23.6, residuo: 8.9 }, ss: { nafta: 0.017, keroseno: 0.13, ligero: 0.63, pesado: 1.38, residuo: 3.4 }, ron: 53.3 },
};
export const ORDEN_CRUDOS = ['maya', 'istmo', 'olmeca'];
export const REFINERIA = { nombre: 'Olmeca', carga: 340, gasolina: 173, diesel: 125, plantas: 17, procesado2025: 263.402, petroliferos2025: 211.886 };
export const CALIDAD = { regular: 87, premium: 91, sGasolinaProm: 30, sGasolinaMax: 80, sDiesel: 15 };
export const BARRIL_L = 158.987;
export const NIVELES = ['Solo destilar', 'Con vacío', 'Con FCC', 'Con coquizadora'];
export const DEF = { horno: 370, crudo: 'maya', plantas: 3, severidad: 96, ron: 98, carga: 340 };
export const LIMITES = { horno: [280, 400], plantas: [0, 3], severidad: [0, 100], ron: [85, 104], carga: [100, 340] };
export const HORNO_MAX = 400; // arriba de esto el crudo se rompe en los tubos
export const REND = {
    fcc: { gasolina: 0.55, lco: 0.19, lodo: 0.06, glp: 0.26, coqueMasa: 0.05 }, // de ejemplo: de cada barril de gasóleo
    coker: { gas: 0.08, nafta: 0.13, ligero: 0.2, pesado: 0.25, coqueMasa: 0.3 }, // de ejemplo; el coque, en el tope publicado de 18 a 30 %
    alquilado: 1.75, // de ejemplo: barriles de alquilado por barril de gas de la FCC que se aprovecha
    olefinas: 0.6, // de ejemplo: qué parte del GLP de la FCC sirve para alquilar
    naftaPesada: 0.75, // de ejemplo: la parte de la nafta que va a la reformadora
};

// ------------------------------------------------------------------ las cuentas de un crudo
export const gravedad = api => 141.5 / (api + 131.5);
/** Lo que cada corte pesa y trae, ya en proporción del barril. */
function normal(c) {
    const C = CRUDOS[c];
    const t = LISTA_CORTES.reduce((s, k) => s + C.v[k], 0);
    return Object.fromEntries(LISTA_CORTES.map(k => [k, C.v[k] / t]));
}
/** Qué parte del crudo ya hirvió a esa temperatura (0–100). */
export function destilado(c, T) {
    const v = normal(c);
    let suma = 0;
    let t0 = 0;
    for (let i = 0; i < LISTA_CORTES.length; i++) {
        const k = LISTA_CORTES[i];
        const t1 = CORTES_C[i];
        if (T >= t1) suma += v[k];
        else { suma += v[k] * clamp01((T - t0) / (t1 - t0)); break; }
        t0 = t1;
    }
    return suma * 100;
}
export const CALIENTE = 26; // en la zona de vaporización el crudo llega unos 25 °C abajo de la salida del horno (de ejemplo)
/** Lo que sale de la torre atmosférica con el horno a esa temperatura, en porcentaje del crudo. */
export function torre(c, T = DEF.horno) {
    const vapor = destilado(c, T - CALIENTE);
    const cortes = {};
    const v = normal(c);
    let abajo = 0;
    for (const k of ['gas', 'nafta', 'keroseno']) {
        const arriba = abajo + v[k] * 100;
        cortes[k] = Math.max(0, Math.min(arriba, vapor) - abajo);
        abajo = arriba;
    }
    // lo último que alcanza a hervir sale con el gasóleo ligero: así lo que sube y lo que se queda suman 100
    cortes.ligero = Math.max(0, vapor - abajo);
    return { T, vapor, cortes, fondo: 100 - vapor, seRompe: T > HORNO_MAX - 5 };
}
const masa = (c, k) => { const C = CRUDOS[c]; return gravedad(k === 'gas' ? 110 : C.apis[k]) * normal(c)[k]; };
/** Toneladas al día de un barril-fracción: cada mil barriles al día de agua pesan 159 t. */
const tDia = (kbd, sg) => kbd * BARRIL_L * sg;
export function azufreDeCortes(c) {
    let [mt, st] = [0, 0];
    for (const k of LISTA_CORTES) {
        const m = masa(c, k);
        mt += m;
        st += m * (CRUDOS[c].ss[k] ?? 0);
    }
    return { azufre: st / mt, sg: mt, api: 141.5 / mt - 131.5 };
}

// ------------------------------------------------------------------ la reformadora: más octano, menos volumen, más hidrógeno (de ejemplo)
export const rendimientoReformado = ron => clamp(0.9 - 0.012 * (ron - 85) - 0.00018 * (ron - 85) ** 2, 0.6, 0.92);
export const hidrogenoReformado = ron => 0.012 + 0.0009 * (ron - 85); // parte de la masa de la nafta
export const CORRIENTES_OCTANO = {
    ligera: { nombre: 'Nafta ligera', ron: 68, mon: 64 },
    reformado: { nombre: 'Reformado', mon: r => r - 10 },
    fcc: { nombre: 'Gasolina de FCC', ron: 92, mon: 80 },
    alquilado: { nombre: 'Alquilado', ron: 96, mon: 94 },
};

// ------------------------------------------------------------------ el balance de la refinería
/** Lo que entra y lo que sale, en miles de barriles al día. plantas: 0 solo destilar, 1 con vacío, 2 con FCC, 3 con coquizadora. */
export function balance({ crudo = DEF.crudo, plantas = DEF.plantas, carga = DEF.carga, ron = DEF.ron } = {}) {
    const n = normal(crudo);
    const nivel = clamp(Math.round(plantas), 0, 3);
    const c = k => n[k] * carga;
    const pasos = { vacio: nivel >= 1, fcc: nivel >= 2, coker: nivel >= 3 };
    // coquizadora
    const resid = c('residuo');
    const sgRes = gravedad(CRUDOS[crudo].apis.residuo);
    const coker = pasos.coker ? { gas: resid * REND.coker.gas, nafta: resid * REND.coker.nafta, ligero: resid * REND.coker.ligero, pesado: resid * REND.coker.pesado, coqueT: tDia(resid, sgRes) * REND.coker.coqueMasa } : { gas: 0, nafta: 0, ligero: 0, pesado: 0, coqueT: 0 };
    // FCC
    const cargaFCC = pasos.fcc ? c('pesado') + coker.pesado : 0;
    const fcc = { carga: cargaFCC, gasolina: cargaFCC * REND.fcc.gasolina, lco: cargaFCC * REND.fcc.lco, lodo: cargaFCC * REND.fcc.lodo, glp: cargaFCC * REND.fcc.glp };
    const alquilado = fcc.glp * REND.olefinas * REND.alquilado;
    const glpResto = fcc.glp * (1 - REND.olefinas);
    // reformadora
    const naftaTotal = c('nafta') + coker.nafta;
    const pesada = naftaTotal * REND.naftaPesada;
    const ligera = naftaTotal - pesada;
    const reformado = pesada * rendimientoReformado(ron);
    const productos = {
        glp: c('gas') + coker.gas + glpResto,
        gasolina: ligera + reformado + fcc.gasolina + alquilado,
        diesel: c('keroseno') + c('ligero') + coker.ligero + fcc.lco,
        combustoleo: (pasos.coker ? 0 : resid) + (pasos.fcc ? 0 : c('pesado')) + fcc.lodo + (pasos.coker && !pasos.fcc ? coker.pesado : 0),
    };
    const liquidos = productos.glp + productos.gasolina + productos.diesel + productos.combustoleo;
    const pool = { ligera, reformado, fcc: fcc.gasolina, alquilado };
    return { crudo, nivel, carga, pasos, cortes: { gas: c('gas'), nafta: c('nafta'), keroseno: c('keroseno'), ligero: c('ligero'), pesado: c('pesado'), residuo: resid }, coker, fcc, alquilado, naftaPesada: pesada, naftaTotal, productos, pool, liquidos, coqueT: coker.coqueT, ligeros: (productos.gasolina + productos.diesel + productos.glp) / carga };
}
/** El índice de octano de la mezcla, (RON + MON) / 2, y qué tanto hay de cada corriente. */
export function octano({ crudo = DEF.crudo, plantas = DEF.plantas, carga = DEF.carga, ron = DEF.ron } = {}) {
    const B = balance({ crudo, plantas, carga, ron });
    const P = B.pool;
    const filas = [
        { id: 'ligera', v: P.ligera, ...CORRIENTES_OCTANO.ligera },
        { id: 'reformado', v: P.reformado, nombre: 'Reformado', ron, mon: ron - 10 },
        { id: 'fcc', v: P.fcc, ...CORRIENTES_OCTANO.fcc },
        { id: 'alquilado', v: P.alquilado, ...CORRIENTES_OCTANO.alquilado },
    ];
    const total = filas.reduce((s, f) => s + f.v, 0) || 1;
    const indice = filas.reduce((s, f) => s + f.v * (f.ron + f.mon) / 2, 0) / total;
    const sgN = gravedad(CRUDOS[crudo].apis.nafta);
    const h2 = tDia(B.naftaPesada, sgN) * hidrogenoReformado(ron);
    return { indice, filas, total, gasolina: B.productos.gasolina, h2, ron };
}
export const KSEV = 8; // de ejemplo: al 100 %, el azufre baja cerca de 3,000 veces
const S_LIGEROS = { coker: 1.1, lco: 0.95 }; // de ejemplo: cuánto azufre traen, comparado con el gasóleo de donde salen
/** Qué tanto azufre queda en el diésel con esa severidad: mg/kg. */
export function azufreDiesel({ crudo = DEF.crudo, plantas = DEF.plantas, severidad = DEF.severidad } = {}) {
    const B = balance({ crudo, plantas });
    const C = CRUDOS[crudo];
    const n = [
        [B.cortes.keroseno, C.ss.keroseno],
        [B.cortes.ligero, C.ss.ligero],
        [B.coker.ligero, C.ss.pesado * S_LIGEROS.coker],
        [B.fcc.lco, C.ss.pesado * S_LIGEROS.lco],
    ];
    const total = n.reduce((s, [v]) => s + v, 0) || 1;
    const entra = n.reduce((s, [v, x]) => s + v * x, 0) / total; // % en masa, aproximado
    const sale = entra * 1e4 * Math.exp(-KSEV * clamp01(severidad / 100));
    return { entra, sale, cumple: sale <= CALIDAD.sDiesel };
}
/** Hasta qué severidad hay que llegar para cumplir los 15 mg/kg. */
export function severidadPara({ crudo = DEF.crudo, plantas = DEF.plantas } = {}) {
    const { entra } = azufreDiesel({ crudo, plantas, severidad: 0 });
    return clamp((100 * Math.log((entra * 1e4) / CALIDAD.sDiesel)) / KSEV, 0, 100);
}
/** A dónde va el azufre, en toneladas al día. La suma debe dar lo que entró. */
export function destinoAzufre({ crudo = DEF.crudo, plantas = DEF.plantas, carga = DEF.carga, severidad = DEF.severidad, ron = DEF.ron } = {}) {
    const B = balance({ crudo, plantas, carga, ron });
    const C = CRUDOS[crudo];
    const sCorte = k => tDia(B.cortes[k], gravedad(C.apis[k])) * (C.ss[k] / 100);
    const porCorte = { nafta: sCorte('nafta'), keroseno: sCorte('keroseno'), ligero: sCorte('ligero'), pesado: sCorte('pesado'), residuo: sCorte('residuo') };
    const entra = Object.values(porCorte).reduce((a, b) => a + b, 0);
    const x = clamp01(severidad / 100);
    const quedaDiesel = Math.exp(-KSEV * x);
    // del residuo: con coquizadora, parte se queda en el coque y lo demás viaja con los productos
    const enCoque = B.pasos.coker ? porCorte.residuo * 0.45 : 0;
    const residuoAProductos = B.pasos.coker ? porCorte.residuo - enCoque : 0;
    const enCombustoleoRes = B.pasos.coker ? 0 : porCorte.residuo;
    const pesadoATratar = B.pasos.fcc ? porCorte.pesado : 0;
    const enCombustoleoPes = B.pasos.fcc ? 0 : porCorte.pesado;
    const aTratar = porCorte.nafta + porCorte.keroseno + porCorte.ligero + pesadoATratar + residuoAProductos;
    const enProductos = aTratar * quedaDiesel;
    const comoH2S = aTratar - enProductos;
    const RECUPERA = 0.98; // de ejemplo: lo que atrapa la planta de azufre
    const solido = comoH2S * RECUPERA;
    const chimenea = comoH2S - solido;
    return { entra, porCorte, solido, chimenea, enCoque, combustoleo: enCombustoleoRes + enCombustoleoPes, enProductos, recupera: RECUPERA };
}
/** El hidrógeno del día, en toneladas: lo que da la reformadora y lo que tiene que hacer su planta. */
export function hidrogeno({ crudo = DEF.crudo, plantas = DEF.plantas, carga = DEF.carga, severidad = DEF.severidad, ron = DEF.ron } = {}) {
    const B = balance({ crudo, plantas, carga, ron });
    const C = CRUDOS[crudo];
    const x = clamp01(severidad / 100);
    const O = octano({ crudo, plantas, carga, ron });
    const diesel = tDia(B.productos.diesel, gravedad(C.apis.ligero));
    const pesado = tDia(B.fcc.carga, gravedad(C.apis.pesado));
    // de ejemplo: lo que consume cada tonelada al tratarla, y sube con la severidad
    const usaDiesel = diesel * (0.002 + 0.008 * x);
    const usaPesado = pesado * 0.006;
    const usa = usaDiesel + usaPesado;
    return { da: O.h2, usa, planta: Math.max(0, usa - O.h2) };
}

// ------------------------------------------------------------------ el tiempo: lo que tarda en responder
export const estadoPlanta = ({ plantas = DEF.plantas, horno = DEF.horno, severidad = DEF.severidad, ron = DEF.ron } = {}) => ({ plantas, horno, severidad, ron, vacio: plantas >= 1 ? 1 : 0, fcc: plantas >= 2 ? 1 : 0, coker: plantas >= 3 ? 1 : 0, ciclo: 0 });
const RAPIDEZ = { horno: 40, severidad: 40, ron: 8, unidad: 1 / 3, ciclo: 1 / 26 };
/** Un paso del tiempo. m: { plantas, horno, severidad, ron }. Función pura, independiente de la velocidad de los cuadros. */
export function pasoPlanta(s, m, dt) {
    const pasos = Math.max(1, Math.ceil(dt / 0.05));
    const h = dt / pasos;
    const n = { ...s };
    for (let i = 0; i < pasos; i++) {
        n.horno += clamp(m.horno - n.horno, -RAPIDEZ.horno * h, RAPIDEZ.horno * h);
        n.severidad += clamp(m.severidad - n.severidad, -RAPIDEZ.severidad * h, RAPIDEZ.severidad * h);
        n.ron += clamp(m.ron - n.ron, -RAPIDEZ.ron * h, RAPIDEZ.ron * h);
        n.vacio += clamp((m.plantas >= 1 ? 1 : 0) - n.vacio, -RAPIDEZ.unidad * h, RAPIDEZ.unidad * h);
        n.fcc += clamp((m.plantas >= 2 ? 1 : 0) - n.fcc, -RAPIDEZ.unidad * h, RAPIDEZ.unidad * h);
        n.coker += clamp((m.plantas >= 3 ? 1 : 0) - n.coker, -RAPIDEZ.unidad * h, RAPIDEZ.unidad * h);
        n.ciclo = (n.ciclo + RAPIDEZ.ciclo * h * n.coker) % 1;
        n.plantas = m.plantas;
    }
    return n;
}

// ------------------------------------------------------------------ las lecturas
/** Lo que mide la refinería. modo: 'torre' | 'conversion' | 'azufre' | 'octano'. */
export function calcular({ modo = 'torre', planta = null, crudo = DEF.crudo, horno = DEF.horno, plantas = DEF.plantas, severidad = DEF.severidad, ron = DEF.ron, carga = DEF.carga } = {}) {
    const nivel = clamp(Math.round(plantas), 0, 3);
    const T = planta ? planta.horno : horno;
    const sev = planta ? planta.severidad : severidad;
    const r = planta ? planta.ron : ron;
    const B = balance({ crudo, plantas: nivel, carga, ron: r });
    const To = torre(crudo, modo === 'torre' ? T : DEF.horno);
    const S = destinoAzufre({ crudo, plantas: nivel, carga, severidad: sev, ron: r });
    const D = azufreDiesel({ crudo, plantas: nivel, severidad: sev });
    const O = octano({ crudo, plantas: nivel, carga, ron: r });
    const H = hidrogeno({ crudo, plantas: nivel, carga, severidad: sev, ron: r });
    return { modo, crudo, C: CRUDOS[crudo], nivel, T, severidad: sev, ron: r, carga, B, To, S, D, O, H, en: { vacio: planta ? planta.vacio : nivel >= 1 ? 1 : 0, fcc: planta ? planta.fcc : nivel >= 2 ? 1 : 0, coker: planta ? planta.coker : nivel >= 3 ? 1 : 0 }, ciclo: planta ? planta.ciclo : 0 };
}

// ------------------------------------------------------------------ acomodo de la refinería (no está a escala)
export const BLOQUE = { x: [-8.4, 8.4], z: [-4.4, 4.4], y: [-0.7, 0], mar: 6.7, agua: -0.08, lecho: -0.5 };
export const FLUIDOS = {
    crudo: { nombre: 'Crudo', color: '#8a5a33' },
    nafta: { nombre: 'Nafta y gasolina', color: '#e2b23a' },
    medio: { nombre: 'Queroseno y diésel', color: '#d9792c' },
    gasoleo: { nombre: 'Gasóleo', color: '#a0522d' },
    residuo: { nombre: 'Residuo', color: '#6e5848' },
    h2: { nombre: 'Hidrógeno', color: '#5fb6e6' },
    azufre: { nombre: 'Gas con azufre', color: '#cfc22e' },
    gas: { nombre: 'Gas', color: '#9aa3ab' },
};
export const TANQUES_CRUDO = [[-7.5, -2.75], [-7.5, -1], [-7.5, 0.75], [-7.5, 2.5]];
export const TANQUES_PROD = [{ x: 4.95, z: -2.6, f: 'nafta', n: 'Gasolina' }, { x: 4.95, z: -1.05, f: 'nafta', n: 'Gasolina' }, { x: 4.95, z: 1.35, f: 'medio', n: 'Diésel' }, { x: 4.95, z: 2.85, f: 'medio', n: 'Diésel' }];
export const ESFERA = { x: 6.05, z: -3.05, r: 0.42 };
export const TORRE_A = { x: -3.1, z: 2.4, r: 0.34, y0: 0.12, y1: 4.7 };
export const TORRE_V = { x: -1.35, z: 2.4, r: 0.54, y0: 0.12, y1: 3.1 };
export const DESALADORA = { x: -5.55, z: 2.5, y: 0.42, r: 0.2, l: 1.05 };
export const HORNO_A = { x: -4.45, z: 2.55, ancho: 0.8, largo: 1.1, alto: 1.15, chimenea: 3.1 };
export const HORNO_V = { x: -2.2, z: 3.75, ancho: 0.5, largo: 0.5, alto: 0.8, chimenea: 2.3 };
export const FCC = { riser: [0.62, 2.45], reactor: [0.62, 2.45, 2.75, 0.34], regen: [1.5, 2.45, 1.05, 0.56], columna: [-0.25, 3.5, 0.24, 2.9] };
export const COKER = { tambores: [[3, 2.15], [3.72, 2.15]], y0: 1.02, alto: 1.75, r: 0.3, columna: [2.35, 3.05, 0.2, 2.6], horno: [3.35, 3.35], pozo: [3.35, 2.15] };
export const REFORMA = { reactores: [[-3.75, -2.2], [-3.15, -2.2], [-2.55, -2.2]], y0: 0.3, alto: 0.95, r: 0.2 };
export const HDS = { x: -0.95, z: -2.3, r: 0.25, alto: 1.9 };
export const H2P = { x: 1.15, z: -2.55 };
export const AZUF = { x: 2.95, z: -2.75 };
export const FLARE = { x: -6.05, z: -3.8, alto: 4.3 };
const puntaTanque = i => [TANQUES_CRUDO[i][0] + 0.62, 0.22, TANQUES_CRUDO[i][1]];
const R1 = 0.78;
const R2 = 0.98;
// Cada caja: x0, x1, y0, y1, z0, z1. Las pinta planta.js y con ellas se revisa que cada tubo llegue a un equipo.
export const EQUIPOS = {
    ...Object.fromEntries(TANQUES_CRUDO.map(([x, z], i) => [`crudo${i}`, [x - 0.64, x + 0.64, 0, 0.72, z - 0.64, z + 0.64]])),
    desaladora: [DESALADORA.x - DESALADORA.l / 2, DESALADORA.x + DESALADORA.l / 2, DESALADORA.y - DESALADORA.r, DESALADORA.y + DESALADORA.r, DESALADORA.z - DESALADORA.r, DESALADORA.z + DESALADORA.r],
    hornoA: [HORNO_A.x - HORNO_A.ancho / 2, HORNO_A.x + HORNO_A.ancho / 2, 0, HORNO_A.alto, HORNO_A.z - HORNO_A.largo / 2, HORNO_A.z + HORNO_A.largo / 2],
    torreA: [TORRE_A.x - TORRE_A.r, TORRE_A.x + TORRE_A.r, TORRE_A.y0, TORRE_A.y1 + 0.2, TORRE_A.z - TORRE_A.r, TORRE_A.z + TORRE_A.r],
    hornoV: [HORNO_V.x - HORNO_V.ancho / 2, HORNO_V.x + HORNO_V.ancho / 2, 0, HORNO_V.alto, HORNO_V.z - HORNO_V.largo / 2, HORNO_V.z + HORNO_V.largo / 2],
    torreV: [TORRE_V.x - TORRE_V.r, TORRE_V.x + TORRE_V.r, TORRE_V.y0, TORRE_V.y1 + 0.1, TORRE_V.z - TORRE_V.r, TORRE_V.z + TORRE_V.r],
    tamborReflujo: [-2.55, -1.95, 1.5, 1.86, 3.2, 3.5],
    columnaF: [FCC.columna[0] - FCC.columna[2], FCC.columna[0] + FCC.columna[2], 0.1, FCC.columna[3], FCC.columna[1] - FCC.columna[2], FCC.columna[1] + FCC.columna[2]],
    riser: [FCC.riser[0] - 0.08, FCC.riser[0] + 0.08, 0.2, 3, FCC.riser[1] - 0.08, FCC.riser[1] + 0.08],
    reactor: [FCC.reactor[0] - 0.36, FCC.reactor[0] + 0.36, 2.4, 3.3, FCC.reactor[1] - 0.36, FCC.reactor[1] + 0.36],
    regen: [FCC.regen[0] - FCC.regen[3], FCC.regen[0] + FCC.regen[3], 0.3, FCC.regen[2] + 0.8, FCC.regen[1] - FCC.regen[3], FCC.regen[1] + FCC.regen[3]],
    tambor0: [2.7, 3.3, 0.9, 2.8, 1.85, 2.45],
    tambor1: [3.42, 4.02, 0.9, 2.8, 1.85, 2.45],
    hornoC: [COKER.horno[0] - 0.31, COKER.horno[0] + 0.31, 0, 0.72, COKER.horno[1] - 0.25, COKER.horno[1] + 0.25],
    columnaC: [COKER.columna[0] - 0.2, COKER.columna[0] + 0.2, 0.1, COKER.columna[3], COKER.columna[1] - 0.2, COKER.columna[1] + 0.2],
    reforma: [-4, -2.3, 0.2, 1.3, -2.45, -1.95],
    hds: [HDS.x - HDS.r, HDS.x + HDS.r, 0.15, HDS.alto + 0.2, HDS.z - HDS.r, HDS.z + HDS.r],
    hidrogeno: [H2P.x - 0.7, H2P.x + 0.7, 0, 1, H2P.z - 0.45, H2P.z + 0.45],
    azufre: [AZUF.x - 0.7, AZUF.x + 1.3, 0, 0.8, AZUF.z - 0.5, AZUF.z + 0.5],
    gasolina0: [TANQUES_PROD[0].x - 0.55, TANQUES_PROD[0].x + 0.55, 0, 0.8, TANQUES_PROD[0].z - 0.55, TANQUES_PROD[0].z + 0.55],
    gasolina1: [TANQUES_PROD[1].x - 0.55, TANQUES_PROD[1].x + 0.55, 0, 0.8, TANQUES_PROD[1].z - 0.55, TANQUES_PROD[1].z + 0.55],
    diesel0: [TANQUES_PROD[2].x - 0.55, TANQUES_PROD[2].x + 0.55, 0, 0.8, TANQUES_PROD[2].z - 0.55, TANQUES_PROD[2].z + 0.55],
    diesel1: [TANQUES_PROD[3].x - 0.55, TANQUES_PROD[3].x + 0.55, 0, 0.8, TANQUES_PROD[3].z - 0.55, TANQUES_PROD[3].z + 0.55],
    esfera: [ESFERA.x - 0.45, ESFERA.x + 0.45, 0, 1.1, ESFERA.z - 0.45, ESFERA.z + 0.45],
    buque: [6.95, 8.2, -0.1, 0.8, -2.1, 2.1],
    ducto: [-8.4, -8.2, 0, 0.4, 3.45, 3.75],
    autotanque: [5.7, 6.5, 0, 0.6, 2.75, 3.75],
    ductoSale: [4.86, 5.04, 0, 0.4, 4.2, 4.4],
    flare: [FLARE.x - 0.08, FLARE.x + 0.08, 0, FLARE.alto + 0.1, FLARE.z - 0.08, FLARE.z + 0.08],
};
const rack = (x, k = 0, alto = false) => [x, alto ? R2 : R1, 0.1 + k * 0.1];
const YT = 0.9;
export const LINEAS = [
    { id: 'llega', grupo: 'crudo', parte: 'crudo', fluido: 'crudo', r: 0.03, puntos: [[-8.32, 0.2, 3.6], [-7.1, 0.12, 3.6], [-6.95, 0.12, 3.25], [-6.88, 0.18, 2.5]] },
    ...TANQUES_CRUDO.map((_, i) => ({ id: `t${i}`, grupo: 'crudo', parte: 'crudo', fluido: 'crudo', r: 0.02, oculto: i === 3, puntos: [puntaTanque(i), [-6.6, 0.22, TANQUES_CRUDO[i][1]], [-6.6, 0.22, 2.5]] })),
    { id: 'aDesalar', grupo: 'crudo', parte: 'desaladora', fluido: 'crudo', r: 0.03, puntos: [[-6.6, 0.22, 2.5], [-6.3, 0.3, 2.5], [DESALADORA.x - DESALADORA.l / 2, DESALADORA.y, DESALADORA.z]] },
    { id: 'aHorno', grupo: 'crudo', parte: 'horno', fluido: 'crudo', r: 0.03, puntos: [[DESALADORA.x + DESALADORA.l / 2, DESALADORA.y, DESALADORA.z], [HORNO_A.x - HORNO_A.ancho / 2, 0.5, HORNO_A.z]] },
    { id: 'aTorre', grupo: 'crudo', parte: 'horno', fluido: 'crudo', r: 0.03, puntos: [[HORNO_A.x + HORNO_A.ancho / 2, 0.7, HORNO_A.z], [-3.75, 0.72, 2.5], [TORRE_A.x - TORRE_A.r, 0.95, TORRE_A.z]] },
    // lo que sale de la torre atmosférica
    { id: 'domo', grupo: 'nafta', parte: 'torre', fluido: 'nafta', r: 0.022, puntos: [[TORRE_A.x, TORRE_A.y1 + 0.18, TORRE_A.z], [TORRE_A.x, 4.98, TORRE_A.z + 0.1], [-2.45, 4.98, 2.7], [-2.25, 3, 3.3], [-2.25, 1.8, 3.34]] },
    { id: 'nafta', grupo: 'nafta', parte: 'torre', fluido: 'nafta', r: 0.024, puntos: [[-2.25, 1.55, 3.34], [-2.6, 0.95, 3.05], [-2.6, R2, 0.5], rack(-2.6, 1, true), rack(-3.2, 1, true), [-3.2, R2, -1], [-3.2, 0.9, -1.9], [-3.2, 0.8, -2]] },
    { id: 'keroseno', grupo: 'keroseno', parte: 'torre', fluido: 'medio', r: 0.022, puntos: [[TORRE_A.x + TORRE_A.r, 3.3, TORRE_A.z], [-2.62, 3.3, 2.4], [-2.68, 1.1, 1.7], rack(-2.68, 2, true), rack(-0.95, 2, true), [-0.95, R2, -1.4], [-0.95, 0.9, -2.05]] },
    { id: 'ligero', grupo: 'ligero', parte: 'torre', fluido: 'medio', r: 0.022, puntos: [[TORRE_A.x + TORRE_A.r, 2.35, TORRE_A.z], [-2.5, 2.35, 2.2], [-2.5, 1.1, 1.5], rack(-2.5, 3), rack(-0.85, 3), [-0.85, R1, -1.4], [-0.85, 0.7, -2.06]] },
    { id: 'fondoA', grupo: 'fondo', parte: 'vacio', fluido: 'residuo', r: 0.03, puntos: [[TORRE_A.x + 0.1, 0.25, TORRE_A.z + TORRE_A.r - 0.02], [-2.75, 0.2, 3.2], [HORNO_V.x - HORNO_V.ancho / 2, 0.42, HORNO_V.z]] },
    { id: 'aVacio', grupo: 'fondo', parte: 'vacio', fluido: 'residuo', r: 0.03, puntos: [[HORNO_V.x + HORNO_V.ancho / 2, 0.55, HORNO_V.z], [-1.65, 0.65, 3.3], [-1.45, 0.75, TORRE_V.z + TORRE_V.r - 0.02]] },
    { id: 'gasoleo', grupo: 'gasoleo', parte: 'vacio', fluido: 'gasoleo', r: 0.028, puntos: [[TORRE_V.x + TORRE_V.r, 2.2, TORRE_V.z], [-0.65, 2.2, 2.3], [-0.65, 0.5, 2.1], [FCC.riser[0] - 0.08, 0.32, FCC.riser[1]]] },
    { id: 'fondoV', grupo: 'residuoV', parte: 'coquizadora', fluido: 'residuo', r: 0.03, puntos: [[TORRE_V.x + 0.2, 0.2, TORRE_V.z + TORRE_V.r - 0.05], [-0.7, 0.14, 3.95], [2.3, 0.14, 3.95], [COKER.columna[0], 0.2, COKER.columna[1] + 0.2]] },
    // FCC
    { id: 'fccSale', grupo: 'fcc', parte: 'fcc', fluido: 'gasoleo', r: 0.03, puntos: [[FCC.riser[0], 3.08, FCC.riser[1]], [0.62, 3.25, 2.9], [0.1, 3.25, 3.4], [FCC.columna[0] + 0.1, 2.2, FCC.columna[1]]] },
    { id: 'fccGasolina', grupo: 'fccGas', parte: 'fcc', fluido: 'nafta', r: 0.024, puntos: [[FCC.columna[0], 2.72, FCC.columna[1] - FCC.columna[2] + 0.04], [-0.25, 1.5, 2.2], rack(-0.25, 0, true), rack(4.4, 0, true), [4.4, 0.5, -0.6], [4.55, 0.4, -1.05]] },
    { id: 'lco', grupo: 'fccLco', parte: 'fcc', fluido: 'medio', r: 0.02, puntos: [[FCC.columna[0] - FCC.columna[2], 1.5, FCC.columna[1]], [-0.55, 1.2, 2.7], [-0.55, R1, 0.6], [-0.75, R1, 0.5], [-0.75, R1, -1.4], [-0.75, 0.5, -2.1]] },
    // coquizadora
    { id: 'aCoqHorno', grupo: 'coker', parte: 'coquizadora', fluido: 'residuo', r: 0.024, puntos: [[COKER.columna[0] + 0.16, 0.25, COKER.columna[1] + 0.1], [2.8, 0.3, 3.3], [COKER.horno[0] - 0.31, 0.32, 3.32]] },
    { id: 'aTambor0', grupo: 'tambor0', parte: 'coquizadora', fluido: 'residuo', r: 0.024, puntos: [[3.2, 0.5, COKER.horno[1] - 0.25], [3.2, 0.72, 2.72], [3, 1.02, COKER.tambores[0][1]]] },
    { id: 'aTambor1', grupo: 'tambor1', parte: 'coquizadora', fluido: 'residuo', r: 0.024, puntos: [[3.5, 0.5, COKER.horno[1] - 0.25], [3.52, 0.72, 2.72], [3.72, 1.02, COKER.tambores[1][1]]] },
    { id: 'coqGas', grupo: 'coker', parte: 'coquizadora', fluido: 'gasoleo', r: 0.024, puntos: [[3, 2.8, 2.15], [3, 3.02, 2.55], [COKER.columna[0] + 0.1, 2.2, COKER.columna[1] - 0.1]] },
    { id: 'coqPesado', grupo: 'coker', parte: 'coquizadora', fluido: 'gasoleo', r: 0.022, puntos: [[COKER.columna[0] - 0.1, 0.5, COKER.columna[1] - 0.17], [2.1, 0.32, 2.3], [FCC.regen[0] + 0.3, 0.22, 3.05], [FCC.riser[0] + 0.05, 0.22, 2.9], [FCC.riser[0], 0.3, FCC.riser[1] + 0.05]] },
    { id: 'coqNafta', grupo: 'coker', parte: 'coquizadora', fluido: 'nafta', r: 0.02, puntos: [[COKER.columna[0] - 0.15, 2.05, COKER.columna[1] - 0.14], [2.2, 1.2, 2.5], [2.2, R1, 0.55], rack(2.2, 1), rack(-3.1, 1), [-3.1, 0.7, -1.2], [-3.1, 0.7, -1.98]] },
    // reformadora a tanques
    { id: 'reformado', grupo: 'nafta', parte: 'reforma', fluido: 'nafta', r: 0.024, puntos: [[-2.3, 0.6, -2.2], [-1.85, 0.5, -1.55], [-1.85, 0.4, -1.45], [-1.85, 0.32, -1.3], [4.35, 0.32, -1.3], [4.5, 0.36, -1.15]] },
    // HDS a tanques
    { id: 'dieselOut', grupo: 'diesel', parte: 'hds', fluido: 'medio', r: 0.024, puntos: [[HDS.x + HDS.r, 0.45, HDS.z], [-0.3, 0.2, -1.65], [0, 0.2, -0.6], [3.9, 0.2, -0.6], [4.15, 0.2, 1.35], [4.42, 0.32, 1.35]] },
    // hidrógeno
    { id: 'h2Reforma', grupo: 'h2r', parte: 'reforma', fluido: 'h2', r: 0.016, puntos: [[-2.55, 1.2, -2.2], [-2.1, 1.28, -2.5], [-1.5, 1.28, -2.55], [HDS.x - HDS.r, 1.3, HDS.z]] },
    { id: 'h2Planta', grupo: 'h2p', parte: 'hidrogeno', fluido: 'h2', r: 0.016, puntos: [[H2P.x - 0.65, 0.6, H2P.z], [0.1, 0.9, H2P.z], [HDS.x + HDS.r, 1.45, HDS.z]] },
    // azufre
    { id: 'h2s', grupo: 'h2s', parte: 'azufre', fluido: 'azufre', r: 0.016, puntos: [[HDS.x + 0.1, HDS.alto + 0.12, HDS.z], [HDS.x + 0.1, 2.25, HDS.z - 0.4], [0.6, 1.5, -3.5], [2.05, 0.68, -3.55], [AZUF.x - 0.62, 0.55, AZUF.z - 0.25]] },
    // salidas
    { id: 'glp', grupo: 'glp', parte: 'mezclado', fluido: 'gas', r: 0.018, puntos: [[FCC.columna[0], FCC.columna[3], FCC.columna[1]], [-0.25, 3.02, 3.2], [-0.05, 1.35, 1.1], [-0.05, 1.18, 0.5], [3.9, 1.18, 0.5], [5.4, 1.1, -2], [ESFERA.x - 0.42, 0.65, ESFERA.z]] },
    { id: 'aBuque', grupo: 'salida', parte: 'salida', fluido: 'nafta', r: 0.022, puntos: [[TANQUES_PROD[1].x + 0.55, 0.3, TANQUES_PROD[1].z], [6.2, 0.2, -0.6], [6.75, 0.25, -0.6], [7.3, 0.62, -0.6]] },
    { id: 'aBuque2', grupo: 'salida', parte: 'salida', fluido: 'medio', r: 0.022, puntos: [[TANQUES_PROD[2].x + 0.55, 0.3, TANQUES_PROD[2].z], [6.2, 0.2, 0.8], [6.75, 0.25, 0.8], [7.3, 0.62, 0.8]] },
    { id: 'aPipa', grupo: 'salida', parte: 'salida', fluido: 'medio', r: 0.018, puntos: [[TANQUES_PROD[3].x + 0.55, 0.3, TANQUES_PROD[3].z], [5.75, 0.3, 3.1]] },
    { id: 'aDucto', grupo: 'salida', parte: 'salida', fluido: 'nafta', r: 0.018, puntos: [[TANQUES_PROD[3].x, 0.3, TANQUES_PROD[3].z + 0.55], [TANQUES_PROD[3].x, 0.14, 3.75], [TANQUES_PROD[3].x, 0.14, 4.3]] },
    { id: 'aFlare', grupo: 'flare', parte: 'servicios', fluido: 'gas', r: 0.016, oculto: false, puntos: [[TORRE_A.x - 0.1, 0.16, TORRE_A.z - TORRE_A.r + 0.02], [-3.9, 0.16, 0.9], [-5.6, 0.16, -2.2], [FLARE.x, 0.2, FLARE.z + 0.06]] },
    // por dentro
    { id: 'subeVapor', grupo: 'crudo', fluido: 'nafta', r: 0.03, oculto: true, puntos: [[TORRE_A.x, 1, TORRE_A.z], [TORRE_A.x, YT + 3.7, TORRE_A.z]] },
    { id: 'subeFCC', grupo: 'fcc', fluido: 'gasoleo', r: 0.03, oculto: true, puntos: [[FCC.riser[0], 0.34, FCC.riser[1]], [FCC.riser[0], 3.05, FCC.riser[1]]] },
    { id: 'catalizador', grupo: 'fcc', parte: 'fcc', fluido: 'gas', r: 0.022, puntos: [[FCC.riser[0] + 0.2, 2.5, FCC.riser[1]], [1.05, 1.95, 2.45], [FCC.regen[0] - 0.05, FCC.regen[2] + 0.72, FCC.regen[1]]] },
    { id: 'catRegresa', grupo: 'fcc', parte: 'fcc', fluido: 'gas', r: 0.022, puntos: [[FCC.regen[0] - FCC.regen[3] + 0.02, 0.62, FCC.regen[1]], [0.85, 0.34, FCC.riser[1]], [FCC.riser[0] + 0.08, 0.28, FCC.riser[1]]] },
];
const REMATE = new Set(['llega (inicio)', 'aDucto (fin)']);

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
export const PARTES = [
    { id: 'crudo', ancla: [-7.5, 1.1, 2.5], vista: { az: -30, el: 24, tam: 6.2, mira: [-6.9, 0.5, 0.6] } },
    { id: 'desaladora', ancla: [DESALADORA.x, 0.95, DESALADORA.z], vista: { az: -18, el: 20, tam: 2.8, mira: [DESALADORA.x, 0.42, DESALADORA.z] } },
    { id: 'horno', ancla: [HORNO_A.x, 1.5, HORNO_A.z + 0.2], vista: { az: -12, el: 18, tam: 3.1, mira: [HORNO_A.x, 0.75, HORNO_A.z] } },
    { id: 'torre', ancla: [TORRE_A.x - 0.1, TORRE_A.y1 + 0.45, TORRE_A.z], vista: { az: 18, el: 8, tam: 6.2, mira: [TORRE_A.x + 0.1, 2.55, TORRE_A.z] } },
    { id: 'vacio', ancla: [TORRE_V.x, TORRE_V.y1 + 0.42, TORRE_V.z], vista: { az: 14, el: 10, tam: 4.6, mira: [TORRE_V.x, 1.6, TORRE_V.z] } },
    { id: 'reforma', ancla: [-3.15, 1.65, -2.2], vista: { az: 158, el: 16, tam: 3, mira: [-3.15, 0.72, -2] } },
    { id: 'hds', ancla: [HDS.x, HDS.alto + 0.62, HDS.z], vista: { az: 195, el: 14, tam: 3.5, mira: [HDS.x + 0.15, 1.05, HDS.z - 0.25] } },
    { id: 'fcc', ancla: [FCC.regen[0] + 0.2, 3.6, FCC.regen[1]], vista: { az: -12, el: 12, tam: 4.7, mira: [0.65, 1.75, 2.75] } },
    { id: 'coquizadora', ancla: [3.35, 3.72, COKER.pozo[1]], vista: { az: 22, el: 14, tam: 4.9, mira: [3.15, 1.85, 2.5] } },
    { id: 'hidrogeno', ancla: [H2P.x, 1.65, H2P.z], vista: { az: -25, el: 34, tam: 2.9, mira: [H2P.x, 0.5, H2P.z] } },
    { id: 'azufre', ancla: [AZUF.x + 0.3, 1.25, AZUF.z], vista: { az: -20, el: 38, tam: 3.3, mira: [AZUF.x + 0.25, 0.4, AZUF.z] } },
    { id: 'mezclado', ancla: [5.3, 1.35, 0.2], vista: { az: 26, el: 28, tam: 7.2, mira: [5.2, 0.5, -0.1] } },
    { id: 'servicios', ancla: [FLARE.x, FLARE.alto + 0.5, FLARE.z], vista: { az: -30, el: 12, tam: 6.2, mira: [-5.4, 2.1, -3] } },
    { id: 'salida', ancla: [7.5, 1.55, 0], vista: { az: 44, el: 20, tam: 7.2, mira: [6.45, 0.45, 1.05] } },
];

// ------------------------------------------------------------------ la pose
/** Todo lo que necesita posar(): lecturas, cuánto corre por cada tubo (0–1), cómo van las plantas, y la cámara. */
export function pose({ modo = 'torre', planta = null, crudo = DEF.crudo, horno = DEF.horno, plantas = DEF.plantas, severidad = DEF.severidad, ron = DEF.ron, carga = DEF.carga, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null } = {}) {
    const L = calcular({ modo, planta, crudo, horno, plantas, severidad, ron, carga });
    const f = clamp01(carga / REFINERIA.carga);
    const B = L.B;
    const cu = L.To.cortes;
    const k = x => clamp01(x);
    const en = L.en;
    const grupos = {
        crudo: f,
        nafta: k((cu.nafta + cu.gas) / 28) * f,
        keroseno: k(cu.keroseno / 18) * f,
        ligero: k(cu.ligero / 14) * f,
        fondo: k(L.To.fondo / 60) * f * en.vacio,
        gasoleo: k(B.cortes.pesado / 90) * en.vacio * en.fcc,
        residuoV: k(B.cortes.residuo / 125) * en.vacio * en.coker,
        fcc: en.fcc * k(B.fcc.carga / 120),
        fccGas: en.fcc * k(B.fcc.gasolina / 60),
        fccLco: en.fcc * k(B.fcc.lco / 25),
        coker: en.coker * k(B.cortes.residuo / 125),
        // el horno le manda el residuo al tambor que se está llenando
        tambor0: en.coker * (L.ciclo % 1 < 0.5 ? k(B.cortes.residuo / 125) : 0),
        tambor1: en.coker * ((L.ciclo + 0.5) % 1 < 0.5 ? k(B.cortes.residuo / 125) : 0),
        diesel: k(B.productos.diesel / 130),
        h2r: k(L.H.da / 90),
        h2p: k(L.H.planta / 60),
        h2s: k((L.S.solido + L.S.chimenea) / 1200),
        glp: en.fcc * k(B.productos.glp / 45),
        salida: f,
        flare: 0.08,
    };
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = grupos[l.grupo] ?? 0;
    const activo = { horno: clamp01((L.T - 250) / 150) * f, vacio: en.vacio, fcc: en.fcc, coker: en.coker, reforma: clamp01((L.ron - 80) / 24), hds: clamp01(L.severidad / 100), h2: grupos.h2p, azufre: grupos.h2s, crudo: f };
    const cam = camara || { mira: [0, 1.6, 0], az: 24, el: 24, d: 40 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, activo, en, ciclo: L.ciclo, T: L.T, crudo,
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'torre', horno: lerp(300, 380, clamp01(t / 12)), camara: { mira: [0, 1.6, 0], az: lerp(14, 30, t / 12), el: 24, d: 40 } });
}
export function posicionCamara({ mira, az, el, d }) {
    return [mira[0] + d * Math.cos(el) * Math.sin(az), mira[1] + d * Math.sin(el), mira[2] + d * Math.cos(el) * Math.cos(az)];
}

// ------------------------------------------------------------------ revisiones
const dentro = (p, c, h = 0.06) => p[0] >= c[0] - h && p[0] <= c[1] + h && p[1] >= c[2] - h && p[1] <= c[3] + h && p[2] >= c[4] - h && p[2] <= c[5] + h;
const distSeg = (p, a, b) => {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
    const q = clamp01((ab[0] * ap[0] + ab[1] * ap[1] + ab[2] * ap[2]) / Math.max(1e-9, ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2));
    return Math.hypot(ap[0] - ab[0] * q, ap[1] - ab[1] * q, ap[2] - ab[2] * q);
};
/** Cada punta de cada tubo debe tocar un equipo u otro tubo. Devuelve las que quedan al aire. El ducto de llegada va marcado: sale del bloque. */
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) {
        for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
            if (REMATE.has(`${L.id} (${nombre})`)) continue;
            const enEquipo = Object.values(EQUIPOS).some(c => dentro(p, c));
            const enTubo = LINEAS.some(o => o !== L && o.puntos.some((q, i) => i > 0 && distSeg(p, o.puntos[i - 1], q) < 0.07));
            if (!enEquipo && !enTubo) sueltas.push(`${L.id} (${nombre})`);
        }
    }
    return sueltas;
}
/** Revisión de cifras contra lo publicado. */
export function revisar() {
    const p = [];
    const lejos = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // 1. cada crudo: la suma de sus cortes da lo publicado para el crudo entero
    for (const k of ORDEN_CRUDOS) {
        const C = CRUDOS[k];
        lejos(LISTA_CORTES.reduce((s, c) => s + C.v[c], 0), 99.5, 100.2, `los cortes de ${k} suman 100`);
        const A = azufreDeCortes(k);
        lejos(A.azufre, C.s * 0.88, C.s * 1.12, `azufre de ${k} por cortes (${C.s} %)`);
        lejos(A.api, C.api - 3, C.api + 3, `grados API de ${k} por cortes (${C.api})`);
        lejos(destilado(k, 800), 99.9, 100.1, `a 800 °C ya hirvió todo ${k}`);
    }
    lejos(gravedad(10), 0.999, 1.001, '10 °API pesa como el agua');
    lejos(destilado('maya', 344), 38, 39.2, 'lo que hierve del Maya hasta 344 °C (38.8)');
    lejos(destilado('olmeca', 344), 64, 66, 'lo que hierve del Olmeca hasta 344 °C (64.8)');
    lejos(torre('maya', 370).fondo, 60, 64, 'lo que se queda abajo de la torre con Maya (61.2)');
    lejos(torre('maya', 280).fondo, torre('maya', 370).fondo, 90, 'con el horno más frío queda más abajo');
    // 2. el diseño de Olmeca
    const B = balance();
    lejos(B.productos.gasolina, 140, 185, 'gasolina al día (diseño de Olmeca: 173 mil)');
    lejos(B.productos.diesel, 110, 140, 'diésel al día (diseño de Olmeca: 125 mil)');
    lejos(B.productos.combustoleo, 0, 20, 'con coquizadora casi no queda combustóleo');
    lejos(B.liquidos / B.carga, 0.85, 1.05, 'los líquidos, contra el crudo');
    lejos(B.coqueT / (tDia(B.cortes.residuo, gravedad(CRUDOS.maya.apis.residuo))), 0.18, 0.3, 'coque del residuo (18 a 30 %)');
    lejos((REFINERIA.petroliferos2025 / REFINERIA.procesado2025), 0.75, 0.85, 'petrolíferos contra crudo en Olmeca, 2025 y diciembre (cerca de 80 %)');
    const solo = balance({ plantas: 0 });
    lejos(solo.productos.combustoleo / solo.carga, 0.6, 0.63, 'solo destilando, el Maya deja 61 de cada 100 de fondo');
    lejos(balance({ plantas: 2 }).productos.gasolina, solo.productos.gasolina, B.productos.gasolina, 'la FCC da más gasolina, y la coquizadora más todavía');
    lejos(balance({ crudo: 'olmeca', plantas: 0 }).ligeros, solo.ligeros, 1, 'un crudo ligero da más aun sin conversión');
    // 3. el azufre
    const S = destinoAzufre();
    lejos(S.entra, 1500, 1900, 'azufre que entra con 340 mil barriles de Maya, t/d (3.4 % de unas 50,000 t)');
    lejos(S.solido + S.chimenea + S.enCoque + S.combustoleo + S.enProductos, S.entra - 0.5, S.entra + 0.5, 'el azufre se conserva');
    lejos(azufreDiesel().sale, 0, CALIDAD.sDiesel, 'a su severidad normal cumple los 15 mg/kg');
    lejos(azufreDiesel({ severidad: 50 }).sale, CALIDAD.sDiesel, 1e5, 'a media severidad no cumple');
    lejos(severidadPara({ crudo: 'olmeca' }), 0, severidadPara({ crudo: 'maya' }), 'un crudo dulce pide menos severidad');
    // 4. el octano
    const O = octano();
    lejos(O.indice, CALIDAD.regular, CALIDAD.premium + 2, 'la mezcla alcanza la Regular');
    lejos(octano({ ron: 85 }).indice, 70, CALIDAD.regular, 'con poca severidad no alcanza');
    lejos(octano({ ron: 85 }).gasolina, O.gasolina, 400, 'más octano, menos volumen');
    lejos(octano({ ron: 104 }).h2, O.h2, 300, 'más octano, más hidrógeno');
    lejos(rendimientoReformado(100), 0.65, 0.8, 'lo que sale de la reformadora');
    const H = hidrogeno();
    lejos(H.usa, H.da, 400, 'la reformadora no alcanza: hace falta la planta de hidrógeno');
    // 5. el acomodo
    const ss = puntasSueltas();
    if (ss.length) p.push(`Puntas sueltas: ${ss.join(', ')}`);
    return p;
}
