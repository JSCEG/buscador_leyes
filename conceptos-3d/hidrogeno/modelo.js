// La planta de hidrógeno como cifras puras: la física de cada proceso, el acomodo de la planta y qué fluye por cada tubo.
// Sin three.js ni DOM. Todas las lecturas (tablero, gráficas, partículas) salen de calcular(), así no pueden contradecirse.
//
// Planta de ejemplo, con cifras típicas (sirven para ver las proporciones, no son los datos de una planta real):
// - Electrolizador PEM de 10 MW: 4 pilas de 130 celdas de 5,000 cm². A 2 A/cm², cada celda lleva 10,000 A.
//   Faraday: H₂ = I · celdas / 2F. Energía por kilo = V · 2F / M(H₂) = V · 26.59 kWh/kg. A 1.48 V (termoneutro): 39.4 kWh/kg,
//   el poder calorífico superior. A 1.9 V: 50.6 kWh/kg en la pila, unos 55 con los equipos auxiliares (+ 10 %).
//   Agua: 8.94 kg/kg H₂. Oxígeno: 7.94 kg/kg H₂.
// - Pirólisis de metano (hidrógeno turquesa): CH₄ → C + 2 H₂. ΔH ≈ 89 kJ/mol y ΔS ≈ 108 J/mol·K a alta temperatura.
//   La conversión de equilibrio a 1 atm es x = √(K / (K + 4)). Es el límite teórico: un reactor real convierte menos.
//   Por kilo de H₂: 3.98 kg de CH₄ y 2.98 kg de carbono sólido. Calor: reacción (74.8 kJ/mol a 25 °C) + calentar el gas
//   (≈ 70 J/mol·K), sin recuperar nada. Plantas reales reportan del orden de 10 a 20 kWh/kg.
// - Pila de combustible PEM de 2 MW: 4 pilas de 122 celdas. Da V · 26.59 kWh por kilo de H₂: a 0.68 V, 18 kWh/kg.
//   Eficiencia sobre el poder calorífico inferior (33.3 kWh/kg ≙ 1.25 V): V / 1.25.
// - Solar 10 MW y viento 3 MW. Tanques: 2,000 kg a 350 bar (≈ 24 kg/m³).
// - Baterías de 4 MW y 16 MWh (Sistema de Almacenamiento de Energía, SAE): regresan unos 82 de cada 100 kWh, el promedio de
//   las baterías de escala de red en EE. UU. en 2019 (EIA). Guardan electricidad, no hidrógeno.
// - Un día completo (diaCompleto): lo que generan sol y viento va primero a la red, luego a las baterías y lo demás a hacer
//   hidrógeno. Lo que le falta a la red sale primero de las baterías y después del hidrógeno guardado.

export const DURACION = 12;
export const FPS = 60;
const D2R = Math.PI / 180;
const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;

export const FARADAY = 96485;
const M_H2 = 2.016e-3; // kg/mol
export const KWH_KG_POR_VOLT = (2 * FARADAY) / M_H2 / 3.6e6; // ≈ 26.59
export const V_REVERSIBLE = 1.23;
export const V_TERMONEUTRO = 1.48;
export const AGUA_POR_KG = 8.94;
export const O2_POR_KG = 7.94;
export const CH4_POR_KG = 3.98;
export const C_POR_KG = 2.98;
export const AUXILIARES = 1.1;
export const COMPRESION_KWH_KG = 3;
export const PLANTA = {
    stacks: 4, celdas: 130, areaCm2: 5000, iMax: 2,
    pila: { stacks: 4, celdas: 122, areaCm2: 5000, iMax: 1.2 },
    solarMW: 10, vientoMW: 3, tanqueKg: 2000, presionBar: 350, pureza: 99.999,
    metanoKgH: 400,
};

