// «Almacenamiento de energía (SAEE)»: el modelo, sin three.js ni DOM. Un sitio de ejemplo en la zona de Chihuahua (Gerencia de Control
// Regional Norte) con las cinco formas de integrar un Sistema de Almacenamiento de Energía Eléctrica que reconocen las Disposiciones de la
// CNE de abril de 2026: no asociado (de una Almacenadora), junto a una central solar, en una fábrica, de la red, y en un autoconsumo aislado.
//
// Reales, con su fuente en fuentes.js:
// - Los precios: los Precios Marginales Locales de la zona de carga Chihuahua, hora por hora, del 1 de noviembre de 2025 al 30 de octubre
//   de 2026 (CENACE). Con ellos se calcula cuánto gana una batería que compra barato y vende caro.
// - La batería: regresa 85 de cada 100 MWh que toma y dura unos 15 años con un ciclo al día (NREL/NLR ATB 2025); las de EE. UU. regresaron
//   82 en 2019 (EIA). Tres horas, como pide la convocatoria de 935 MW de SENER.
// - El sol de Chihuahua (NASA POWER) y la curva de diésel de ejemplo del manual de HOMER.
// - Las reglas: quién necesita permiso, quién puede vender y quién no puede inyectar (Disposiciones de la CNE, LSE y su reglamento).
// De ejemplo, para ver la tendencia: los tamaños de la central, de la mina y de las baterías; el pago fijo del tolling; la forma del sol en
// el día; la demanda de la mina; y que la batería hace a lo más un ciclo al día, cargando antes de descargar.
import { PML } from './precios.js';

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const clamp01 = x => clamp(x, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;
const suma = a => a.reduce((s, x) => s + x, 0);

// ------------------------------------------------------------------ las cifras de las fuentes
/** NREL/NLR, Annual Technology Baseline 2025: baterías de litio (LFP) de la red. */
export const ATB = { ida: 0.85, vida: 15, ciclosDia: 1, fom: 4, horasTipicas: 4 };
/** EIA, 2021: lo que regresó en promedio la flota de baterías de EE. UU. en 2019, y su duración promedio. */
export const EIA = { ida: 0.82, horas2019: 1.5 };
/** Convocatoria de Proyectos Estratégicos (SENER), segunda modificación: Capacidad Requerida de SAEE por región, todos de 3 horas. */
export const CONVOCATORIA = {
    horas: 3,
    regiones: [['Baja California', 140], ['Baja California Sur', 50], ['Norte', 245], ['Noroeste', 160], ['Oriental', 180], ['Occidental', 20], ['Peninsular', 140]],
    antesDe: 2030,
    publicada: '15 de mayo de 2026',
    modificada: ['26 de mayo', '10 de julio', '2 de septiembre', '29 de octubre de 2026'],
    registroHasta: '1 de marzo de 2027',
};
export const totalConvocatoria = () => suma(CONVOCATORIA.regiones.map(r => r[1]));
/** NASA POWER, Chihuahua (28.64 N, 106.08 O): irradiación global en el suelo, kWh/m² al día, de enero a diciembre (2001–2025). */
export const NASA = { lat: 28.64, lon: -106.08, ghi: [4.1606, 5.1446, 6.3977, 7.3675, 7.8866, 7.349, 6.4685, 6.4094, 5.6285, 5.322, 4.4369, 3.931], anual: 5.8774 };
/** HOMER: consumo de diésel = F0 × capacidad + F1 × potencia, en L/h; su ejemplo de 50 kW gasta 8.48 L/h a 25 kW y 15.3 a 50 kW. */
export const HOMER = { F0: 0.033, F1: 0.273, ejemplo: { kW: 50, a25: 8.48, a50: 15.3 } };
export const dieselLh = (capKW, kW) => (kW > 0 ? HOMER.F0 * capKW + HOMER.F1 * kW : 0);

/** Los ejemplos del sitio. MW de corriente alterna. */
export const SAEE = { P: 100, horas: CONVOCATORIA.horas };
export const CENTRAL = { mwCA: 240, contrato: 200, mwp: 312, pr: 0.82 };
export const MINA = { dia: 2.0, noche: 1.2, mwp: 6, diesel: 2.5, bateria: 2 };

// ------------------------------------------------------------------ los precios
const [a0, m0, d0] = PML.desde.split('-').map(Number);
export const DIAS = PML.datos.split(';').map((d, i) => {
    const f = new Date(Date.UTC(a0, m0 - 1, d0 + i));
    return { fecha: f.toISOString().slice(0, 10), mes: (f.getUTCFullYear() - a0) * 12 + f.getUTCMonth() - (m0 - 1), mesCal: f.getUTCMonth(), h: d.split(',').map(Number) };
});
const NOMBRES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** Los 12 meses de los datos, en orden: de noviembre de 2025 a octubre de 2026. */
export const MESES = Array.from({ length: 12 }, (_, i) => { const mc = (m0 - 1 + i) % 12; const a = a0 + Math.floor((m0 - 1 + i) / 12); return { i, mesCal: mc, nombre: NOMBRES[mc], corto: NOMBRES[mc].slice(0, 3), anio: a }; });
const memoPerfil = new Map();
/** El día promedio de un mes: el precio de cada hora, $/MWh. */
export function perfilMes(m) {
    if (memoPerfil.has(m)) return memoPerfil.get(m);
    const dias = DIAS.filter(d => d.mes === m);
    const p = Array.from({ length: 24 }, (_, h) => suma(dias.map(d => d.h[h])) / dias.length);
    memoPerfil.set(m, p);
    return p;
}
export const perfilAnual = () => Array.from({ length: 24 }, (_, h) => suma(DIAS.map(d => d.h[h])) / DIAS.length);

// ------------------------------------------------------------------ la batería: comprar barato, vender caro
/**
 * Un ciclo al día: carga antes de descargar. Busca la hora que separa la carga de la descarga y, para cada una, junta la hora más barata
 * que quede antes con la más cara que quede después mientras convenga (vender × 1 > comprar ÷ ida). Así regresa ida de cada MWh que toma.
 * cap: { cargaMax[h], descargaMax[h] } en MWh por hora (por omisión, P); precioCarga[h] puede ser distinto al de venta (energía que se iba a
 * tirar cuesta 0). Devuelve MWh tomados y entregados por hora, el estado de carga y el dinero.
 */
export function despacho(precio, { P, E, ida = ATB.ida, precioCarga = precio, cargaMax = null, descargaMax = null } = {}) {
    let mejor = { ganancia: 0, carga: Array(24).fill(0), descarga: Array(24).fill(0), compra: 0, venta: 0, corte: null };
    for (let k = 1; k < 24; k++) {
        const ch = [];
        for (let h = 0; h < k; h++) ch.push({ h, p: precioCarga[h], cap: cargaMax ? cargaMax[h] : P });
        const dh = [];
        for (let h = k; h < 24; h++) dh.push({ h, p: precio[h], cap: descargaMax ? descargaMax[h] : P });
        ch.sort((a, b) => a.p - b.p);
        dh.sort((a, b) => b.p - a.p);
        const carga = Array(24).fill(0);
        const descarga = Array(24).fill(0);
        let falta = E;
        let i = 0;
        let j = 0;
        let compra = 0;
        let venta = 0;
        while (falta > 1e-9 && i < ch.length && j < dh.length) {
            const c = ch[i];
            const d = dh[j];
            if (!(d.p - c.p / ida > 0)) break;
            const libreC = (c.cap - carga[c.h]) * ida;
            const libreD = d.cap - descarga[d.h];
            if (libreC <= 1e-9) { i++; continue; }
            if (libreD <= 1e-9) { j++; continue; }
            const x = Math.min(falta, libreC, libreD);
            carga[c.h] += x / ida;
            descarga[d.h] += x;
            compra += (x / ida) * c.p;
            venta += x * d.p;
            falta -= x;
        }
        if (venta - compra > mejor.ganancia) mejor = { ganancia: venta - compra, carga, descarga, compra, venta, corte: k };
    }
    const soc = [0];
    for (let h = 0; h < 24; h++) soc.push(soc[h] + mejor.carga[h] * ida - mejor.descarga[h]);
    return { ...mejor, soc, tomada: suma(mejor.carga), entregada: suma(mejor.descarga), E, P };
}
const memoAnio = new Map();
/** El año de precios reales, día por día, con una batería de P MW y h horas: lo que ganó cada mes y en el año. */
export function anio({ P = SAEE.P, horas = SAEE.horas, ida = ATB.ida } = {}) {
    const clave = `${P}|${horas}|${ida}`;
    if (memoAnio.has(clave)) return memoAnio.get(clave);
    const meses = MESES.map(m => ({ ...m, ganancia: 0, entregada: 0, dias: 0, peor: Infinity, mejor: -Infinity }));
    const porDia = [];
    for (const d of DIAS) {
        const r = despacho(d.h, { P, E: P * horas, ida });
        const mm = meses[d.mes];
        mm.ganancia += r.ganancia;
        mm.entregada += r.entregada;
        mm.dias++;
        mm.peor = Math.min(mm.peor, r.ganancia);
        mm.mejor = Math.max(mm.mejor, r.ganancia);
        porDia.push(r.ganancia);
    }
    const total = suma(meses.map(m => m.ganancia));
    const res = { meses, total, porMW: total / P, entregada: suma(meses.map(m => m.entregada)), ciclos: suma(meses.map(m => m.entregada)) / (P * horas), porDia };
    memoAnio.set(clave, res);
    return res;
}

// ------------------------------------------------------------------ el sol de Chihuahua
const DIA_MES = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];
/** Horas de sol y curva del día (forma de seno) que suma la irradiación de NASA POWER de ese mes; kW/m² a la mitad de cada hora. */
export function solMes(mesCal, nubes = 0) {
    const decl = 23.45 * Math.sin(D2R * (360 / 365) * (284 + DIA_MES[mesCal]));
    const ws = Math.acos(-Math.tan(NASA.lat * D2R) * Math.tan(decl * D2R)) / D2R;
    const largo = (2 * ws) / 15;
    const sale = 12 - largo / 2;
    const forma = Array.from({ length: 24 }, (_, h) => { const t = h + 0.5; return t > sale && t < sale + largo ? Math.sin((Math.PI * (t - sale)) / largo) : 0; });
    const k = (NASA.ghi[mesCal] * (1 - nubes)) / suma(forma);
    return { horas: forma.map(f => f * k), largo, sale };
}
/** La central: MW que daría hora por hora sin límite y lo que puede entregar con su contrato de interconexión. */
export function centralDia(mesCal) {
    const s = solMes(mesCal);
    const bruta = s.horas.map(g => Math.min(CENTRAL.mwCA, CENTRAL.mwp * g * CENTRAL.pr));
    const entrega = bruta.map(p => Math.min(p, CENTRAL.contrato));
    return { bruta, entrega, tirada: bruta.map((p, h) => p - entrega[h]), sol: s };
}
export function factorPlanta() {
    let e = 0;
    const dias = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (let m = 0; m < 12; m++) e += suma(centralDia(m).entrega) * dias[m];
    return e / (CENTRAL.contrato * 8760);
}

