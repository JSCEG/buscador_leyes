// El modelo de «Cómo se equilibra la red»: puro, sin three.js ni DOM. Lo leen la escena, el tablero, las gráficas y las pruebas, así que
// una cifra sale de un solo lugar. Es un sistema de ejemplo del tamaño del Sistema Interconectado Nacional en una tarde, con las reglas del
// Código de Red: la frecuencia normal (59.8 a 60.2 Hz), la reserva de cada estado operativo y cómo deben responder los gobernadores. La
// física de los primeros segundos (inercia, gobernadores, la carga que baja con la frecuencia) sigue la guía del NREL. Lo que no viene en las
// fuentes está marcado como «de ejemplo».
//
// Cuatro formas de verlo: se dispara una central (los primeros segundos y los minutos siguientes), menos máquinas girando (sol, viento y
// baterías), la reserva de un día de calor (hora por hora) y cuando falta mucho (el corte de carga por pasos, como el 28 de diciembre de 2020).
import { D2R, clamp, clamp01, lerp } from '../planta-comun/ayudas.js';
import { apoyo, lineaAerea } from '../planta-comun/lineas.js';

// ------------------------------------------------------------------ lo que pide el Código de Red (CRE, RES/550/2021)
export const F0 = 60;
/** Estado Operativo Normal del SIN: de 59.8 a 60.2 Hz (tabla 1.1.2). */
export const BANDA = { min: 59.8, max: 60.2 };
/** Lo que una central debe aguantar sin desconectarse en el SIN (tabla 2.1), en minutos. */
export const AGUANTE = [{ de: 58.8, a: 61.2, min: Infinity }, { de: 58.2, a: 58.8, min: 30 }, { de: 57.0, a: 58.2, min: 15 }];
/** Y el cambio de frecuencia que debe aguantar: hasta 2.5 Hz por segundo (2.2.1). */
export const ROCOF_MAX = 2.5;
/**
 * Los gobernadores (Control Primario): estatismo de 3 a 8 %; aquí 5 %, de ejemplo. Banda muerta de ±30 mHz. Empiezan en 2 s como máximo
 * y terminan en 30 s (tabla 2.2.2.A). El retraso de 0.5 s y el ritmo de 0.8 % de su capacidad por segundo son del ejemplo del NREL.
 */
export const GOB = { R: 0.05, rango: [0.03, 0.08], banda: 0.03, retraso: 0.5, ritmo: 0.008, completo: 30 };
/** Reserva operativa del SIN: normal con más de 6 % de la demanda, alerta de 3 a 6 %, emergencia con menos de 3 %; la mitad, rodante. */
export const RESERVA = { normal: 0.06, emergencia: 0.03, rodante: 0.5, minutos: 10 };
export const estadoOperativo = ro => (ro >= RESERVA.normal ? 'normal' : ro >= RESERVA.emergencia ? 'alerta' : 'emergencia');

// ------------------------------------------------------------------ la física (NREL, 2020)
/** Constante de inercia promedio de las máquinas que giran: de 2 a 7 s según la central; 4.5 s, de ejemplo. */
export const H = 4.5;
/** La carga baja de 1 a 2 % por cada 1 % que baja la frecuencia; el NREL usa 1.3. */
export const CARGA_D = 1.3;
/** Las baterías llegan a toda su potencia en menos de un segundo; empiezan abajo de 59.85 Hz, de ejemplo. */
export const BATERIA = { empieza: 59.95, toda: 59.85, sube: 0.4 };
/** El control automático de generación del CENACE: de ejemplo, sube la reserva hasta regresar a 60 Hz en unos minutos. */
export const AGC = { empieza: 8, k: 150 };

// ------------------------------------------------------------------ el sistema de ejemplo
/** Una tarde: 40,000 MW de demanda, 15 % con sol y viento; las máquinas que giran van al 80 % de su capacidad. De ejemplo. */
export const SISTEMA = { demanda: 40000, renovable: 0.15, carga: 0.8 };
/** La central que se dispara: 810 MW, como una unidad de Laguna Verde (CFE). */
export const UNIDAD = 810;
/** El corte de carga por baja frecuencia: cuatro pasos, como el del SIN en 2020. Frecuencias y porcentajes de ejemplo; suman 26 %. */
export const PASOS = [{ f: 59.5, pct: 0.065 }, { f: 59.3, pct: 0.065 }, { f: 59.1, pct: 0.065 }, { f: 58.9, pct: 0.065 }];
export const PASO_RETRASO = 0.15;
/** Por debajo de 57 Hz el Código ya no pide que las centrales aguanten: el sistema se cae. */
export const COLAPSO = 57.0;

// ------------------------------------------------------------------ lo que pasó (CENACE, CRE y CNE)
/** 28 de diciembre de 2020: salieron unos 9,262 MW; la frecuencia bajó a 58.9 Hz y los cuatro pasos cortaron 8,696 MW de 31,789. */
export const EVENTO2020 = { perdida: 9262, demanda: 31789, corte: 8696, fMin: 58.9, fMax: 61.82, pasos: 4 };
/** Febrero de 2021, sin gas por la helada en Texas: el corte por baja frecuencia desconectó 2,016.6 MW en el noreste. */
export const FEB2021 = { corte: 2016.6 };
/** El SIN en 2024 (CNE): tiempo en estado normal, alertas, emergencias, el 7 de mayo y la capacidad instalada. */
export const SEN2024 = { normal: 96.81, mayo: 91.95, junio: 93.82, alertas: 285, emergencias: 49, mayo7: { disturbios: 65, MWh: 3339.67 }, capacidad: 90543, pct: { ciclo: 39.39, hidro: 13.93, termica: 12.48, solar: 8.89, eolica: 8.3, carbon: 6.03, turbogas: 4.37, nuclear: 1.78 } };