// ------------------------------------------------------------------ curvas
/** Voltaje de una celda del electrolizador a i A/cm² (activación + óhmica). */
export function voltajeElectrolisis(i) {
    return V_REVERSIBLE + 0.06 * Math.log10(Math.max(i, 1e-3) / 1e-3) + 0.24 * i;
}
/** Voltaje de una celda de la pila a i A/cm² (activación, óhmica y falta de gas al final). */
export function voltajePila(i) {
    return V_REVERSIBLE - 0.06 * Math.log10(Math.max(i, 1e-3) / 1e-6) - 0.16 * i - 0.03 * Math.exp(5 * (i - 1.1));
}
/** Conversión de equilibrio del metano a T °C (1 atm). */
export function conversionEquilibrio(tC) {
    const T = tC + 273.15;
    const K = Math.exp(-(89000 - 108 * T) / (8.314 * T));
    return Math.sqrt(K / (K + 4));
}
/** Calor por kilo de H₂ en la pirólisis (kWh/kg), sin recuperar calor. */
export function calorPirolisis(tC) {
    const x = Math.max(conversionEquilibrio(tC), 0.01);
    const kJmol = 74.8 * x + 0.07 * (tC - 25);
    return (kJmol * 1000) / (x * 2 * M_H2) / 3.6e6;
}

const electrolizadorMW = i => (PLANTA.stacks * PLANTA.celdas * PLANTA.areaCm2 * i * voltajeElectrolisis(i)) / 1e6;
const pilaMW = i => (PLANTA.pila.stacks * PLANTA.pila.celdas * PLANTA.pila.areaCm2 * i * voltajePila(i)) / 1e6;

/**
 * Las lecturas de la planta. proceso: 'verde' | 'turquesa' | 'pila' | 'dia'.
 * carga 0–1: la corriente que se le pide al electrolizador, o la demanda a la pila. temp: °C del reactor. sol 0–1.
 */
export function calcular({ proceso = 'verde', carga = 0.8, temp = 1000, sol = 1, hora = 12 } = {}) {
    const disponible = PLANTA.solarMW * sol + PLANTA.vientoMW;
    const r = { proceso, disponible, sol, verde: null, turquesa: null, pila: null, dia: null, h2Entra: 0, h2Sale: 0 };
    if (proceso === 'dia') {
        r.dia = enHora(hora);
        r.h2Entra = r.dia.kgEntra;
        r.h2Sale = r.dia.kgSale;
    } else if (proceso === 'verde') {
        let i = clamp01(carga) * PLANTA.iMax;
        const pedida = electrolizadorMW(i) * AUXILIARES;
        let limitada = false;
        if (pedida > disponible) {
            let [a, b] = [0, i];
            for (let k = 0; k < 28; k++) {
                const m = (a + b) / 2;
                if (electrolizadorMW(m) * AUXILIARES > disponible) b = m; else a = m;
            }
            i = a;
            limitada = true;
        }
        const v = voltajeElectrolisis(i);
        const mw = electrolizadorMW(i);
        const kwhCelda = v * KWH_KG_POR_VOLT;
        const kgH = (mw * 1000) / kwhCelda;
        r.verde = {
            i, v, mw, total: mw * AUXILIARES, limitada, kgH, kwhKg: kwhCelda * AUXILIARES, kwhCelda,
            aguaLH: kgH * AGUA_POR_KG, o2KgH: kgH * O2_POR_KG, eficiencia: V_TERMONEUTRO / (v * AUXILIARES),
            kA: (i * PLANTA.areaCm2) / 1000,
        };
        r.h2Entra = kgH;
    } else if (proceso === 'turquesa') {
        const x = conversionEquilibrio(temp);
        const kgH = PLANTA.metanoKgH * x * (1 / CH4_POR_KG);
        const kwhKg = calorPirolisis(temp);
        r.turquesa = { temp, x, kgH, ch4KgH: PLANTA.metanoKgH, cKgH: kgH * C_POR_KG, kwhKg, mw: (kgH * kwhKg) / 1000 };
        r.h2Entra = kgH;
    } else {
        const i = clamp01(carga) * PLANTA.pila.iMax;
        const v = voltajePila(Math.max(i, 1e-3));
        const mw = pilaMW(i);
        const kwhKg = v * KWH_KG_POR_VOLT;
        const kgH = (mw * 1000) / kwhKg;
        r.pila = { i, v, mw, kwhKg, kgH, aguaLH: kgH * AGUA_POR_KG, calorMW: mw * (V_TERMONEUTRO / v - 1), eficiencia: v / 1.25 };
        r.h2Sale = kgH;
    }
    return r;
}
/** De cada kWh que entra al electrolizador, cuántos regresan al pasar por el tanque y la pila. */
export function idaYVuelta() {
    const entra = voltajeElectrolisis(2) * KWH_KG_POR_VOLT * AUXILIARES;
    const sale = voltajePila(1) * KWH_KG_POR_VOLT;
    return { entra, sale, fraccion: sale / entra };
}

