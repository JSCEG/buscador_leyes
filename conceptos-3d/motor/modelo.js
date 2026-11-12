// El modelo del motor: puro, sin three.js ni DOM. Lo leen la escena, el tablero, las gráficas y las pruebas, así que una cifra sale de un
// solo lugar. El motor es el WEG de 2 HP, 4 polos y 460 V que probó una tesis de la UNAM (FES Aragón, 2006): en vacío, al arranque, a par
// máximo, a plena carga, de temperatura y de eficiencia. Un circuito equivalente ajustado a esas pruebas da el par, la corriente y las
// pérdidas a cualquier velocidad. La eficiencia mínima es la de la NOM-016-ENER-2025; los consejos, los de la guía de la CONUEE. Lo que no
// viene en las fuentes está marcado como «de ejemplo».
//
// Cuatro formas de verlo: cómo gira (el campo y el deslizamiento), el arranque, la eficiencia con carga y la temperatura.
import { D2R, clamp, clamp01, lerp } from '../planta-comun/ayudas.js';

const R3 = Math.sqrt(3);
// ------------------------------------------------------------------ el motor (tesis UNAM, FES Aragón, 2006)
export const MOTOR = { marca: 'WEG', hecho: 'México', hp: 2, kW: 1.492, polos: 4, f: 60, V: 460, Vyy: 230, rpm: 1765, clase: 'F', nema: 'B', letra: 'L' };
/** Par nominal: 1.492 kW × 9,549 ÷ 1,765 rpm. */
export const TNOM = (MOTOR.kW * 9549) / MOTOR.rpm;
export const sincrona = (f = MOTOR.f, polos = MOTOR.polos) => (120 * f) / polos;
/** Lo que se midió. V, A, W, N·m, rpm, °C. El vacío se hizo en doble estrella a 230 V; el resto, en estrella a 460 V. */
export const PRUEBAS = {
    frio: { R: 8.887, t: 21.4 },
    vacio: { V: 230.35, I: 4.466, P: 168.9, rpm: 1799.9 },
    arranque: { V: 461.41, I: 25.202, P: 15510, par: 20.93, pct: 259.35, kvaHp: 10.03 },
    maximo: { V: 459.41, par: 26.23, pct: 325.03 },
    plena: { V: 460.38, I: 3.114, P: 1751.2, fp: 0.705, par: 8.09, rpm: 1761.9 },
    temperatura: { devanado: 79.46, aumento: 53.86, permitido: 115, ambiente: 25.6 },
};
/** La prueba de eficiencia: carga (%), eficiencia (%), entrada (W), par (N·m), rpm. */
export const EFICIENCIA = [[130.6, 83.8, 2324.7, 10.65, 1746.9], [115.5, 84.0, 2050.5, 9.44, 1753.8], [100.8, 83.9, 1792.6, 8.26, 1760.2], [76.2, 82.8, 1373.4, 6.26, 1770.7], [50.5, 79.1, 951.7, 4.20, 1781.0], [25.0, 67.8, 551.4, 2.16, 1790.5]];
/** Las pérdidas a plena carga, en W: cobre del estator y del rotor, núcleo, fricción y ventilación, indeterminadas. */
export const PERDIDAS = { estator: 161.35, rotor: 33.67, nucleo: 79.41, friccion: 11.58, otras: 1.67 };
/** Temperatura del armazón cada media hora a plena carga (h, °C). */
export const ARMAZON = [[0, 21.5], [0.5, 43.2], [1, 52.0], [1.5, 53.7], [2, 55.4], [2.5, 57.6], [3, 59.2], [3.5, 61.0], [4, 61.5]];

// ------------------------------------------------------------------ las reglas
/** Eficiencia nominal a plena carga de un motor cerrado de 2 HP y 4 polos: NOM-016-ENER-2002 (la de la tesis) y NOM-016-ENER-2025. */
export const NORMA = { y2002: 84.0, min2002: 81.5, y2025: 86.5, vigor: 180 };
/** CONUEE: 61 % de la energía de la industria; 2.6 millones de motores; que trabajen entre 65 y 100 %; voltaje ±5 %; desbalance ≤ 1 %. */
export const CONUEE = { industria: 61, motores: 2.6, factor: [65, 100], voltaje: 5, bajo: [2, 4], desbalance: 1 };

