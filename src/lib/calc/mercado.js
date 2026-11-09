/**
 * Dated tables of the electricity market. CENACE still applies the 2015 Market Rules under the LSE's
 * third transitory article, so everything here carries LEYENDA_MERCADO, a date and a version.
 * GDMTH hours come from Table 5 of the CNE 2026 tariff agreement and seasons from Table 4.
 * Dates are read as calendar days in UTC, so the answer does not depend on the visitor's time zone.
 */

export const LEYENDA_MERCADO = 'Regla aplicada hoy por CENACE; pendiente de actualización';

export const PRECIO_NETO_2025 = Object.freeze({ sin: 4397797.01, bca: 2073887.95, bcs: 6814089.79, version: '2026-09-03', fuente: 'cenace-precio-neto-2025' });

export const SISTEMAS = Object.freeze({ sin: 'Sistema Interconectado Nacional', bca: 'Baja California', bcs: 'Baja California Sur' });

/** Net capacity price: max[0, factor × cost of new entry − estimated energy rent]. */
export const precioNeto = (factor, cone, renta) => Math.max(0, factor * cone - renta);

export const kwMes = mwAnio => mwAnio / 12000;

export const pagoPotencia = (mwAnio, sistema) => mwAnio * PRECIO_NETO_2025[sistema];

const DIA_MS = 86400000;
const dia = (y, m, d) => Date.UTC(y, m - 1, d) / DIA_MS;
const diaSemana = n => new Date(n * DIA_MS).getUTCDay();
const primerDomingo = (y, m) => { const d1 = dia(y, m, 1); return d1 + ((7 - diaSemana(d1)) % 7); };
const ultimoDomingo = (y, m) => { const fin = dia(y, m + 1, 1) - 1; return fin - diaSemana(fin); };

/** Calendar day number of an ISO date, or null when the date does not exist. */
function leerFecha(fecha) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha ?? ''));
    if (!m) return null;
    const [y, mes, d] = m.slice(1).map(Number);
    const n = dia(y, mes, d);
    const back = new Date(n * DIA_MS);
    if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mes - 1 || back.getUTCDate() !== d) return null;
    return { n, y };
}

export function temporadaGDMTH(sistema, fecha) {
    const f = leerFecha(fecha);
    if (!f) return null;
    const inicio = sistema === 'bca' ? dia(f.y, 5, 1) : primerDomingo(f.y, 4);
    const fin = ultimoDomingo(f.y, 10) - 1;
    return f.n >= inicio && f.n <= fin ? 'verano' : 'invierno';
}

// Hour ranges [from, to) per system, season and day type.
const H = (base, intermedio, punta = []) => ({ base, intermedio, punta });
const TABLA = {
    sin: {
        verano: { habil: H([[0, 6]], [[6, 20], [22, 24]], [[20, 22]]), sabado: H([[0, 7]], [[7, 24]]), domingo: H([[0, 19]], [[19, 24]]) },
        invierno: { habil: H([[0, 6]], [[6, 18], [22, 24]], [[18, 22]]), sabado: H([[0, 8]], [[8, 19], [21, 24]], [[19, 21]]), domingo: H([[0, 18]], [[18, 24]]) },
    },
    bca: {
        verano: { habil: H([], [[0, 14], [18, 24]], [[14, 18]]), sabado: H([], [[0, 24]]), domingo: H([], [[0, 24]]) },
        invierno: { habil: H([[0, 17], [22, 24]], [[17, 22]]), sabado: H([[0, 18], [21, 24]], [[18, 21]]), domingo: H([[0, 24]], []) },
    },
    bcs: {
        verano: { habil: H([], [[0, 12], [22, 24]], [[12, 22]]), sabado: H([], [[0, 19], [22, 24]], [[19, 22]]), domingo: H([], [[0, 24]]) },
        invierno: { habil: H([[0, 18], [22, 24]], [[18, 22]]), sabado: H([[0, 18], [21, 24]], [[18, 21]]), domingo: H([[0, 19], [21, 24]], [[19, 21]]) },
    },
};

/** Base, intermediate or peak for a GDMTH customer. A holiday counts as a Sunday. */
export function periodoGDMTH({ sistema, fecha, hora, festivo = false }) {
    const errores = [];
    if (!TABLA[sistema]) errores.push({ campo: 'sistema', mensaje: 'Elige un sistema' });
    const f = leerFecha(fecha);
    if (!f) errores.push({ campo: 'fecha', mensaje: 'Escribe una fecha que exista' });
    const h = /^(\d{2}):(\d{2})$/.exec(String(hora ?? ''));
    const horas = h ? Number(h[1]) + Number(h[2]) / 60 : NaN;
    if (!h || Number(h[1]) > 23 || Number(h[2]) > 59) errores.push({ campo: 'hora', mensaje: 'Escribe una hora entre 00:00 y 23:59' });
    if (errores.length) return { ok: false, periodo: null, temporada: null, dia: null, errores };
    const temporada = temporadaGDMTH(sistema, fecha);
    const semana = diaSemana(f.n);
    const tipo = festivo || semana === 0 ? 'domingo' : semana === 6 ? 'sabado' : 'habil';
    const tabla = TABLA[sistema][temporada][tipo];
    const periodo = ['punta', 'intermedio', 'base'].find(p => tabla[p].some(([a, b]) => horas >= a && horas < b));
    return { ok: true, periodo, temporada, dia: tipo, errores };
}

/** Peak hours of DIST and DIT in the SIN (Tables 6 and 7), shown as text. */
export const PUNTAS_DIST_DIT = Object.freeze([
    { temporada: 'Primavera', dist: '19:00 a 22:00', dit: '19:30 a 22:30', sabado: 'Sin punta' },
    { temporada: 'Verano', dist: '20:00 a 22:00', dit: '20:30 a 22:30', sabado: 'Sin punta' },
    { temporada: 'Otoño', dist: '19:00 a 22:00', dit: '19:30 a 22:30', sabado: 'Sin punta' },
    { temporada: 'Invierno', dist: '18:00 a 22:00', dit: '18:30 a 22:30', sabado: 'DIST 19:00 a 21:00; DIT 19:30 a 21:30' },
]);

/** Share of consumption to cover with clean energy certificates, only in years with a requirement. */
export const REQUISITO_CEL = Object.freeze({ 2025: 0.139, 2026: 0.139 });

export const celRequeridos = (mwh, anio) => (REQUISITO_CEL[anio] == null ? null : mwh * REQUISITO_CEL[anio]);

export const celGenerados = (mwh, fraccionLimpia = 1) => mwh * fraccionLimpia;

/** Below 0.7 MW, exempt generator; 0.7 MW or more, a permit; 0.7 to 20 MW in interconnected self-supply may be simplified. */
export function figuraPermiso(mw, { autoconsumo = false } = {}) {
    if (mw < 0.7) return 'exenta';
    if (autoconsumo && mw <= 20) return 'simplificado';
    return 'permiso';
}