// ------------------------------------------------------------------ un día completo
export const BATERIA = { mw: 4, mwh: 16, eficiencia: 0.82, minimo: 0.05 };
const ETA_BATERIA = Math.sqrt(BATERIA.eficiencia);
export const COMPROMISO = { dia: 3.5, tarde: 4, noche: 3.4 };
export const PASO_HORAS = 0.25;
const biseca = (f, meta, b) => { let a = 0; for (let k = 0; k < 30; k++) { const m = (a + b) / 2; if (f(m) > meta) b = m; else a = m; } return a; };
export const ELECTROLIZADOR_MAX = electrolizadorMW(PLANTA.iMax) * AUXILIARES;
export const SAE_H2_MAX = pilaMW(PLANTA.pila.iMax);
const kgElectrolizador = total => { if (total <= 0) return 0; const i = biseca(x => electrolizadorMW(x) * AUXILIARES, total, PLANTA.iMax); return (electrolizadorMW(i) * 1000) / (voltajeElectrolisis(i) * KWH_KG_POR_VOLT); };
const kgCelda = mw => { if (mw <= 0) return 0; const i = biseca(pilaMW, mw, PLANTA.pila.iMax); return (mw * 1000) / (voltajePila(Math.max(i, 1e-3)) * KWH_KG_POR_VOLT); };
export const solarEnHora = h => (h <= 6.5 || h >= 18.5 ? 0 : PLANTA.solarMW * Math.sin((Math.PI * (h - 6.5)) / 12) ** 1.2);
export const vientoEnHora = h => 1.3 + 0.9 * Math.cos((2 * Math.PI * (h - 2)) / 24);
export const compromisoEnHora = h => (h >= 18 && h < 23 ? COMPROMISO.tarde : h >= 7 && h < 18 ? COMPROMISO.dia : COMPROMISO.noche);
/** 0 de día, 1 de noche; el amanecer y el atardecer duran cerca de hora y media. */
export const nocheEnHora = h => { const u = Math.sin((Math.PI * (h - 6.5)) / 12); return 1 - clamp01((u + 0.12) / 0.3); };

let filasDia = null;
/** El reparto de un día, en cuartos de hora. Las baterías se repiten hasta quedar en su ciclo; los tanques amanecen igual que ayer. */
export function diaCompleto(nivelInicio = 0.45) {
    if (filasDia) return filasDia;
    let soc = 0.5;
    let filas = [];
    for (let vuelta = 0; vuelta < 3; vuelta++) {
        filas = [];
        let nivel = nivelInicio;
        for (let k = 0; k < 24 / PASO_HORAS; k++) {
            const h = k * PASO_HORAS;
            const solar = solarEnHora(h);
            const viento = vientoEnHora(h);
            const ren = solar + viento;
            const dem = compromisoEnHora(h);
            const directo = Math.min(ren, dem);
            let sobra = ren - directo;
            let falta = dem - directo;
            const carga = Math.min(sobra, BATERIA.mw, Math.max(0, ((1 - soc) * BATERIA.mwh) / (ETA_BATERIA * PASO_HORAS)));
            sobra -= carga;
            const elec = Math.min(sobra, ELECTROLIZADOR_MAX);
            const vertido = sobra - elec;
            const descarga = Math.min(falta, BATERIA.mw, Math.max(0, ((soc - BATERIA.minimo) * BATERIA.mwh * ETA_BATERIA) / PASO_HORAS));
            falta -= descarga;
            const saeH2 = Math.min(falta, SAE_H2_MAX);
            falta -= saeH2;
            const kgEntra = kgElectrolizador(elec);
            const kgSale = kgCelda(saeH2);
            filas.push({ h, solar, viento, ren, dem, directo, carga, elec, vertido, descarga, saeH2, falta, soc, nivel, kgEntra, kgSale, red: directo + descarga + saeH2 });
            soc += ((carga * ETA_BATERIA - descarga / ETA_BATERIA) * PASO_HORAS) / BATERIA.mwh;
            nivel += ((kgEntra - kgSale) * PASO_HORAS) / PLANTA.tanqueKg;
        }
    }
    // lo poco que no cuadra entre días se reparte, para que el reloj dé la vuelta sin brincos
    const ultima = filas.at(-1);
    const sobrante = ultima.nivel + ((ultima.kgEntra - ultima.kgSale) * PASO_HORAS) / PLANTA.tanqueKg - nivelInicio;
    filas.forEach(f => { f.nivel -= (sobrante * f.h) / 24; });
    filas.sobrante = sobrante;
    filasDia = filas;
    return filas;
}
/** La fila de cualquier hora, con los valores entre cuartos de hora. */
export function enHora(hora) {
    const filas = diaCompleto();
    const h = ((hora % 24) + 24) % 24;
    const i = Math.floor(h / PASO_HORAS);
    const a = filas[i];
    const b = filas[(i + 1) % filas.length];
    const k = h / PASO_HORAS - i;
    const r = { h };
    for (const c of Object.keys(a)) if (c !== 'h') r[c] = a[c] + (b[c] - a[c]) * k;
    return r;
}
/** Energía que cada almacenamiento puede entregar a la red, en MWh. */
export function energiaUtil() {
    return { baterias: (1 - BATERIA.minimo) * BATERIA.mwh * ETA_BATERIA, tanques: (PLANTA.tanqueKg * voltajePila(1) * KWH_KG_POR_VOLT) / 1000 };
}