// ------------------------------------------------------------------ de ejemplo
/**
 * El circuito equivalente por fase (Ω): el estator en caliente, la magnetización, la dispersión en marcha y al arranque (con tanta
 * corriente se satura), y el rotor. Se ajusta a las pruebas: par al arranque, par a plena carga y par máximo. Lo que arrastra al arrancar,
 * la inercia, las rampas, cuánto tarda en calentarse y el horario del año: de ejemplo.
 */
export const EJ = { Xm: 116.1, Xmarcha: 13.6, Xarranque: 6.7435, J: 0.03, rampa: 4, cargaArranque: 0.8, tiempos: [0.3, 1.9], reparto: 0.51, armazon: 0.71 };
const R1 = (PRUEBAS.frio.R / 2) * ((PRUEBAS.temperatura.devanado + 234.5) / (PRUEBAS.frio.t + 234.5));
/** Reactancia de dispersión a 60 Hz: baja hacia el arranque, cuando la corriente satura. */
const Xdisp = s => EJ.Xmarcha + (EJ.Xarranque - EJ.Xmarcha) * clamp(s, 0, 1) ** 2;
/** El circuito a un voltaje V (entre fases), una frecuencia f y un deslizamiento s, con la resistencia del rotor R2. */
function circuito(V, f, s, R2r) {
    const k = f / MOTOR.f;
    const Vf = V / R3;
    const X = Xdisp(s) * k;
    const Xm = EJ.Xm * k;
    const ss = Math.max(s, 1e-5);
    // rotor en paralelo con la magnetización
    const zr = { r: R2r / ss, i: X / 2 };
    const den = zr.r ** 2 + (zr.i + Xm) ** 2;
    const zp = { r: (Xm * Xm * zr.r) / den, i: (Xm * (zr.r ** 2 + zr.i * (zr.i + Xm))) / den };
    const z = { r: R1 + zp.r, i: X / 2 + zp.i };
    const I = Vf / Math.hypot(z.r, z.i);
    const Pag = 3 * I * I * zp.r;
    const ws = (2 * Math.PI * sincrona(f)) / 60;
    return { I, fp: z.r / Math.hypot(z.r, z.i), Pag, par: f > 0 ? Pag / ws : 0, cobre1: 3 * I * I * R1, cobre2: s * Pag };
}
// el rotor: más resistencia al arranque (las barras profundas), menos en marcha; se ajusta a las pruebas
const sN = 1 - 1760.2 / sincrona();
const ajustar = (s, par, sube) => { let a = 0.05; let b = 40; for (let i = 0; i < 90; i++) { const m = (a + b) / 2; if ((circuito(MOTOR.V, MOTOR.f, s, m).par < par) === sube) a = m; else b = m; } return (a + b) / 2; };
export const ROTOR = { marcha: ajustar(sN, 8.26, false), arranque: ajustar(1, PRUEBAS.arranque.par, true) };
const R2 = s => ROTOR.marcha + (ROTOR.arranque - ROTOR.marcha) * clamp(s, 0, 1);
/** El motor a un voltaje, una frecuencia y una velocidad (rpm). */
export function motorEn(V, f, rpm) {
    const ns = sincrona(f);
    const s = ns > 0 ? (ns - rpm) / ns : 1;
    const c = circuito(V, f, s, R2(s));
    const nucleo = PERDIDAS.nucleo * (V / MOTOR.V / Math.max(f / MOTOR.f, 0.05)) ** 2 * (f / MOTOR.f) ** 1.5;
    const friccion = PERDIDAS.friccion * (rpm / sincrona()) ** 2;
    const otras = PERDIDAS.otras * (c.I / PRUEBAS.plena.I) ** 2;
    const util = Math.max(0, c.par * ((2 * Math.PI * rpm) / 60) - friccion - otras);
    const Pin = 3 * (V / R3) * c.I * c.fp + nucleo;
    return { V, f, rpm, s, ns, I: c.I, fp: c.fp, par: c.par, Pin, util, cobre1: c.cobre1, cobre2: c.cobre2, nucleo, friccion, otras, perd: c.cobre1 + c.cobre2 + nucleo + friccion + otras, ef: Pin > 0 ? util / Pin : 0 };
}
/** La velocidad a la que el par del motor iguala al de la carga (constante): la busca entre el par máximo y la síncrona. */
export function operacion(V, f, carga) {
    const ns = sincrona(f);
    const T = carga * TNOM;
    let a = ns * 0.8;
    let b = ns;
    // el par crece al bajar de la síncrona hasta su máximo
    for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (motorEn(V, f, m).par > T) a = m; else b = m; }
    return motorEn(V, f, (a + b) / 2);
}
/** El par máximo a 460 V y 60 Hz, y a qué velocidad. */
export function parMaximo(V = MOTOR.V, f = MOTOR.f) {
    let m = { par: 0, rpm: 0 };
    for (let k = 0; k <= 600; k++) { const rpm = (sincrona(f) * k) / 600; const p = motorEn(V, f, rpm).par; if (p > m.par) m = { par: p, rpm }; }
    return m;
}
/** Con un variador: el voltaje sube con la frecuencia hasta 60 Hz (mismo flujo); arriba, el voltaje ya no sube. */
export const voltajeVariador = f => MOTOR.V * Math.min(1, Math.max(0.04, f / MOTOR.f));

