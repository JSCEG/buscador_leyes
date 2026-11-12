// La física de las centrales térmicas, pura (sin three.js): la unidad de vapor con su combustible, cuánto tarda cada máquina en
// arrancar, cuánto cuesta cada MWh y el sistema aislado de Baja California Sur. Una sola cuenta mueve los flujos, el tablero,
// las gráficas y el diagrama. Las cifras y sus fuentes están en datos.js y fuentes.js.
import { cablesSueltos as revisarCables } from '../planta-comun/lineas.js';
import { BLOQUE, BORNES, EQUIPOS, LINEAS, PARTES, REMATE } from './lugar.js';
import { AGUA, AZUFRE_A_SO2, BCS, COMBUSTIBLES, FACTOR_SEN, IEPS, MARGEN, PRECIOS, TECNO, UNIDADES } from './datos.js';

export { AEREAS, BLOQUE, BORNES, EJE, EQUIPOS, FLUIDOS, LINEAS, MAR, PARTES, POSTES, REMATE, SITIO } from './lugar.js';
export * from './datos.js';

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const clamp01 = x => clamp(x, 0, 1);
const D2R = Math.PI / 180;
const lerp = (a, b, k) => a + (b - a) * k;
/** MJ que caben en un millón de BTU, y BTU en un kWh. */
export const MJ_MMBTU = 1055.056;
export const BTU_KWH = 3412.14;
/** De cada 100 partes del combustible, las que salen con los gases de la chimenea (de ejemplo). */
export const CHIMENEA = { carbon: 0.1, combustoleo: 0.09, gas: 0.11 };

/** Régimen térmico (BTU por kWh) de una máquina con su combustible y su carga: sube a carga parcial. */
export function regimen(tec, comb, carga = 1) {
    const T = TECNO[tec];
    const castigo = typeof T.castigo === 'number' ? T.castigo : T.castigo[comb];
    return T.regimen[comb] * (1 + castigo * ((1 - clamp01(carga)) / 0.5) ** 2);
}
export const eficiencia = (tec, comb, carga = 1) => BTU_KWH / regimen(tec, comb, carga);
/** Lo que se quema y lo que sale por cada MWh: MJ, litros o toneladas, kg de CO2 y de SO2. */
export function porMWh(tec, comb, carga = 1) {
    const c = COMBUSTIBLES[comb];
    const mmbtu = regimen(tec, comb, carga) / 1000;
    const mj = mmbtu * MJ_MMBTU;
    const litros = c.pcsLitro ? mj / c.pcsLitro : null;
    const kg = c.pcsLitro ? litros * c.densidad || null : c.pcsKg ? mj / c.pcsKg : null;
    return { mmbtu, mj, litros, kg, co2: (mmbtu * c.co2) / 1000, so2: kg ? kg * c.azufre * 2 * AZUFRE_A_SO2 : 0, cenizas: kg ? kg * c.cenizas : 0 };
}

// ------------------------------------------------------------------ la unidad de vapor
/** La unidad de vapor de la figura con su carga (0 a 1) y su combustible. */
export function unidadVapor({ carga = 1, comb = 'carbon' } = {}) {
    const k = clamp(carga, TECNO.vapor.minimo, 1);
    const mw = UNIDADES.vapor * k;
    const eta = eficiencia('vapor', comb, k);
    const m = porMWh('vapor', comb, k);
    const q = mw / eta;
    const chimenea = q * CHIMENEA[comb];
    const condensador = q - mw - chimenea;
    return {
        comb, carga: k, mw, eta, q, regimen: regimen('vapor', comb, k),
        th: m.kg ? (m.kg * mw) / 1000 : null, litrosH: m.litros ? m.litros * mw : null, gjH: (m.mj * mw) / 1000,
        co2mwh: m.co2, co2th: m.co2 * mw, so2mwh: m.so2, so2kgh: m.so2 * mw, cenizasTh: (m.cenizas * mw) / 1000,
        chimenea, condensador, marM3s: condensador / (AGUA.mj * AGUA.dT),
    };
}