// ------------------------------------------------------------------ acomodo y tubos
export const LOSA = { x: [-6.5, 6.5], z: [-5.1, 4.8] };
export const FLUIDOS = {
    agua: { nombre: 'Agua', color: '#16a9d4' },
    h2: { nombre: 'Hidrógeno', color: '#22b84a' },
    o2: { nombre: 'Oxígeno', color: '#5f8dff' },
    elec: { nombre: 'Electricidad', color: '#ff8a1f' },
    ch4: { nombre: 'Metano', color: '#b36bff' },
    c: { nombre: 'Carbono', color: '#8a6a30' },
};
// proceso: en cuál corre. Los puntos son [x, y, z]; r, el grueso del tubo.
export const LINEAS = [
    { id: 'solar', fluido: 'elec', procesos: ['verde', 'turquesa', 'dia'], r: 0.03, puntos: [[-3.6, 0.2, -2.25], [-3.6, 0.2, -1.95], [-2.8, 0.2, -1.95], [-2.8, 0.3, -1.62]] },
    { id: 'viento', fluido: 'elec', procesos: ['verde', 'turquesa', 'dia'], r: 0.03, puntos: [[-5.6, 0.18, -3.75], [-5.6, 0.18, -2.1], [-4.22, 0.18, -2.1]] },
    { id: 'viento2', fluido: 'elec', procesos: ['verde', 'turquesa', 'dia'], r: 0.03, puntos: [[-4.22, 0.18, -2.1], [-2.3, 0.18, -2.1], [-2.3, 0.3, -1.62]] },
    { id: 'bus', fluido: 'elec', procesos: ['dia'], r: 0.03, puntos: [[-3.6, 0.2, -2.25], [-4.22, 0.2, -2.25], [-4.22, 0.2, 1.62], [-3.72, 0.26, 1.62], [-3.72, 0.26, 3.62], [-1.2, 0.26, 3.62], [-1.04, 0.3, 3.3]] },
    { id: 'carga', fluido: 'elec', procesos: ['dia'], r: 0.035, puntos: [[-2.36, 0.26, 3.62], [-2.36, 0.3, 3.78]] },
    { id: 'descarga', fluido: 'elec', procesos: ['dia'], r: 0.04, puntos: [[-1.11, 0.36, 3.72], [-0.72, 0.36, 3.72], [-0.72, 0.36, 3.58]] },
    { id: 'rectificador', fluido: 'elec', procesos: ['verde', 'dia'], r: 0.05, puntos: [[-2.5, 0.72, -1.02], [-2.5, 0.72, -0.72]] },
    { id: 'ro', fluido: 'agua', procesos: ['verde', 'dia'], r: 0.045, puntos: [[-5.35, 0.3, -0.75], [-5.35, 0.3, -0.38]] },
    { id: 'agua', fluido: 'agua', procesos: ['verde', 'dia'], r: 0.055, puntos: [[-4.48, 0.34, 0.2], [-3.98, 0.34, 0.2]] },
    { id: 'h2crudo', fluido: 'h2', procesos: ['verde', 'dia'], r: 0.055, puntos: [[-1.02, 1.05, -0.3], [-0.78, 1.05, -0.45], [-0.66, 1.05, -0.45]] },
    { id: 'o2', fluido: 'o2', procesos: ['verde', 'dia'], r: 0.05, puntos: [[-1.02, 0.85, 0.5], [-0.78, 0.85, 0.75], [-0.6, 0.85, 0.75]] },
    { id: 'venteo', fluido: 'o2', procesos: ['verde', 'dia'], r: 0.05, puntos: [[-0.35, 1.32, 0.75], [-0.35, 2.75, 0.75]] },
    { id: 'h2sep', fluido: 'h2', procesos: ['verde', 'dia'], r: 0.05, puntos: [[-0.35, 1.62, -0.45], [-0.35, 1.98, -0.45], [0.85, 1.98, -0.45], [0.85, 1.98, 0.62], [0.85, 1.14, 0.62]] },
    { id: 'deoxo', fluido: 'h2', procesos: ['verde', 'dia'], r: 0.05, puntos: [[1.04, 0.24, 0.62], [1.35, 0.24, 0.62], [1.35, 0.24, -0.04]] },
    { id: 'refinado', fluido: 'h2', procesos: ['verde', 'turquesa', 'dia'], r: 0.05, puntos: [[1.65, 2.22, -0.3], [2.48, 2.22, -0.3], [2.48, 0.56, -0.3], [2.48, 0.56, 0.02]] },
    { id: 'alta', fluido: 'h2', procesos: ['verde', 'turquesa', 'dia'], r: 0.05, puntos: [[3.62, 0.44, 0.25], [3.88, 0.44, 0.25], [3.88, 0.62, 0.12], [3.98, 0.62, 0.12]] },
    { id: 'colector', fluido: 'h2', procesos: [], r: 0.05, puntos: [[3.88, 0.62, -1.15], [3.88, 0.62, 1.32]] },
    { id: 'apila', fluido: 'h2', procesos: ['pila', 'dia'], r: 0.05, puntos: [[5.0, 0.42, 1.72], [5.0, 0.42, 3.0], [2.92, 0.42, 3.0]] },
    { id: 'aguaPila', fluido: 'agua', procesos: ['pila', 'dia'], r: 0.05, puntos: [[1.0, 0.18, 2.28], [1.0, 0.18, 2.1], [-5.1, 0.18, 2.1], [-5.1, 0.18, 0.84]] },
    { id: 'cdPila', fluido: 'elec', procesos: ['pila', 'dia'], r: 0.05, puntos: [[0.28, 0.72, 3.0], [-0.28, 0.72, 3.12]] },
    { id: 'linea', fluido: 'elec', procesos: ['pila', 'dia'], r: 0.018, puntos: [[-0.72, 1.32, 3.2], [-1.3, 1.62, 3.26], [-1.95, 2.02, 3.3], [-2.65, 1.72, 3.34], [-3.3, 1.86, 3.38], [-3.75, 1.18, 3.42]] },
    { id: 'metano', fluido: 'ch4', procesos: ['turquesa'], r: 0.055, puntos: [[3.98, 0.24, -3.65], [3.0, 0.24, -3.65], [3.0, 0.24, -3.42]] },
    { id: 'calor', fluido: 'elec', procesos: ['turquesa'], r: 0.035, puntos: [[-1.86, 0.2, -1.62], [-1.86, 0.2, -2.25], [2.02, 0.2, -2.25], [2.02, 0.2, -3.1]] },
    { id: 'carbono', fluido: 'c', procesos: ['turquesa'], r: 0.06, puntos: [[2.2, 2.55, -3.45], [1.72, 2.66, -3.6], [1.2, 1.55, -3.72]] },
    { id: 'h2turq', fluido: 'h2', procesos: ['turquesa'], r: 0.05, puntos: [[2.6, 3.12, -3.4], [2.6, 3.34, -3.4], [1.75, 3.34, -3.4], [1.75, 0.3, -3.1], [1.75, 0.3, -0.72], [1.35, 0.3, -0.72], [1.35, 0.3, -0.54]] },
];