// ------------------------------------------------------------------ los modos
const datoMes = m => MESES[clamp(Math.round(m), 0, 11)];
/** Compra y venta: el SAEE no asociado en el día promedio del mes y en los días reales. */
export function mercado({ mes = DEF.mes, horas = DEF.horas, hora = DEF.hora } = {}) {
    const M = datoMes(mes);
    const perfil = perfilMes(M.i);
    const E = SAEE.P * horas;
    const d = despacho(perfil, { P: SAEE.P, E });
    const a = anio({ P: SAEE.P, horas });
    const h = clamp(Math.floor(hora), 0, 23);
    const t = clamp(hora - h, 0, 1);
    return {
        modo: 'mercado', mes: M.i, M, horas, hora, perfil, E, P: SAEE.P, d, a, mesReal: a.meses[M.i],
        precio: perfil[h], carga: d.carga[h], descarga: d.descarga[h], soc: lerp(d.soc[h], d.soc[h + 1], t), socPct: E > 0 ? lerp(d.soc[h], d.soc[h + 1], t) / E : 0,
        barata: perfil.indexOf(Math.min(...perfil)), cara: perfil.indexOf(Math.max(...perfil)),
    };
}
/** Junto a una central solar: la batería guarda lo que no cabe en el contrato y lo del mediodía barato, y lo entrega en la noche cara. */
export function junto({ mes = DEF.mes, pct = DEF.pct, hora = DEF.hora } = {}) {
    const M = datoMes(mes);
    const precio = perfilMes(M.i);
    const c = centralDia(M.mesCal);
    const P = (CENTRAL.contrato * pct) / 100;
    const E = P * CONVOCATORIA.horas;
    // carga lo que la central produce (lo que se iba a tirar cuesta 0); descarga en lo que deje libre el contrato
    const precioCarga = precio.map((p, h) => (c.tirada[h] > 0.01 ? 0 : p));
    const cargaMax = c.bruta.map(x => Math.min(P, x));
    const d = P > 0 ? despacho(precio, { P, E, precioCarga, cargaMax, descargaMax: c.bruta.map(() => P) }) : despacho(precio, { P: 0, E: 0 });
    const red = c.bruta.map((x, h) => Math.min(CENTRAL.contrato, Math.max(0, x - d.carga[h]) + d.descarga[h]));
    const tiradaCon = c.bruta.map((x, h) => Math.max(0, x - d.carga[h] - CENTRAL.contrato));
    const ingresoSin = suma(c.entrega.map((x, h) => x * precio[h]));
    const ingresoCon = suma(red.map((x, h) => x * precio[h]));
    const h = clamp(Math.floor(hora), 0, 23);
    const t = clamp(hora - h, 0, 1);
    const tardeSin = suma(c.entrega.filter((_, i) => i >= 18));
    const tardeCon = suma(red.filter((_, i) => i >= 18));
    return {
        modo: 'central', mes: M.i, M, pct, hora, P, E, precio, c, d, red, tiradaCon, ingresoSin, ingresoCon, extra: ingresoCon - ingresoSin,
        tirada: suma(c.tirada), recuperada: suma(c.tirada) - suma(tiradaCon), tardeSin, tardeCon,
        ahora: { bruta: c.bruta[h], red: red[h], carga: d.carga[h], descarga: d.descarga[h], precio: precio[h] }, socPct: E > 0 ? lerp(d.soc[h], d.soc[h + 1], t) / E : 0,
    };
}
/** El tolling: la CFE paga un monto fijo al mes por tener la batería a su disposición y se queda con lo que gane en el mercado. */
export function tolling({ pago = DEF.pago, factor = DEF.factor, esquema = DEF.esquema } = {}) {
    const a = anio({ P: SAEE.P, horas: SAEE.horas });
    const fijo = pago * 1000 * SAEE.P; // pesos al mes
    const meses = a.meses.map(m => ({ ...m, mercado: m.ganancia * factor, fijo, cfe: m.ganancia * factor - fijo }));
    const mercadoAnio = suma(meses.map(m => m.mercado));
    const fijoAnio = fijo * 12;
    const parte = esquema === 'mixta' ? 0.54 : 0;
    return {
        modo: 'tolling', pago, factor, esquema, parte, meses, mercadoAnio, fijoAnio,
        cfeAnio: mercadoAnio - fijoAnio, almacenadoraAnio: fijoAnio, cfeConParte: mercadoAnio - fijoAnio + parte * fijoAnio, privadoConParte: (1 - parte) * fijoAnio,
        mesesPierde: meses.filter(m => m.cfe < 0).length, empate: a.porMW / 12 / 1000,
    };
}
/** Sin red: una mina con paneles, baterías y una planta diésel; el día promedio del mes, repetido hasta que la batería se acomoda. */
export function aislado({ mes = DEF.mes, horasMina = DEF.horasMina, nubes = DEF.nubes, hora = DEF.hora } = {}) {
    const M = datoMes(mes);
    const s = solMes(M.mesCal, nubes);
    const solar = s.horas.map(g => MINA.mwp * g * CENTRAL.pr);
    const demanda = Array.from({ length: 24 }, (_, h) => (h >= 7 && h < 19 ? MINA.dia : MINA.noche));
    const P = MINA.bateria;
    const E = P * horasMina;
    let soc = E / 2;
    let r;
    for (let vuelta = 0; vuelta < 4; vuelta++) {
        r = { soc: [soc], carga: [], descarga: [], diesel: [], tirada: [], directo: [] };
        for (let h = 0; h < 24; h++) {
            const directo = Math.min(solar[h], demanda[h]);
            const sobra = solar[h] - directo;
            const falta = demanda[h] - directo;
            const c = Math.min(sobra, P, (E - soc) / Math.sqrt(ATB.ida));
            const dsc = Math.min(falta, P, soc * Math.sqrt(ATB.ida));
            soc += c * Math.sqrt(ATB.ida) - dsc / Math.sqrt(ATB.ida);
            r.directo.push(directo);
            r.carga.push(c);
            r.descarga.push(dsc);
            r.tirada.push(sobra - c);
            r.diesel.push(falta - dsc);
            r.soc.push(soc);
        }
    }
    const litros = suma(r.diesel.map(kw => dieselLh(MINA.diesel * 1000, kw * 1000)));
    const horasDiesel = r.diesel.filter(x => x > 0.001).length;
    const dem = suma(demanda);
    const h = clamp(Math.floor(hora), 0, 23);
    const t = clamp(hora - h, 0, 1);
    return {
        modo: 'aislado', mes: M.i, M, horasMina, nubes, hora, solar, demanda, P, E, r, litros, horasDiesel, dem,
        deSol: (suma(r.directo) + suma(r.descarga)) / dem, deDiesel: suma(r.diesel) / dem, tirada: suma(r.tirada),
        ahora: { solar: solar[h], demanda: demanda[h], carga: r.carga[h], descarga: r.descarga[h], diesel: r.diesel[h] }, socPct: E > 0 ? lerp(r.soc[h], r.soc[h + 1], t) / E : 0,
    };
}

