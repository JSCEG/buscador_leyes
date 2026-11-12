// El modelo del inversor: puro, sin three.js ni DOM. Lo leen la escena, el tablero, las gráficas y las pruebas, así que una cifra sale
// de un solo lugar. La instalación es la planta fotovoltaica de 42.84 kWp del Instituto de Energías Renovables (IER) de la UNAM en
// Temixco, Morelos, con los datos de una tesis de maestría: 168 módulos en cadenas de 14 y dos inversores ABB TRIO-20.0 de 20 kW. Lo que
// pide la red sale de las especificaciones técnicas de la generación distribuida (CRE, RES/142/2017). Lo que no viene en las fuentes está
// marcado como «de ejemplo».
//
// Cuatro formas de verlo: un día en Temixco (los seguidores de máxima potencia), cómo sale la onda (los pulsos y el filtro), con la red
// (cuándo debe desconectarse) y el calor (eficiencia y temperatura).
import { D2R, clamp, clamp01, lerp } from '../planta-comun/ayudas.js';
import { apoyo, enCruceta, lineaAerea } from '../planta-comun/lineas.js';

// ------------------------------------------------------------------ la planta (tesis IER-UNAM, 2017)
export const PLANTA = { kWp: 42.84, modulos: 168, inversores: 2, inclinacion: 19, lat: 18.839, altitud: 1247, irradiacion: 6.2, tSol: [32, 36.7], viento: 1.75, lugar: 'techumbre del auditorio Tonatiuh' };
/** Lo medido el 6 de mayo de 2017: de 07:40 a 19:20; 35.9 kW a la salida de los inversores y 32 kW a la del transformador. */
export const MEDIDO = { fecha: '6 de mayo de 2017', inicio: 7 + 40 / 60, fin: 19 + 20 / 60, inversores: 35.9, transformador: 32, otro: { fecha: '7 de mayo de 2017', inversores: 30, transformador: 29 } };
/** Los dos módulos de la planta (sus fichas, en el anexo de la tesis). Coeficientes en % por °C. */
export const MODULOS = {
    yingli: { nombre: 'Yingli YL250P-29b', P: 250, Vmp: 29.8, Imp: 8.39, Voc: 37.6, Isc: 8.92, gP: -0.42, gV: -0.32, gI: 0.05 },
    solarever: { nombre: 'Solarever SE-156-260P-60', P: 260, Vmp: 31.52, Imp: 8.25, Voc: 38.82, Isc: 8.83, gP: -0.41, gV: -0.32, gI: -0.05, noct: 45 },
};
/** Cada cadena lleva 14 módulos en serie; cada canal del inversor, 3 cadenas; cada inversor, 2 canales (14S × 2(3P)). */
export const ARREGLO = { serie: 14, cadenas: 3, canales: 2 };
/** La ficha del ABB TRIO-20.0-TL-OUTD (anexo de la tesis). W, V, A; temperaturas en °C. */
export const TRIO = {
    P: 20000, Pmax: 22000, V: 480, Pcanal: 12000, Vmax: 1000, arranque: 360, plena: [450, 800], opera: [200, 950], Icanal: 25, Iac: 27,
    falla: 51.4, fp: 0.995, fpAjuste: 0.8, thd: 3, efMax: 98.2, efCEC: 97.5, umbral: 65, temp: [-30, 60], reduce: 45, kg: 71, medidas: [1061, 702, 292],
};
export const TRAFO = { kVA: 45, alta: 480, baja: 220 };

// ------------------------------------------------------------------ las reglas (CRE, RES/142/2017)
/**
 * Especificaciones técnicas de la generación distribuida: distorsión de corriente de 5 % (en % de la corriente nominal) y por orden de
 * armónica; corriente directa menor a 0.5 %; tiempos de desconexión por voltaje (en % del nominal) y por frecuencia (central asíncrona
 * de más de 30 kW); en isla, salir en 0.5 s; para volver, voltaje normal, 59.3 a 60.5 Hz y 5 minutos de espera.
 */
export const RED = {
    tdd: 5, porOrden: [[11, 4], [17, 2], [23, 1.5], [35, 0.6], [Infinity, 0.3]], cd: 0.5,
    tension: [[50, 0.16], [88, 2], [110, Infinity], [120, 1], [Infinity, 0.16]],
    frecuencia: { alta: 62, altaRango: [61.2, 62], altaMax: 300, baja: 57, bajaRango: [57, 58.8], bajaMin: 30, bajaMax: 300, rapido: 0.16 },
    isla: 0.5, vuelta: { espera: 300, f: [59.3, 60.5] }, entrada: 5,
};

// ------------------------------------------------------------------ de ejemplo
/**
 * El sol de un día despejado de mayo en el plano de los módulos (W/m², calibrado a los 35.9 kW medidos), el aire durante el día, las
 * pérdidas en cables, el transformador, la curva de eficiencia del inversor (ajustada a 98.2 % y CEC 97.5 %), cuánto baja su potencia
 * arriba de 45 °C, el voltaje del bus, la bobina del filtro, el índice de modulación y cuánto tarda en notar una isla: de ejemplo.
 */
export const EJ = {
    sol: { max: 1050, sale: 7.5, mediodia: 13.6, forma: 1.3 }, aire: { min: 22, max: 34, hora: 14.5 }, cables: 0.02, trafo: 0.97,
    perdidas: [0.0008, 0.0095, 0.024], reduceA: 0.7, bus: 870, filtro: { x: 0.08, resonancia: 60, amortigua: 0.3 }, m: 0.9, detecta: 0.2, disipador: 0.035,
};
export const DEF = { hora: 13.6, nubes: 0, N: 267, s: 1, v: 100, f: 60, carga: 0.75, ta: 35 };
export const LIMITES = { hora: [6, 21], nubes: [0, 0.9], N: [1, 400], s: [0.1, 1], v: [30, 135], f: [55.5, 63.5], carga: [0.02, 1.1], ta: [10, 60] };