// Puntos clave: cada uno, una ficha. vista: desde dónde mirarlo (grados) y su tamaño, para la cámara. ancla: el punto en 3D.
export const PARTES = [
    { id: 'renovable', ancla: [-4, 1.3, -3.3], vista: { az: 24, el: 26, tam: 5 } },
    { id: 'agua', ancla: [-5.1, 1, 0.2], vista: { az: -42, el: 18, tam: 3 } },
    { id: 'electrolizador', ancla: [-2.5, 1.1, 0.1], vista: { az: 18, el: 24, tam: 3.3 } },
    { id: 'separadores', ancla: [-0.35, 1.1, 0.15], vista: { az: 8, el: 34, tam: 2.8 } },
    { id: 'refinacion', ancla: [1.4, 1.2, 0.1], vista: { az: 10, el: 34, tam: 2.8 } },
    { id: 'compresor', ancla: [3.05, 0.65, 0.25], vista: { az: -6, el: 36, tam: 2.1 } },
    { id: 'tanques', ancla: [5, 0.9, 0.1], vista: { az: 46, el: 24, tam: 3.6 } },
    { id: 'baterias', ancla: [-2.36, 0.85, 4.2], vista: { az: -12, el: 30, tam: 3.1 } },
    { id: 'pila', ancla: [1.6, 0.9, 3], vista: { az: 16, el: 26, tam: 3.2 } },
    { id: 'red', ancla: [-3.5, 1, 3.3], vista: { az: -14, el: 24, tam: 5 } },
    { id: 'pirolisis', ancla: [2.6, 1.8, -3.4], vista: { az: 158, el: 20, tam: 5.7, mira: [3.45, 1.05, -3.45] } }, // que entren el reactor y el tanque de metano
];