export const DEF = { mes: 10, horas: 3, hora: 20.5, pct: 30, pago: 60, factor: 1, esquema: 'mixta', horasMina: 4, nubes: 0 };
export const LIMITES = { mes: [0, 11], horas: [1, 6], hora: [0, 23.99], pct: [0, 60], pago: [0, 150], factor: [0.5, 1.5], horasMina: [0, 10], nubes: [0, 0.8] };

// ------------------------------------------------------------------ el tiempo de la escena
export const estadoPlanta = () => ({ t: 0 });
export function pasoPlanta(s, m, dt) { return { ...s, t: s.t + dt }; }

// ------------------------------------------------------------------ las lecturas
export function calcular({ modo = 'mercado', mes = DEF.mes, horas = DEF.horas, hora = DEF.hora, pct = DEF.pct, pago = DEF.pago, factor = DEF.factor, esquema = DEF.esquema, horasMina = DEF.horasMina, nubes = DEF.nubes } = {}) {
    if (modo === 'central') return junto({ mes, pct, hora });
    if (modo === 'tolling') return { ...tolling({ pago, factor, esquema }), ...mercado({ mes, horas: SAEE.horas, hora }), modo: 'tolling', T: tolling({ pago, factor, esquema }) };
    if (modo === 'aislado') return aislado({ mes, horasMina, nubes, hora });
    return mercado({ mes, horas, hora });
}

