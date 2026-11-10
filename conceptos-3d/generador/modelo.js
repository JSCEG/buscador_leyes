// El modelo del generador: puro, sin three.js ni DOM. Lo leen la escena, el tablero, las gráficas y las pruebas, así que una cifra sale
// de un solo lugar. El generador es el de la Central Termoeléctrica Valle de México de la CFE, con los datos de placa que da una tesis de
// la UNAM: 340 MVA, 20 kV, 3,600 vueltas por minuto, enfriado con hidrógeno y agua. Los límites para sincronizar y la sobreexcitación son
// los de la norma CFE G0100-07, y lo que debe dar de potencia reactiva, los del Código de Red. Lo que no viene en las fuentes está marcado
// como «de ejemplo».
//
// Cuatro formas de verlo: cómo nace el voltaje (la velocidad y el campo), sincronizar con la red, cargar el generador (su curva de
// capabilidad) y lo que se calienta (y por qué se enfría con hidrógeno).
import { D2R, clamp, clamp01, lerp } from '../planta-comun/ayudas.js';

// ------------------------------------------------------------------ la placa (tesis UNAM, Central Termoeléctrica Valle de México)
/** S en MVA, V en kV, I en A; campo en A de corriente directa; H2 en kg/cm². */
export const GEN = { S: 340.16, V: 20, I: 9650, rpm: 3600, f: 60, polos: 2, campo: 3060, campoMax: 3519, excitacionV: 330, h2: 3.16, agua: 600, fabricante: 'Tecnomasio Italiano', modelo: 'T510162', excitacion: 'Unitrol D', aislamiento: 'F' };
/** Vueltas por minuto para cada frecuencia, según los polos: n = 120 × f ÷ polos. */
export const sincrona = (f = GEN.f, polos = GEN.polos) => (120 * f) / polos;

// ------------------------------------------------------------------ de ejemplo
/**
 * Factor de potencia nominal, reactancias (por unidad de 340 MVA) y la turbina: de ejemplo. Xd es la reactancia síncrona; X''d, la de los
 * primeros ciclos de una falla; la red se ve como una reactancia más. La saturación dobla la curva de vacío.
 */
export const EJ = { fp: 0.85, Xd: 1.8, Xdpp: 0.18, Xred: 0.1, sat: 0.25, turbina: 300, delta: 75 };
/** La fuerza que induce el campo a plena carga (por unidad), con el factor de potencia de ejemplo: E = |V + j Xd I|. */
export const E_PLENA = Math.hypot(1 + EJ.Xd * Math.sqrt(1 - EJ.fp ** 2), EJ.Xd * EJ.fp);
/** Corriente de campo que daría el voltaje nominal sin carga si no hubiera saturación: la placa dice 3,060 A a plena carga. */
export const IF_AIRE = GEN.campo / E_PLENA;
export const E_MAX = GEN.campoMax / IF_AIRE;

// ------------------------------------------------------------------ las reglas
/** CFE G0100-07, tabla 4: diferencias máximas al sincronizar, para la norma, el verificador (25) y el sincronizador automático (25A). */
export const SINCRO = { norma: { dV: 5, df: 0.067, dA: 10 }, verificador: { dV: 4, df: 0.06, dA: 7 }, automatico: { dV: 3, df: 0.04, dA: 5 }, ventanaV: [90, 110], ventanaF: [58.2, 61] };
/** CFE G0100-07: sobreexcitación (V/Hz). Alarma a 105 % en 1 s; sin curva del fabricante, disparo a 106 % en 100 s, 108 % en 30 s y 116 % en 0.5 s. */
export const VHZ = { alarma: 105, pasos: [{ pct: 106, s: 100 }, { pct: 108, s: 30 }, { pct: 116, s: 0.5 }] };
/** Código de Red: una central síncrona debe dar y absorber reactiva (factor de potencia 0.95), y las grandes, ±0.33 de su potencia máxima. */
export const CODIGO = { fp: 0.95, qp: 0.33, v: [0.95, 1.05], tipoD: 30 };
/** Hidrógeno contra aire (tesis UNAM): calor específico ~14 veces, conductividad ~7, pesa 1/14; ventilación de 1/10 a 1/12; explota del 5 al 75 %. */
export const H2 = { calor: 14, conduce: 7, peso: 1 / 14, ventilacion: [10, 12], explota: [5, 75], sobrepresion: [0.33, 1.2] };