// ------------------------------------------------------------------ el sol y las cadenas
/** Irradiancia en el plano de los módulos (W/m²) a una hora del día (hora local de 2017, con horario de verano). */
export function sol(hora, nubes = 0) {
    const { max, sale, mediodia, forma } = EJ.sol;
    const medio = 2 * (mediodia - sale);
    const u = (hora - sale) / medio;
    return u <= 0 || u >= 1 ? 0 : max * Math.sin(Math.PI * u) ** forma * (1 - nubes);
}
export const aire = hora => EJ.aire.min + (EJ.aire.max - EJ.aire.min) * Math.max(0, Math.cos((Math.PI * (hora - EJ.aire.hora)) / 14)) ** 1.5;
/** Temperatura de la celda: el aire más lo que calienta el sol, con la NOCT de 45 °C. */
export const celda = (G, ta) => ta + ((MODULOS.solarever.noct - 20) / 800) * G;

/**
 * La curva de una cadena de 14 módulos: I = Isc × [1 − C1 × (e^(V ÷ (C2 × Voc)) − 1)], que pasa justo por corto circuito, máxima potencia y
 * circuito abierto de la ficha. El sol escala la corriente; la temperatura baja el voltaje y la potencia con los coeficientes de la ficha.
 */
export function cadena(mod, G, Tc) {
    const M = MODULOS[mod];
    const n = ARREGLO.serie;
    const Voc = M.Voc * n;
    const C2 = (M.Vmp / M.Voc - 1) / Math.log(1 - M.Imp / M.Isc);
    const C1 = (1 - M.Imp / M.Isc) * Math.exp(-M.Vmp / (C2 * M.Voc));
    const dT = Tc - 25;
    const voc = Voc * (1 + (M.gV / 100) * dT) * (G > 1 ? 1 + 0.035 * Math.log(G / 1000) : 0);
    const isc = M.Isc * (G / 1000) * (1 + ((M.gP - M.gV) / 100) * dT);
    return { mod, voc, isc, I: V => (V >= voc || voc <= 0 ? 0 : Math.max(0, isc * (1 - C1 * (Math.exp(V / (C2 * voc)) - 1)))) };
}
/** Un canal del inversor: tres cadenas en paralelo. Su seguidor busca la punta, sin pasar de 25 A ni de 12 kW. */
export function canal(mod, G, Tc) {
    const c = cadena(mod, G, Tc);
    const I = V => ARREGLO.cadenas * c.I(V);
    let Vmp = 0;
    let Pmp = 0;
    const tope = Math.min(c.voc, TRIO.opera[1]);
    for (let k = 0; k <= 400; k++) { const V = (tope * k) / 400; const P = V * I(V); if (P > Pmp) { Pmp = P; Vmp = V; } }
    // afina la punta
    for (let paso = tope / 400; paso > 0.01; paso /= 2) for (const V of [Vmp - paso, Vmp + paso]) { const P = V * I(V); if (V > 0 && V < tope && P > Pmp) { Pmp = P; Vmp = V; } }
    let V = Vmp;
    let limite = null;
    // si la corriente pasa de 25 A, el seguidor se corre a más voltaje, donde la cadena da menos corriente
    if (I(V) > TRIO.Icanal) { let a = V; let b = tope; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (I(m) > TRIO.Icanal) a = m; else b = m; } V = b; limite = 'corriente'; }
    if (V * I(V) > TRIO.Pcanal) { let a = V; let b = tope; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (m * I(m) > TRIO.Pcanal) a = m; else b = m; } V = b; limite = 'potencia'; }
    const opera = V >= TRIO.opera[0] && Pmp > 0;
    return { mod, V: opera ? V : 0, I: opera ? I(V) : 0, P: opera ? V * I(V) : 0, Pmp, Vmp, voc: c.voc, isc: c.isc * ARREGLO.cadenas, limite: opera ? limite : null, plena: V >= TRIO.plena[0] && V <= TRIO.plena[1], curva: I };
}