// ------------------------------------------------------------------ cómo gira
export function gira({ f = DEF.f, carga = DEF.carga } = {}) {
    const V = voltajeVariador(f);
    const o = operacion(V, f, carga);
    return { ...o, carga, polos: MOTOR.polos, vueltasCampo: sincrona(f), deslizamiento: o.s * 100, debil: f > MOTOR.f };
}

// ------------------------------------------------------------------ el arranque
export const METODOS = { directo: 'Directo', suave: 'Arrancador suave', variador: 'Variador' };
/**
 * Arranque con una carga de bomba (el par crece con el cuadrado de la velocidad): directo a 460 V; con arrancador suave, el voltaje sube de
 * 40 a 100 % en la rampa; con variador, la frecuencia sube de 2 a 60 Hz en la rampa. Devuelve la historia cada 10 ms.
 */
const memoArranque = new Map();
export function arranque({ metodo = DEF.metodo, rampa = EJ.rampa, carga = EJ.cargaArranque } = {}) {
    const clave = `${metodo}|${rampa.toFixed(2)}|${carga.toFixed(2)}`;
    if (memoArranque.has(clave)) return memoArranque.get(clave);
    const dt = 0.002;
    let n = 0;
    const hist = [];
    let pico = 0;
    let llega = null;
    for (let k = 0; k <= 7500; k++) {
        const t = k * dt;
        const u = clamp01(t / rampa);
        const f = metodo === 'variador' ? lerp(2, MOTOR.f, u) : MOTOR.f;
        const V = metodo === 'variador' ? voltajeVariador(f) : metodo === 'suave' ? MOTOR.V * lerp(0.4, 1, u) : MOTOR.V;
        const m = motorEn(V, f, Math.min(n, sincrona(f) * 0.9999));
        const Tc = carga * TNOM * (n / MOTOR.rpm) ** 2;
        n = Math.max(0, n + ((m.par - Tc) / EJ.J) * dt * (60 / (2 * Math.PI)));
        pico = Math.max(pico, m.I);
        if (llega === null && n >= 0.97 * sincrona()) llega = t;
        if (k % 5 === 0) hist.push({ t, n, I: m.I, par: m.par, Tc, V, f });
    }
    const r = { metodo, rampa, carga, hist, pico, llega, veces: pico / PRUEBAS.plena.I, final: hist.at(-1) };
    memoArranque.set(clave, r);
    return r;
}
/** Lo que pasa a los t segundos de arrancar. */
export function arranqueEn(t, o) {
    const i = clamp(Math.round(t / 0.01), 0, o.hist.length - 1);
    return o.hist[i];
}

// ------------------------------------------------------------------ la eficiencia con carga
export function carga({ carga: c = DEF.carga, anual = DEF.anual } = {}) {
    const o = operacion(MOTOR.V, MOTOR.f, c);
    const ef = o.ef * 100;
    // lo que gastaría de más en un año contra un motor de la norma de 2025 (con su misma curva, subida a 86.5 % a plena carga)
    const ef25 = Math.min(0.99, o.ef + (NORMA.y2025 / 100 - operacion(MOTOR.V, MOTOR.f, 1).ef));
    const extra = c > 0 ? (o.util / 1000) * anual * (1 / o.ef - 1 / ef25) : 0;
    return { ...o, carga: c, anual, efPct: ef, ef25: ef25 * 100, energia: (o.Pin / 1000) * anual, cumple2002: ef >= NORMA.min2002, cumple2025: ef >= NORMA.y2025, enRango: c * 100 >= CONUEE.factor[0] && c * 100 <= CONUEE.factor[1], extra };
}

