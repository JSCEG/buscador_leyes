/**
 * Five CNE permit tables read by DGMESNIE besides the four map markets (transport, marketing,
 * hydrocarbon infrastructure, electricity supply and accredited third parties). Rows arrive as in
 * docs/permisos-cne-2026-10-21/CONTRATO-BACKEND.md; everything here reads whatever fields are
 * filled, so new states, municipalities and coordinates show up without code changes.
 */

export const NULL_VALUE = '__sin_dato';
export const NO_STATE = '--';

const field = (key, label, extra = {}) => ({ key, label, ...extra });

/** map.states: choropleth by EF_ID; map.points: installations with coordinates. */
export const CNE_TABLES = Object.freeze([
    {
        key: 'transporte', label: 'Transporte', code: 'TR', map: { states: true, points: true }, capacity: true, sheet: true,
        column: field('medioTransporte', 'Medio'),
        facets: [field('medioTransporte', 'Medio de transporte'), field('producto', 'Producto'), field('modalidad', 'Modalidad')],
        details: [field('producto', 'Producto'), field('medioTransporte', 'Medio de transporte'), field('modalidad', 'Modalidad'), field('capacidad', 'Capacidad', { capacity: true }),
            field('numeroUnidades', 'Número de unidades', { number: true }), field('trayecto', 'Trayecto'), field('longitudKm', 'Longitud', { number: true, unit: 'km' }), field('cobertura', 'Cobertura')],
    },
    {
        key: 'comercializacion', label: 'Comercialización', code: 'CO', map: { states: true, points: false }, sheet: true,
        column: field('producto', 'Producto'),
        facets: [field('producto', 'Producto'), field('modalidad', 'Modalidad')],
        details: [field('producto', 'Producto'), field('modalidad', 'Modalidad')],
    },
    {
        key: 'infraestructura', label: 'Infraestructura de hidrocarburos', code: 'IH', map: { states: false, points: true }, capacity: true, sheet: true,
        column: field('producto', 'Producto'),
        facets: [field('producto', 'Producto')],
        details: [field('producto', 'Producto'), field('capacidad', 'Capacidad', { capacity: true }), field('zonaGeografica', 'Zona geográfica'),
            field('longitudSistemaKm', 'Longitud del sistema', { number: true, unit: 'km' }), field('cobertura', 'Cobertura')],
    },
    {
        key: 'suministro', label: 'Suministro eléctrico', code: 'SE', map: { states: false, points: false }, sheet: true,
        column: field('cobertura', 'Cobertura'),
        facets: [field('modalidad', 'Modalidad')],
        details: [field('modalidad', 'Modalidad'), field('cobertura', 'Cobertura')],
    },
    {
        // Separate from dbo.Laboratorios_UV: the two lists may overlap and are never merged.
        key: 'terceros', label: 'Terceros acreditados', code: 'TA', map: { states: false, points: false }, sheet: false,
        column: field('ambito', 'Ámbito'),
        facets: [],
        details: [field('ambito', 'Ámbito')],
    },
].map(table => Object.freeze(table)));

export const CNE_TABLE = Object.fromEntries(CNE_TABLES.map(table => [table.key, table]));

/** Filters every table has, before its own. */
export const COMMON_FACETS = Object.freeze([field('tipoPermiso', 'Tipo de permiso'), field('mercado', 'Mercado')]);

const fold = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

/**
 * Permit number as the database stores NumeroPermisoNorm: upper case, no spaces, no CNE/ prefix,
 * no leading zeros in any segment. CNE/PL/0922/TRA/OM/2026 → PL/922/TRA/OM/2026.
 */