// ------------------------------------------------------------------ el inversor: eficiencia y calor
/** Pérdidas del inversor (W) a una potencia de salida p (de cada 1 de 20 kW): una parte fija, una en proporción y una con el cuadrado. */
export const perdidaInv = p => TRIO.P * (EJ.perdidas[0] + EJ.perdidas[1] * p + EJ.perdidas[2] * p * p);
export const eficiencia = p => (p <= 0 ? 0 : p / (p + perdidaInv(p) / TRIO.P));
/** La eficiencia CEC: el promedio pesado a 10, 20, 30, 50, 75 y 100 % de carga. */
export const CEC = [[0.1, 0.04], [0.2, 0.05], [0.3, 0.12], [0.5, 0.21], [0.75, 0.53], [1, 0.05]];
export const eficienciaCEC = () => CEC.reduce((a, [p, w]) => a + w * eficiencia(p), 0);
/** Lo más que puede dar con el aire a ta °C: completo hasta 45 °C y luego baja, hasta 70 % a 60 °C (de ejemplo). */
export const maxPorCalor = ta => TRIO.Pmax * (ta <= TRIO.reduce ? 1 : ta >= TRIO.temp[1] ? EJ.reduceA : lerp(1, EJ.reduceA, (ta - TRIO.reduce) / (TRIO.temp[1] - TRIO.reduce)));
/** Un inversor con una potencia de corriente directa (W) y el aire a ta °C. */
export function inversor(Pdc, ta) {
    const tope = maxPorCalor(ta);
    // la salida p cumple p + pérdidas(p) = Pdc: se resuelve con unas vueltas
    let p = Pdc / TRIO.P;
    for (let k = 0; k < 30; k++) p = Math.max(0, (Pdc - perdidaInv(p)) / TRIO.P);
    let Pac = Pdc > TRIO.umbral ? p * TRIO.P : 0;
    const recorta = Pac > tope;
    if (recorta) Pac = tope;
    const perd = Pac > 0 ? perdidaInv(Pac / TRIO.P) : 0;
    return { Pdc, Pac, perd, ef: Pac > 0 ? Pac / (Pac + perd) : 0, recorta, tope };
}
export function calor({ carga = DEF.carga, ta = DEF.ta } = {}) {
    const tope = maxPorCalor(ta);
    const Pac = Math.min(carga * TRIO.P, tope);
    const p = Pac / TRIO.P;
    const perd = perdidaInv(p);
    return { carga, ta, Pac, p, perd, ef: eficiencia(p), tope, recorta: carga * TRIO.P > tope, disipador: ta + EJ.disipador * perd, cec: eficienciaCEC() };
}

// ------------------------------------------------------------------ un día en Temixco
/** La planta a una hora: los dos inversores con sus dos canales (el 1, con Yingli; el 2, con Solarever), y lo que sale del transformador. */
export function dia({ hora = DEF.hora, nubes = DEF.nubes } = {}) {
    const G = sol(hora, nubes);
    const ta = aire(hora);
    const Tc = celda(G, ta);
    const inv = ['yingli', 'solarever'].map(mod => {
        const ch = [canal(mod, G, Tc), canal(mod, G, Tc)];
        const Pdc = (ch[0].P + ch[1].P) * (1 - EJ.cables);
        return { mod, canales: ch, ...inversor(Pdc, ta) };
    });
    const Pac = inv[0].Pac + inv[1].Pac;
    const Pdisp = inv.reduce((a, i) => a + i.canales[0].Pmp + i.canales[1].Pmp, 0);
    return { hora, nubes, G, ta, Tc, inv, Pac, Pdc: inv[0].Pdc + inv[1].Pdc, Pdisp, trafo: Pac * EJ.trafo, recortaCorriente: inv.some(i => i.canales.some(c => c.limite === 'corriente')), opera: Pac > 0 };
}
/** La energía de un día (kWh a la salida de los inversores), sumando cada cuarto de hora. */
export function energiaDia(nubes = 0) {
    let e = 0;
    for (let h = 5; h <= 21; h += 0.25) e += dia({ hora: h, nubes }).Pac * 0.25;
    return e / 1000;
}

// ------------------------------------------------------------------ cómo sale la onda
/**
 * Un brazo del puente compara una senoidal (índice m) con un triángulo de N pulsos por ciclo: sale +1 o −1 (de la mitad del bus).
 * Devuelve los cambios de signo en un ciclo, de 0 a 2π.
 */
export function pulsos(N, m = EJ.m, desfase = 0) {
    const tri = th => { const u = ((th * N) / (2 * Math.PI)) % 1; return u < 0.5 ? 4 * u - 1 : 3 - 4 * u; };
    const g = th => m * Math.sin(th - desfase) - tri(th);
    const cortes = [];
    const n = Math.max(400, N * 60);
    let a = 0;
    let ga = g(1e-9);
    for (let k = 1; k <= n; k++) {
        const b = (2 * Math.PI * k) / n;
        const gb = g(b);
        if ((ga > 0) !== (gb > 0)) { let x0 = a; let x1 = b; for (let i = 0; i < 30; i++) { const xm = (x0 + x1) / 2; if ((g(xm) > 0) === (ga > 0)) x0 = xm; else x1 = xm; } cortes.push((x0 + x1) / 2); }
        a = b;
        ga = gb;
    }
    return { cortes, inicio: g(1e-9) > 0 ? 1 : -1 };
}
const memoOnda = new Map();
/**
 * Las armónicas del voltaje entre dos fases (la resta de dos brazos, que da tres niveles), por unidad de la fundamental: las de 2 a 49 y
 * las de cerca de N, 2N y 3N. La que tiene la frecuencia de los pulsos es igual en los dos brazos y se cancela.
 */