// ------------------------------------------------------------------ la temperatura
/** Cuánto sube el devanado, de cada 1 de lo final, a las t horas: dos partes, una rápida (el cobre) y una lenta (el fierro). */
export const forma = t => 1 - EJ.reparto * Math.exp(-t / EJ.tiempos[0]) - (1 - EJ.reparto) * Math.exp(-t / EJ.tiempos[1]);
/** El aumento final del devanado crece con las pérdidas: 53.86 °C con las de plena carga. */
let perdP = null;
const perdPlena = () => (perdP ??= operacion(MOTOR.V, MOTOR.f, 1).perd);
export function calor({ horas = DEF.horas, carga: c = DEF.carga, ambiente = DEF.ambiente } = {}) {
    const o = operacion(MOTOR.V, MOTOR.f, c);
    // el aumento de la prueba, escalado con lo que pierde el modelo contra lo que pierde a plena carga
    const final = PRUEBAS.temperatura.aumento * (o.perd / perdPlena());
    const ahora = final * forma(horas);
    return { ...o, carga: c, horas, ambiente, final, devanado: ambiente + ahora, armazon: ambiente + EJ.armazon * ahora, aumento: ahora, limite: PRUEBAS.temperatura.permitido, pasa: final > PRUEBAS.temperatura.permitido };
}

export const DEF = { f: 60, carga: 1, metodo: 'directo', rampa: EJ.rampa, cargaArr: EJ.cargaArranque, anual: 4000, horas: 0, ambiente: 25 };
export const LIMITES = { f: [5, 75], carga: [0.05, 1.3], rampa: [1, 10], cargaArr: [0, 1.2], anual: [500, 8760], horas: [0, 5], ambiente: [10, 45] };

// ------------------------------------------------------------------ el tiempo de la escena
export const estadoPlanta = () => ({ t: 0, tArr: -1 });
/** Un paso. El arranque se ve en cámara lenta: un segundo en unos 3. */
export function pasoPlanta(s, m, dt) {
    const n = { ...s };
    n.t += dt;
    if (m.modo === 'arranque') {
        if (m.arrancar && n.tArr < 0) n.tArr = 0;
        if (!m.arrancar) n.tArr = -1;
        if (n.tArr >= 0) n.tArr = Math.min(15, n.tArr + dt / 3);
    } else n.tArr = -1;
    return n;
}

// ------------------------------------------------------------------ las lecturas
export function calcular({ modo = 'gira', planta = null, f = DEF.f, carga: c = DEF.carga, metodo = DEF.metodo, rampa = DEF.rampa, cargaArr = DEF.cargaArr, anual = DEF.anual, horas = DEF.horas, ambiente = DEF.ambiente } = {}) {
    const L = { modo };
    if (modo === 'gira') Object.assign(L, gira({ f, carga: c }));
    else if (modo === 'arranque') {
        const a = arranque({ metodo, rampa, carga: cargaArr });
        const t = planta?.tArr ?? -1;
        const ahora = t >= 0 ? arranqueEn(t, a) : { t: 0, n: 0, I: 0, par: 0, Tc: 0, V: 0, f: 0 };
        Object.assign(L, { ...a, t, ahora, corriendo: t >= 0, rpm: ahora.n });
    } else if (modo === 'carga') Object.assign(L, carga({ carga: c, anual }));
    else Object.assign(L, calor({ horas, carga: c, ambiente }));
    return L;
}