/** «Un día de mucho calor»: más demanda y más centrales fuera, de ejemplo. */
export const CALOR = { pico: 47500, fuera: 2500, hora: 18.3 };
export const DEF = { perdida: UNIDAD, demanda: SISTEMA.demanda, renovable: SISTEMA.renovable, bateria: 0, pico: 46000, fuera: 2000, perdidaG: EVENTO2020.perdida, demandaG: EVENTO2020.demanda, hora: 17 };
export const LIMITES = { perdida: [100, 2000], demanda: [20000, 50000], renovable: [0, 0.7], bateria: [0, 2000], pico: [40000, 52000], fuera: [0, 8000], perdidaG: [1000, 12000], demandaG: [20000, 50000], hora: [0, 24] };

// ------------------------------------------------------------------ los segundos después de una pérdida
/**
 * Lo que pasa cuando de golpe faltan `perdida` MW. Integra la ecuación de oscilación de todo el sistema:
 *   df/dt = 60 × (lo que se agrega − lo que falta) ÷ (2 × energía de giro)
 * con la carga que baja con la frecuencia, los gobernadores, las baterías, el control del CENACE y los pasos del corte de carga.
 * Devuelve muestras cada 0.05 s en el primer minuto y cada segundo después, el punto más bajo y lo que se cortó.
 */
const cache = new Map();
export function simular({ perdida = DEF.perdida, demanda = DEF.demanda, renovable = DEF.renovable, bateria = DEF.bateria, gobernadores = true, agc = true, pasos = false, tFin = 600 } = {}) {
    const k = [perdida, demanda, renovable, bateria, gobernadores, agc, pasos, tFin].map(x => (typeof x === 'number' ? Math.round(x * 1000) / 1000 : x)).join('|');
    if (cache.has(k)) return cache.get(k);
    if (cache.size > 80) cache.clear();
    const sincronas = (demanda * (1 - renovable)) / SISTEMA.carga; // MW de máquinas que giran
    const Sg = Math.max(500, sincronas - perdida); // las que quedan
    const Ek = H * Sg; // MW·s
    const RR = RESERVA.normal * RESERVA.rodante * demanda; // reserva rodante: 3 % de la demanda
    const RO = RESERVA.normal * demanda;
    let [f, gob, bat, agcP, cortado, t] = [F0, 0, 0, 0, 0, 0];
    const relojes = PASOS.map(() => 0);
    const cortes = [];
    const R = { t: [], f: [], gob: [], bat: [], agc: [], carga: [], corta: [], perdida, demanda, Ek, RR, RO, Sg, sincronas, rocof: (F0 * perdida) / (2 * Ek) };
    let nadir = F0;
    let tNadir = 0;
    let colapso = null;
    let siguiente = 0;
    while (t <= tFin + 1e-9) {
        const df = f - F0;
        const cargaBaja = CARGA_D * (df / F0) * (demanda - cortado); // negativa si la frecuencia baja
        if (t >= siguiente - 1e-9) {
            R.t.push(t); R.f.push(f); R.gob.push(gob); R.bat.push(bat); R.agc.push(agcP); R.carga.push(-cargaBaja); R.corta.push(cortado);
            siguiente += t < 60 ? 0.05 : 1;
        }
        if (colapso !== null) { t += 0.05; f = Math.max(0, f - 3 * 0.05); continue; }
        const dt = t < 60 ? 0.005 : 0.05;
        // gobernadores: fuera de la banda muerta, responden con su estatismo, hasta la reserva rodante y a su ritmo
        if (gobernadores && t >= GOB.retraso) {
            const ef = Math.sign(-df) * Math.max(0, Math.abs(df) - GOB.banda);
            const meta = clamp(((ef / F0) / GOB.R) * Sg, -0.1 * Sg, Math.max(0, RR - Math.max(0, agcP)));
            const paso = GOB.ritmo * Sg * dt;
            gob += clamp(meta - gob, -paso, paso);
        }
        // baterías: abajo de 59.95 empiezan; abajo de 59.85 dan todo, y llegan en 0.4 s
        if (bateria > 0) {
            const meta = bateria * clamp01((BATERIA.empieza - f) / (BATERIA.empieza - BATERIA.toda));
            const paso = (bateria / BATERIA.sube) * dt;
            bat += clamp(meta - bat, -paso, paso);
        }
        // el CENACE: después de unos segundos, sube la reserva poco a poco hasta regresar a 60 Hz
        if (agc && t >= AGC.empieza) agcP = clamp(agcP + AGC.k * -df * dt, -RO, Math.max(0, RO - Math.max(0, gob)));
        // el corte de carga: un paso opera si la frecuencia se queda abajo de su ajuste más de 0.15 s
        if (pasos) PASOS.forEach((p, i) => {
            if (relojes[i] < 0) return;
            relojes[i] = f < p.f ? relojes[i] + dt : 0;
            if (relojes[i] >= PASO_RETRASO) { const mw = p.pct * demanda; cortado += mw; cortes.push({ i, f: p.f, t, mw }); relojes[i] = -1; }
        });
        const balance = -perdida + gob + bat + agcP - cargaBaja + cortado;
        f += ((F0 * balance) / (2 * Ek)) * dt;
        if (f < nadir) { nadir = f; tNadir = t; }
        if (f < COLAPSO) colapso = t;
        t += dt;
    }
    const i30 = R.t.findIndex(x => x >= 30);
    Object.assign(R, { nadir, tNadir, cortes, cortado, colapso, f30: R.f[i30], fFin: R.f.at(-1), sinBanda: nadir < BANDA.min });
    cache.set(k, R);
    return R;
}
/** El valor de una serie en el tiempo t, interpolado. */
export function en(S, serie, t) {
    const T = S.t;
    if (t <= 0) return S[serie][0];
    if (t >= T.at(-1)) return S[serie].at(-1);
    let a = 0;
    let b = T.length - 1;
    while (b - a > 1) { const m = (a + b) >> 1; if (T[m] <= t) a = m; else b = m; }
    return lerp(S[serie][a], S[serie][b], (t - T[a]) / (T[b] - T[a]));
}