export function armonicasOnda(N) {
    const k = Math.round(clamp(N, 1, 400));
    if (memoOnda.has(k)) return memoOnda.get(k);
    const A = pulsos(k);
    const B = pulsos(k, EJ.m, (2 * Math.PI) / 3);
    // los tramos donde los dos brazos no cambian: su voltaje es (a − b), entre −2 y 2
    const marcas = [...A.cortes.map(x => [x, 'a']), ...B.cortes.map(x => [x, 'b'])].sort((x, y) => x[0] - y[0]);
    const tramos = [];
    let va = A.inicio;
    let vb = B.inicio;
    let desde = 0;
    for (const [x, q] of marcas) { tramos.push([desde, x, va - vb]); if (q === 'a') va = -va; else vb = -vb; desde = x; }
    tramos.push([desde, 2 * Math.PI, va - vb]);
    const coef = h => {
        let a = 0;
        let b = 0;
        for (const [x0, x1, v] of tramos) { if (!v) continue; a += v * (Math.sin(h * x1) - Math.sin(h * x0)); b += v * (Math.cos(h * x0) - Math.cos(h * x1)); }
        return Math.hypot(a, b) / (Math.PI * h);
    };
    const v1 = coef(1);
    const ordenes = new Set();
    for (let h = 2; h <= 49; h++) ordenes.add(h);
    for (const c of [1, 2, 3]) for (let d = -14; d <= 14; d++) { const h = c * k + d; if (h >= 2) ordenes.add(h); }
    const lista = [...ordenes].sort((x, y) => x - y).map(h => [h, coef(h) / v1]);
    const r = { N: k, v1, lista };
    memoOnda.set(k, r);
    return r;
}
/** El límite de cada orden de armónica, en % de la corriente nominal (las pares, la cuarta parte). */
export const limiteOrden = h => { const l = RED.porOrden.find(([hasta]) => h < hasta)[1]; return h % 2 ? l : l / 4; };
/**
 * Cuánto deja pasar el filtro (bobina, capacitor y bobina) de cada armónica, contra la fundamental: las bobinas frenan h veces más, y
 * arriba de su resonancia el capacitor se lleva el resto (de ejemplo).
 */
export function pasaFiltro(h, F = EJ.filtro) {
    const r = h / F.resonancia;
    return 1 / (h * F.x * Math.hypot(1 - r * r, 2 * F.amortigua * r));
}
/**
 * La corriente que sale a la red con N pulsos por ciclo y una carga s. TDD: la distorsión contra la corriente nominal (la que cuenta la
 * regla); THD: contra la corriente de ese momento.
 */
export function onda({ N = DEF.N, s = DEF.s, F = EJ.filtro } = {}) {
    const { lista, v1 } = armonicasOnda(N);
    const corr = lista.map(([h, v]) => [h, v * pasaFiltro(h, F)]);
    const suma = Math.sqrt(corr.reduce((a, [, i]) => a + i * i, 0));
    let peor = { h: 0, i: 0, lim: 1, veces: 0 };
    for (const [h, i] of corr) { const lim = limiteOrden(h) / 100; if (i / lim > peor.veces) peor = { h, i, lim, veces: i / lim }; }
    const k = Math.round(clamp(N, 1, 400));
    return { N: k, s, khz: (k * 60) / 1000, conmuta: 2 * k * 60, v1, corr, tdd: suma * 100, thd: (suma / s) * 100, cumple: suma * 100 <= RED.tdd && peor.veces <= 1, peor, fase: (EJ.m * EJ.bus) / 2 / Math.SQRT2 };
}
/** El voltaje de un brazo (por unidad de la mitad del bus) en un ángulo, para dibujar los pulsos. */
export function brazo(th, N, m = EJ.m) {
    const u = ((th * N) / (2 * Math.PI)) % 1;
    const tri = u < 0.5 ? 4 * u - 1 : 3 - 4 * u;
    return m * Math.sin(th) >= tri ? 1 : -1;
}
/** La corriente (por unidad de la nominal) en un ángulo: la fundamental más el rizo de las armónicas. */
export function corrienteEn(th, o) {
    let i = o.s * Math.sin(th);
    for (const [h, a] of o.corr) if (a > 1e-4) i += a * Math.sin(h * th - Math.PI / 2);
    return i;
}

// ------------------------------------------------------------------ con la red
/** En cuánto tiempo debe desconectarse con un voltaje (en % del nominal) en el punto de interconexión. Infinity: opera. */
export const tiempoTension = v => RED.tension.find(([hasta]) => v < hasta)[1];
/**
 * Lo mismo con la frecuencia, para una central asíncrona de más de 30 kW: por arriba de 62 o abajo de 57 Hz, 0.16 s; de 61.2 a 62, se
 * ajusta hasta 300 s; de 57 a 58.8, debe aguantar al menos 30 s y salir antes de 300. Ajustes de ejemplo: 10 s arriba y 60 s abajo.
 */
export const AJUSTE = { alta: 10, baja: 60 };
export function tiempoFrecuencia(f) {
    const F = RED.frecuencia;
    if (f > F.alta || f < F.baja) return F.rapido;
    if (f >= F.altaRango[0]) return AJUSTE.alta;
    if (f <= F.bajaRango[1]) return AJUSTE.baja;
    return Infinity;
}
export function red({ v = DEF.v, f = DEF.f } = {}) {
    const tv = tiempoTension(v);
    const tf = tiempoFrecuencia(f);
    const t = Math.min(tv, tf);
    const vuelve = v >= 88 && v <= 110 && f >= RED.vuelta.f[0] && f <= RED.vuelta.f[1];
    return { v, f, volts: (v / 100) * TRAFO.baja, tv, tf, t, opera: !Number.isFinite(t), porque: Number.isFinite(t) ? (tv <= tf ? 'voltaje' : 'frecuencia') : null, vuelve };
}

// ------------------------------------------------------------------ el tiempo de la escena
export const estadoPlanta = () => ({ t: 0, apagon: false, tIsla: -1, conectado: true, espera: 0, fuera: 0 });
/**
 * Un paso. Al irse la luz, la isla se ve en cámara lenta (medio segundo en unos 3 s). Fuera de rango, el tiempo que da la regla corre 10
 * veces más rápido; al volver, la espera de 5 minutos, 60 veces más rápido.
 */