export const DEF = { rpm: 3600, campo: Math.round(IF_AIRE), rpmS: 3603, vS: 101, P: 250, campoC: 2600, cargaE: 0.85, medio: 'h2' };
export const LIMITES = { rpm: [0, 3780], campo: [0, GEN.campoMax], rpmS: [3570, 3630], vS: [94, 106], P: [0, 340], campoC: [600, GEN.campoMax], cargaE: [0.1, 1] };

// ------------------------------------------------------------------ cómo nace el voltaje
/** Curva de vacío: el voltaje, por unidad, que da cada corriente de campo (por unidad de IF_AIRE) a la velocidad nominal; satura, de ejemplo. */
export const curvaVacio = x => (x * (1 + EJ.sat)) / (1 + EJ.sat * x);
/** El generador sin carga: la frecuencia sale de la velocidad; el voltaje, de la velocidad y del campo. V/Hz, de cada 100 de lo nominal. */
export function vacio({ rpm = DEF.rpm, campo = DEF.campo } = {}) {
    const f = (rpm * GEN.polos) / 120;
    const e = curvaVacio(campo / IF_AIRE); // a la velocidad nominal
    const v = e * (rpm / GEN.rpm); // por unidad de 20 kV
    const vhz = rpm > 1 ? (v / (f / GEN.f)) * 100 : 0;
    return { rpm, campo, f, e, v, kV: v * GEN.V, vhz, alarma: vhz > VHZ.alarma, omega: (2 * Math.PI * f) };
}

// ------------------------------------------------------------------ sincronizar
/** La aguja del sincronoscopio gira con la diferencia de frecuencia; la aguja «rápido» es la del generador más rápido que la red. */
export function sincro({ rpmS = DEF.rpmS, vS = DEF.vS, angulo = 0 } = {}) {
    const fg = (rpmS * GEN.polos) / 120;
    const df = fg - GEN.f;
    const dV = vS - 100;
    const a = ((((angulo + 180) % 360) + 360) % 360) - 180; // de −180 a 180
    const v = SINCRO.verificador;
    const ok = { dV: dV >= 0 && dV <= v.dV, df: df > 0 && df <= v.df, dA: Math.abs(a) <= v.dA };
    // si se cierra aquí: la diferencia de voltajes empuja corriente por X''d y la red
    const e = vS / 100;
    const golpe = Math.hypot(e * Math.cos(a * D2R) - 1, e * Math.sin(a * D2R)) / (EJ.Xdpp + EJ.Xred);
    return { fg, df, dV, angulo: a, ok, puede: ok.dV && ok.df && ok.dA, golpe, kA: (golpe * GEN.I) / 1000, vuelta: df !== 0 ? Math.abs(1 / df) : Infinity };
}

// ------------------------------------------------------------------ cargar el generador
/**
 * Con la red fija en 1 por unidad: la turbina da P (MW) y el campo da E. P = E × V × sen δ ÷ Xd; Q = (E × V × cos δ − V²) ÷ Xd.
 * δ es el ángulo de carga: cuánto se adelanta el rotor. Si P pide más que E ÷ Xd, el generador se sale de paso.
 */