// ------------------------------------------------------------------ cuánto tarda cada una en arrancar
/** Fracción de su capacidad que da una máquina t minutos después de la orden de arrancar. */
export function potenciaArranque(tec, t, frio = false) {
    const T = TECNO[tec];
    const espera = frio ? T.espera.frio : T.espera.caliente;
    if (t < espera) return 0;
    return clamp01(T.minimo + T.rampa * (t - espera));
}
/** Minutos desde la orden hasta plena carga. */
export const minutosPlena = (tec, frio = false) => (frio ? TECNO[tec].espera.frio : TECNO[tec].espera.caliente) + (1 - TECNO[tec].minimo) / TECNO[tec].rampa;

// ------------------------------------------------------------------ cuánto cuesta cada MWh
/** Las opciones que se comparan: máquina y combustible. */
export const OPCIONES = [
    { id: 'vaporCarbon', tec: 'vapor', comb: 'carbon', nombre: 'Vapor con carbón' },
    { id: 'vaporCombustoleo', tec: 'vapor', comb: 'combustoleo', nombre: 'Vapor con combustóleo' },
    { id: 'vaporGas', tec: 'vapor', comb: 'gas', nombre: 'Vapor con gas' },
    { id: 'turbogasGas', tec: 'turbogas', comb: 'gas', nombre: 'Turbogás con gas' },
    { id: 'turbogasDiesel', tec: 'turbogas', comb: 'diesel', nombre: 'Turbogás con diésel' },
    { id: 'motoresCombustoleo', tec: 'motores', comb: 'combustoleo', nombre: 'Motores con combustóleo' },
];
/** Costo del combustible (USD por MWh), impuesto al carbono (pesos por MWh) y CO2 (t por MWh) de una opción a plena carga. */
export function costo(o, { gas = PRECIOS.gas } = {}) {
    const precios = { ...PRECIOS, gas };
    const m = porMWh(o.tec, o.comb);
    const ieps = IEPS[o.comb];
    const impuesto = !ieps ? 0 : ieps.unidad === 'litro' ? m.litros * ieps.cuota : (m.kg / 1000) * ieps.cuota;
    return { ...o, eta: eficiencia(o.tec, o.comb), mmbtu: m.mmbtu, usd: m.mmbtu * precios[o.comb], impuesto, co2: m.co2, precio: precios[o.comb] };
}
export const ordenMerito = p => OPCIONES.map(o => costo(o, p)).sort((a, b) => a.usd - b.usd);

// ------------------------------------------------------------------ los modos
export const DEF = { carga: 1, comb: 'carbon', minuto: 0, frio: false, gas: PRECIOS.gas, hora: 20, anio: 2024 };
export const LIMITES = { carga: [0.3, 1], minuto: [0, 600], gas: [2, 12], hora: [0, 23.99], anio: [2024, 2039] };

export function modoVapor({ carga = DEF.carga, comb = DEF.comb } = {}) {
    return { modo: 'vapor', u: unidadVapor({ carga, comb }), comb, pedida: carga };
}
export function modoArranque({ minuto = DEF.minuto, frio = DEF.frio } = {}) {
    const p = { vapor: potenciaArranque('vapor', minuto, frio), turbogas: potenciaArranque('turbogas', minuto, frio), motores: potenciaArranque('motores', minuto, frio) };
    return { modo: 'arranque', minuto, frio, p, plena: { vapor: minutosPlena('vapor', frio), turbogas: minutosPlena('turbogas', frio), motores: minutosPlena('motores', frio) } };
}
export function modoCosto({ gas = DEF.gas } = {}) {
    return { modo: 'costo', gas, orden: ordenMerito({ gas }), factorSen: FACTOR_SEN[2024] };
}
/** La forma de la demanda de un día de verano, de 0 a 1 (de ejemplo): baja en la madrugada y sube con el aire acondicionado. */
export const FORMA_DIA = Array.from({ length: 24 }, (_, h) => +(0.64 + 0.36 * clamp01((h - 6) / 10) * clamp01((24 - h) / 3) + 0.03 * Math.sin(((h - 3) / 24) * 2 * Math.PI)).toFixed(3));
const PICO_FORMA = Math.max(...FORMA_DIA);
export function modoAislado({ hora = DEF.hora, anio: anioPedido = 2024 } = {}) {
    const anio = Math.round(anioPedido);
    const pico = BCS.pico2024 * (1 + BCS.crecePico) ** (anio - 2024);
    const dia = FORMA_DIA.map(f => (pico * f) / PICO_FORMA);
    const h = Math.floor(clamp(hora, 0, 23.99));
    return {
        modo: 'aislado', hora, anio, pico, dia, ahora: dia[h],
        instalada: pico * (1 + MARGEN.sibcs), sinReserva: pico, conMargenSin: pico * (1 + MARGEN.sin),
        pico2039: BCS.pico2024 * (1 + BCS.crecePico) ** 15,
    };
}
export function calcular({ modo = 'vapor', ...p } = {}) {
    if (modo === 'arranque') return modoArranque(p);
    if (modo === 'costo') return modoCosto(p);
    if (modo === 'aislado') return modoAislado(p);
    return modoVapor(p);
}
export const estadoPlanta = () => ({ t: 0 });
export function pasoPlanta(s, m, dt) { return { ...s, t: s.t + dt }; }