// ------------------------------------------------------------------ acomodo (no está a escala)
export const BLOQUE = { x: [-7.2, 7.2], z: [-3.2, 3.2], y: [-0.4, 0] };
/** El banco de pruebas: el motor a la izquierda, el torquímetro y el electrodinamómetro a la derecha, sobre la mesa. */
export const MESA = { x: [-4.4, 5.4], z: [-1.1, 1.1], y: 0.9 };
export const EJE = { y: 1.85, z: 0 };
export const X = { motor: [-3.0, 0.2], ventilador: [-3.65, -3.0], eje: [-3.5, 2.7], torquimetro: [1.1, 1.9], cople: [0.7, 2.3], dinamometro: [2.7, 4.7] };
export const R = { motor: 0.82, aletas: 0.92, dinamometro: 0.75 };
export const SITIO = { variador: [-5.9, -1.6], analizador: [-1.4, 2.3], resistencias: [6.2, -1.7], caja: [-1.3, EJE.y + R.aletas + 0.15], placa: [-2.0, R.aletas + 0.02], soporte: [-1.3, -1.25] };
/** El poste de los cables, junto a la mesa: su brazo llega a la caja de conexiones; los cables van encima del brazo, a esta altura. */
export const BRAZO = { y: SITIO.caja[1] + 0.12, cable: SITIO.caja[1] + 0.135 };
export const FLUIDOS = {
    ca: { nombre: 'Corriente alterna', color: '#f2b233' },
    giro: { nombre: 'Potencia en el eje', color: '#2fb36a' },
    medida: { nombre: 'Lo que miden los aparatos', color: '#7e57c2' },
};
const [vx, vz] = SITIO.variador;
const [ax, az] = SITIO.analizador;
const [rx, rz] = SITIO.resistencias;
// los cables del banco van por el piso; suben pegados al poste de los cables, a la orilla de la mesa o a la del carro del analizador
const zPoste = SITIO.soporte[1] - 0.056; // la cara de atrás del poste
const zMesa = MESA.z[1] + 0.015; // la orilla de la mesa, del lado del analizador
const zCarro = az - 0.4 - 0.015; // la orilla de atrás del carro, donde quedan el analizador y el lector
const [xAl, xMi] = [SITIO.caja[0] - 0.02, SITIO.caja[0] + 0.02]; // la alimentación y la medición, lado a lado por el poste
const xm = (a, b) => (a + b) / 2;
/** Los bornes donde se conecta cada cable o se apoya en una orilla. */
export const BORNES = {
    variadorEntra: [vx - 0.565, 0.2, vz],
    variadorSale: [vx + 0.565, 0.2, vz + 0.15],
    soporteAl: [xAl, BRAZO.cable, zPoste],
    soporteMi: [xMi, BRAZO.cable, zPoste],
    cajaAl: [xAl, BRAZO.cable, -0.265],
    cajaMi: [xMi, BRAZO.cable, -0.265],
    analizadorMide: [ax + 0.1, 1.12, zCarro],
    analizadorPar: [ax + 0.4, 1.12, zCarro],
    lector: [ax - 0.5, 1.1, zCarro],
    torquimetro: [xm(...X.torquimetro), MESA.y + 0.03, 0.265],
    bordePar: [xm(...X.torquimetro), MESA.y + 0.015, zMesa],
    termopar: [-0.5, EJE.y + 0.3, R.aletas + 0.04],
    bordeTermopar: [-0.5, MESA.y + 0.015, zMesa],
    dinamometro: [xm(...X.dinamometro), MESA.y + 0.03, -0.665],
    bordeCarga: [xm(...X.dinamometro), MESA.y + 0.015, -zMesa],
    resistencias: [rx - 0.565, 0.2, rz],
};
const piso = (x, z) => [x, 0.025, z];
// la vuelta de lo alto del poste al brazo, cerrada para que el cable no se levante
const codo = b => [[b[0], b[1] - 0.02, b[2]], [b[0], b[1], b[2] + 0.02]];
export const LINEAS = [
    // la alimentación llega por el piso desde el tablero del laboratorio, fuera del dibujo
    { id: 'red', fluido: 'ca', r: 0.02, cable: true, puntos: [piso(BLOQUE.x[0] + 0.05, vz), piso(vx - 0.58, vz), BORNES.variadorEntra] },
    // del variador por el piso al poste de los cables; sube y llega por su brazo a la caja de conexiones
    { id: 'alimenta', fluido: 'ca', r: 0.02, cable: true, puntos: [BORNES.variadorSale, piso(vx + 0.58, BORNES.variadorSale[2]), piso(xAl, BORNES.variadorSale[2]), piso(xAl, zPoste), ...codo(BORNES.soporteAl), BORNES.cajaAl] },
    { id: 'eje', fluido: 'giro', r: 0.05, oculto: true, puntos: [[0.0, EJE.y, 0], [X.torquimetro[0], EJE.y, 0], [X.dinamometro[0] + 0.2, EJE.y, 0]] },
    // lo que da el dinamómetro baja de la mesa y va por el piso al banco de resistencias
    { id: 'carga', fluido: 'ca', r: 0.02, cable: true, puntos: [BORNES.dinamometro, BORNES.bordeCarga, piso(BORNES.bordeCarga[0], -zMesa), piso(rx - 0.58, rz), BORNES.resistencias] },
    // la medición baja por el mismo poste, cruza por debajo de la mesa y sube por la orilla del carro al analizador
    { id: 'mide', fluido: 'medida', r: 0.015, cable: true, puntos: [BORNES.cajaMi, ...codo(BORNES.soporteMi).reverse(), piso(xMi, zPoste), piso(0.2, MESA.z[1]), piso(BORNES.analizadorMide[0] + 0.1, zCarro - 0.3), piso(BORNES.analizadorMide[0], zCarro), BORNES.analizadorMide] },
    { id: 'par', fluido: 'medida', r: 0.015, cable: true, puntos: [BORNES.torquimetro, BORNES.bordePar, piso(BORNES.bordePar[0], zMesa), piso(BORNES.analizadorPar[0] + 0.2, zCarro - 0.3), piso(BORNES.analizadorPar[0], zCarro), BORNES.analizadorPar] },
    { id: 'termopar', fluido: 'medida', r: 0.015, cable: true, puntos: [BORNES.termopar, BORNES.bordeTermopar, piso(BORNES.bordeTermopar[0], zMesa), piso(BORNES.lector[0] + 0.3, zCarro - 0.3), piso(BORNES.lector[0], zCarro), BORNES.lector] },
];
export const REMATE = new Set(['red (inicio)']);
const caja = (x, y0, z, w, h, d) => [x - w / 2, x + w / 2, y0, y0 + h, z - d / 2, z + d / 2];
export const EQUIPOS = {
    motor: [X.ventilador[0], X.motor[1] + 0.1, MESA.y, EJE.y + R.aletas + 0.4, -R.aletas - 0.1, R.aletas + 0.1],
    caja: caja(SITIO.caja[0], SITIO.caja[1] - 0.2, 0, 0.6, 0.5, 0.6),
    torquimetro: [X.torquimetro[0], X.torquimetro[1], MESA.y, EJE.y + 0.4, -0.4, 0.4],
    dinamometro: [X.dinamometro[0], X.dinamometro[1], MESA.y, EJE.y + R.dinamometro + 0.3, -0.9, 0.9],
    variador: caja(vx, 0, vz, 1.2, 2.2, 0.8),
    analizador: caja(ax, 0, az, 1.6, 1.6, 1.0),
    resistencias: caja(rx, 0, rz, 1.2, 1.6, 1.0),
};