export function carga({ P = DEF.P, campoC = DEF.campoC } = {}) {
    const p = P / GEN.S;
    const E = campoC / IF_AIRE;
    const s = (p * EJ.Xd) / E;
    const paso = s <= 1;
    const d = paso ? Math.asin(s) : Math.PI / 2;
    const q = (E * Math.cos(d) - 1) / EJ.Xd;
    const i = Math.hypot(p, q);
    const fp = i > 0 ? p / i : 1;
    const limites = { estator: i > 1, campo: campoC > GEN.campoMax, turbina: P > EJ.turbina, estabilidad: d / D2R > EJ.delta, paso: !paso };
    return { P, campoC, p, q, Q: q * GEN.S, E, delta: d / D2R, i, I: i * (GEN.S * 1e3) / (Math.sqrt(3) * GEN.V), fp, paso, limites, dentro: !Object.values(limites).some(Boolean), adelanto: q < 0 };
}
/** La curva de capabilidad: los cuatro límites, como puntos (p, q) por unidad. */
export function capabilidad(n = 60) {
    const estator = [];
    const campo = [];
    const estabilidad = [];
    for (let k = 0; k <= n; k++) {
        const a = -Math.PI / 2 + (k / n) * Math.PI;
        estator.push([Math.cos(a), Math.sin(a)]);
    }
    const R = E_MAX / EJ.Xd;
    const c = -1 / EJ.Xd;
    for (let k = 0; k <= n; k++) { const p = (k / n) * R; campo.push([p, c + Math.sqrt(Math.max(0, R * R - p * p))]); }
    for (let k = 0; k <= n; k++) { const E = 0.3 + (k / n) * (E_MAX - 0.3); const d = EJ.delta * D2R; estabilidad.push([(E * Math.sin(d)) / EJ.Xd, (E * Math.cos(d) - 1) / EJ.Xd]); }
    return { estator, campo, estabilidad, turbina: EJ.turbina / GEN.S, codigo: CODIGO.qp };
}
/** El límite de Q a una potencia p: arriba lo pone el estator o el campo; abajo, el estator o la estabilidad. */
export function limitesQ(p) {
    const est = p <= 1 ? Math.sqrt(1 - p * p) : 0;
    const R = E_MAX / EJ.Xd;
    const campo = p <= R ? -1 / EJ.Xd + Math.sqrt(R * R - p * p) : -Infinity;
    // estabilidad: con δ en su límite, p = E sen δ ÷ Xd → E = p Xd ÷ sen δ
    const d = EJ.delta * D2R;
    const E = (p * EJ.Xd) / Math.sin(d);
    const estab = (E * Math.cos(d) - 1) / EJ.Xd;
    return { arriba: Math.min(est, campo), abajo: Math.max(-est, estab), estator: est, campo, estabilidad: estab };
}

// ------------------------------------------------------------------ lo que se calienta
/**
 * Pérdidas en MW a una carga (de cada 1 de 340 MVA, con el factor de potencia de ejemplo). El campo sale de la placa: 330 V × 3,060 A a
 * plena carga. El núcleo, el cobre del estator y la ventilación con aire son de ejemplo; con hidrógeno, la ventilación baja a 1/11.
 */
export const PERD = { nucleo: 0.75, cobre: 1.1, aire: 2.4, campo: (GEN.excitacionV * GEN.campo) / 1e6 };
export function perdidas({ cargaE = DEF.cargaE, medio = DEF.medio } = {}) {
    const s = cargaE;
    const P = s * GEN.S * EJ.fp;
    // el campo crece con la carga: de vacío a plena carga, como E
    const E = Math.hypot(1 + EJ.Xd * s * Math.sqrt(1 - EJ.fp ** 2), EJ.Xd * s * EJ.fp);
    const campo = PERD.campo * (E / E_PLENA) ** 2;
    const cobre = PERD.cobre * s * s;
    const ventilacion = medio === 'h2' ? PERD.aire / ((H2.ventilacion[0] + H2.ventilacion[1]) / 2) : PERD.aire;
    const total = PERD.nucleo + cobre + campo + ventilacion;
    return { cargaE, medio, P, nucleo: PERD.nucleo, cobre, campo, ventilacion, total, eficiencia: P / (P + total), corriente: (E * IF_AIRE) };
}