export function pasoPlanta(s, m, dt) {
    const n = { ...s };
    n.t += dt;
    if (m.modo === 'red') {
        const r = red({ v: m.v, f: m.f });
        if (m.apagon && !n.apagon) { n.apagon = true; n.tIsla = 0; }
        if (n.apagon) {
            n.tIsla += dt / 6;
            if (n.tIsla >= EJ.detecta) n.conectado = false;
            if (!m.apagon) { n.apagon = false; n.tIsla = -1; n.espera = RED.vuelta.espera; }
        } else if (!r.opera) {
            if (n.conectado) { n.fuera += dt * 10; if (n.fuera >= r.t) { n.conectado = false; n.espera = RED.vuelta.espera; } } else n.espera = RED.vuelta.espera;
        } else {
            n.fuera = 0;
            if (!n.conectado) { n.espera = Math.max(0, n.espera - dt * 60); if (n.espera <= 0 && r.vuelve) n.conectado = true; }
        }
    } else { n.apagon = false; n.tIsla = -1; n.conectado = true; n.espera = 0; n.fuera = 0; }
    return n;
}

// ------------------------------------------------------------------ las lecturas
export function calcular({ modo = 'dia', planta = null, hora = DEF.hora, nubes = DEF.nubes, N = DEF.N, s = DEF.s, v = DEF.v, f = DEF.f, carga = DEF.carga, ta = DEF.ta } = {}) {
    const L = { modo };
    if (modo === 'dia') Object.assign(L, dia({ hora, nubes }));
    else if (modo === 'onda') Object.assign(L, onda({ N, s }));
    else if (modo === 'red') Object.assign(L, red({ v, f }), { apagon: planta?.apagon ?? false, tIsla: planta?.tIsla ?? -1, conectado: planta?.conectado ?? true, espera: planta?.espera ?? 0, fuera: planta?.fuera ?? 0 });
    else Object.assign(L, calor({ carga, ta }));
    return L;
}