/** Puntos clave: dónde va el número y desde dónde se ve. */
export const PARTES = [
    { id: 'carcasa', ancla: [-2.4, EJE.y + R.aletas + 0.05, 0.4], vista: { az: 24, el: 18, tam: 4.4, mira: [-1.4, EJE.y, 0] } },
    { id: 'placa', ancla: [SITIO.placa[0], EJE.y + 0.2, SITIO.placa[1] + 0.05], vista: { az: 4, el: 8, tam: 1.6, mira: [SITIO.placa[0], EJE.y, 0.5] } },
    { id: 'caja', ancla: [SITIO.caja[0], SITIO.caja[1] + 0.35, 0.25], vista: { az: 20, el: 28, tam: 2.0, mira: [SITIO.caja[0], SITIO.caja[1], 0] } },
    { id: 'nucleo', ancla: [-0.5, EJE.y + 0.55, 0.45], vista: { az: 30, el: 16, tam: 3.4, mira: [-1.4, EJE.y, 0] } },
    { id: 'bobinas', ancla: [-2.75, EJE.y + 0.45, 0.4], vista: { az: -24, el: 16, tam: 3.0, mira: [-1.6, EJE.y, 0] } },
    { id: 'rotor', ancla: [-1.0, EJE.y + 0.15, 0.4], vista: { az: 18, el: 12, tam: 3.0, mira: [-1.4, EJE.y, 0] } },
    { id: 'eje', ancla: [0.55, EJE.y + 0.1, 0.12], vista: { az: 16, el: 20, tam: 2.4, mira: [0.6, EJE.y, 0] } },
    { id: 'baleros', ancla: [X.motor[1] - 0.05, EJE.y + 0.25, 0.2], vista: { az: 40, el: 14, tam: 2.0, mira: [X.motor[1], EJE.y, 0] } },
    { id: 'ventilador', ancla: [xm(...X.ventilador), EJE.y + 0.55, 0.3], vista: { az: -42, el: 14, tam: 2.4, mira: [-3.3, EJE.y, 0] } },
    { id: 'variador', ancla: [vx, 2.25, vz + 0.42], vista: { az: 20, el: 14, tam: 2.8, mira: [vx, 1.2, vz] } },
    { id: 'torquimetro', ancla: [xm(...X.torquimetro), EJE.y + 0.42, 0.15], vista: { az: 18, el: 18, tam: 2.2, mira: [xm(...X.torquimetro), EJE.y, 0] } },
    { id: 'dinamometro', ancla: [xm(...X.dinamometro), EJE.y + R.dinamometro + 0.2, 0.3], vista: { az: -24, el: 16, tam: 3.4, mira: [4.0, EJE.y - 0.2, -0.3] } },
    { id: 'analizador', ancla: [ax, 1.75, az + 0.3], vista: { az: 8, el: 14, tam: 2.4, mira: [ax, 1.2, az] } },
    { id: 'termopares', ancla: [-0.5, EJE.y + 0.55, R.aletas + 0.05], vista: { az: 14, el: 18, tam: 2.2, mira: [-0.5, EJE.y + 0.2, 0.6] } },
];