// ------------------------------------------------------------------ la pose
/**
 * Todo lo que necesita posar(). noche 0–1, adentro 0–1 (las cubiertas se vuelven vidrio), desarme 0–1 (vista explotada),
 * encendido 0–1 (la entrada), nivel 0–1 (tanques), soc 0–1 (baterías), hora (en el proceso «dia»), dt (lo que avanza lo que fluye).
 */
export function pose({ proceso = 'verde', carga = 0.8, temp = 1000, noche = 0, adentro = 0, desarme = 0, encendido = 1, nivel = 0.45, soc = 0.6, hora = 12, t = 0, dt = 0, camara = null } = {}) {
    const sol = 1 - clamp01(noche);
    const lectura = calcular({ proceso, carga, temp, sol, hora });
    const D = lectura.dia;
    const f = {
        verde: lectura.verde ? clamp01(lectura.verde.mw / 10) : D ? clamp01(D.elec / AUXILIARES / 10) : 0,
        turquesa: lectura.turquesa ? lectura.turquesa.x : 0,
        pila: lectura.pila ? clamp01(lectura.pila.mw / 2) : D ? clamp01(D.saeH2 / 2) : 0,
        bateria: D ? clamp01(Math.max(D.carga, D.descarga) / BATERIA.mw) : 0,
    };
    f.red = D ? clamp01(D.red / 5) : f.pila;
    const flujos = {};
    for (const L of LINEAS) flujos[L.id] = Math.max(0, ...L.procesos.map(p => f[p] ?? 0), 0);
    if (proceso === 'verde' || proceso === 'turquesa') {
        const m = lectura.disponible;
        flujos.solar = (flujos.solar > 0 ? 1 : 0) * clamp01((PLANTA.solarMW * sol) / m) * Math.max(f.verde, f.turquesa);
        flujos.viento = (flujos.viento > 0 ? 1 : 0) * clamp01(PLANTA.vientoMW / m + 0.2) * Math.max(f.verde, f.turquesa);
        flujos.viento2 = flujos.viento;
    }
    if (D) {
        const parteSolar = D.ren > 0 ? D.solar / D.ren : 0;
        flujos.solar = clamp01((D.elec * parteSolar) / ELECTROLIZADOR_MAX);
        flujos.viento = clamp01(D.viento / PLANTA.vientoMW);
        flujos.viento2 = clamp01((D.elec * (1 - parteSolar)) / ELECTROLIZADOR_MAX);
        flujos.bus = clamp01((D.directo + D.carga) / 8);
        flujos.carga = clamp01(D.carga / BATERIA.mw);
        flujos.descarga = clamp01(D.descarga / BATERIA.mw);
        flujos.linea = f.red;
        for (const id of ['apila', 'aguaPila', 'cdPila']) flujos[id] = f.pila;
    }
    const c = camara || { mira: [0, 0.6, -0.1], az: 24, el: 32, d: 30 };
    return {
        t, dt, proceso, noche, adentro, desarme, encendido, nivel, soc, sol, lectura, flujos, f,
        horaSol: D ? (D.h - 6.5) / 12 : undefined,
        activo: { verde: f.verde, turquesa: f.turquesa, pila: f.pila, bateria: f.bateria },
        camara: { mira: c.mira, az: c.az * D2R, el: c.el * D2R, d: c.d, fov: c.fov || 30 },
    };
}