// ------------------------------------------------------------------ acomodo (no está a escala)
export const BLOQUE = { x: [-8, 8], z: [-4, 4], y: [-0.4, 0] };
/** Dónde va cada cosa: [x, z] del centro. */
export const SITIO = {
    subestacion: [0.2, -2.7],
    saee: [-4.6, 1.3],
    trafo: [-2.4, -0.9],
    control: [-6.9, -1.0],
    medidor: [-1.3, -1.6],
    cenace: [-6.4, -3.0],
    central: [4.6, 2.2],
    saeeCE: [6.4, -0.6],
    inversorCE: [3.0, -0.4],
    fabrica: [4.6, -3.0],
    saeeRed: [1.6, -2.2],
    mina: [-0.6, 2.6],
    diesel: [0.7, 3.1],
};
export const FILAS_SAEE = 2;
export const POR_FILA = 5;
export const CONT = { largo: 1.0, ancho: 0.34, alto: 0.36 };
export const ALTO_LINEA = 2.2;
export const FLUIDOS = {
    red: { nombre: 'Energía de la red', color: '#f2b233' },
    carga: { nombre: 'Entra a la batería', color: '#2f7fd1' },
    descarga: { nombre: 'Sale de la batería', color: '#2fb36a' },
    solar: { nombre: 'Energía del sol', color: '#ff8a3c' },
    diesel: { nombre: 'Planta diésel', color: '#8a8f98' },
    senal: { nombre: 'Instrucciones del CENACE', color: '#7e57c2' },
};
const [sx, sz] = SITIO.subestacion;
const [tx, tz] = SITIO.trafo;
export const LINEAS = [
    { id: 'rnt', fluido: 'red', r: 0.04, cable: true, puntos: [[BLOQUE.x[0] + 0.05, ALTO_LINEA + 0.4, -3.4], [-3.0, ALTO_LINEA + 0.2, -3.4], [sx - 1.0, 1.4, sz - 0.4]] },
    { id: 'saee', fluido: 'descarga', r: 0.04, cable: true, puntos: [[tx + 0.2, 0.6, tz - 0.1], [-1.6, 1.0, -1.6], [sx - 1.0, 1.0, sz + 0.4]] },
    { id: 'pcs', fluido: 'carga', r: 0.03, oculto: true, puntos: [[-4.6, 0.25, 0.4], [tx - 0.2, 0.3, tz + 0.2]] },
    { id: 'central', fluido: 'solar', r: 0.04, cable: true, puntos: [[SITIO.inversorCE[0], 0.6, SITIO.inversorCE[1] - 0.15], [2.2, 1.2, -1.6], [sx + 1.0, 1.0, sz + 0.4]] },
    { id: 'saeeCE', fluido: 'carga', r: 0.03, cable: true, puntos: [[SITIO.saeeCE[0] - 0.9, 0.3, SITIO.saeeCE[1]], [4.6, 0.35, -0.5], [SITIO.inversorCE[0] + 0.3, 0.35, SITIO.inversorCE[1]]] },
    { id: 'fabrica', fluido: 'red', r: 0.03, cable: true, puntos: [[sx + 1.0, 1.2, sz - 0.3], [2.6, 1.6, -3.3], [SITIO.fabrica[0] - 1.2, 0.9, SITIO.fabrica[1]]] },
    { id: 'cenace', fluido: 'senal', r: 0.02, cable: true, puntos: [[SITIO.cenace[0] + 0.7, 1.0, SITIO.cenace[1] + 0.3], [-4.2, 1.4, -2.2], [SITIO.control[0] + 0.3, 0.7, SITIO.control[1] - 0.25]] },
    { id: 'mina', fluido: 'solar', r: 0.025, cable: true, puntos: [[SITIO.mina[0] - 0.3, 0.3, SITIO.mina[1] + 0.5], [SITIO.mina[0] + 0.2, 0.35, 3.3], [SITIO.diesel[0] - 0.35, 0.3, SITIO.diesel[1]]] },
];
export const REMATE = new Set(['rnt (inicio)']);
const caja = (x, y0, z, w, h, d) => [x - w / 2, x + w / 2, y0, y0 + h, z - d / 2, z + d / 2];
export const EQUIPOS = {
    subestacion: caja(sx, 0, sz, 2.6, 2.0, 1.6),
    saee: caja(SITIO.saee[0], 0, SITIO.saee[1], 5.6, 0.6, 2.4),
    trafo: caja(tx, 0, tz, 0.8, 0.9, 0.7),
    control: caja(SITIO.control[0], 0, SITIO.control[1], 0.9, 0.6, 0.6),
    cenace: caja(SITIO.cenace[0], 0, SITIO.cenace[1], 1.6, 1.2, 1.0),
    inversorCE: caja(SITIO.inversorCE[0], 0, SITIO.inversorCE[1], 0.8, 0.8, 0.6),
    saeeCE: caja(SITIO.saeeCE[0], 0, SITIO.saeeCE[1], 2.0, 0.5, 1.0),
    fabrica: caja(SITIO.fabrica[0], 0, SITIO.fabrica[1], 2.6, 1.4, 1.4),
    mina: caja(SITIO.mina[0], 0, SITIO.mina[1], 1.4, 0.6, 1.4),
    diesel: caja(SITIO.diesel[0], 0, SITIO.diesel[1], 0.8, 0.6, 0.5),
};