// ------------------------------------------------------------------ la pose
/** Qué tan rápido gira a la vista: proporcional a las vueltas por minuto (aquí, despacio). */
export const giroVista = rpm => (rpm / 1800) * 6;
export function pose({ modo = 'gira', planta = null, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, planta, ...resto });
    const rpm = L.rpm;
    const util = modo === 'arranque' ? (L.corriendo ? L.ahora.par * L.ahora.n * (Math.PI / 30) : 0) : L.util;
    const corriente = modo === 'arranque' ? L.ahora.I : L.I;
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    const s = clamp01(corriente / (2 * PRUEBAS.plena.I));
    flujos.red = flujos.alimenta = corriente > 0.05 ? 0.1 + 0.85 * s : 0;
    flujos.eje = clamp01(util / 2200) > 0.01 ? 0.1 + 0.85 * clamp01(util / 2200) : 0;
    flujos.carga = flujos.eje;
    flujos.mide = flujos.par = flujos.termopar = rpm > 1 ? 0.35 : 0;
    const cam = camara || { mira: [-0.2, 1.4, 0], az: 22, el: 22, d: 30 };
    const calor = modo === 'calor' ? clamp01((L.devanado - 40) / 80) : modo === 'carga' ? clamp01((L.perd - 150) / 400) : modo === 'arranque' ? clamp01((L.ahora.I - 5) / 20) : 0;
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, rpm,
        activo: {
            ca: corriente > 0.05 ? 1 : 0, giro: rpm > 1 ? 1 : 0, calor,
            alarma: (modo === 'carga' && !L.cumple2025) || (modo === 'calor' && L.pasa) ? 0.6 : 0,
            golpe: modo === 'arranque' && L.corriendo ? clamp01((L.ahora.I - 6) / 20) : 0,
            resistencias: clamp01(util / 2000),
        },
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'gira', camara: { mira: [-0.2, 1.4, 0], az: lerp(14, 30, t / 12), el: 22, d: 30 } });
}