// ------------------------------------------------------------------ el tiempo de la escena
export const estadoPlanta = () => ({ t: 0, angulo: 140, cerrado: false, golpe: 0, golpeCierre: 0 });
const aMedia = a => ((((a + 180) % 360) + 360) % 360) - 180;
/** Un paso: la aguja del sincronoscopio avanza con la diferencia de frecuencia; cerrado, se queda en cero. */
export function pasoPlanta(s, m, dt) {
    const n = { ...s };
    n.t += dt;
    if (m.modo === 'sincronizar') {
        // al cerrar, la aguja se toma de −180 a 180°: así regresa a cero por el camino corto
        if (m.cerrar && !n.cerrado) { n.cerrado = true; n.angulo = aMedia(n.angulo); n.golpe = n.golpeCierre = sincro({ ...m, angulo: n.angulo }).golpe; }
        if (!m.cerrar) n.cerrado = false;
        if (n.cerrado) n.angulo = lerp(n.angulo, 0, Math.min(1, dt * 3));
        else n.angulo = (n.angulo + 360 * ((m.rpmS * GEN.polos) / 120 - GEN.f) * dt) % 360;
    }
    n.golpe = Math.max(0, n.golpe - dt * 0.8);
    return n;
}

// ------------------------------------------------------------------ las lecturas
export function calcular({ modo = 'voltaje', planta = null, rpm = DEF.rpm, campo = DEF.campo, rpmS = DEF.rpmS, vS = DEF.vS, P = DEF.P, campoC = DEF.campoC, cargaE = DEF.cargaE, medio = DEF.medio } = {}) {
    const L = { modo };
    if (modo === 'voltaje') Object.assign(L, vacio({ rpm, campo }));
    else if (modo === 'sincronizar') {
        Object.assign(L, sincro({ rpmS, vS, angulo: planta?.angulo ?? 140 }), { rpmS, vS, cerrado: planta?.cerrado ?? false, golpeAhora: planta?.golpe ?? 0 });
        // cerrado, lo que cuenta es el golpe de cuando se cerró
        if (L.cerrado) { L.golpe = planta.golpeCierre; L.kA = (L.golpe * GEN.I) / 1000; }
    }
    else if (modo === 'carga') Object.assign(L, carga({ P, campoC }));
    else Object.assign(L, perdidas({ cargaE, medio }));
    return L;
}