// ------------------------------------------------------------------ la reserva de un día de calor
/** Forma de la demanda de un día de calor, hora por hora (de cada 1 de la máxima): de ejemplo, con la punta a media tarde. */
export const FORMA_DIA = [0.75, 0.72, 0.7, 0.69, 0.69, 0.71, 0.75, 0.8, 0.85, 0.89, 0.92, 0.95, 0.97, 0.98, 0.99, 1.0, 1.0, 0.995, 0.985, 0.96, 0.93, 0.9, 0.86, 0.8];
/** Lo que hay: máquinas disponibles sin contar sol ni viento (de ejemplo), y la capacidad solar y eólica del país en 2024 (CNE). */
export const PARQUE = { firme: 47000, solar: Math.round((SEN2024.capacidad * SEN2024.pct.solar) / 100), eolica: Math.round((SEN2024.capacidad * SEN2024.pct.eolica) / 100) };
const formaEn = h => { const x = ((h % 24) + 24) % 24; const i = Math.floor(x); return lerp(FORMA_DIA[i], FORMA_DIA[(i + 1) % 24], x - i); };
/** Fracción de la capacidad solar que produce a la hora h: de 7 a 19:30, de ejemplo. */
export const solarEn = h => { const u = (h - 7) / 12.5; return u > 0 && u < 1 ? 0.78 * Math.sin(Math.PI * u) ** 1.3 : 0; };
/** Fracción de la eólica: un poco más de noche, de ejemplo. */
export const eolicaEn = h => 0.27 + 0.08 * Math.cos(((h - 2) / 24) * 2 * Math.PI);
/** La reserva a la hora h: lo disponible menos la demanda, de cada 1 de la demanda. Y lo que hay que cortar para no bajar de 3 %. */
export function hora({ hora: h = DEF.hora, pico = DEF.pico, fuera = DEF.fuera } = {}) {
    const demanda = pico * formaEn(h);
    const firme = PARQUE.firme - fuera;
    const solar = PARQUE.solar * solarEn(h);
    const eolica = PARQUE.eolica * eolicaEn(h);
    const disponible = firme + solar + eolica;
    const ro = (disponible - demanda) / demanda;
    const corte = Math.max(0, demanda - disponible / (1 + RESERVA.emergencia));
    return { hora: h, demanda, firme, solar, eolica, disponible, ro, estado: estadoOperativo(ro), corte, reserva: disponible - demanda };
}
const cacheDia = new Map();
export function dia({ pico = DEF.pico, fuera = DEF.fuera } = {}) {
    const k = `${Math.round(pico)}|${Math.round(fuera)}`;
    if (cacheDia.has(k)) return cacheDia.get(k);
    if (cacheDia.size > 60) cacheDia.clear();
    const R = { h: [], demanda: [], disponible: [], ro: [] };
    for (let h = 0; h <= 24.001; h += 0.1) { const x = hora({ hora: h, pico, fuera }); R.h.push(h); R.demanda.push(x.demanda); R.disponible.push(x.disponible); R.ro.push(x.ro); }
    R.minRo = Math.min(...R.ro);
    R.horaMin = R.h[R.ro.indexOf(R.minRo)];
    R.horas = { normal: 0, alerta: 0, emergencia: 0 };
    R.ro.slice(0, -1).forEach(r => { R.horas[estadoOperativo(r)] += 0.1; });
    R.en = (serie, h) => { const x = clamp01(h / 24) * (R.h.length - 1); const i = Math.min(R.h.length - 2, Math.floor(x)); return lerp(R[serie][i], R[serie][i + 1], x - i); };
    cacheDia.set(k, R);
    return R;
}

// ------------------------------------------------------------------ el tiempo de la escena
export const estadoPlanta = () => ({ t: 0, ev: null });
/** Un paso del tiempo. m: { evento, tope }. El primer medio minuto va a la velocidad real; luego se acelera para ver los minutos. */
/** En el corte de carga, los primeros 4 s van muy despacio: los pasos operan en décimas de segundo. */
export const prisa = (ev, modo = 'disparo') => (modo === 'corte' ? (ev < 4 ? 0.15 : ev < 20 ? 0.6 : 3) : ev < 12 ? 0.6 : ev < 30 ? 1 : ev < 60 ? 6 : 24);
export function pasoPlanta(s, m, dt) {
    const n = { ...s };
    n.t += dt;
    if (!m.evento) n.ev = null;
    else if (n.ev === null) n.ev = 0;
    else n.ev = Math.min(m.tope ?? 600, n.ev + dt * prisa(n.ev, m.modo));
    return n;
}

// ------------------------------------------------------------------ las lecturas
/** Lo que mide el sistema. modo: 'disparo' | 'inercia' | 'reserva' | 'corte'. */
export function calcular({ modo = 'disparo', planta = null, perdida = DEF.perdida, demanda = DEF.demanda, renovable = DEF.renovable, bateria = DEF.bateria, pico = DEF.pico, fuera = DEF.fuera, perdidaG = DEF.perdidaG, demandaG = DEF.demandaG, hora: h = DEF.hora, gob = true } = {}) {
    const L = { modo };
    const ev = planta && planta.ev !== null ? planta.ev : null;
    if (modo === 'reserva') {
        Object.assign(L, hora({ hora: h, pico, fuera }), { D: dia({ pico, fuera }), pico, fuera, f: F0, ev: null });
        return L;
    }
    const p = modo === 'corte'
        ? { perdida: perdidaG, demanda: demandaG, renovable: SISTEMA.renovable, bateria: 0, pasos: true, tFin: 120 }
        : modo === 'inercia'
            ? { perdida: UNIDAD, demanda: SISTEMA.demanda, renovable, bateria, pasos: false, tFin: 600 }
            : { perdida, demanda, renovable: SISTEMA.renovable, bateria: 0, pasos: false, tFin: 600, gobernadores: gob, agc: gob };
    const S = simular(p);
    const t = ev === null ? null : ev;
    const v = serie => (t === null ? (serie === 'f' ? F0 : 0) : en(S, serie, t));
    const f = v('f');
    Object.assign(L, p, { S, t, f, gob: v('gob'), bat: v('bat'), agc: v('agc'), carga: v('carga'), cortado: t === null ? 0 : v('corta'), disparada: t !== null });
    L.cortes = t === null ? [] : S.cortes.filter(c => c.t <= t);
    L.apagon = S.colapso !== null && t !== null && t >= S.colapso;
    L.inercia = t === null ? 0 : Math.max(0, p.perdida - L.gob - L.bat - L.agc - L.carga - L.cortado); // lo que sale del giro
    return L;
}