// ------------------------------------------------------------------ acomodo (no está a escala)
export const BLOQUE = { x: [-8.6, 8.6], z: [-3.6, 3.6], y: [-0.4, 0] };
/** El edificio con la techumbre y los cuatro subarreglos encima: 1 y 2 de Yingli; 3 y 4 de Solarever. */
export const EDIFICIO = { x: [-8.3, 0.7], z: [-3.4, -0.5], alto: 2.2 };
export const SUBARREGLO = [
    { id: 1, mod: 'yingli', x: -6.0, z: -2.55 }, { id: 2, mod: 'yingli', x: -6.0, z: -1.35 },
    { id: 3, mod: 'solarever', x: -1.6, z: -2.55 }, { id: 4, mod: 'solarever', x: -1.6, z: -1.35 },
];
export const MODULO = { w: 0.3, d: 0.3, fila: 0.36 };
/** Las cajas de protección de las cadenas, una por subarreglo, en el borde de la techumbre. */
export const CAJAS = SUBARREGLO.map((s, k) => ({ id: s.id, x: s.x + (k < 2 ? 1.2 : 1.0) * (k % 2 ? 1 : -1) + (k < 2 ? 0.6 : 0.4), y: EDIFICIO.alto, z: EDIFICIO.z[1] - 0.12 }));
/** Los dos inversores, en el patio (agrandados): el 1 se abre. */
export const INV = { x: [2.35, 4.35], z: 0.0, w: 1.3, h: 2.0, d: 0.5, y0: 0.35 };
export const SITIO = { trafo: [6.3, 0.5], tablero: [7.55, 1.75], poste: [8.25, 2.6] };
export const FLUIDOS = {
    cd: { nombre: 'Corriente directa de los módulos', color: '#f2b233' },
    ca: { nombre: 'Corriente alterna a la red', color: '#2f7fd1' },
};
const IX = INV.x[0];
const yI = v => INV.y0 + v * INV.h;
const zF = INV.z + INV.d / 2;
/** El poste de la red (de celosía, como los de las otras figuras): su alto; la línea cuelga de su cruceta, a 0.92 del alto. */
export const POSTE = { alto: 3.2 };
// los cables de corriente directa bajan pegados a la pared y van por el piso, cada uno en su carril, hasta la parte de atrás de su
// inversor; los de alterna salen por un costado del inversor, bajan de su base y van por el piso al transformador y al tablero
const zPared = EDIFICIO.z[1] + 0.015;
const zBase = INV.z - INV.d / 2 - 0.15 - 0.015; // la orilla de atrás de la base de concreto
const carril = k => -0.425 - k * 0.02;
const xCd = k => INV.x[k < 2 ? 0 : 1] + (k % 2 ? 0.18 : -0.18);
const xBaseCa = x => x + INV.w / 2 + 0.215; // la orilla de la base, del lado derecho
const [tx, tz] = SITIO.trafo;
const [bx, bz] = SITIO.tablero;
const [px, pz] = SITIO.poste;
/** Los bornes donde se conecta cada cable o se apoya en una orilla: cajas, inversores, transformador, tablero y poste. */
export const BORNES = {
    ...Object.fromEntries(CAJAS.map((c, k) => [`caja${k + 1}`, [c.x, c.y + 0.2, zPared]])),
    ...Object.fromEntries([0, 1, 2, 3].flatMap(k => [[`baseCd${k + 1}`, [xCd(k), INV.y0 + 0.015, zBase]], [`entraCd${k + 1}`, [xCd(k), INV.y0 + 0.05, INV.z - INV.d / 2 - 0.015]]])),
    ...Object.fromEntries(INV.x.flatMap((x, k) => [[`saleCa${k + 1}`, [x + INV.w / 2 + 0.015, INV.y0 + 0.07, 0.1]], [`baseCa${k + 1}`, [xBaseCa(x), INV.y0 + 0.015, 0.1]], [`trafoCa${k + 1}`, [tx - 0.515, 0.15, 0.55 - k * 0.25]]])),
    trafoSale: [tx + 0.515, 0.15, tz + 0.25],
    tableroEntra: [bx - 0.365, 0.15, bz],
    tableroSale: [bx + 0.365, 0.15, bz + 0.1],
    poste: [px, POSTE.alto * 0.92, pz],
};
const piso = (x, z) => [x, 0.025, z];
const bajada = (k) => {
    const c = CAJAS[k];
    const x = xCd(k);
    return { id: `cd${k + 1}`, fluido: 'cd', r: 0.02, cable: true, puntos: [BORNES[`caja${k + 1}`], piso(c.x, zPared), piso(c.x + 0.12, carril(k)), piso(x - 0.12, carril(k)), piso(x, zBase), BORNES[`baseCd${k + 1}`], BORNES[`entraCd${k + 1}`]] };
};
const alterna = (x, k) => {
    const xb = xBaseCa(x);
    const llega = BORNES[`trafoCa${k + 1}`];
    const z = llega[2];
    // el del inversor 1 pasa por delante de la base del inversor 2
    const paso = k === 0 ? [piso(xb + 0.1, z), piso(tx - 0.53, z)] : [piso(tx - 0.53, z)];
    return { id: `ca${k + 1}`, fluido: 'ca', r: 0.02, cable: true, puntos: [BORNES[`saleCa${k + 1}`], BORNES[`baseCa${k + 1}`], piso(xb, 0.1), ...paso, llega] };
};
const orillaRed = [px, POSTE.alto * 0.85, BLOQUE.z[1] - 0.05];
/** La línea de la red: tres fases que cuelgan de la cruceta del poste y salen a la calle. */
export const AEREAS = { redAerea: [enCruceta(BORNES.poste, BORNES.poste, orillaRed), apoyo(orillaRed, [0.25, 0, 0])] };
export const LINEAS = [
    bajada(0), bajada(1), bajada(2), bajada(3),
    ...INV.x.map(alterna),
    { id: 'salida', fluido: 'ca', r: 0.02, cable: true, puntos: [BORNES.trafoSale, piso(tx + 0.53, BORNES.trafoSale[2]), piso(tx + 0.65, bz), piso(bx - 0.38, bz), BORNES.tableroEntra] },
    // del tablero, por el piso, al poste; sube por dentro de él hasta la cruceta
    { id: 'red', fluido: 'ca', r: 0.02, cable: true, puntos: [BORNES.tableroSale, piso(bx + 0.38, BORNES.tableroSale[2]), piso(px, pz - 0.3), piso(px, pz), BORNES.poste] },
    // la línea aérea no lleva tubo: la página dibuja sus tres conductores; aquí va la fase de en medio
    lineaAerea('redAerea', AEREAS.redAerea, { fluido: 'ca' }),
    // por dentro del inversor 1: de las terminales, por los seguidores, al bus, al puente, al filtro y a los relevadores
    { id: 'adentroCD', fluido: 'cd', r: 0.03, oculto: true, puntos: [[IX - 0.4, yI(0.12), zF - 0.08], [IX - 0.3, yI(0.3), zF - 0.08], [IX - 0.1, yI(0.47), zF - 0.08], [IX + 0.05, yI(0.66), zF - 0.08]] },
    { id: 'adentroCA', fluido: 'ca', r: 0.03, oculto: true, puntos: [[IX + 0.12, yI(0.72), zF - 0.08], [IX + 0.38, yI(0.55), zF - 0.08], [IX + 0.42, yI(0.3), zF - 0.08], [IX + 0.45, yI(0.1), zF - 0.08]] },
];
export const REMATE = new Set(['redAerea (fin)']); // la línea sigue por la calle, fuera del dibujo
const caja = (x, y0, z, w, h, d) => [x - w / 2, x + w / 2, y0, y0 + h, z - d / 2, z + d / 2];
export const EQUIPOS = {
    ...Object.fromEntries(CAJAS.map(c => [`caja${c.id}`, caja(c.x, c.y - 0.05, c.z, 0.5, 0.45, 0.4)])),
    ...Object.fromEntries(INV.x.map((x, k) => [`inversor${k + 1}`, caja(x, 0, INV.z, INV.w + 0.1, INV.y0 + INV.h, INV.d + 0.1)])),
    trafo: caja(SITIO.trafo[0], 0, SITIO.trafo[1], 1.1, 1.4, 1.0),
    tablero: caja(SITIO.tablero[0], 0, SITIO.tablero[1], 0.8, 1.6, 0.6),
    poste: caja(SITIO.poste[0], 0, SITIO.poste[1], 0.3, 3.2, 0.3),
};

