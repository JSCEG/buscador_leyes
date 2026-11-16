// Cómo se conecta una central a la red, puro (sin three.js): el flujo de la central a la red (voltajes, corriente, pérdidas y
// reactivos en cada tramo), lo que pasa en una falla contra lo que pide el Código de Red, los pasos del trámite del CENACE y quién paga
// cada obra. Lo leen la escena, el tablero, las gráficas y la prueba (tests/interconexion.test.js).
import { cablesSueltos as revisarCables } from '../planta-comun/lineas.js';
import { BANCO_MVAR, CASO, CONVOCATORIA, COSTO_KM, EJEMPLO, HUECO, LINEA_TIPICA, LSE48, MIC, PRIMERA, RECUPERA, REACTIVOS, SEGUNDA, TABLA_I1, TENSION, TIPOS } from './datos.js';
import { AEREAS, BLOQUE, BORNES, LINEAS, PARTES, REMATE } from './lugar.js';

export * from './datos.js';
export { AEREAS, BAHIAS, BLOQUE, BORNES, CAMPOS, ESTACIONES, FLUIDOS, LINEAS, PARTES, REMATE, SITIO } from './lugar.js';

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const clamp01 = x => clamp(x, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;

// ------------------------------------------------------------------ números complejos, lo justo
const C = (re, im = 0) => ({ re, im });
const suma = (a, b) => C(a.re + b.re, a.im + b.im);
const resta = (a, b) => C(a.re - b.re, a.im - b.im);
const por = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const entre = (a, b) => { const d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const conj = a => C(a.re, -a.im);
const mod = a => Math.hypot(a.re, a.im);
const escala = (a, k) => C(a.re * k, a.im * k);

// ------------------------------------------------------------------ la cadena de la central al punto de interconexión
/** Base de 100 MVA. Cada tramo en por unidad: línea, transformadores elevadores (en paralelo) y transformadores de bloque (en paralelo). */
export const SB = 100;
const ZB115 = CASO.elevadoras.vAlta ** 2 / SB;
const zDe = (x, xr) => C(x / Math.hypot(1, xr), (x * xr) / Math.hypot(1, xr));
export const TRAMOS = {
    linea: C((CASO.linea.r * CASO.linea.km) / ZB115, (CASO.linea.x * CASO.linea.km) / ZB115),
    carga: (LINEA_TIPICA.bMicroS * 1e-6 * CASO.linea.km) * ZB115, // susceptancia total de la línea, por unidad
    elevadoras: zDe((CASO.elevadoras.z * SB) / (CASO.elevadoras.proteus + CASO.elevadoras.tampico), CASO.elevadoras.xr),
    bloque: zDe((CASO.bloque.z * SB) / (CASO.bloque.mva * CASO.bloque.n), CASO.bloque.xr),
};
/** Lo que pueden dar todos los inversores juntos, MVA. */
export const S_INVERSORES = ((CASO.inversores.proteus + CASO.inversores.tampico) * CASO.inversores.kva) / 1000;
/** Potencia de cortocircuito trifásica en el punto de interconexión (MVA) y cuántas veces la central (relación de cortocircuito). */
export const CORTO_MVA = Math.sqrt(3) * CASO.elevadoras.vAlta * CASO.corto.trifasico;
export const SCR = CORTO_MVA / CASO.mw;
export const AMPERES_NOMINAL = (CASO.mw / (Math.sqrt(3) * CASO.elevadoras.vAlta)) * 1000;
export const TIPO = Object.entries(TIPOS).find(([, [a, b]]) => CASO.mw > a && CASO.mw <= b)[0];
const TAN_FP = Math.tan(Math.acos(REACTIVOS.fp));

/**
 * El flujo de la central a la red, con la tensión del punto de interconexión fija en 1.0 (la red es fuerte). mw: lo que entra a la red;
 * fp: 'unidad' (sin reactivos en el punto), 'entrega' (fp 0.95 entregando reactivos) o 'absorbe' (fp 0.95 absorbiéndolos).
 * banco: si el banco de capacitores de 34.5 kV está conectado. Se calcula del punto de interconexión hacia los inversores.
 */
export function flujo({ mw = CASO.mw, fp = 'unidad', banco = false } = {}) {
    const q = fp === 'entrega' ? mw * TAN_FP : fp === 'absorbe' ? -mw * TAN_FP : 0;
    let V = C(1);
    let S = C(mw / SB, q / SB);
    // la línea, en pi: la mitad de su carga capacitiva en cada punta
    S = suma(S, C(0, -(TRAMOS.carga / 2) * mod(V) ** 2));
    let I = conj(entre(S, V));
    const iLinea = mod(I);
    V = suma(V, por(TRAMOS.linea, I));
    S = suma(S, escala(TRAMOS.linea, mod(I) ** 2));
    const perdLinea = TRAMOS.linea.re * iLinea ** 2 * SB;
    S = suma(S, C(0, -(TRAMOS.carga / 2) * mod(V) ** 2));
    const v115 = mod(V);
    I = conj(entre(S, V));
    V = suma(V, por(TRAMOS.elevadoras, I));
    S = suma(S, escala(TRAMOS.elevadoras, mod(I) ** 2));
    const v34 = mod(V);
    const qBanco = banco ? (BANCO_MVAR / SB) * v34 ** 2 : 0;
    S = suma(S, C(0, -qBanco));
    I = conj(entre(S, V));
    V = suma(V, por(TRAMOS.bloque, I));
    S = suma(S, escala(TRAMOS.bloque, mod(I) ** 2));
    const vInv = mod(V);
    const pInv = S.re * SB;
    const qInv = S.im * SB;
    const amperes = (iLinea * SB * 1000) / (Math.sqrt(3) * CASO.elevadoras.vAlta);
    return {
        mw, mvar: q, fp, banco,
        v115, v34, vInv,
        pInv, qInv, qBanco: qBanco * SB,
        carga: Math.hypot(pInv, qInv) / S_INVERSORES,
        amperes, usoLinea: amperes / CASO.linea.amperes,
        perdLinea, perdidas: pInv - mw,
        fueraTension: vInv > TENSION.max + 1e-9 || vInv < TENSION.min - 1e-9,
        sobrecarga: Math.hypot(pInv, qInv) / S_INVERSORES > 1 + 1e-9,
    };
}

// ------------------------------------------------------------------ una falla en la red
/** Lo mínimo que el Código de Red pide aguantar (Zona A) a t segundos del inicio de la falla: interpolación de la tabla. */
export function envolvente(t, tipo = 'asincrona') {
    const p = HUECO[tipo];
    if (t < 0) return 1;
    if (t >= p.at(-1)[0]) return p.at(-1)[1];
    let v = 0;
    for (let i = 0; i < p.length - 1; i++) {
        const [t0, v0] = p[i];
        const [t1, v1] = p[i + 1];
        if (t >= t0 && t <= t1) v = t1 === t0 ? Math.max(v0, v1) : lerp(v0, v1, (t - t0) / (t1 - t0));
    }
    return v;
}
/** La rapidez con que vuelve el voltaje cuando se libera la falla (de ejemplo; en una red fuerte vuelve en unas décimas de segundo). */
const TAU_V = 0.05;
/** Corriente reactiva que da la central durante la falla, por unidad, según cuánto bajó el voltaje: de ejemplo (el CENACE fija la suya en los estudios). */
const iReactiva = v => clamp(2 * (0.9 - v), 0, 1);
/** Lo que tarda la potencia activa en volver después de la falla: dentro de los 0.25 a 0.5 s del Código. */
export const T_RECUPERA = 0.35;
/**
 * Una falla en la línea de la red cerca de la subestación: el voltaje del punto de interconexión cae a `residual` (por unidad) durante
 * `ms` milisegundos. t: segundos desde el inicio de la falla. Devuelve si la central debe seguir conectada y lo que se ve en ese instante.
 */
export function falla({ ms = 150, residual = 0, t = 0, mw = CASO.mw } = {}) {
    const tc = ms / 1000;
    const voltaje = s => (s < 0 ? 1 : s < tc ? residual : 1 - (1 - residual) * Math.exp(-(s - tc) / TAU_V));
    // ¿baja el voltaje de lo que pide la Zona A? Se revisa cada milisegundo hasta 1.6 s.
    let sale = null;
    for (let s = 0; s <= 1.6; s += 0.001) if (voltaje(s) < envolvente(s) - 1e-9) { sale = s; break; }
    const debeQuedarse = sale === null;
    const p0 = mw / CASO.mw;
    const fuera = s => sale !== null && s >= sale;
    const potencia = s => {
        if (s < 0) return p0;
        if (fuera(s)) return 0;
        const v = voltaje(s);
        if (s < tc) {
            const iq = iReactiva(v);
            const ip = Math.sqrt(Math.max(0, 1.1 ** 2 - iq ** 2));
            return Math.min(p0, v * ip);
        }
        const enFalla = Math.min(p0, residual * Math.sqrt(Math.max(0, 1.1 ** 2 - iReactiva(residual) ** 2)));
        return lerp(enFalla, p0, clamp01((s - tc) / T_RECUPERA));
    };
    const reactiva = s => (s < 0 || fuera(s) || s >= tc ? 0 : voltaje(s) * iReactiva(voltaje(s)));
    const v = voltaje(t);
    return {
        ms, residual, t, tc, sale, debeQuedarse,
        v, minimo: envolvente(t), p: potencia(t), q: reactiva(t), enFalla: t >= 0 && t < tc, conectada: !fuera(t),
        voltaje, potencia, reactiva,
        // la corriente de la falla: la red aporta la de cortocircuito; la central, poco más que su corriente normal (de ejemplo, 1.1 veces)
        kaRed: CASO.corto.trifasico * (1 - residual), kaCentral: (1.1 * AMPERES_NOMINAL) / 1000,
        // lo más largo que puede durar una falla con este voltaje sin que la central pueda salir
        msMax: msPermitidos(residual),
    };
}
/** Cuántos milisegundos de falla con este voltaje puede exigir la Zona A (asíncrona tipo D). */
export function msPermitidos(residual, tipo = 'asincrona') {
    for (let s = 0; s <= 1.6; s += 0.001) if (envolvente(s, tipo) > residual + 1e-9) return Math.round(s * 1000) - 1;
    return 1500;
}

// ------------------------------------------------------------------ los pasos del trámite
/** La fila de la tabla I.1 del MIC que toca a una central de estos MW. */
export const filaMic = mw => TABLA_I1.find(f => mw > f.mw[0] && mw <= f.mw[1]);
const FILA = filaMic(CASO.mw);
/**
 * Las etapas del trámite de esta central, en días hábiles. Los estudios salen de la tabla I.1 del MIC; el contrato, del MIC (30 días
 * para pedirlo) y la LSE (10 para firmarlo); la construcción, la inspección y las pruebas son de ejemplo.
 */
export const ETAPAS = [
    { id: 'solicitud', nombre: 'Solicitud', corto: 'Solicitud', dias: MIC.revision, quien: 'cenace' },
    { id: 'indicativo', nombre: 'Estudio indicativo', corto: 'Indicativo', dias: FILA.indicativo, quien: 'cenace' },
    { id: 'impacto', nombre: 'Estudio de impacto', corto: 'Impacto', dias: FILA.impacto, quien: 'cenace' },
    { id: 'instalaciones', nombre: 'Estudio de instalaciones', corto: 'Instalaciones', dias: FILA.instalaciones, quien: 'cenace' },
    { id: 'contrato', nombre: 'Contrato de interconexión', corto: 'Contrato', dias: MIC.pedirContrato + LSE48.firma, quien: 'cfe' },
    { id: 'obra', nombre: 'Construcción de las obras', corto: 'Obras', dias: EJEMPLO.construccion, quien: 'central', ejemplo: true },
    { id: 'inspeccion', nombre: 'Inspección y conexión física', corto: 'Conexión', dias: EJEMPLO.inspeccion, quien: 'cenace', ejemplo: true },
    { id: 'pruebas', nombre: 'Pruebas de operación', corto: 'Pruebas', dias: EJEMPLO.pruebas, quien: 'central', ejemplo: true },
];
let acum = 0;
for (const e of ETAPAS) { e.desde = acum; acum += e.dias; e.hasta = acum; }
export const TOTAL_DIAS = acum;
/** Días hábiles de los estudios y su costo para esta central (tabla I.1). */
export const ESTUDIOS = { dias: FILA.indicativo + FILA.impacto + FILA.instalaciones, validacion: FILA.validacion, costo: FILA.costo, partes: FILA.partes };
/** Dónde va el trámite en el día hábil `dia`: la etapa, cuánto lleva la obra (0–1) y si la central ya está conectada. */
export function tramite({ dia = 0 } = {}) {
    const d = clamp(dia, 0, TOTAL_DIAS);
    const i = ETAPAS.findIndex(e => d < e.hasta);
    const etapa = ETAPAS[i < 0 ? ETAPAS.length - 1 : i];
    const obraE = ETAPAS.find(e => e.id === 'obra');
    const obra = clamp01((d - obraE.desde) / obraE.dias);
    const pruebas = ETAPAS.find(e => e.id === 'pruebas');
    return {
        dia: d, etapa, avance: clamp01((d - etapa.desde) / etapa.dias), obra,
        conectada: d >= pruebas.desde,
        comercial: d >= TOTAL_DIAS,
        // durante las pruebas de operación la central trabaja al 100 % (240 horas, MIC 12.4.3)
        carga: d >= pruebas.desde ? 1 : 0,
        meses: d / 21,
    };
}

// ------------------------------------------------------------------ quién paga
/** El reparto de una obra de refuerzo que comparten varios proyectos: por MW, como dice la convocatoria. */
export const PROYECTOS = CONVOCATORIA.map(p => {
    const grupo = CONVOCATORIA.filter(q => q.grupo === p.grupo);
    const mwGrupo = grupo.reduce((s, q) => s + q.mw, 0);
    const parte = (p.mdp * p.mw) / mwGrupo;
    return { ...p, compartida: grupo.length > 1, parte, porMw: parte / p.mw };
});
export const CONV_TOTAL = {
    mw: CONVOCATORIA.reduce((s, p) => s + p.mw, 0),
    mdp: [...new Map(CONVOCATORIA.map(p => [p.grupo, p.mdp])).values()].reduce((s, x) => s + x, 0),
    proyectos: CONVOCATORIA.length,
};
export const POR_GCR = [...new Set(CONVOCATORIA.map(p => p.gcr))].map(g => {
    const ps = PROYECTOS.filter(p => p.gcr === g);
    const mw = ps.reduce((s, p) => s + p.mw, 0);
    const mdp = ps.reduce((s, p) => s + p.parte, 0);
    return { gcr: g, proyectos: ps.length, mw, mdp, porMw: mdp / mw };
});
/** El proyecto de la convocatoria en la misma zona que el caso: San Luis de la Paz. */
export const VECINO = PROYECTOS.find(p => p.region === 'San Luis de la Paz');
/**
 * Lo que cuesta conectar esta central. km: largo de la línea de enlace; modalidad: 'individual' (la central paga los refuerzos) o
 * 'planeacion' (los refuerzos entran al programa de la red). refuerzo: millones de pesos de refuerzos, si el estudio los pide.
 */
export function costos({ km = CASO.linea.km, modalidad = 'individual', refuerzo = 0 } = {}) {
    const linea = (km * COSTO_KM.rural) / 1e6;
    const estudios = ESTUDIOS.costo / 1e6;
    const centralRefuerzo = modalidad === 'individual' ? refuerzo : 0;
    return {
        km, modalidad, linea, estudios, refuerzo,
        central: linea + estudios + centralRefuerzo,
        red: refuerzo - centralRefuerzo,
        garantias: MIC.garantia,
    };
}

// ------------------------------------------------------------------ valores de arranque y rangos
export const DEF = { mw: CASO.mw, fp: 'unidad', banco: false, dia: 0, ms: 150, residual: 0, tf: -0.2, km: CASO.linea.km, modalidad: 'individual', saee: false };
export const LIMITES = { mw: [0, CASO.mw], dia: [0, TOTAL_DIAS], ms: [50, 1000], tf: [-0.2, 2.5], km: [1, 40] };
/** La forma de la falla en el reloj: pasa en cámara lenta. */
export const LENTO = 0.25;

/** Lo que se calcula para el modo pedido. */
export function calcular({ modo = 'linea', ...p } = {}) {
    const q = { ...DEF, ...p };
    if (modo === 'pasos') return { modo, ...tramite(q), flujo: flujo({ mw: CASO.mw }) };
    if (modo === 'falla') return { modo, ...falla({ ms: q.ms, residual: q.residual, t: q.tf }), flujo: flujo({ mw: CASO.mw }) };
    if (modo === 'paga') return { modo, ...costos({ km: q.km, modalidad: q.modalidad, refuerzo: VECINO.parte }), flujo: flujo({ mw: CASO.mw }), saee: q.saee };
    return { modo, ...flujo({ mw: q.mw, fp: q.fp, banco: q.banco }) };
}

// ------------------------------------------------------------------ la pose para la escena
/** Las líneas que solo aparecen en ciertos casos. */
export const SOLO = { vieja: 'antes', refuerzo: 'refuerzo', bahiaRefuerzo: 'refuerzo', saee: 'saee', banco: 'banco' };
export function pose({ modo = 'linea', noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, ...resto });
    const s = x => (x > 0.01 ? 0.15 + 0.8 * clamp01(x) : 0);
    // cuánto de la obra está hecho y cuánta energía sale de la central
    let obra = 1;
    let carga = 1;
    let entronque = true;
    let falla = null;
    let refuerzo = false;
    let saee = false;
    let banco = false;
    if (modo === 'pasos') { obra = L.obra; carga = L.carga * (L.conectada ? 1 : 0); entronque = L.obra >= 0.72; }
    else if (modo === 'linea') { carga = L.mw / CASO.mw; banco = L.banco; }
    else if (modo === 'falla') { carga = L.p; falla = { enFalla: L.enFalla, abierta: L.t >= L.tc, sale: !L.conectada }; }
    else { refuerzo = true; saee = true; }
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    const central = s(carga);
    for (const id of ['colectora1', 'colectora2', 'colectora3', 'colectora4', 'colectora5', 'colectora6', 'bajaT1', 'bajaT2', 'subeT1', 'subeT2', 'salida', 'enlace', 'bahiaCentral']) flujos[id] = central;
    // la red siempre lleva energía; en una falla, la línea que falló queda abierta
    const redAbierta = falla?.abierta || falla?.enFalla;
    flujos.bahiaRed1 = flujos.red1 = entronque ? 0.6 : 0;
    flujos.bahiaRed2 = flujos.red2 = entronque && !redAbierta ? 0.6 : 0;
    flujos.vieja = entronque ? 0 : 0.6;
    flujos.bahiaRefuerzo = flujos.refuerzo = refuerzo ? 0.4 : 0;
    flujos.banco = banco ? 0.6 : 0;
    flujos.saee = saee ? 0.5 : 0;
    for (const id of ['datosPlanta', 'fibra', 'datosPoi', 'datosCenace']) flujos[id] = obra >= 1 || modo !== 'pasos' ? 0.45 : 0.25;
    const activo = { sol: carga, central: carga, falla: falla?.enFalla ? 1 : 0, saee: saee ? 1 : 0, banco: banco ? 1 : 0, refuerzo: refuerzo ? 1 : 0 };
    const cam = camara || { mira: [0, 0.6, 0], az: 16, el: 30, d: 36 };
    return { t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, activo, obra, entronque, falla, refuerzo, saee, banco, camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 } };
}
export function estado(t) {
    return pose({ t, modo: 'linea', camara: { mira: [0, 0.6, 0], az: lerp(8, 22, t / 12), el: 30, d: 36 } });
}