// ------------------------------------------------------------------ acomodo (no está a escala)
export const BLOQUE = { x: [-8.4, 8.4], z: [-3.4, 3.4], y: [-0.4, 0] };
/** La línea de transmisión que une todo, de oeste a este, sobre torres. */
export const RED = { z: -0.35, y: 1.35, torres: [-7.2, -5.2, -3.2, -1.2, 0.8, 2.8, 4.8, 6.8], nodo: -1.2 };
/** Dónde está cada cosa: centro x, z del edificio y el punto donde se conecta a la red. */
export const SITIO = {
    hidro: { x: -6.3, z: -2.2, sub: [-5.45, -1.05] },
    ciclo: { x: -3.3, z: -2.1, sub: [-2.45, -1.05] },
    grande: { x: -0.1, z: -2.2, sub: [0.75, -1.05] },
    turbogas: { x: 2.4, z: -1.9, sub: [3.1, -1.05] },
    eolico: { x: 5.4, z: -2.3, sub: [5.4, -1.05], torres: [4.2, 5.4, 6.6] },
    solar: { x: 5.7, z: 1.9, sub: [4.4, 0.45] },
    baterias: { x: 2.9, z: 1.75, sub: [2.9, 0.45] },
    ciudad: { x: -4.9, z: 1.95, sub: [-1.6, 0.95] },
    cenace: { x: 0.55, z: 2.15 },
};
/** Los cuatro sectores de la ciudad, en el orden en que se cortan. */
export const SECTORES = [{ x: -3.5, z: 1.25 }, { x: -6.0, z: 1.25 }, { x: -3.5, z: 2.6 }, { x: -6.0, z: 2.6 }];

export const FLUIDOS = {
    energia: { nombre: 'Energía que va a la ciudad', color: '#f2b233' },
    bateria: { nombre: 'Energía de las baterías', color: '#3fb6c6' },
    senal: { nombre: 'Señales del CENACE a las centrales', color: '#c2185b' },
};
const yR = RED.y;
const xs = RED.torres;
/** Las torres de la red (geoTorre): su alto; las fases cuelgan de la cruceta, a 0.92 del alto. */
export const ALTO_TORRE = 1.45;
/** El transformador de cada central (y el inversor del sol y de las baterías): su tapa, sus tres boquillas y el paso entre ellas. */
export const TRAFOS = {
    ...Object.fromEntries(['hidro', 'ciclo', 'grande', 'turbogas', 'eolico'].map(id => [id, { x: SITIO[id].sub[0] - 0.05, z: SITIO[id].sub[1], tapa: 0.34 }])),
    solar: { x: SITIO.solar.sub[0], z: SITIO.solar.sub[1], tapa: 0.3 },
    baterias: { x: SITIO.baterias.sub[0], z: SITIO.baterias.sub[1], tapa: 0.3 },
    ciudad: { x: SITIO.ciudad.sub[0] + 0.15, z: SITIO.ciudad.sub[1] - 0.12, tapa: 0.38 },
};
export const BOQUILLA = { alto: 0.08, paso: 0.07 };
/** El relevador de cada sector, en la subestación de la ciudad (x), y el transformador que cuelga del poste de cada sector. */
export const RELEVADOR = { x: SECTORES.map((s, i) => SITIO.ciudad.sub[0] - 0.28 + i * 0.13), z: SITIO.ciudad.sub[1] + 0.15, frente: SITIO.ciudad.sub[1] + 0.2 };
export const POSTE_SECTOR = { alto: 0.55, trafo: 0.36, lado: 0.035 };
const posteDe = s => [s.x + 0.9, s.z];
const torreMasCerca = x => xs.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a));
/** La caja de conexión al pie de cada edificio, a un lado de su transformador: x y la cara de la pared que lo ve (z). */
export const CONEXION = {
    hidro: { x: TRAFOS.hidro.x - 0.25, z: SITIO.hidro.z + 0.55 },
    ciclo: { x: TRAFOS.ciclo.x - 0.25, z: SITIO.ciclo.z + 0.725 },
    grande: { x: TRAFOS.grande.x - 0.25, z: SITIO.grande.z + 0.6 },
    turbogas: { x: TRAFOS.turbogas.x - 0.25, z: SITIO.turbogas.z + 0.25 },
};
/** La caja de baja tensión de cada transformador, de y a y + 0.05: en su cara del oeste, la que ve a la caja de conexión; en el parque
 *  eólico, en la de atrás, la que ve a los aerogeneradores. [x, z] del centro de su cara de abajo. */
export const BAJA = {
    y: 0.15,
    ...Object.fromEntries(Object.keys(CONEXION).map(id => [id, [TRAFOS[id].x - 0.135, TRAFOS[id].z]])),
    eolico: [TRAFOS.eolico.x, TRAFOS.eolico.z - 0.115],
};
/** Las filas de paneles (z), con su caja combinadora en la punta de cada una, en x = COMBINADOR. */
export const FILAS_SOLAR = Array.from({ length: 4 }, (_, i) => Math.round((SITIO.solar.z - 0.75 + i * 0.42) * 100) / 100);
export const COMBINADOR = 4.1;
const CONTENEDORES = [-0.55, 0, 0.55].map(dx => SITIO.baterias.x + dx);
/** Los bornes donde se conecta cada cable: las crucetas de las torres, las boquillas de los transformadores, los relevadores y los postes,
 *  y en el piso, las cajas de conexión de las centrales, las cajas de baja de sus transformadores, la base de cada aerogenerador, las
 *  combinadoras de los paneles, los contenedores de baterías y la cara de cada inversor. */