// ------------------------------------------------------------------ revisiones
const dentroDe = (p, c, h = 0.08) => p[0] >= c[0] - h && p[0] <= c[1] + h && p[1] >= c[2] - h && p[1] <= c[3] + h && p[2] >= c[4] - h && p[2] <= c[5] + h;
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
        if (REMATE.has(`${L.id} (${nombre})`)) continue;
        if (!Object.values(EQUIPOS).some(c => dentroDe(p, c))) sueltas.push(`${L.id} (${nombre})`);
    }
    return sueltas;
}
/** Revisión de cifras contra la tesis, la norma y lo que se sabe de estos motores. */
export function revisar() {
    const p = [];
    const entre = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    entre(sincrona(), 1800, 1800, '4 polos a 60 Hz: 1,800 vueltas por minuto');
    entre(TNOM, 8.06, 8.08, 'par nominal: 8.07 N·m');
    entre(PRUEBAS.arranque.par / TNOM * 100, 259, 260, 'par de arranque: 259 % del nominal');
    entre((PRUEBAS.arranque.I * 0.46 * R3) / MOTOR.hp, 10.0, 10.1, 'kVA a rotor bloqueado por HP: 10.03, letra L');
    entre(R1, 5.4, 5.5, 'la resistencia del estator en caliente');
    // el circuito reproduce las pruebas
    const n = operacion(MOTOR.V, MOTOR.f, 8.26 / TNOM);
    entre(n.rpm, 1757, 1763, 'a plena carga, unas 1,760 rpm (se midieron 1,760.2)');
    entre(n.I, 2.95, 3.3, 'y unos 3.1 A (se midieron 3.15)');
    entre(n.fp, 0.66, 0.75, 'factor de potencia de unos 0.70 (se midió 0.705)');
    entre(n.ef * 100, 82.9, 84.9, 'eficiencia de unos 84 % (se midió 83.9 %)');
    entre(motorEn(MOTOR.V, MOTOR.f, 0).par, 20.8, 21.1, 'al arranque, 20.93 N·m');
    entre(motorEn(PRUEBAS.arranque.V, MOTOR.f, 0).I, 24, 28.5, 'y unos 25 A (se midieron 25.2)');
    entre(parMaximo().par, 25.2, 27.2, 'par máximo de unos 26 N·m (se midieron 26.23)');
    entre(motorEn(MOTOR.V, MOTOR.f, 1799.5).I, 1.9, 2.5, 'en vacío, unos 2.2 A a 460 V (4.47 A a 230 V en doble estrella)');
    for (const [c, ef, , par, rpm] of EFICIENCIA) {
        const o = operacion(MOTOR.V, MOTOR.f, par / TNOM);
        entre(o.ef * 100, ef - 2.5, ef + 2.5, `eficiencia a ${c} % (${ef} %)`);
        entre(o.rpm, rpm - 6, rpm + 6, `velocidad a ${c} % (${rpm} rpm)`);
    }
    const pl = carga({ carga: 1 });
    entre(pl.cumple2002 ? 1 : 0, 1, 1, 'cumplía la norma de 2002 (mínima 81.5 %)');
    entre(pl.cumple2025 ? 1 : 0, 0, 0, 'no llega a los 86.5 % de la norma de 2025');
    entre(carga({ carga: 0.25 }).efPct, 60, 74, 'a 25 % de carga la eficiencia se cae (se midió 67.8 %)');
    entre(carga({ carga: 0.75, anual: 4000 }).extra, 100, 250, 'a 75 % y 4,000 horas, unos 140 kWh más al año que uno de la norma de 2025');
    // cómo gira
    entre(gira({ f: 30 }).vueltasCampo, 900, 900, 'a 30 Hz, el campo da 900 vueltas');
    entre(gira({ f: 30, carga: 1 }).rpm, 840, 899, 'y el rotor un poco menos');
    entre(gira({ carga: 0.05 }).deslizamiento, 0, 0.5, 'casi sin carga, casi no resbala');
    // el arranque
    const d = arranque({ metodo: 'directo' });
    const v = arranque({ metodo: 'variador' });
    const sv = arranque({ metodo: 'suave' });
    entre(d.veces, 7, 9.5, 'directo: unas 8 veces la corriente nominal');
    entre(d.llega, 0.05, 1.5, 'y llega a su velocidad en menos de un segundo y medio');
    entre(v.pico, 1, PRUEBAS.plena.I * 2.5, 'con variador, la corriente no pasa de unas 2 veces la nominal');
    entre(sv.pico, d.pico * 0.3, d.pico * 0.8, 'con arrancador suave, menos que directo');
    entre(v.llega, EJ.rampa * 0.8, EJ.rampa * 1.4, 'con variador tarda lo que dura la rampa');
    // la temperatura
    const c = calor({ horas: 10, carga: 1, ambiente: PRUEBAS.temperatura.ambiente });
    entre(c.devanado, 77, 82, 'a plena carga el devanado llega a unos 79.5 °C');
    entre(c.pasa ? 1 : 0, 0, 0, 'lejos de los 115 °C de aumento de la clase F');
    for (const [h, tC] of ARMAZON.slice(1)) entre((forma(h) * (61.5 - 21.5) + 21.5), tC - 6, tC + 6, `armazón a las ${h} h (${tC} °C)`);
    entre(calor({ horas: 10, carga: 1.3 }).final, PRUEBAS.temperatura.aumento * 1.2, 120, 'con 130 % de carga sube bastante más');
    entre(clamp(1, 0, 2), 1, 1, 'ayudas');
    return p;
}