// ------------------------------------------------------------------ revisiones
/** Cada cable llega a un borne (planta-comun/lineas.js) y cada línea que no remata en la orilla empieza y termina en uno. */
export const cablesSueltos = () => revisarCables(LINEAS, BORNES, REMATE);
export const puntasSueltas = () => cablesSueltos();
export const partesFuera = () => PARTES.filter(p => p.ancla[0] < BLOQUE.x[0] || p.ancla[0] > BLOQUE.x[1] || p.ancla[2] < BLOQUE.z[0] || p.ancla[2] > BLOQUE.z[1]).map(p => p.id);

/** Revisión de cifras contra las fuentes y contra la física. Devuelve la lista de lo que no cuadra. */
export function revisar() {
    const mal = [];
    const cerca = (a, b, tol, que) => { if (!(Math.abs(a - b) <= tol)) mal.push(`${que}: ${a} contra ${b}`); };
    // el flujo reproduce el estudio de la tesis UNAM con una cadena sencilla
    const f1 = flujo({ fp: 'unidad' });
    const fe = flujo({ fp: 'entrega' });
    const fa = flujo({ fp: 'absorbe' });
    cerca(fe.mvar, CASO.qFp95, 0.01, 'reactivos con fp 0.95 (tabla 20)');
    cerca(f1.vInv, CASO.tesis.vInvFp1, 0.006, 'tensión en inversores con fp 1');
    cerca(fe.vInv, CASO.tesis.vInvEntrega, 0.006, 'tensión en inversores entregando reactivos');
    cerca(fa.vInv, CASO.tesis.vInvAbsorbe, 0.006, 'tensión en inversores absorbiendo reactivos');
    cerca(fe.carga, CASO.tesis.cargaEntrega, 0.012, 'carga de los inversores entregando reactivos');
    if (!fe.sobrecarga || !fe.fueraTension) mal.push('entregando reactivos, la tesis marca sobrecarga y tensión alta');
    if (f1.sobrecarga || f1.fueraTension) mal.push('con fp 1 todo debe quedar en sus límites');
    const fb = flujo({ fp: 'entrega', banco: true });
    if (fb.sobrecarga) mal.push('con el banco, los inversores ya no deben sobrecargarse');
    cerca(f1.amperes, 452, 2, 'corriente de la línea a 90 MW');
    cerca(f1.perdLinea, 0.21, 0.01, 'pérdidas en la línea a 90 MW');
    if (f1.usoLinea > 0.55) mal.push('la línea va a la mitad de su capacidad');
    cerca(CORTO_MVA, 2770, 5, 'potencia de cortocircuito');
    cerca(SCR, 30.8, 0.2, 'relación de cortocircuito');
    if (TIPO !== 'D') mal.push(`una central de 90 MW es tipo D, no ${TIPO}`);
    cerca((TRAMOS.carga * SB), 0.22, 0.01, 'carga capacitiva de la línea, MVAr');
    // el Código de Red: la central asíncrona tipo D aguanta 0 voltios 450 ms y debe volver a 0.9 a 1.5 s
    cerca(envolvente(0.45), 0, 1e-9, 'Zona A a 450 ms');
    cerca(envolvente(1.05), 0.45, 1e-9, 'Zona A a 1.05 s');
    cerca(envolvente(1.5), 0.9, 1e-9, 'Zona A a 1.5 s');
    cerca(msPermitidos(0), 450, 0, 'falla franca que debe aguantar');
    if (!falla({ ms: 150, residual: 0 }).debeQuedarse) mal.push('una falla de 150 ms debe aguantarse');
    if (falla({ ms: 700, residual: 0 }).debeQuedarse) mal.push('con 700 ms a cero, la central ya puede salir');
    if (T_RECUPERA < RECUPERA[0] || T_RECUPERA > RECUPERA[1]) mal.push('la potencia vuelve entre 0.25 y 0.5 s');
    // el trámite: la tabla I.1 del MIC para 30 a 100 MW
    if (FILA.total !== 100 || FILA.indicativo + FILA.impacto + FILA.instalaciones + FILA.validacion !== 100) mal.push('tabla I.1: 100 días hábiles para 30 a 100 MW');
    const p = FILA.partes;
    if (p.indicativo + p.impacto + p.instalaciones + p.validacion !== FILA.costo) mal.push('tabla I.1: los costos no suman');
    if (TOTAL_DIAS <= ESTUDIOS.dias + MIC.revision) mal.push('el trámite dura más que los estudios');
    if (MIC.revision + ESTUDIOS.dias + ESTUDIOS.validacion > MIC.tope) mal.push('los estudios caben en los 280 días del MIC');
    // quién paga
    cerca(CONV_TOTAL.mw, 5970, 0.5, 'MW de la primera convocatoria');
    cerca(CONV_TOTAL.mdp, 11990, 0.5, 'millones de pesos de refuerzos de la primera convocatoria');
    cerca(PROYECTOS.reduce((s, x) => s + x.parte, 0), CONV_TOTAL.mdp, 0.5, 'el reparto de refuerzos compartidos');
    cerca(VECINO.parte, (756 * 180) / 310, 0.01, 'refuerzo del proyecto de San Luis de la Paz');
    cerca(costos().linea, 14.42, 0.01, 'línea de 4.76 km a precios de 2018');
    cerca(S_INVERSORES, 96.81, 0.01, 'capacidad de los inversores');
    if (SEGUNDA.saee !== 0.3 || SEGUNDA.horas !== 3) mal.push('segunda convocatoria: 30 % por tres horas');
    if (PRIMERA.permisos !== 18) mal.push('primera convocatoria: 18 permisos');
    for (const id of Object.keys(AEREAS)) if (!LINEAS.find(l => l.id === id)) mal.push(`falta la línea ${id}`);
    return mal;
}