export const BORNES = {
    ...Object.fromEntries(xs.map((x, i) => [`torre${i}`, [x, ALTO_TORRE * 0.92, RED.z]])),
    ...Object.fromEntries(Object.entries(TRAFOS).map(([id, t]) => [`trafo-${id}`, [t.x, t.tapa + BOQUILLA.alto, t.z]])),
    ...Object.fromEntries(SECTORES.map((s, i) => [`relevador${i + 1}`, [RELEVADOR.x[i], 0.06, RELEVADOR.frente]])),
    ...Object.fromEntries(SECTORES.map((s, i) => { const [x, z] = posteDe(s); return [`poste${i + 1}`, [x, POSTE_SECTOR.trafo, z + POSTE_SECTOR.lado]]; })),
    ...Object.fromEntries(Object.entries(CONEXION).map(([id, c]) => [`caja-${id}`, [c.x, 0.03, c.z + 0.03]])),
    ...Object.fromEntries(['hidro', 'ciclo', 'grande', 'turbogas', 'eolico'].map(id => [`baja-${id}`, [BAJA[id][0], BAJA.y, BAJA[id][1]]])),
    ...Object.fromEntries(SITIO.eolico.torres.map((x, k) => [`turbina${k}`, [x, 0.03, SITIO.eolico.z + 0.08]])),
    ...Object.fromEntries(FILAS_SOLAR.map((z, k) => [`combinador${k}`, [COMBINADOR, 0.012, z]])),
    'inversor-solar': [SITIO.solar.sub[0], 0.05, SITIO.solar.sub[1] + 0.11],
    ...Object.fromEntries(CONTENEDORES.map((x, k) => [`contenedor${k}`, [x, 0.05, SITIO.baterias.z - 0.475]])),
    ...Object.fromEntries(CONTENEDORES.map((x, k) => [`inversor-baterias${k}`, [SITIO.baterias.sub[0] + (k - 1) * 0.1, 0.05, SITIO.baterias.sub[1] + 0.11]])),
};
const torre = x => BORNES[`torre${xs.indexOf(x)}`];
const enTorre = x => apoyo(torre(x), [0, 0, 0.25], 0.08);
const orilla = x => apoyo([x, ALTO_TORRE * 0.85, RED.z], [0, 0, 0.25]);
const boquillas = id => apoyo(BORNES[`trafo-${id}`], [BOQUILLA.paso, 0, 0]);
/** Las líneas que llegan a una torre de lado (de una central o de la ciudad) se cuelgan del otro brazo de su cruceta, el que va a lo largo de la red. */
const deLado = x => apoyo(torre(x), [0.25, 0, 0], 0.08);
/** Cada central a la torre más cercana: de las boquillas de su transformador al brazo de la cruceta. */
const aLaRed = id => [boquillas(id), deLado(torreMasCerca(TRAFOS[id].x))];
/** Las líneas aéreas, apoyo por apoyo: la red sigue por las dos orillas hacia el resto del país. */
export const AEREAS = {
    oeste: [orilla(BLOQUE.x[0] + 0.05), ...xs.filter(x => x <= RED.nodo).map(enTorre)],
    este: [orilla(BLOQUE.x[1] - 0.05), ...xs.filter(x => x >= RED.nodo).reverse().map(enTorre)],
    ...Object.fromEntries(['hidro', 'ciclo', 'grande', 'turbogas', 'eolico', 'solar', 'baterias'].map(id => [id, aLaRed(id)])),
    ciudad: [deLado(RED.nodo), boquillas('ciudad')],
};
/**
 * De cada relevador al poste de su sector, cables de media tensión por el piso (por debajo de la losa y de la calle): por la cerrada de
 * los sectores 1 y 2, o por un lado y la cerrada de los sectores 3 y 4; suben pegados al poste hasta su transformador.
 */
const yP = 0.012;
const alSector = i => {
    const s = SECTORES[i];
    const [px, pz] = posteDe(s);
    const zp = pz + POSTE_SECTOR.lado;
    const x0 = RELEVADOR.x[i];
    // sale por abajo del relevador, corre sobre la losa y baja al piso en su orilla
    const losa = SITIO.ciudad.sub[1] + 0.3;
    const sale = [[x0, 0.047, RELEVADOR.frente + 0.02], [x0, 0.047, losa], [x0, yP, losa + 0.015]];
    const ida = i < 2
        ? [[x0, yP, i ? 1.31 : zp], [px, yP, i ? 1.31 : zp]]
        : [[x0, yP, 1.3], [x0, yP, i === 2 ? zp : 2.66], [px, yP, i === 2 ? zp : 2.66]];
    return [BORNES[`relevador${i + 1}`], ...sale, ...ida, [px, yP, zp], BORNES[`poste${i + 1}`]];
};
const sinRepetir = puntos => puntos.filter((p, k, a) => k === 0 || Math.hypot(p[0] - a[k - 1][0], p[1] - a[k - 1][1], p[2] - a[k - 1][2]) > 1e-6);
/**
 * De cada central a su transformador, cables por el piso: salen de la caja de conexión al pie del edificio, corren junto a la losa de la
 * subestación, suben a la losa y suben pegados a la cara del transformador hasta su caja de baja tensión. Los de los aerogeneradores salen
 * de la base de cada uno y llegan por atrás; los del sol y las baterías van de las combinadoras y los contenedores a la cara de su inversor.
 */