/** Puntos clave: dónde va el número y desde dónde se ve. */
export const PARTES = [
    { id: 'arreglo', ancla: [-3.8, EDIFICIO.alto + 0.5, -2.0], vista: { az: 14, el: 34, tam: 8.0, mira: [-3.8, 2.3, -1.9] } },
    { id: 'cadena', ancla: [-6.0, EDIFICIO.alto + 0.35, -1.25], vista: { az: 10, el: 30, tam: 3.4, mira: [-6.0, 2.3, -1.4] } },
    { id: 'cajas', ancla: [CAJAS[1].x, CAJAS[1].y + 0.45, CAJAS[1].z + 0.1], vista: { az: 18, el: 16, tam: 2.6, mira: [CAJAS[1].x, 2.0, -0.6] } },
    { id: 'inversor', ancla: [INV.x[1], yI(1.0) + 0.12, INV.z + 0.1], vista: { az: 24, el: 14, tam: 3.6, mira: [3.35, 1.3, 0] } },
    { id: 'mppt', ancla: [IX - 0.3, yI(0.33), zF], vista: { az: 8, el: 8, tam: 2.4, mira: [IX, yI(0.45), 0] } },
    { id: 'bus', ancla: [IX - 0.05, yI(0.5), zF], vista: { az: 6, el: 8, tam: 2.2, mira: [IX, yI(0.5), 0] } },
    { id: 'puente', ancla: [IX + 0.05, yI(0.72), zF], vista: { az: 6, el: 10, tam: 2.2, mira: [IX, yI(0.6), 0] } },
    { id: 'filtro', ancla: [IX + 0.38, yI(0.5), zF], vista: { az: -8, el: 8, tam: 2.2, mira: [IX + 0.1, yI(0.45), 0] } },
    { id: 'disipador', ancla: [IX + 0.55, yI(0.82), INV.z - INV.d / 2 - 0.1], vista: { az: 150, el: 16, tam: 2.8, mira: [IX, yI(0.5), -0.2] } },
    { id: 'relevadores', ancla: [IX + 0.4, yI(0.16), zF], vista: { az: -6, el: 10, tam: 2.2, mira: [IX + 0.1, yI(0.3), 0] } },
    { id: 'control', ancla: [IX, yI(0.92), zF], vista: { az: 4, el: 14, tam: 2.2, mira: [IX, yI(0.75), 0] } },
    { id: 'transformador', ancla: [SITIO.trafo[0], 1.55, SITIO.trafo[1] + 0.3], vista: { az: -16, el: 18, tam: 2.8, mira: [SITIO.trafo[0], 0.8, SITIO.trafo[1]] } },
    { id: 'interconexion', ancla: [SITIO.tablero[0], 1.75, SITIO.tablero[1] + 0.3], vista: { az: -24, el: 14, tam: 2.6, mira: [SITIO.tablero[0], 1.0, SITIO.tablero[1]] } },
    { id: 'red', ancla: [SITIO.poste[0], 3.2, SITIO.poste[1]], vista: { az: -30, el: 14, tam: 3.4, mira: [7.6, 1.8, 2.0] } },
];