// ------------------------------------------------------------------ acomodo (no está a escala)
export const BLOQUE = { x: [-8.2, 8.2], z: [-3.2, 3.2], y: [-0.4, 0] };
/** El eje a lo largo de x; en y = EJE.y. */
export const EJE = { y: 1.0, z: 0 };
export const X = { hp: [-6.7, -5.3], lp: [-5.1, -3.4], cople: -3.08, estator: [-2.7, 1.5], rotor: [-2.95, 1.85], anillos: [2.25, 2.75], chumaceras: [-6.95, -3.25, 1.95, 3.05] };
export const R = { hp: 0.45, lp: 0.78, estator: 1.0, rotor: 0.5, anillos: 0.28 };
export const SITIO = {
    excitacion: [4.7, -1.7], trafoExc: [4.7, -2.7], hidrogeno: [-4.6, 2.3], agua: [-2.3, 2.35],
    bus: { z: 2.0, y: 0.55, x: [-0.6, 5.2] }, interruptor: [2.9, 2.0], transformador: [6.1, 2.0], sincro: [0.9, 2.95],
};
export const FLUIDOS = {
    vapor: { nombre: 'Vapor que mueve la turbina', color: '#c9ced6' },
    elec: { nombre: 'Energía que sale a la red', color: '#f2b233' },
    campo: { nombre: 'Corriente directa del campo', color: '#c2185b' },
    h2: { nombre: 'Hidrógeno', color: '#7fb7e6' },
    agua: { nombre: 'Agua de los devanados', color: '#2f7fd1' },
};
const bz = SITIO.bus.z;
export const LINEAS = [
    { id: 'vapor', fluido: 'vapor', r: 0.09, puntos: [[BLOQUE.x[0] + 0.05, 2.3, -0.6], [-7.3, 2.3, -0.6], [-6.4, 2.0, -0.3], [-6.0, EJE.y + R.hp + 0.02, 0]] },
    { id: 'campo', fluido: 'campo', r: 0.03, cable: true, puntos: [[SITIO.excitacion[0] - 0.35, 1.2, SITIO.excitacion[1]], [3.6, 1.7, -1.0], [2.5, EJE.y + R.anillos + 0.25, -0.12]] },
    { id: 'h2', fluido: 'h2', r: 0.035, puntos: [[SITIO.hidrogeno[0] + 0.3, 1.05, SITIO.hidrogeno[1] - 0.2], [-3.4, 1.75, 1.3], [-2.4, EJE.y + 0.75, 0.72]] },
    { id: 'agua', fluido: 'agua', r: 0.04, puntos: [[SITIO.agua[0] + 0.1, 0.75, SITIO.agua[1] - 0.25], [SITIO.agua[0] + 0.3, 1.3, 1.4], [-1.7, EJE.y + 0.6, 0.85]] },
    { id: 'bus', fluido: 'elec', r: 0.05, oculto: true, puntos: [[-0.6, 0.1, 0.6], [-0.6, SITIO.bus.y, 1.2], [-0.6, SITIO.bus.y, bz], [SITIO.interruptor[0] - 0.35, SITIO.bus.y, bz]] },
    { id: 'salida', fluido: 'elec', r: 0.05, oculto: true, puntos: [[SITIO.interruptor[0] + 0.35, SITIO.bus.y, bz], [SITIO.bus.x[1], SITIO.bus.y, bz], [SITIO.transformador[0] - 0.6, 1.0, bz]] },
    { id: 'linea', fluido: 'elec', r: 0.02, cable: true, puntos: [[SITIO.transformador[0] + 0.2, 2.15, bz], [7.2, 2.5, bz], [BLOQUE.x[1] - 0.1, 2.6, bz]] },
];
export const REMATE = new Set(['vapor (inicio)', 'linea (fin)']); // el vapor viene de la caldera y la línea sigue a la subestación, fuera del dibujo
/** Cajas de los equipos: x0, x1, y0, y1, z0, z1. */
export const EQUIPOS = {
    turbina: [X.hp[0], X.lp[1], 0, EJE.y + R.lp, -R.lp, R.lp],
    estator: [X.estator[0], X.estator[1], 0, EJE.y + R.estator + 0.1, -1.1, 1.1],
    anillos: [X.anillos[0] - 0.1, X.anillos[1] + 0.1, 0, EJE.y + R.anillos + 0.35, -0.5, 0.5],
    excitacion: [SITIO.excitacion[0] - 0.5, SITIO.excitacion[0] + 0.5, 0, 1.5, SITIO.excitacion[1] - 0.4, SITIO.excitacion[1] + 0.4],
    hidrogeno: [SITIO.hidrogeno[0] - 0.5, SITIO.hidrogeno[0] + 0.5, 0, 1.3, SITIO.hidrogeno[1] - 0.4, SITIO.hidrogeno[1] + 0.4],
    agua: [SITIO.agua[0] - 0.5, SITIO.agua[0] + 0.5, 0, 1.0, SITIO.agua[1] - 0.4, SITIO.agua[1] + 0.4],
    interruptor: [SITIO.interruptor[0] - 0.4, SITIO.interruptor[0] + 0.4, 0, 1.2, bz - 0.4, bz + 0.4],
    transformador: [SITIO.transformador[0] - 0.7, SITIO.transformador[0] + 0.7, 0, 2.3, bz - 0.6, bz + 0.6],
    torre: [7.0, 7.4, 0, 2.7, bz - 0.2, bz + 0.2],
};