const deLaCentral = id => {
    const [bx, bz] = BAJA[id];
    const orilla = SITIO[id].sub[0] - 0.25; // la orilla de la losa, del lado de la caja de conexión
    return [BORNES[`caja-${id}`], [CONEXION[id].x, yP, bz], [orilla - 0.015, yP, bz], [orilla, 0.047, bz], [bx, 0.047, bz], [bx, BAJA.y, bz]];
};
const delAerogenerador = k => {
    const x = SITIO.eolico.torres[k];
    const [dx, carril] = [[-0.02, -1.45], [0, -1.4], [0.02, -1.36]][k];
    const [bx, bz] = BAJA.eolico;
    const orilla = SITIO.eolico.sub[1] - 0.2; // la orilla de la losa, del lado de los aerogeneradores
    return [BORNES[`turbina${k}`], [x, yP, carril], [bx + dx, yP, carril], [bx + dx, yP, orilla - 0.015], [bx + dx, 0.047, orilla], [bx + dx, 0.047, bz], [bx + dx, BAJA.y, bz]];
};
const [sx, sz] = SITIO.solar.sub;
const delSol = [...FILAS_SOLAR.slice().reverse().map((z, k) => BORNES[`combinador${FILAS_SOLAR.length - 1 - k}`]), [COMBINADOR, yP, sz + 0.3], [sx, yP, sz + 0.3], BORNES['inversor-solar']];
const deLasBaterias = k => { const [x, , z] = BORNES[`inversor-baterias${k}`]; return [BORNES[`contenedor${k}`], [CONTENEDORES[k], yP, 0.9], [x, yP, 0.9], [x, yP, z + 0.14], BORNES[`inversor-baterias${k}`]]; };
const alTrafo = (id, central, puntos, fluido = 'energia') => ({ id, central, fluido, r: 0.008, cable: true, puntos: sinRepetir(puntos) });
/** Los cables de cada central a su transformador o inversor; su flujo es el de la línea de la central. */
const DE_LAS_CENTRALES = [
    ...Object.keys(CONEXION).map(id => alTrafo(`g-${id}`, id, deLaCentral(id))),
    ...SITIO.eolico.torres.map((x, k) => alTrafo(`g-eolico${k}`, 'eolico', delAerogenerador(k))),
    alTrafo('g-solar', 'solar', delSol),
    ...CONTENEDORES.map((x, k) => alTrafo(`g-baterias${k}`, 'baterias', deLasBaterias(k), 'bateria')),
];
export const LINEAS = [
    // la red, de las centrales del oeste y del este al nodo de la ciudad; cada central a la red; del nodo a la subestación de la ciudad
    ...Object.entries(AEREAS).map(([id, apoyos]) => lineaAerea(id, apoyos, { fluido: id === 'baterias' ? 'bateria' : 'energia' })),
    // de la subestación de la ciudad a cada sector
    ...SECTORES.map((s, i) => ({ id: `s${i + 1}`, fluido: 'energia', r: 0.008, cable: true, puntos: sinRepetir(alSector(i)) })),
    // de cada central a su transformador o su inversor, por el piso
    ...DE_LAS_CENTRALES,
    // las señales del control automático de generación del CENACE: corren por el aire, sin tubo
    ...['hidro', 'ciclo', 'turbogas'].map(id => ({ id: `agc-${id}`, fluido: 'senal', r: 0.02, oculto: true, puntos: [[SITIO.cenace.x - 0.2, 1.35, SITIO.cenace.z - 0.3], [lerp(SITIO.cenace.x, SITIO[id].x, 0.5), 2.6, lerp(SITIO.cenace.z, SITIO[id].z, 0.5)], [SITIO[id].x, 1.5, SITIO[id].z + 0.4]] })),
];
/** Puntas que salen por la orilla: la red sigue hacia el resto del país. */
export const REMATE = new Set(['oeste (inicio)', 'este (inicio)']);
/** Cajas de los equipos: x0, x1, y0, y1, z0, z1. Cada punta de cada cable debe caer en una. */
export const EQUIPOS = {
    torres: [xs[0] - 0.1, xs.at(-1) + 0.1, yR - 0.15, yR + 0.1, RED.z - 0.1, RED.z + 0.1],
    ...Object.fromEntries(['hidro', 'ciclo', 'grande', 'turbogas', 'eolico', 'solar', 'baterias'].map(id => { const [x, z] = SITIO[id].sub; return [`sub-${id}`, [x - 0.3, x + 0.3, 0, 0.8, z - 0.3, z + 0.3]]; })),
    subCiudad: [SITIO.ciudad.sub[0] - 0.45, SITIO.ciudad.sub[0] + 0.35, 0.4, 0.9, SITIO.ciudad.sub[1] - 0.35, SITIO.ciudad.sub[1] + 0.35],
    relevadores: [RELEVADOR.x[0] - 0.05, RELEVADOR.x.at(-1) + 0.05, 0.04, 0.32, RELEVADOR.z - 0.05, RELEVADOR.frente],
    ...Object.fromEntries(SECTORES.map((s, i) => [`sector${i + 1}`, [s.x - 1.1, s.x + 1.1, 0, 1.2, s.z - 0.6, s.z + 0.6]])),
    cenace: [SITIO.cenace.x - 1.1, SITIO.cenace.x + 1.1, 0, 1.6, SITIO.cenace.z - 0.7, SITIO.cenace.z + 0.7],
    ...Object.fromEntries(['hidro', 'ciclo', 'turbogas'].map(id => [`planta-${id}`, [SITIO[id].x - 1.2, SITIO[id].x + 1.2, 0, 2.2, SITIO[id].z - 0.9, SITIO[id].z + 0.9]])),
    'planta-grande': [SITIO.grande.x - 0.9, SITIO.grande.x + 0.9, 0, 2.6, SITIO.grande.z - 0.9, SITIO.grande.z + 0.7],
    turbinas: [SITIO.eolico.torres[0] - 0.2, SITIO.eolico.torres.at(-1) + 0.2, 0, 2.6, SITIO.eolico.z - 0.2, SITIO.eolico.z + 0.2],
    paneles: [COMBINADOR - 0.1, 7.4, 0, 0.4, FILAS_SOLAR[0] - 0.2, FILAS_SOLAR.at(-1) + 0.2],
    contenedores: [CONTENEDORES[0] - 0.25, CONTENEDORES.at(-1) + 0.25, 0, 0.4, SITIO.baterias.z - 0.5, SITIO.baterias.z + 0.5],
};