/** Puntos clave: dónde va el número y desde dónde se ve. */
export const PARTES = [
    { id: 'contenedores', ancla: [-5.2, 0.5, 1.9], vista: { az: 20, el: 26, tam: 4.6, mira: [-4.6, 0.3, 1.3] } },
    { id: 'clima', ancla: [-3.6, 0.55, 0.7], vista: { az: 30, el: 30, tam: 2.0, mira: [-3.6, 0.3, 0.7] } },
    { id: 'pcs', ancla: [-4.6, 0.45, 1.3], vista: { az: 10, el: 34, tam: 2.4, mira: [-4.6, 0.2, 1.3] } },
    { id: 'control', ancla: [SITIO.control[0], 0.75, SITIO.control[1]], vista: { az: 30, el: 22, tam: 2.0, mira: [SITIO.control[0], 0.3, SITIO.control[1]] } },
    { id: 'trafo', ancla: [tx, 1.05, tz], vista: { az: 24, el: 22, tam: 2.0, mira: [tx, 0.5, tz] } },
    { id: 'medidor', ancla: [SITIO.medidor[0], 0.85, SITIO.medidor[1]], vista: { az: 18, el: 18, tam: 1.6, mira: [SITIO.medidor[0], 0.5, SITIO.medidor[1]] } },
    { id: 'subestacion', ancla: [sx, 2.15, sz], vista: { az: 10, el: 20, tam: 4.0, mira: [sx, 1.0, sz] } },
    { id: 'cenace', ancla: [SITIO.cenace[0], 1.45, SITIO.cenace[1]], vista: { az: 24, el: 20, tam: 2.6, mira: [SITIO.cenace[0], 0.7, SITIO.cenace[1]] } },
    { id: 'central', ancla: [4.4, 0.5, 2.4], vista: { az: -16, el: 30, tam: 5.0, mira: [4.6, 0.2, 2.0] } },
    { id: 'saeeCE', ancla: [SITIO.saeeCE[0], 0.6, SITIO.saeeCE[1]], vista: { az: -24, el: 26, tam: 2.6, mira: [SITIO.saeeCE[0], 0.3, SITIO.saeeCE[1]] } },
    { id: 'fabrica', ancla: [SITIO.fabrica[0], 1.55, SITIO.fabrica[1]], vista: { az: -20, el: 22, tam: 3.4, mira: [SITIO.fabrica[0], 0.7, SITIO.fabrica[1]] } },
    { id: 'saeeRed', ancla: [SITIO.saeeRed[0], 0.6, SITIO.saeeRed[1]], vista: { az: -10, el: 24, tam: 2.4, mira: [SITIO.saeeRed[0], 0.3, SITIO.saeeRed[1]] } },
    { id: 'mina', ancla: [SITIO.mina[0], 0.75, SITIO.mina[1]], vista: { az: 8, el: 28, tam: 3.0, mira: [SITIO.mina[0] + 0.3, 0.3, SITIO.mina[1]] } },
    { id: 'diesel', ancla: [SITIO.diesel[0], 0.75, SITIO.diesel[1]], vista: { az: -14, el: 22, tam: 1.8, mira: [SITIO.diesel[0], 0.35, SITIO.diesel[1]] } },
];