/** Puntos clave: dónde va el número y desde dónde se ve. */
export const PARTES = [
    { id: 'turbina', ancla: [-5.0, EJE.y + R.lp + 0.15, 0.2], vista: { az: 24, el: 18, tam: 4.2, mira: [-5.1, 1.0, 0] } },
    { id: 'eje', ancla: [X.cople, EJE.y + 0.4, 0.3], vista: { az: 10, el: 58, tam: 2.4, mira: [X.cople, EJE.y, 0] } },
    { id: 'rotor', ancla: [0.9, EJE.y + 0.2, 0.55], vista: { az: -20, el: 20, tam: 3.4, mira: [-0.5, EJE.y, 0] } },
    { id: 'campo', ancla: [-0.9, EJE.y + 0.35, 0.5], vista: { az: -14, el: 28, tam: 2.6, mira: [-0.6, EJE.y, 0] } },
    { id: 'nucleo', ancla: [-2.2, EJE.y + 0.7, 0.75], vista: { az: 32, el: 22, tam: 3.4, mira: [-0.6, EJE.y, 0] } },
    { id: 'barras', ancla: [-1.4, EJE.y + 0.7, 0.3], vista: { az: -12, el: 34, tam: 3.4, mira: [-0.6, EJE.y + 0.3, 0] } },
    { id: 'escobillas', ancla: [2.55, EJE.y + R.anillos + 0.3, 0.25], vista: { az: 36, el: 16, tam: 1.6, mira: [2.5, EJE.y + 0.1, 0] } },
    { id: 'excitacion', ancla: [SITIO.excitacion[0], 1.7, SITIO.excitacion[1] + 0.2], vista: { az: 20, el: 18, tam: 2.4, mira: [SITIO.excitacion[0], 0.8, SITIO.excitacion[1] - 0.4] } },
    { id: 'hidrogeno', ancla: [SITIO.hidrogeno[0], 1.3, SITIO.hidrogeno[1]], vista: { az: 18, el: 22, tam: 2.6, mira: [SITIO.hidrogeno[0] + 0.4, 0.7, SITIO.hidrogeno[1] - 0.3] } },
    { id: 'agua', ancla: [SITIO.agua[0], 1.05, SITIO.agua[1]], vista: { az: 22, el: 22, tam: 2.4, mira: [SITIO.agua[0] + 0.2, 0.6, SITIO.agua[1] - 0.3] } },
    { id: 'bus', ancla: [1.8, SITIO.bus.y + 0.3, bz], vista: { az: 22, el: 50, tam: 3.6, mira: [1.2, 0.4, bz - 0.3] } },
    { id: 'interruptor', ancla: [SITIO.interruptor[0], 1.12, bz + 0.2], vista: { az: 24, el: 18, tam: 1.8, mira: [SITIO.interruptor[0], 0.6, bz] } },
    { id: 'sincro', ancla: [SITIO.sincro[0] + 0.45, 1.55, SITIO.sincro[1] + 0.05], vista: { az: 6, el: 8, tam: 1.3, mira: [SITIO.sincro[0], 1.1, SITIO.sincro[1]] } },
    { id: 'transformador', ancla: [SITIO.transformador[0], 2.45, bz + 0.3], vista: { az: -22, el: 18, tam: 2.8, mira: [SITIO.transformador[0], 1.1, bz] } },
];