/** Puntos clave: dónde va el número y desde dónde se ve. */
const Yd = 1.95; // el reloj de la frecuencia, arriba del CENACE
/** ang: radianes de la aguja para ±1.5 Hz. */
export const DIAL = { x: SITIO.cenace.x + 0.55, y: Yd, z: SITIO.cenace.z + 0.05, r: 0.36, ang: 2.0 };
export const PARTES = [
    { id: 'ciclo', ancla: [SITIO.ciclo.x - 0.5, 1.45, SITIO.ciclo.z + 0.3], vista: { az: 12, el: 20, tam: 2.8, mira: [SITIO.ciclo.x, 0.7, SITIO.ciclo.z] } },
    { id: 'rotor', ancla: [SITIO.ciclo.x + 0.35, 0.62, SITIO.ciclo.z + 0.45], vista: { az: 18, el: 16, tam: 1.6, mira: [SITIO.ciclo.x + 0.2, 0.5, SITIO.ciclo.z + 0.3] } },
    { id: 'gobernador', ancla: [SITIO.ciclo.x - 0.85, 0.6, SITIO.ciclo.z + 0.95], vista: { az: -18, el: 16, tam: 1.3, mira: [SITIO.ciclo.x - 0.75, 0.35, SITIO.ciclo.z + 0.8] } },
    { id: 'hidro', ancla: [SITIO.hidro.x, 1.3, SITIO.hidro.z + 0.2], vista: { az: -18, el: 34, tam: 3.0, mira: [SITIO.hidro.x, 0.6, SITIO.hidro.z - 0.2] } },
    { id: 'grande', ancla: [SITIO.grande.x + 0.2, 2.0, SITIO.grande.z + 0.3], vista: { az: -28, el: 20, tam: 3.4, mira: [SITIO.grande.x, 0.9, SITIO.grande.z] } },
    { id: 'turbogas', ancla: [SITIO.turbogas.x, 1.15, SITIO.turbogas.z + 0.2], vista: { az: -30, el: 24, tam: 2.0, mira: [SITIO.turbogas.x, 0.5, SITIO.turbogas.z] } },
    { id: 'eolico', ancla: [SITIO.eolico.x, 2.4, SITIO.eolico.z + 0.2], vista: { az: 8, el: 14, tam: 3.4, mira: [SITIO.eolico.x, 1.3, SITIO.eolico.z] } },
    { id: 'solar', ancla: [SITIO.solar.x, 0.55, SITIO.solar.z], vista: { az: 20, el: 32, tam: 2.8, mira: [SITIO.solar.x, 0.2, SITIO.solar.z] } },
    { id: 'baterias', ancla: [SITIO.baterias.x, 0.7, SITIO.baterias.z + 0.1], vista: { az: 22, el: 22, tam: 1.9, mira: [SITIO.baterias.x, 0.35, SITIO.baterias.z] } },
    { id: 'red', ancla: [-2.2, RED.y + 0.25, RED.z], vista: { az: -24, el: 18, tam: 3.6, mira: [-2.2, 1.0, RED.z] } },
    { id: 'ciudad', ancla: [SITIO.ciudad.x, 1.0, SITIO.ciudad.z], vista: { az: 10, el: 30, tam: 3.4, mira: [SITIO.ciudad.x, 0.5, SITIO.ciudad.z] } },
    { id: 'relevadores', ancla: [SITIO.ciudad.sub[0] - 0.1, 0.42, SITIO.ciudad.sub[1] + 0.15], vista: { az: 22, el: 20, tam: 1.6, mira: [SITIO.ciudad.sub[0], 0.6, SITIO.ciudad.sub[1]] } },
    { id: 'cenace', ancla: [SITIO.cenace.x - 0.4, 1.3, SITIO.cenace.z + 0.3], vista: { az: 14, el: 18, tam: 2.2, mira: [SITIO.cenace.x, 0.8, SITIO.cenace.z] } },
    { id: 'medidor', ancla: [DIAL.x + DIAL.r + 0.05, DIAL.y + 0.2, DIAL.z + 0.05], vista: { az: 4, el: 6, tam: 1.2, mira: [DIAL.x, DIAL.y, DIAL.z] } },
];

// ------------------------------------------------------------------ la pose
/** Qué tan rápido gira a la vista un rotor: proporcional a la frecuencia (a 60 Hz, 3,600 vueltas por minuto; aquí, despacio). */
export const giroVista = f => (f / F0) * 6;
/** Lo que la escena necesita para dibujarse en este momento. */
export function pose({ modo = 'disparo', planta = null, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, planta, ...resto });
    const f = L.f;
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    const apagado = L.apagon;
    // cuántas máquinas giran: con más sol y viento, se apagan unidades del ciclo combinado y de la hidroeléctrica
    const ren = modo === 'inercia' ? L.renovable : modo === 'reserva' ? clamp01((L.solar + L.eolica) / L.demanda) : SISTEMA.renovable;
    const giran = { ciclo1: ren < 0.5, ciclo2: ren < 0.3, vapor: ren < 0.6, hidro1: true, hidro2: ren < 0.4, grande: !(L.disparada && modo !== 'reserva') };
    // de cada 1, cuánto lleva cada línea
    const sectores = [0, 1, 2, 3].map(i => !apagado && !L.cortes?.some(c => c.i === i));
    let rota = -1;
    if (modo === 'reserva' && L.corte > 0) { rota = Math.floor((t / 6) % 4); sectores[rota] = false; } // cortes rotativos
    if (!apagado) {
        const base = 0.25 + 0.6 * clamp01((L.demanda ?? SISTEMA.demanda) / 50000);
        flujos.oeste = flujos.este = flujos.ciudad = base;
        flujos.hidro = 0.5 + 0.5 * clamp01((L.agc ?? 0) / 600);
        flujos.ciclo = giran.ciclo1 ? 0.6 + 0.4 * clamp01((L.gob ?? 0) / 600) : 0.2;
        flujos.grande = giran.grande ? 0.7 : 0;
        flujos.turbogas = modo === 'reserva' ? (L.estado !== 'normal' ? 0.6 : 0) : 0;
        flujos.eolico = 0.25 + 0.6 * ren;
        flujos.solar = modo === 'reserva' ? clamp01(L.solar / 4000) : 0.2 + 0.8 * ren;
        flujos.baterias = clamp01((L.bat ?? 0) / 300);
        sectores.forEach((v, i) => { flujos[`s${i + 1}`] = v ? base : 0; });
        const agcVivo = L.t !== null && L.t >= AGC.empieza && Math.abs(F0 - f) > 0.005;
        for (const id of ['hidro', 'ciclo', 'turbogas']) flujos[`agc-${id}`] = agcVivo || (modo === 'reserva' && L.estado !== 'normal') ? 0.8 : 0;
    }
    // el cable de cada central a su transformador lleva lo mismo que su línea
    for (const l of DE_LAS_CENTRALES) flujos[l.id] = flujos[l.central];
    const cam = camara || { mira: [0, 0.8, 0], az: 18, el: 26, d: 34 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, f, giran, sectores, rota, apagado,
        aguja: clamp((f - F0) / 1.5, -1, 1) * DIAL.ang, // radianes del reloj: ±1.5 Hz a lo ancho
        activo: { energia: apagado ? 0 : 1, bateria: clamp01((L.bat ?? 0) / 200), senal: flujos['agc-hidro'] > 0 ? 1 : 0, fuera: L.disparada && modo !== 'reserva' ? 1 : 0, sol: modo === 'reserva' ? clamp01(L.solar / PARQUE.solar / 0.6) : 0.4 + ren, tg: flujos.turbogas > 0 ? 1 : 0 },
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'disparo', camara: { mira: [0, 0.8, 0], az: lerp(10, 26, t / 12), el: 26, d: 34 } });
}