// ------------------------------------------------------------------ la pose
export function pose({ modo = 'dia', planta = null, noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, planta, ...resto });
    const conectado = modo === 'red' ? L.conectado : true;
    // cuánto pasa, de cada 1
    const s = modo === 'dia' ? clamp01(L.Pac / (2 * TRIO.P)) : modo === 'calor' ? clamp01(L.Pac / TRIO.P) : modo === 'onda' ? L.s : conectado ? 0.7 : 0;
    const sol0 = modo === 'dia' ? clamp01(L.G / EJ.sol.max) : modo === 'red' && !conectado ? 0.7 : 0.8;
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    const cd = modo === 'red' && !conectado ? 0 : s;
    for (const k of [1, 2, 3, 4]) flujos[`cd${k}`] = cd > 0.01 ? 0.1 + 0.85 * cd : 0;
    flujos.adentroCD = flujos.cd1;
    for (const id of ['ca1', 'ca2', 'salida', 'adentroCA']) flujos[id] = conectado && s > 0.01 ? 0.1 + 0.85 * s : 0;
    flujos.red = flujos.redAerea = flujos.salida;
    const cam = camara || { mira: [-0.4, 1.4, -0.5], az: 16, el: 26, d: 34 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, conectado,
        // qué tan rápido conmutan los transistores a la vista (en cámara muy lenta)
        conmuta: modo === 'onda' ? clamp01(L.N / 400) : s > 0.01 ? 0.6 : 0,
        sol: noche > 0.5 ? 0 : sol0,
        activo: {
            cd: cd > 0.01 ? 1 : 0, ca: conectado && s > 0.01 ? 1 : 0,
            calor: modo === 'calor' ? clamp01((L.disipador - 45) / 35) : 0,
            alarma: modo === 'red' && !conectado ? 1 : modo === 'calor' && L.recorta ? 1 : modo === 'onda' && !L.cumple ? 1 : 0,
            puente: modo === 'onda' ? 1 : 0,
            isla: modo === 'red' && L.apagon ? 1 : 0,
        },
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'dia', camara: { mira: [-0.4, 1.4, -0.5], az: lerp(8, 24, t / 12), el: 26, d: 34 } });
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
/** Revisión de cifras contra la tesis, la ficha del inversor y la regla de la generación distribuida. */
export function revisar() {
    const p = [];
    const entre = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // la planta
    const kWp = (84 * MODULOS.yingli.P + 84 * MODULOS.solarever.P) / 1000;
    entre(kWp, 42.84, 42.84, '84 × 250 + 84 × 260 W = 42.84 kWp');
    entre(ARREGLO.serie * ARREGLO.cadenas * ARREGLO.canales * PLANTA.inversores, 168, 168, '14 × 3 × 2 × 2 = 168 módulos');
    entre(ARREGLO.serie * MODULOS.yingli.Vmp, 417.1, 417.3, 'una cadena Yingli: 417.2 V, como en la tesis');
    entre(ARREGLO.serie * MODULOS.solarever.Vmp, 441.2, 441.3, 'y Solarever: 441.28 V');
    // la curva de la cadena pasa por los tres puntos de la ficha
    const c = cadena('yingli', 1000, 25);
    entre(c.I(0), 8.919, 8.921, 'en corto circuito, Isc');
    entre(c.I(417.2), 8.389, 8.391, 'en máxima potencia, Imp');
    entre(c.I(c.voc - 0.01), 0, 0.01, 'en circuito abierto, nada');
    const ch = canal('yingli', 1000, 25);
    entre(ch.Pmp, 10490, 10600, 'tres cadenas Yingli en un canal a 1,000 W/m² y 25 °C: unos 10.5 kW');
    entre(ch.I, 24, TRIO.Icanal, 'casi los 25 A que aguanta el canal');
    const caliente = canal('yingli', 1000, 65);
    entre(caliente.V, 330, 400, 'con la celda a 65 °C, el voltaje baja de 417 a unos 360 V');
    entre(caliente.plena ? 1 : 0, 0, 0, 'abajo de 450 V: fuera de la ventana de plena potencia');
    // el inversor
    entre(Math.max(...Array.from({ length: 100 }, (_, k) => eficiencia((k + 1) / 100))) * 100, 98.1, 98.3, 'eficiencia máxima, 98.2 %');
    entre(eficienciaCEC() * 100, 97.4, 97.6, 'eficiencia CEC, 97.5 %');
    entre(perdidaInv(1), 600, 700, 'a 20 kW, unos 670 W de calor');
    entre(inversor(50, 30).Pac, 0, 0, 'con menos de 65 W no entrega');
    entre(maxPorCalor(40), TRIO.Pmax, TRIO.Pmax, 'hasta 45 °C da todo');
    entre(maxPorCalor(55), 0.75 * TRIO.Pmax, 0.85 * TRIO.Pmax, 'a 55 °C ya reduce');
    // un día de mayo
    const n = dia({ hora: EJ.sol.mediodia });
    entre(n.Pac / 1000, 34, 37.5, 'al mediodía, unos 36 kW: se midieron 35.9');
    entre(n.inv[0].canales[0].I, 23.5, TRIO.Icanal, 'al mediodía los canales llegan cerca de su tope de 25 A');
    entre(n.inv[0].canales[0].V, 340, TRIO.plena[0], 'y con la celda caliente trabajan abajo de los 450 V de plena potencia');
    entre(dia({ hora: 7.4 }).Pac, 0, 0, 'a las 7:24 todavía no entrega');
    entre(dia({ hora: 8.0 }).Pac, 1, 1e9, 'a las 8:00 ya entrega (se midió desde las 7:40)');
    entre(dia({ hora: 19.6 }).Pac, 0, 600, 'a las 19:36 casi nada (se midió hasta las 19:20)');
    entre(energiaDia(), 200, 290, 'un día despejado: unos 250 kWh (la tesis estima unos 215 al día en abril)');
    // la onda
    const o = onda({});
    entre(o.khz, 16, 16.1, '267 pulsos por ciclo: 16 kHz');
    entre(o.tdd, 0.05, TRIO.thd, 'a 16 kHz la distorsión de los pulsos queda abajo de los 3 % de la ficha');
    entre(o.cumple ? 1 : 0, 1, 1, 'y cumple la regla');
    entre(onda({ N: 1 }).tdd, 30, 400, 'con un solo pulso, casi cuadrada: muy distorsionada');
    entre(onda({ N: 1 }).cumple ? 1 : 0, 0, 0, 'y no cumple');
    entre(onda({ N: 267, s: 0.1 }).thd, o.tdd * 9.9, o.tdd * 10.1, 'a 10 % de carga, la misma distorsión pesa 10 veces más contra la corriente de ese momento');
    entre(armonicasOnda(267).v1 / Math.sqrt(3), 0.88, 0.92, 'la fundamental entre fases: √3 × el índice de 0.9');
    entre(onda({ N: 99 }).tdd, RED.tdd * 0.3, RED.tdd, 'a 6 kHz la distorsión total ya cabe en 5 %');
    entre(onda({ N: 200 }).cumple ? 1 : 0, 0, 0, 'pero a 12 kHz una armónica sola todavía pasa su límite');
    entre(onda({ N: 60 }).tdd, RED.tdd * 2, 1000, 'si los pulsos caen en la resonancia del filtro, la distorsión se dispara');
    entre(o.fase, 276, 278, 'el bus de 870 V da unos 277 V por fase: 480 entre fases');
    entre(limiteOrden(5), 4, 4, 'la quinta: 4 %');
    entre(limiteOrden(4), 1, 1, 'una par: la cuarta parte');
    // la red
    entre(tiempoTension(100), Infinity, Infinity, 'a 100 % opera');
    entre(tiempoTension(80), 2, 2, 'a 80 %, 2 s');
    entre(tiempoTension(115), 1, 1, 'a 115 %, 1 s');
    entre(tiempoTension(130), 0.16, 0.16, 'a 130 %, 0.16 s');
    entre(tiempoFrecuencia(60), Infinity, Infinity, 'a 60 Hz opera');
    entre(tiempoFrecuencia(58), AJUSTE.baja, AJUSTE.baja, 'a 58 Hz, su ajuste');
    entre(AJUSTE.baja, RED.frecuencia.bajaMin, RED.frecuencia.bajaMax, 'el ajuste de baja frecuencia, entre 30 y 300 s');
    entre(tiempoFrecuencia(56), 0.16, 0.16, 'abajo de 57 Hz, 0.16 s');
    entre(EJ.detecta, 0, RED.isla, 'nota la isla antes de medio segundo');
    entre(red({ f: 60.8 }).vuelve ? 1 : 0, 0, 0, 'a 60.8 Hz no vuelve: debe estar entre 59.3 y 60.5');
    entre(clamp(1, 0, 2), 1, 1, 'ayudas');
    return p;
}