// ------------------------------------------------------------------ la pose
/** Qué tan rápido gira a la vista: proporcional a las vueltas por minuto (aquí, despacio). */
export const giroVista = rpm => (rpm / GEN.rpm) * 5;
export function pose({ modo = 'voltaje', planta = null, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, planta, ...resto });
    const rpm = modo === 'voltaje' ? L.rpm : modo === 'sincronizar' ? L.rpmS : GEN.rpm;
    const cerrado = modo === 'carga' || modo === 'calor' || (modo === 'sincronizar' && L.cerrado);
    const campoA = modo === 'voltaje' ? L.campo : modo === 'carga' ? L.campoC : modo === 'calor' ? L.corriente : (L.vS / 100) * IF_AIRE;
    const potencia = modo === 'carga' ? clamp01(L.P / GEN.S) : modo === 'calor' ? L.cargaE * EJ.fp : cerrado ? 0.02 : 0;
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    flujos.vapor = 0.1 + 0.9 * (modo === 'voltaje' ? clamp01(rpm / GEN.rpm) * 0.2 : modo === 'sincronizar' ? 0.15 : potencia);
    flujos.campo = clamp01(campoA / GEN.campoMax);
    flujos.h2 = modo === 'calor' && L.medio === 'aire' ? 0 : 0.35;
    flujos.agua = 0.3 + 0.6 * (modo === 'calor' ? L.cargaE : potencia);
    flujos.bus = flujos.salida = flujos.linea = cerrado ? 0.15 + 0.85 * potencia : 0;
    const cam = camara || { mira: [0, 1.0, 0], az: 24, el: 24, d: 30 };
    const fueraDePaso = modo === 'carga' && !L.paso;
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, rpm, cerrado, fueraDePaso,
        aguja: modo === 'sincronizar' ? (L.cerrado ? planta?.angulo ?? 0 : L.angulo) : 0,
        golpe: modo === 'sincronizar' ? (L.golpeAhora > 0.05 && L.golpe > 2 ? clamp01(L.golpeAhora) : 0) : 0,
        activo: {
            vapor: flujos.vapor, campo: flujos.campo, elec: cerrado ? 1 : 0,
            calor: modo === 'calor' ? clamp01((L.total - 2) / 3) : modo === 'carga' ? clamp01((L.i - 0.8) * 3) + (L.limites.campo ? 0.5 : 0) : 0,
            alarma: modo === 'voltaje' && L.alarma ? 1 : fueraDePaso ? 1 : 0,
            h2: modo === 'calor' && L.medio === 'aire' ? 0 : 1,
            golpe: modo === 'sincronizar' && L.cerrado && L.golpe > 2 ? clamp01(L.golpeAhora) : 0,
        },
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'voltaje', camara: { mira: [0, 1.0, 0], az: lerp(14, 30, t / 12), el: 24, d: 30 } });
}