// ------------------------------------------------------------------ revisiones
const dentro = (p, c, h = 0.06) => p[0] >= c[0] - h && p[0] <= c[1] + h && p[1] >= c[2] - h && p[1] <= c[3] + h && p[2] >= c[4] - h && p[2] <= c[5] + h;
/** Cada punta de cada cable debe tocar un equipo: una torre, una subestación, un sector o el CENACE. Devuelve las que quedan al aire. */
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
        if (REMATE.has(`${L.id} (${nombre})`)) continue;
        if (!Object.values(EQUIPOS).some(c => dentro(p, c))) sueltas.push(`${L.id} (${nombre})`);
    }
    return sueltas;
}
/** Revisión de cifras contra lo publicado y contra lo que pide el Código de Red. */
export function revisar() {
    const p = [];
    const entre = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    entre(GOB.R, GOB.rango[0], GOB.rango[1], 'el estatismo está dentro de lo que pide el Código (3 a 8 %)');
    entre(H, 2, 7, 'la inercia está dentro de lo que da el NREL (2 a 7 s)');
    entre(PASOS.reduce((s, x) => s + x.pct, 0), 0.259, 0.261, 'los cuatro pasos suman 26 %, lo que se cortó en 2020');
    entre(EVENTO2020.corte / EVENTO2020.demanda, 0.27, 0.275, '8,696 de 31,789 MW son 27 de cada 100 (el CENACE dice 26 %)');
    entre(PARQUE.solar, 8000, 8100, 'la capacidad solar de 2024, 8.89 % de 90,543 MW');
    // perder una unidad de 810 MW: la frecuencia baja pero no sale de lo normal, y el CENACE la regresa a 60 Hz
    const A = simular({});
    entre(A.rocof, 0.08, 0.2, 'al principio, la frecuencia cae unas décimas de Hz por segundo');
    entre(A.nadir, BANDA.min, 59.95, 'perder 810 MW no saca la frecuencia de la banda normal');
    entre(A.tNadir, 2, 12, 'el punto más bajo llega en segundos');
    entre(A.f30, 59.85, 59.98, 'a los 30 s, los gobernadores la sostienen un poco abajo de 60 Hz');
    entre(Math.abs(A.fFin - F0), 0, 0.01, 'a los 10 minutos, el CENACE la regresó a 60 Hz');
    entre(A.cortes.length, 0, 0, 'sin cortar carga');
    // sin gobernadores, solo la carga la frenaría: bajaría hasta cerca de 59.1 Hz
    const sinGob = simular({ gobernadores: false, agc: false, tFin: 120 });
    entre(sinGob.fFin, 58.9, 59.2, 'sin gobernadores ni CENACE, la frecuencia se queda muy abajo');
    // con más sol y viento hay menos inercia: cae más rápido y más hondo; las baterías ayudan
    const alto = simular({ renovable: 0.7 });
    entre(alto.rocof / A.rocof, 2.5, 4, 'con 70 % de sol y viento, cae unas tres veces más rápido');
    entre(alto.nadir, 59.3, A.nadir - 0.05, 'y llega más abajo');
    const conBat = simular({ renovable: 0.7, bateria: 500 });
    entre(conBat.nadir, alto.nadir + 0.05, F0, 'con 500 MW de baterías no baja tanto');
    // cuando falta mucho: lo que se perdió el 28 de diciembre de 2020
    const G = simular({ perdida: EVENTO2020.perdida, demanda: EVENTO2020.demanda, pasos: true, tFin: 120 });
    entre(G.cortes.length, 4, 4, 'con lo que se perdió en 2020, operan los cuatro pasos');
    entre(G.nadir, 58.6, 59.1, 'y la frecuencia baja cerca de 58.9 Hz, como entonces');
    entre(G.colapso === null ? 1 : 0, 1, 1, 'el sistema no se cae');
    entre(simular({ perdida: EVENTO2020.perdida, demanda: EVENTO2020.demanda, pasos: false, tFin: 60 }).colapso === null ? 0 : 1, 1, 1, 'sin corte de carga, se cae');
    // la reserva: un día de calor normal casi siempre en normal; con centrales fuera, alerta y emergencia en la noche
    const D0 = dia({ pico: 44000, fuera: 0 });
    entre(D0.minRo, RESERVA.normal, 1, 'un día de 44,000 MW con todo disponible queda en estado normal');
    const D1 = dia({});
    entre(D1.horaMin, 18, 22, 'la reserva más baja, cuando se va el sol y la demanda sigue alta');
    const D2 = dia({ pico: 50000, fuera: 4000 });
    entre(D2.minRo, -0.2, RESERVA.emergencia, 'un día de mucho calor y centrales fuera llega a emergencia');
    entre(hora({ hora: 13, pico: 50000, fuera: 4000 }).ro, RESERVA.emergencia, 1, 'a mediodía el sol la sostiene');
    const D3 = dia({ pico: CALOR.pico, fuera: CALOR.fuera });
    entre(D3.horas.emergencia, 0.5, 3, 'un día de mucho calor tiene emergencia una o dos horas, al caer la tarde');
    entre(D3.horas.alerta, 1, 4, 'y alerta antes y después');
    entre(SEN2024.alertas, 285, 285, 'alertas de 2024');
    entre(clamp(1, 0, 2), 1, 1, 'ayudas');
    return p;
}
