// El modelo de la figura de tarifas: el recibo de una casa con las tarifas reales de 2026, lo que cuesta de verdad llevarle la energía y
// quién paga la diferencia, el promedio de 12 meses que la pasa a la tarifa DAC, y lo que paga una tienda. Puro: sin three.js.
// Las tarifas están en tarifas.js, los costos en costos.js y el lugar de cada cosa en lugar.js; aquí solo se hacen las cuentas.
import { AJUSTE, DAC, IVA, LIMITE_DAC, MINIMO_KWH, NOMBRES, RECIBO_CFE, TARIFAS, TEMPERATURA } from './tarifas.js';
import { APARATOS, CLIMA, COSTO, DIVISIONES, NEGOCIO, SUBSIDIO, cargos, porKwhVariable } from './costos.js';
import { BLOQUE, EQUIPOS, LINEAS, PARTES, REMATE } from './lugar.js';

export { BLOQUE, FLUIDOS, LINEAS, PARTES, SITIO } from './lugar.js';
export { AJUSTE, DAC, IVA, LIMITE_DAC, MINIMO_KWH, NOMBRES, RECIBO_CFE, SERIE_T1, TARIFAS, TEMPERATURA } from './tarifas.js';
export { APARATOS, CLIMA, COSTO, DIVISIONES, ESLABONES, NEGOCIO, SUBSIDIO } from './costos.js';

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const clamp01 = x => clamp(x, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;
const suma = a => a.reduce((s, x) => s + x, 0);
export const tarifaDe = i => NOMBRES[clamp(Math.round(i), 0, NOMBRES.length - 1)];

// ------------------------------------------------------------------ el recibo de un mes
/** Lo que cobra la tarifa doméstica por los kWh de un mes, bloque por bloque. Precios sin IVA. */
export function cobro(tarifa, kwh, verano) {
    const t = TARIFAS[tarifa][verano ? 'verano' : 'fuera'];
    const cobrar = Math.max(kwh, MINIMO_KWH);
    let resto = cobrar;
    let desde = 0;
    const bloques = t.bloques.map(([nombre, tam, precio]) => {
        const k = Math.max(0, Math.min(resto, tam));
        resto -= k;
        const b = { nombre, desde, hasta: desde + tam, kwh: k, precio, importe: k * precio };
        desde += tam;
        return b;
    });
    const energia = suma(bloques.map(b => b.importe));
    return { tarifa, kwh, cobrar, verano, mes: t.mes, bloques, energia, iva: energia * IVA, total: energia * (1 + IVA), medio: energia / cobrar };
}
/** La tarifa DAC de un mes: cargo fijo más cada kWh al precio de la región. */
export function cobroDac(region, kwh) {
    const r = DAC.regiones[region];
    const cobrar = Math.max(kwh, MINIMO_KWH);
    const energia = DAC.fijo + cobrar * r.kwh;
    return { region, kwh, cobrar, fijo: DAC.fijo, precio: r.kwh, energia, iva: energia * IVA, total: energia * (1 + IVA), medio: energia / cobrar };
}
/** Lo que cuesta de verdad llevar esos kWh a una casa, eslabón por eslabón, y lo que pone el Gobierno: la aportación gubernamental. */
export function costoReal(kwh, pagado, region = DEF.region) {
    const cobrar = Math.max(kwh, MINIMO_KWH);
    const categoria = cobrar <= COSTO.limiteDB1 ? 'DB1' : 'DB2';
    const partes = cargos(region, categoria).map(p => ({ ...p, importe: p.fijo ?? p.kwh * cobrar }));
    const total = suma(partes.map(p => p.importe));
    return { kwh: cobrar, categoria, region, partes, total, porKwh: total / cobrar, pagado, aportacion: Math.max(0, total - pagado), deMas: Math.max(0, pagado - total), pagaPct: total > 0 ? Math.min(1, pagado / total) : 1, razon: total > 0 ? pagado / total : 1 };
}

// ------------------------------------------------------------------ el consumo de la casa
export const BASE = suma(APARATOS.map(a => a.kwhMes));
/** kWh al mes: los aparatos de siempre y el clima según sus horas al día, los equipos y el mes (0 = enero). */
export function consumoMes({ mesCal, horasClima = DEF.horasClima, equipos = DEF.equipos }) {
    const clima = CLIMA.kw * equipos * horasClima * 30 * CLIMA.uso[mesCal];
    return { base: BASE, clima, total: BASE + clima };
}
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** Los meses de verano de la casa de ejemplo: de mayo a octubre, seis seguidos. */
export const VERANO = [4, 5, 6, 7, 8, 9];
export const esVerano = m => VERANO.includes(m);

/** Un año de la casa: consumo, recibo de cada mes con su tarifa, el promedio de 12 meses y si cae en la DAC. */
export function anio({ tarifa = '1', horasClima = DEF.horasClima, equipos = DEF.equipos, region = DEF.region } = {}) {
    const meses = MESES.map((nombre, m) => {
        const c = consumoMes({ mesCal: m, horasClima, equipos });
        const r = cobro(tarifa, c.total, esVerano(m));
        const d = cobroDac(region, c.total);
        const k = costoReal(c.total, r.energia, region);
        return { m, nombre, ...c, recibo: r, dac: d, costo: k };
    });
    const promedio = suma(meses.map(x => x.total)) / 12;
    const limite = LIMITE_DAC[tarifa];
    const enDac = promedio > limite;
    const pagoNormal = suma(meses.map(x => x.recibo.total));
    const pagoDac = suma(meses.map(x => x.dac.total));
    const aportacion = suma(meses.map(x => x.costo.aportacion));
    const costo = suma(meses.map(x => x.costo.total));
    // con cuántas horas de clima al día pasaría el límite
    const porHora = (CLIMA.kw * equipos * 30 * suma(CLIMA.uso)) / 12;
    const horasLimite = porHora > 0 ? (limite - BASE) / porHora : Infinity;
    return { tarifa, horasClima, equipos, region, meses, promedio, limite, enDac, pagoNormal, pagoDac, pago: enDac ? pagoDac : pagoNormal, aportacion: enDac ? 0 : aportacion, costo, horasLimite };
}

// ------------------------------------------------------------------ cada modo
export const DEF = { tarifaIdx: 0, kwh: 150, verano: false, horasClima: 4, equipos: 1, region: 'central', mes: 6, tienda: 900 };
export const LIMITES = { tarifaIdx: [0, 6], kwh: [25, 1500], horasClima: [0, 24], mes: [0, 11], tienda: [100, 3000] };

export function modoRecibo({ tarifaIdx = DEF.tarifaIdx, kwh = DEF.kwh, verano = DEF.verano, region = DEF.region } = {}) {
    const tarifa = tarifaDe(tarifaIdx);
    const r = cobro(tarifa, kwh, verano);
    const k = costoReal(kwh, r.energia, region);
    const limiteDac = LIMITE_DAC[tarifa];
    return { modo: 'recibo', tarifa, r, k, limiteDac, pasaDac: kwh > limiteDac, bimestre: r.total * 2, temperatura: TEMPERATURA[tarifa], curva: curvaRecibo(tarifa, verano) };
}
/** Lo que se paga al mes, con IVA, de 0 a 1,500 kWh: para la gráfica. */
export function curvaRecibo(tarifa, verano) {
    const t = TARIFAS[tarifa][verano ? 'verano' : 'fuera'];
    const quiebres = [0, MINIMO_KWH];
    let x = 0;
    for (const [, tam] of t.bloques) { x += tam; if (Number.isFinite(x) && x < 1500) quiebres.push(x); }
    quiebres.push(1500);
    return [...new Set(quiebres)].sort((a, b) => a - b).map(k => [k, cobro(tarifa, k, verano).total]);
}
export function modoCosto(p = {}) {
    const L = modoRecibo(p);
    return { ...L, modo: 'costo' };
}
export function modoDac({ tarifaIdx = DEF.tarifaIdx, horasClima = DEF.horasClima, equipos = DEF.equipos, region = DEF.region, mes = DEF.mes } = {}) {
    const tarifa = tarifaDe(tarifaIdx);
    const a = anio({ tarifa, horasClima, equipos, region });
    const m = clamp(Math.round(mes), 0, 11);
    return { modo: 'dac', tarifa, a, mes: m, ahora: a.meses[m] };
}
export function modoNegocio({ tienda = DEF.tienda, region = DEF.region } = {}) {
    const t = NEGOCIO.pdbt[region];
    const energia = t.fijo + tienda * t.kwh;
    const pdbt = { kwh: tienda, fijo: t.fijo, precio: t.kwh, energia, iva: energia * IVA, total: energia * (1 + IVA), medio: energia / tienda };
    const k = cargos(region, 'PDBT').map(p => ({ ...p, importe: p.fijo ?? p.kwh * tienda }));
    const barras = NEGOCIO.precioMedio2025.map(([t2, v, id]) => ({ t: t2, v, id, color: id === 'casa' ? '#2fb36a' : id === 'dac' ? '#d64545' : id === 'nacional' ? '#171317' : '#8a8f98' }));
    return { modo: 'negocio', tienda, region, pdbt, partes: k, barras, casa: cobro('1', tienda, false) };
}

export function calcular({ modo = 'recibo', ...p } = {}) {
    if (modo === 'costo') return modoCosto(p);
    if (modo === 'dac') return modoDac(p);
    if (modo === 'negocio') return modoNegocio(p);
    return modoRecibo(p);
}
export const estadoPlanta = () => ({ t: 0 });
export function pasoPlanta(s, m, dt) { return { ...s, t: s.t + dt }; }

// ------------------------------------------------------------------ la pose
export function pose({ modo = 'recibo', noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, ...resto });
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    const s = x => (x > 0.01 ? 0.15 + 0.8 * clamp01(x) : 0);
    const activo = { clima: 0, focos: noche, alumbrado: noche, total: 0.5, pago: 0.3, aporte: 0, poste: 0.3, central: 0.6, medidor: 0.4 };
    let kwh = DEF.kwh;
    if (modo === 'recibo' || modo === 'costo') {
        kwh = L.r.cobrar;
        activo.clima = clamp01((kwh - BASE) / 500);
        activo.total = clamp01(L.r.total / 2500);
        activo.pago = clamp01(L.k.pagaPct);
        activo.aporte = clamp01(1 - L.k.pagaPct);
    } else if (modo === 'dac') {
        kwh = L.ahora.total;
        activo.clima = clamp01(L.ahora.clima / 400);
        const tot = L.a.enDac ? L.ahora.dac.total : L.ahora.recibo.total;
        activo.total = clamp01(tot / 2500);
        activo.pago = L.a.enDac ? 1 : clamp01(L.ahora.costo.pagaPct);
        activo.aporte = L.a.enDac ? 0 : clamp01(1 - L.ahora.costo.pagaPct);
    } else {
        kwh = L.tienda;
        activo.clima = 0.2;
        activo.total = clamp01(L.pdbt.total / 12000);
        activo.pago = 1;
    }
    activo.medidor = 0.3 + 0.6 * clamp01(kwh / 800);
    activo.poste = 0.2 + 0.6 * clamp01(kwh / 800);
    const red = s(0.3 + 0.7 * clamp01(kwh / 800));
    flujos.rnt = red;
    flujos.mt = red;
    flujos.bt = modo === 'negocio' ? s(0.3) : red;
    flujos.comercio = s(modo === 'negocio' ? 0.4 + 0.6 * clamp01(kwh / 3000) : 0.3);
    flujos.fabrica = s(0.5);
    flujos.senal = 0.35;
    flujos.pago = s(activo.pago);
    flujos.aporte = s(activo.aporte);
    flujos.dap = s(0.25);
    const cam = camara || { mira: [0, 0.6, 0], az: 16, el: 30, d: 34 };
    return { t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos, activo, camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 } };
}
export function estado(t) {
    return pose({ t, modo: 'recibo', camara: { mira: [0, 0.6, 0], az: lerp(10, 24, t / 12), el: 30, d: 34 } });
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

/** Revisión de cifras contra las fuentes. */
export function revisar() {
    const p = [];
    const entre = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // las tarifas: los mismos bloques que la CFE y la SHCP
    entre(cobro('1', 150, false).energia, 75 * 1.144 + 65 * 1.389 + 10 * 4.067 - 0.001, 75 * 1.144 + 65 * 1.389 + 10 * 4.067 + 0.001, 'tarifa 1, 150 kWh en noviembre');
    entre(cobro('1', 10, false).cobrar, 25, 25, 'el mínimo es de 25 kWh');
    entre(cobro('1F', 2600, true).bloques.map(b => b.kwh).join(',') === '300,900,1300,100' ? 1 : 0, 1, 1, 'la 1F en verano: 300, 900 y 1,300 kWh, y lo demás excedente');
    entre(cobro('1C', 400, true).bloques[2].kwh, 100, 100, 'la 1C en verano: el intermedio alto empieza en 301');
    for (const n of NOMBRES) for (const v of [true, false]) entre(TARIFAS[n][v ? 'verano' : 'fuera'].bloques.at(-1)[2], 4.05, 4.07, `el excedente de la ${n} es el mismo en todas`);
    entre(AJUSTE.factor ** 12, 1.037, 1.039, 'el ajuste de 12 meses: la inflación de noviembre a noviembre');
    entre((AJUSTE.inpcNov25 / AJUSTE.inpcNov24) ** (1 / 12), 1.0031, 1.0032, 'el factor mensual sale del INPC');
    // los costos: los mismos totales que publica la CFE para la PDBT
    entre(porKwhVariable('central', 'PDBT'), 3.5648, 3.5655, 'PDBT en Valle de México Centro: 3.565 $/kWh');
    entre(porKwhVariable('noroeste', 'PDBT'), 3.2535, 3.2545, 'PDBT en el Noroeste: 3.254 $/kWh');
    entre(costoReal(150, 0, 'central').total, 390.7, 390.8, '150 kWh en Valle de México Centro cuestan 390.74 $');
    const k150 = costoReal(150, cobro('1', 150, true).energia, 'central');
    entre(k150.pagaPct, 0.54, 0.56, 'con la tarifa 1 se paga como 55 de cada 100');
    entre(costoReal(200, 0, 'central').categoria === 'DB2' ? 1 : 0, 1, 1, 'arriba de 150 kWh es DB2');
    for (const d of Object.values(DIVISIONES)) for (const c of ['DB1', 'DB2']) entre(d[c].energia + d[c].capacidad, 1.1, 1.31, `generación en ${d.nombre}, ${c}`);
    // la DAC
    entre(anio({ tarifa: '1', horasClima: 7, equipos: 1 }).enDac ? 1 : 0, 1, 1, 'tarifa 1 con un minisplit 7 h al día cae en DAC');
    entre(anio({ tarifa: '1', horasClima: 4, equipos: 1 }).enDac ? 1 : 0, 0, 0, 'con 4 h al día no');
    entre(anio({ tarifa: '1F', horasClima: 24, equipos: 3, region: 'noroeste' }).enDac ? 1 : 0, 0, 0, 'la 1F casi nunca: ni con tres equipos todo el día');
    entre(cobroDac('central', 300).energia, 146.01 + 300 * 6.869 - 0.01, 146.01 + 300 * 6.869 + 0.01, 'DAC Central: 146.01 $ más 6.869 $/kWh');
    // la casa y el país
    entre(BASE, 140, 160, 'la casa sin clima, cerca del promedio de 149 kWh al mes');
    entre((SUBSIDIO.ventas2025.domestico + SUBSIDIO.ventas2025.dac) / SUBSIDIO.domesticos2025 / 12, 148, 151, 'kWh al mes por usuario doméstico en 2025');
    entre(SUBSIDIO.pef2026 / SUBSIDIO.domesticos2025, 1900, 2000, 'subsidio de 2026 por usuario doméstico, en pesos al año');
    // el recibo de ejemplo de la CFE: la aportación es el costo menos el cargo por consumo
    const sumaCfe = suma(RECIBO_CFE.costos.map(c => c[1]));
    entre(sumaCfe - RECIBO_CFE.cargo, RECIBO_CFE.aportacion - 0.02, RECIBO_CFE.aportacion + 0.02, 'en el recibo de ejemplo, aportación = costo − cargo por consumo');
    entre(RECIBO_CFE.iva / RECIBO_CFE.cargo, 0.159, 0.161, 'IVA de 16 %');
    // la figura
    entre(puntasSueltas().length, 0, 0, `líneas sueltas: ${puntasSueltas().join(', ')}`);
    entre(partesFuera().length, 0, 0, 'puntos clave fuera del sitio');
    return p;
}