export function normalizePermitNumber(value) {
    const compact = String(value ?? '').toUpperCase().replace(/\s+/g, '').replace(/^CNE\//, '');
    return compact.split('/').map(segment => segment.replace(/^0+(?=.)/, '')).join('/');
}

/** INEGI state codes (EF_ID) with their names. */
export const STATES = Object.freeze([
    ['01', 'Aguascalientes'], ['02', 'Baja California'], ['03', 'Baja California Sur'], ['04', 'Campeche'], ['05', 'Coahuila'],
    ['06', 'Colima'], ['07', 'Chiapas'], ['08', 'Chihuahua'], ['09', 'Ciudad de México'], ['10', 'Durango'], ['11', 'Guanajuato'],
    ['12', 'Guerrero'], ['13', 'Hidalgo'], ['14', 'Jalisco'], ['15', 'Estado de México'], ['16', 'Michoacán'], ['17', 'Morelos'],
    ['18', 'Nayarit'], ['19', 'Nuevo León'], ['20', 'Oaxaca'], ['21', 'Puebla'], ['22', 'Querétaro'], ['23', 'Quintana Roo'],
    ['24', 'San Luis Potosí'], ['25', 'Sinaloa'], ['26', 'Sonora'], ['27', 'Tabasco'], ['28', 'Tamaulipas'], ['29', 'Tlaxcala'],
    ['30', 'Veracruz'], ['31', 'Yucatán'], ['32', 'Zacatecas'],
].map(([id, name]) => Object.freeze({ id, name })));
export const STATE_NAME = Object.fromEntries(STATES.map(s => [s.id, s.name]));
const BY_NAME = new Map(STATES.map(s => [fold(s.name), s.id]));
[['mexico', '15'], ['edo. de mexico', '15'], ['distrito federal', '09'], ['cdmx', '09'], ['coahuila de zaragoza', '05'],
    ['michoacan de ocampo', '16'], ['veracruz de ignacio de la llave', '30'], ['veracruz-llave', '30']].forEach(([name, id]) => BY_NAME.set(name, id));

const CODE_KEYS = ['cve_ent', 'cve_edo', 'ef_id', 'cvegeo', 'cve_entidad', 'id_ent', 'clave', 'code', 'id'];
const NAME_KEYS = ['nomgeo', 'nom_ent', 'nombre', 'entidad', 'estado', 'nom_edo', 'name', 'state_name', 'admin_name'];

/** EF_ID of a state polygon, from its INEGI code or, failing that, its name; '' when unknown. */
export function featureStateId(feature) {
    const props = Object.fromEntries(Object.entries(feature?.properties || {}).map(([key, value]) => [key.toLowerCase(), value]));
    for (const key of CODE_KEYS) {
        const raw = String(props[key] ?? feature?.[key] ?? '').trim();
        if (/^\d{1,2}$/.test(raw)) {
            const id = raw.padStart(2, '0');
            if (STATE_NAME[id]) return id;
        }
    }
    for (const key of NAME_KEYS) {
        const id = BY_NAME.get(fold(props[key]));
        if (id) return id;
    }
    return '';
}

const blank = value => value === null || value === undefined || String(value).trim() === '';
export const facetValue = value => (blank(value) ? NULL_VALUE : String(value).trim());
const stateOf = row => (blank(row.efId) ? NO_STATE : String(row.efId).trim().padStart(2, '0'));

/** Distinct values of a field with their counts, most frequent first; empty values as «Sin especificar». */
export function facetOptions(rows, key) {
    const counts = new Map();
    for (const row of rows) counts.set(facetValue(row[key]), (counts.get(facetValue(row[key])) || 0) + 1);
    return [...counts.entries()]
        .map(([value, count]) => ({ value, label: value === NULL_VALUE ? 'Sin especificar' : value, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
}

/** States present in the rows, by name, with «Sin entidad» last. */
export function stateOptions(rows) {
    const counts = new Map();
    for (const row of rows) counts.set(stateOf(row), (counts.get(stateOf(row)) || 0) + 1);
    return [...counts.entries()]
        .map(([value, count]) => ({ value, label: value === NO_STATE ? 'Sin entidad' : STATE_NAME[value] || rowsStateName(rows, value) || value, count }))
        .sort((a, b) => (a.value === NO_STATE) - (b.value === NO_STATE) || a.label.localeCompare(b.label, 'es'));
}
const rowsStateName = (rows, id) => rows.find(row => stateOf(row) === id)?.entidad;

/**
 * Markets of the permits map. Every CNE row belongs to one, by its `Mercado` text read without case or
 * accents; crude oil, petrochemicals and the generic «Hidrocarburos» go to «otros».
 */
export const CNE_MARKETS = Object.freeze([
    { key: 'electricidad', label: 'Electricidad' },
    { key: 'petroliferos', label: 'Petrolíferos' },
    { key: 'gas-lp', label: 'Gas LP' },
    { key: 'gas-natural', label: 'Gas natural' },
    { key: 'otros', label: 'Petróleo crudo, petroquímicos y otros hidrocarburos' },
].map(market => Object.freeze(market)));
export const CNE_MARKET = Object.fromEntries(CNE_MARKETS.map(market => [market.key, market]));
const MARKET_BY_NAME = new Map([
    ['electricidad', 'electricidad'], ['petroliferos', 'petroliferos'], ['gas natural', 'gas-natural'],
    ['gas lp', 'gas-lp'], ['gas licuado de petroleo', 'gas-lp'], ['gas l.p.', 'gas-lp'],
]);
export const marketOf = row => MARKET_BY_NAME.get(fold(row?.mercado)) || 'otros';

/** Key of one activity (a table within a market) in the panel and the map layers. */
export const activityKey = (table, market) => `${table}|${market}`;
export const parseActivity = key => { const [table, market] = String(key).split('|'); return { table, market }; };

/**
 * What each market has in each table: total and vigentes, and how many vigentes carry a state or
 * coordinates (what the map can draw). Only tables with rows in that market appear, in table order.
 * @param {Record<string, object[]|null>} rowsByTable
 */
export function activitiesByMarket(rowsByTable) {
    const result = Object.fromEntries(CNE_MARKETS.map(market => [market.key, []]));
    for (const table of CNE_TABLES) {
        const rows = rowsByTable[table.key];
        if (!Array.isArray(rows)) continue;
        const byMarket = new Map();
        for (const row of rows) {
            const market = marketOf(row);
            const entry = byMarket.get(market) || { table: table.key, market, total: 0, vigentes: 0, withState: 0, withPoint: 0 };
            entry.total += 1;
            if (row.estatus === 'Vigente') {
                entry.vigentes += 1;
                if (stateOf(row) !== NO_STATE) entry.withState += 1;
                if (validPoint(row.latitud, row.longitud)) entry.withPoint += 1;
            }
            byMarket.set(market, entry);
        }
        for (const [market, entry] of byMarket) result[market].push(entry);
    }
    return result;
}

/** Vigentes per state for the choropleth, in the shape of /Tablas/Estados. */
export function stateCounts(rows) {
    const counts = new Map();
    for (const row of rows) {
        if (row.estatus !== 'Vigente') continue;
        const id = stateOf(row);
        const entry = counts.get(id) || { efId: id, entidad: id === NO_STATE ? 'Sin entidad' : STATE_NAME[id] || row.entidad || id, permisos: 0 };
        entry.permisos += 1;
        counts.set(id, entry);
    }
    return [...counts.values()];
}

/** Rows that pass every filter; `estatus` '' keeps all, `efId` '--' keeps rows without state. */
export function filterRows(rows, { estatus = 'Vigente', efId = '', market = '', q = '', facets = {} } = {}) {
    const term = String(q).trim();
    const number = normalizePermitNumber(term);
    const words = fold(term);
    return rows.filter(row => {
        if (estatus && row.estatus !== estatus) return false;
        if (efId && stateOf(row) !== efId) return false;
        if (market && marketOf(row) !== market) return false;
        for (const [key, value] of Object.entries(facets)) if (value && facetValue(row[key]) !== value) return false;
        if (!term) return true;
        const own = row.numeroPermisoNorm ? String(row.numeroPermisoNorm).toUpperCase() : normalizePermitNumber(row.numeroPermiso);
        return (number.length >= 2 && own.includes(number)) || fold(row.razonSocial).includes(words) || fold(row.rfc) === words;
    });
}

/** Capacity per unit; rows without a unit are left out instead of mixing units. */
export function capacityTotals(rows) {
    const totals = new Map();
    for (const row of rows) {
        const amount = Number(row.capacidad);
        if (blank(row.unidadCapacidad) || blank(row.capacidad) || !Number.isFinite(amount)) continue;
        const unit = String(row.unidadCapacidad).trim();
        totals.set(unit, (totals.get(unit) || 0) + amount);
    }
    return [...totals.entries()].map(([unit, total]) => ({ unit, total })).sort((a, b) => b.total - a.total);
}

/** Coordinates inside México, else null; 0/0 and swapped values are not plotted. */
export function validPoint(lat, lon) {
    const y = Number(lat);
    const x = Number(lon);
    if (blank(lat) || blank(lon) || !Number.isFinite(y) || !Number.isFinite(x)) return null;
    return y >= 14 && y <= 33 && x >= -118.5 && x <= -86.5 ? [y, x] : null;
}

/** UTC timestamp (with or without Z) in Mexico City time: «21 de octubre de 2026, 10:05». */
export function mexicoCityTime(value) {
    if (blank(value)) return '';
    const text = String(value).trim();
    const utc = /[zZ]|[+-]\d{2}:?\d{2}$/.test(text) ? text : `${text.replace(' ', 'T')}Z`;
    const when = new Date(utc);
    if (Number.isNaN(when.getTime())) return '';
    return new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(when);
}

/** Plain calendar date (yyyy-MM-dd or ISO) as «4 mar 2026», read as a date, not shifted by time zone. */
export function calendarDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
    if (!match || Number(match[1]) < 1950) return '';
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
        .toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
}

/** Five sequential classes for the choropleth; 0 has its own blank class. */
export function choroplethClass(count, max) {
    if (!count || !max) return 0;
    const ratio = count / max;
    return ratio > 0.6 ? 5 : ratio > 0.35 ? 4 : ratio > 0.15 ? 3 : ratio > 0.05 ? 2 : 1;
}