// ------------------------------------------------------------------ revisiones
const dentro = (p, c, h = 0.08) => p[0] >= c[0] - h && p[0] <= c[1] + h && p[1] >= c[2] - h && p[1] <= c[3] + h && p[2] >= c[4] - h && p[2] <= c[5] + h;
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
        if (REMATE.has(`${L.id} (${nombre})`)) continue;
        if (!Object.values(EQUIPOS).some(c => dentro(p, c))) sueltas.push(`${L.id} (${nombre})`);
    }
    return sueltas;
}
/** Revisión de cifras contra la placa y las reglas. */
export function revisar() {
    const p = [];
    const entre = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    entre(sincrona(), 3600, 3600, 'dos polos a 60 Hz: 3,600 vueltas por minuto');
    entre(sincrona(60, 56), 128.5, 128.6, 'una hidroeléctrica de 56 polos: 128.6 vueltas por minuto');
    entre((GEN.S * 1e3) / (Math.sqrt(3) * GEN.V), 9800, 9840, 'la corriente de 340 MVA en 20 kV');
    entre(GEN.I, 9600, 9840, 'la placa dice 9,650 A, cerca de la cuenta');
    entre(EJ.Xd, 1.3, 2.5, 'reactancia síncrona de ejemplo, del orden de las reales');
    entre(GEN.campoMax / GEN.campo, 1.1, 1.2, 'el campo máximo pasa por poco al de plena carga');
    // vacío: a 3,600 rpm y con su campo, 20 kV a 60 Hz; a media velocidad, mitad de voltaje y frecuencia
    const v = vacio({});
    entre(v.kV, 19.99, 20.01, 'sin carga, a 3,600 vueltas y con su campo: 20 kV');
    entre(v.f, 60, 60, 'y 60 Hz');
    const media = vacio({ rpm: 1800 });
    entre(media.f, 30, 30, 'a la mitad de la velocidad, 30 Hz');
    entre(media.vhz, 99.9, 100.1, 'y la mitad del voltaje: la relación V/Hz no cambia');
    entre(vacio({ campo: GEN.campoMax }).vhz, 150, 260, 'con todo el campo y sin carga, el voltaje se pasaría por mucho');
    entre(vacio({ rpm: 3000 }).vhz, 99.9, 100.1, 'si baja la velocidad con el mismo campo, V/Hz se queda igual');
    entre(vacio({ rpm: 3000, campo: IF_AIRE * 1.3 }).vhz, VHZ.alarma, 200, 'subir el campo con poca velocidad da sobreexcitación');
    // sincronizar
    const s = sincro({ rpmS: 3603, vS: 102, angulo: 3 });
    entre(s.puede ? 1 : 0, 1, 1, 'con 0.05 Hz de más, 2 % de voltaje y 3° de diferencia, se puede cerrar');
    entre(sincro({ rpmS: 3597, vS: 102, angulo: 3 }).puede ? 1 : 0, 0, 0, 'más lento que la red no: tomaría potencia');
    entre(sincro({ rpmS: 3603, vS: 102, angulo: 20 }).puede ? 1 : 0, 0, 0, 'con 20° de diferencia no');
    entre(sincro({ rpmS: 3603, vS: 100, angulo: 120 }).golpe, 5, 7, 'cerrar a 120°: unas seis veces la corriente nominal');
    entre(sincro({ rpmS: 3603, vS: 101, angulo: 2 }).golpe, 0, 0.2, 'cerrar bien: casi nada');
    entre(sincro({ rpmS: 3603 }).vuelta, 19.9, 20.1, 'con 0.05 Hz de diferencia, la aguja da una vuelta cada 20 s');
    // carga: el punto nominal da la placa
    const n = carga({ P: GEN.S * EJ.fp, campoC: GEN.campo });
    entre(n.i, 0.995, 1.005, 'a plena carga y con 3,060 A de campo: la corriente nominal');
    entre(n.fp, 0.845, 0.855, 'con el factor de potencia de ejemplo');
    entre(n.delta, 25, 45, 'el ángulo de carga, unos 35°');
    const poco = carga({ P: 250, campoC: 1750 });
    entre(poco.adelanto && poco.paso && !poco.limites.estabilidad ? 1 : 0, 1, 1, 'con menos campo, absorbe reactiva sin perder el paso');
    entre(-poco.Q, 80, 120, 'unos 90 MVAr, casi lo que pide el Código');
    entre(carga({ P: 300, campoC: 700 }).paso ? 1 : 0, 0, 0, 'con mucha potencia y poco campo, se sale de paso');
    const c = limitesQ(EJ.turbina / GEN.S);
    const qCod = (CODIGO.qp * EJ.turbina) / GEN.S;
    entre(c.arriba, qCod, 1, 'a la potencia de la turbina, alcanza a dar la reactiva que pide el Código (un tercio)');
    entre(c.abajo, -1, -qCod, 'y a absorberla');
    // calor: con hidrógeno, eficiencia de casi 99 %; con aire, menos
    const h = perdidas({ cargaE: 1, medio: 'h2' });
    const a = perdidas({ cargaE: 1, medio: 'aire' });
    entre(h.campo, 1.0, 1.02, 'el campo: 330 V × 3,060 A');
    entre(h.eficiencia, 0.985, 0.995, 'con hidrógeno, cerca de 99 %');
    entre(a.eficiencia, 0.975, h.eficiencia - 0.004, 'con aire, menos');
    entre(a.ventilacion / h.ventilacion, 10, 12, 'la ventilación con hidrógeno es de 1/10 a 1/12');
    entre(h.corriente, GEN.campo - 5, GEN.campo + 5, 'a plena carga, el campo de la placa');
    entre(clamp(1, 0, 2), 1, 1, 'ayudas');
    return p;
}