// ------------------------------------------------------------------ la pose: qué se mueve y qué brilla
export function pose({ modo = 'vapor', noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, ...resto });
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    const s = x => (x > 0.01 ? 0.15 + 0.8 * clamp01(x) : 0);
    const activo = { vapor: 0, patio: 0, turbogas: 0, motores: 0, humo: 0 };
    let vapor = 0;
    let comb = 'carbon';
    if (modo === 'vapor') { vapor = L.u.carga; comb = L.comb; activo.turbogas = 0.2; activo.motores = 0.6; }
    else if (modo === 'arranque') { vapor = L.p.vapor; activo.turbogas = L.p.turbogas; activo.motores = L.p.motores; }
    else if (modo === 'costo') { vapor = 0.8; activo.turbogas = 0.5; activo.motores = 0.7; }
    else { vapor = 0.6; comb = 'combustoleo'; activo.turbogas = 0.4; activo.motores = 0.9; }
    activo.vapor = vapor;
    activo.patio = comb === 'carbon' ? vapor : 0;
    activo.humo = vapor * (comb === 'gas' ? 0.25 : comb === 'combustoleo' ? 0.8 : 1);
    flujos.banda = s(activo.patio);
    for (const id of ['molido1', 'molido2', 'molido3']) flujos[id] = s(activo.patio);
    flujos.combustoleo = s(comb === 'combustoleo' ? vapor : 0);
    for (const id of ['vapor', 'cruce', 'retorno', 'marEntra', 'marSale', 'gases', 'generador', 'aRed']) flujos[id] = s(vapor);
    flujos.gasoducto = s(activo.turbogas);
    flujos.turbogasRed = s(activo.turbogas);
    flujos.rnt = s(Math.max(vapor, activo.turbogas));
    flujos.aislado = s(activo.motores);
    flujos.senal = 0.4;
    const cam = camara || { mira: [0, 0.8, -0.3], az: 18, el: 30, d: 36 };
    return { t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, activo, camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 } };
}
export function estado(t) {
    return pose({ t, modo: 'vapor', camara: { mira: [0, 0.8, -0.3], az: lerp(10, 24, t / 12), el: 30, d: 36 } });
}

// ------------------------------------------------------------------ revisiones
const dentroDe = ([x, y, z], [x0, x1, y0, y1, z0, z1]) => x >= x0 - 1e-6 && x <= x1 + 1e-6 && y >= y0 - 1e-6 && y <= y1 + 1e-6 && z >= z0 - 1e-6 && z <= z1 + 1e-6;
export function puntasSueltas() {
    const sueltas = [];
    for (const L of LINEAS) for (const [nombre, p] of [['inicio', L.puntos[0]], ['fin', L.puntos.at(-1)]]) {
        if (REMATE.has(`${L.id} (${nombre})`)) continue;
        if (!Object.values(EQUIPOS).some(c => dentroDe(p, c))) sueltas.push(`${L.id} (${nombre})`);
    }
    return sueltas.concat(cablesSueltos());
}
/** Los cables cuelgan de algo: cada punta en un borne y cada punto de en medio en un borne o en el piso (planta-comun/lineas.js). */
export const cablesSueltos = () => revisarCables(LINEAS, BORNES, REMATE);
export const partesFuera = () => PARTES.filter(p => p.ancla[0] < BLOQUE.x[0] || p.ancla[0] > BLOQUE.x[1] || p.ancla[2] < BLOQUE.z[0] || p.ancla[2] > BLOQUE.z[1]).map(p => p.id);