// ------------------------------------------------------------------ la pose
export function pose({ modo = 'mercado', noche = 0, adentro = 0, desarme = 0, encendido = 1, t = 0, dt = 0, camara = null, ...resto } = {}) {
    const L = calcular({ modo, ...resto });
    const flujos = {};
    for (const l of LINEAS) flujos[l.id] = 0;
    const s = x => (x > 0.01 ? 0.15 + 0.8 * clamp01(x) : 0);
    let cargando = 0;
    let descargando = 0;
    let socSaee = 0;
    let socCE = 0;
    let socMina = 0;
    if (modo === 'mercado' || modo === 'tolling') {
        cargando = L.carga / SAEE.P;
        descargando = L.descarga / SAEE.P;
        socSaee = L.socPct;
        flujos.saee = s(Math.max(cargando, descargando));
        flujos.pcs = flujos.saee;
        flujos.rnt = s(0.4 + 0.6 * descargando);
        flujos.cenace = 0.35;
    } else if (modo === 'central') {
        const a = L.ahora;
        socCE = L.socPct;
        flujos.central = s(a.red / CENTRAL.contrato);
        flujos.saeeCE = s(Math.max(a.carga, a.descarga) / Math.max(1, L.P));
        flujos.rnt = s(a.red / CENTRAL.contrato);
        flujos.cenace = 0.35;
        cargando = L.P > 0 ? a.carga / L.P : 0;
        descargando = L.P > 0 ? a.descarga / L.P : 0;
    } else {
        const a = L.ahora;
        socMina = L.socPct;
        flujos.mina = s(Math.max(a.solar, a.descarga, a.diesel) / MINA.dia);
        flujos.rnt = 0.3;
        cargando = a.carga / MINA.bateria;
        descargando = a.descarga / MINA.bateria;
    }
    const cam = camara || { mira: [0, 0.8, 0], az: 18, el: 30, d: 34 };
    return {
        t, dt, modo, noche, adentro, desarme, encendido, lectura: L, flujos,
        activo: {
            carga: clamp01(cargando), descarga: clamp01(descargando), socSaee, socCE, socMina,
            diesel: modo === 'aislado' ? clamp01(L.ahora.diesel / MINA.diesel) : 0,
            sol: modo === 'aislado' ? clamp01(L.ahora.solar / MINA.mwp) : modo === 'central' ? clamp01(L.ahora.bruta / CENTRAL.mwCA) : 0.4,
            tirada: modo === 'central' ? clamp01((L.ahora.bruta - L.ahora.carga - CENTRAL.contrato) / 40) : 0,
        },
        camara: { mira: cam.mira, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cam.fov || 30 },
    };
}
export function estado(t) {
    return pose({ t, modo: 'mercado', camara: { mira: [0, 0.8, 0], az: lerp(10, 26, t / 12), el: 30, d: 34 } });
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
/** Revisión de cifras contra las fuentes y contra la física. */
export function revisar() {
    const p = [];
    const entre = (x, a, b, nombre) => { if (!(x >= a && x <= b)) p.push(`${nombre} = ${Number(x).toFixed(4)}, se esperaba entre ${a} y ${b}`); };
    // la convocatoria
    entre(totalConvocatoria(), 935, 935, 'la convocatoria pide 935 MW de SAEE');
    entre(totalConvocatoria() * CONVOCATORIA.horas, 2805, 2805, 'unos 2,805 MWh con 3 horas');
    entre(CONVOCATORIA.regiones.find(r => r[0] === 'Norte')[1], 245, 245, 'la región Norte, la que más: 245 MW');
    // los precios
    entre(DIAS.length, 364, 364, 'un año de precios: 364 días');
    entre(DIAS.at(-1).fecha === PML.hasta ? 1 : 0, 1, 1, 'los días van seguidos hasta el último');
    const pa = perfilAnual();
    entre(suma(pa) / 24, 415, 430, 'precio promedio en Chihuahua: unos 423 $/MWh');
    entre(pa.indexOf(Math.min(...pa)), 10, 12, 'la hora más barata, cerca del mediodía');
    entre(pa.indexOf(Math.max(...pa)), 19, 21, 'la más cara, entre las 20 y las 22 h');
    // la batería no inventa energía
    const d = despacho(perfilMes(10), { P: 100, E: 300 });
    entre(d.entregada / d.tomada, ATB.ida - 1e-9, ATB.ida + 1e-9, 'regresa 85 de cada 100 MWh');
    entre(d.entregada, 299.99, 300.01, 'un ciclo completo en septiembre: 300 MWh');
    entre(Math.max(...d.carga), 0, 100.001, 'no carga a más de 100 MW');
    entre(Math.max(...d.descarga), 0, 100.001, 'ni descarga a más de 100 MW');
    entre(Math.min(...d.soc), -1e-9, 1e9, 'el estado de carga nunca es negativo');
    entre(Math.max(...d.soc), 0, 300.001, 'ni pasa de 300 MWh');
    const a = anio();
    entre(a.porMW / 1000, 700, 1100, 'un año de arbitraje con 3 horas: unos 750 a 1,000 mil pesos por MW');
    entre(a.ciclos, 250, 364, 'casi un ciclo al día');
    entre(a.meses[10].ganancia > a.meses[3].ganancia ? 1 : 0, 1, 1, 'septiembre deja mucho más que febrero');
    entre(anio({ horas: 6 }).porMW / a.porMW, 1.2, 2.0, 'con 6 horas gana más, pero no el doble');
    entre(anio({ ida: EIA.ida }).porMW / a.porMW, 0.85, 0.99, 'con 82 % de ida y vuelta, un poco menos');
    // el sol y la central
    entre(factorPlanta(), 0.24, 0.34, 'la central entrega entre 24 y 34 % del año');
    entre(suma(solMes(4).horas), NASA.ghi[4] - 0.001, NASA.ghi[4] + 0.001, 'el sol de mayo suma lo de NASA POWER');
    entre(solMes(5).largo, 13.6, 14.2, 'en junio hay unas 14 horas de sol');
    const j0 = junto({ pct: 0 });
    const j30 = junto({ pct: 30 });
    entre(j0.extra, -1e-6, 1e-6, 'sin batería no hay ingreso extra');
    entre(j30.extra, 1, 1e12, 'con 30 % de batería, gana más');
    entre(j30.recuperada, 0, j30.tirada + 1e-6, 'no recupera más de lo que se iba a tirar');
    entre(Math.max(...j30.red), 0, CENTRAL.contrato + 1e-6, 'nunca inyecta más que su contrato de interconexión');
    // el tolling
    const t = tolling({ pago: 60 });
    entre(t.cfeAnio + t.almacenadoraAnio - t.mercadoAnio, -1e-3, 1e-3, 'lo de la CFE más lo de la Almacenadora es lo que da el mercado');
    entre(t.mesesPierde, 1, 11, 'hay meses en que el mercado no alcanza para el pago fijo');
    // el diésel de HOMER y la mina
    entre(dieselLh(50, 25), 8.43, 8.53, 'HOMER: 8.48 L/h a 25 kW');
    entre(dieselLh(50, 50), 15.2, 15.4, 'HOMER: 15.3 L/h a 50 kW');
    const m0 = aislado({ horasMina: 0, mes: 6 });
    const m6 = aislado({ horasMina: 6, mes: 6 });
    entre(m0.horasDiesel, 10, 24, 'sin batería, el diésel trabaja toda la noche');
    entre(m6.litros, 0, m0.litros - 1, 'con 6 horas de batería gasta menos diésel');
    entre(m6.deSol, m0.deSol, 1, 'y más de la energía sale del sol');
    entre(aislado({ nubes: 0.8 }).deDiesel, aislado({ nubes: 0 }).deDiesel, 1, 'con nubes, más diésel');
    return p;
}