export function estado(t) {
    return pose({ t, proceso: 'verde', carga: 0.8, noche: clamp01((t - 7) / 2), adentro: clamp01((t - 3) / 2) * (1 - clamp01((t - 5.5) / 1)), camara: { mira: [0, 0.6, -0.1], az: lerp(14, 40, t / DURACION), el: 30, d: 30 } });
}
export function posicionCamara({ mira, az, el, d }) {
    return [mira[0] + d * Math.cos(el) * Math.sin(az), mira[1] + d * Math.sin(el), mira[2] + d * Math.cos(el) * Math.cos(az)];
}

/** Revisión de cifras contra lo que se sabe de estos equipos. */
export function revisar() {
    const p = [];
    const lejos = (x, a, b, nombre) => { if (x < a || x > b) p.push(`${nombre} = ${x.toFixed(3)}, se esperaba entre ${a} y ${b}`); };
    lejos(KWH_KG_POR_VOLT * V_TERMONEUTRO, 39.2, 39.6, 'kWh/kg a 1.48 V');
    const v = calcular({ proceso: 'verde', carga: 1, sol: 1 }).verde;
    lejos(v.v, 1.8, 2.0, 'V a plena carga');
    lejos(v.mw, 9.5, 10.5, 'MW del electrolizador');
    lejos(v.kwhKg, 50, 60, 'kWh/kg de planta');
    lejos(v.kgH, 170, 210, 'kg/h de H₂');
    const noche = calcular({ proceso: 'verde', carga: 1, sol: 0 }).verde;
    lejos(noche.total, 2.9, 3.01, 'MW de noche, solo viento');
    const q = calcular({ proceso: 'pila', carga: 1 }).pila;
    lejos(q.mw, 1.7, 2.2, 'MW de la pila');
    lejos(q.v, 0.55, 0.72, 'V de la pila a plena carga');
    lejos(calcular({ proceso: 'pila', carga: 0.8 }).pila.v, 0.62, 0.74, 'V de la pila al 80 %');
    lejos(conversionEquilibrio(1000), 0.95, 0.995, 'conversión a 1000 °C');
    lejos(conversionEquilibrio(600), 0.5, 0.8, 'conversión a 600 °C');
    lejos(calorPirolisis(1000), 8, 14, 'kWh/kg de pirólisis');
    lejos(idaYVuelta().fraccion, 0.28, 0.4, 'ida y vuelta');
    const filas = diaCompleto();
    const suma = c => filas.reduce((a, x) => a + x[c] * PASO_HORAS, 0);
    lejos(suma('falta'), 0, 0.001, 'MWh que la red no recibe en un día');
    lejos(suma('ren') - suma('directo') - suma('carga') - suma('elec') - suma('vertido'), -0.001, 0.001, 'balance de lo generado');
    lejos(suma('descarga') / suma('carga'), 0.8, 0.84, 'lo que regresan las baterías');
    lejos(Math.abs(filas.sobrante), 0, 0.02, 'lo que cambian los tanques en un día');
    lejos(Math.min(...filas.map(x => x.soc)), BATERIA.minimo - 0.001, 0.2, 'carga mínima de las baterías');
    lejos(Math.max(...filas.map(x => x.soc)), 0.9, 1.001, 'carga máxima de las baterías');
    lejos(Math.min(...filas.map(x => x.nivel)), 0.05, 0.95, 'tanques en su punto bajo');
    lejos(Math.max(...filas.map(x => x.nivel)), 0.05, 0.95, 'tanques en su punto alto');
    lejos(enHora(20).descarga, 1, BATERIA.mw, 'baterías a las 20 h');
    lejos(enHora(3).saeH2, 0.5, SAE_H2_MAX, 'hidrógeno a las 3 h');
    lejos(enHora(12).elec, 2, ELECTROLIZADOR_MAX, 'electrolizador al mediodía');
    return p;
}