/** Revisión de cifras contra las fuentes y contra la física. Devuelve la lista de lo que no cuadra. */
export function revisar() {
    const mal = [];
    const cerca = (x, ref, tol, que) => { if (Math.abs(x - ref) > tol) mal.push(`${que}: ${x.toFixed(3)} y la fuente dice ${ref}`); };
    // eficiencia a plena carga con el régimen de la EIA (3,412 ÷ régimen): 34.0, 33.1, 31.1, 26.0 y 32.5 %
    cerca(eficiencia('vapor', 'carbon'), 0.34, 0.002, 'vapor con carbón');
    cerca(eficiencia('turbogas', 'gas'), 0.311, 0.002, 'turbogás con gas');
    cerca(eficiencia('turbogas', 'diesel'), 0.26, 0.002, 'turbogás con diésel');
    cerca(eficiencia('motores', 'combustoleo'), 0.325, 0.002, 'motores con combustóleo');
    // a media carga, el régimen sube 5 % con carbón y 18 % en la turbina de gas (WWSIS-2)
    cerca(regimen('vapor', 'carbon', 0.5) / regimen('vapor', 'carbon'), 1.05, 1e-9, 'castigo del carbón a media carga');
    cerca(regimen('turbogas', 'gas', 0.5) / regimen('turbogas', 'gas'), 1.18, 1e-9, 'castigo de la turbina de gas a media carga');
    // CO2 por MWh: régimen de la EIA × coeficiente de la EIA
    cerca(porMWh('vapor', 'carbon').co2, 0.94, 0.01, 'CO2 del vapor con carbón');
    cerca(porMWh('vapor', 'combustoleo').co2, 0.775, 0.01, 'CO2 del vapor con combustóleo');
    cerca(porMWh('vapor', 'gas').co2, 0.545, 0.01, 'CO2 del vapor con gas');
    cerca(porMWh('turbogas', 'gas').co2, 0.58, 0.01, 'CO2 de la turbogás con gas');
    cerca(porMWh('turbogas', 'diesel').co2, 0.97, 0.01, 'CO2 de la turbogás con diésel');
    cerca(porMWh('motores', 'combustoleo').co2, 0.79, 0.01, 'CO2 de los motores');
    // SO2 sin control: unos 21 kg por MWh con 4.4 % de azufre; unos 4 con carbón de 0.5 %
    cerca(porMWh('vapor', 'combustoleo').so2, 21, 0.6, 'SO2 del combustóleo');
    cerca(porMWh('vapor', 'carbon').so2, 4, 0.3, 'SO2 del carbón importado');
    // el agua de mar: Petacalco enfría sus seis unidades de 350 MW con 99 m³/s
    const u = unidadVapor({ carga: 1, comb: 'carbon' });
    if (Math.abs(u.mw + u.chimenea + u.condensador - u.q) > 1e-6) mal.push('el balance de la unidad de vapor no cierra');
    cerca(u.marM3s, 99 / 6, 2.5, 'agua de mar por unidad');
    // arranques: vapor de 2.5 a 3 h en caliente y de 5 a 10 h en frío; turbogás de 5 a 11 min; motores en unos 2 min, 5 en frío
    const dentro = (x, a, b, que) => { if (x < a || x > b) mal.push(`${que}: ${x} fuera de ${a} a ${b}`); };
    dentro(minutosPlena('vapor'), 150, 180, 'arranque en caliente del vapor');
    dentro(minutosPlena('vapor', true), 300, 600, 'arranque en frío del vapor');
    dentro(minutosPlena('turbogas'), 5, 11, 'arranque de la turbogás');
    dentro(minutosPlena('turbogas', true), 5, 11, 'arranque en frío de la turbogás');
    dentro(minutosPlena('motores'), 1, 2.5, 'arranque de los motores');
    dentro(minutosPlena('motores', true), 4, 5.5, 'arranque en frío de los motores');
    if (partesFuera().length) mal.push(`partes fuera del bloque: ${partesFuera()}`);
    return mal;
}
