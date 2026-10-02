/**
 * Public Registry of the Comisión Nacional de Energía (https://www.cne.gob.mx/Permisos/): the same
 * endpoints its own page uses. They allow cross-origin requests, so the browser calls them
 * directly. Requests are on demand (one page of results, one permit at a time) and cached briefly;
 * nothing is downloaded in bulk.
 */
const API = 'https://api-creweb.cne.gob.mx/';
const PUBLIC_API = 'https://api-publico.cne.gob.mx/';
const DRIVE = 'https://drive.cne.gob.mx/';
export const REGISTRY_URL = 'https://www.cne.gob.mx/Permisos/';

export const RESOLUTIONS_URL = 'https://www.cne.gob.mx/Resoluciones/';

/**
 * Route of the CNE section: { tab, permit?, resolution? } for #permisos, #permiso=<number>,
 * #resoluciones, #resolucion=<number> and #panorama-cne; otherwise null.
 */
export function permitsRoute(hash = '') {
    if (hash === '#permisos') return { tab: 'permisos' };
    if (hash === '#resoluciones') return { tab: 'resoluciones' };
    if (hash === '#panorama-cne') return { tab: 'panorama' };
    const m = /^#(permiso|resolucion)=(.+)$/.exec(hash);
    if (!m) return null;
    let value;
    try { value = decodeURIComponent(m[2]); } catch { return null; }
    return m[1] === 'permiso' ? { tab: 'permisos', permit: value } : { tab: 'resoluciones', resolution: value };
}

/** Hash of a CNE route (inverse of permitsRoute). */
export function permitsHash({ tab = 'permisos', permit = null, resolution = null } = {}) {
    if (permit) return `#permiso=${encodeURIComponent(permit)}`;
    if (resolution) return `#resolucion=${encodeURIComponent(resolution)}`;
    return tab === 'resoluciones' ? '#resoluciones' : tab === 'panorama' ? '#panorama-cne' : '#permisos';
}

/** Permits pinned to a desk are stored among article ids as 'cne:<permit number>'. */
const PIN_PREFIX = 'cne:';
export const permitPinId = numero => `${PIN_PREFIX}${numero}`;
export const permitFromPinId = id => (String(id).startsWith(PIN_PREFIX) ? String(id).slice(PIN_PREFIX.length) : null);

const TTL = 10 * 60 * 1000;
const TIMEOUT = 20000;
const cache = new Map();

async function request(url, options = {}) {
    const key = `${url}|${options.body || ''}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return hit.data;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (!response.ok) throw new Error(`CNE ${response.status}`);
        const data = await response.json();
        cache.set(key, { at: Date.now(), data });
        return data;
    } finally {
        clearTimeout(timer);
    }
}

const COLUMNS = ['Numero', 'Estado', 'Persona', 'AliasProyecto', 'ResolucionesAsociadas', 'AnexosAsociados'];

/**
 * One page of permits. Filters match the registry's own column filters (substring, any case).
 * The registry applies the Estado filter after paging, so it is not offered.
 * @returns {{ total: number, rows: Array }}
 */
export async function searchPermits({ numero = '', titular = '', proyecto = '', start = 0, length = 20 } = {}) {
    const values = { Numero: numero, Persona: titular, AliasProyecto: proyecto };
    const body = JSON.stringify({
        parameters: {
            draw: 1,
            columns: COLUMNS.map(data => ({ data, name: '', searchable: true, orderable: false, search: { value: String(values[data] || '').trim(), regex: false } })),
            order: [],
            start,
            length,
            search: { value: '', regex: false },
        },
    });
    const data = await request(`${API}api/Permisos/ObtenerPermisosPaginados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body,
    });
    return { total: Number(data?.recordsFiltered) || 0, rows: Array.isArray(data?.data) ? data.data : [] };
}

/** The registry row of one permit by its exact number, or null when it is not in the registry. */
export async function fetchPermit(numero) {
    const { rows } = await searchPermits({ numero, length: 10 });
    const wanted = String(numero).trim().toUpperCase();
    return rows.find(row => String(row.Numero).trim().toUpperCase() === wanted) || null;
}

/** Resolutions of a permit's file (expediente), oldest first. */
export async function fetchResolutions(expedienteId) {
    const rows = await request(`${PUBLIC_API}api/Resoluciones/?resolucionId=${encodeURIComponent(expedienteId)}&tipoEntidad=2`);
    return (Array.isArray(rows) ? rows : []).map(row => ({ ...row, sortKey: resolutionSortKey(row) })).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

// The resolutions search (https://www.cne.gob.mx/Resoluciones/) uses the legacy DataTables
// protocol: column filters in aoData, results in aaData. Its global search box is ignored.
const RES_COLUMNS = ['DocumentoResolucion', 'NumeroResolucion', 'FechaResolucion', 'Proemio', 'ModalidadResolucion', 'TipoResolucion', 'DocumentoActa', 'NumeroActa'];
const RES_FILTER = { numero: 1, fecha: 2, texto: 3, modalidad: 4, tipo: 5, acta: 7 };

export function resolutionsQueryUrl(filters = {}, { start = 0, length = 20 } = {}) {
    const data = [
        { name: 'sEcho', value: 1 }, { name: 'iColumns', value: RES_COLUMNS.length }, { name: 'sColumns', value: ',,,,,,,' },
        { name: 'iDisplayStart', value: start }, { name: 'iDisplayLength', value: length },
    ];
    RES_COLUMNS.forEach((column, i) => {
        const key = Object.keys(RES_FILTER).find(name => RES_FILTER[name] === i);
        const searchable = i !== 0 && i !== 6;
        data.push(
            { name: `mDataProp_${i}`, value: column }, { name: `sSearch_${i}`, value: String((key && filters[key]) || '').trim() },
            { name: `bRegex_${i}`, value: false }, { name: `bSearchable_${i}`, value: searchable }, { name: `bSortable_${i}`, value: searchable },
        );
    });
    data.push({ name: 'sSearch', value: '' }, { name: 'bRegex', value: false }, { name: 'iSortCol_0', value: 2 }, { name: 'sSortDir_0', value: 'desc' }, { name: 'iSortingCols', value: 1 });
    return `${PUBLIC_API}api/Resoluciones/?aoData=${encodeURIComponent(JSON.stringify(data))}`;
}

/**
 * One page of CNE resolutions, newest first. Filters (substring, any case): numero, fecha
 * (any part of dd/mm/yyyy, e.g. "2025"), texto (proemio), modalidad, tipo, acta.
 * @returns {{ total: number, rows: Array }}
 */
export async function searchResolutions(filters = {}, { start = 0, length = 20 } = {}) {
    const data = await request(resolutionsQueryUrl(filters, { start, length }));
    return { total: Number(data?.iTotalDisplayRecords) || 0, rows: Array.isArray(data?.aaData) ? data.aaData : [] };
}

/** How many resolutions match, asking the registry for a single row. */
export async function countResolutions(filters = {}) {
    return (await searchResolutions(filters, { length: 1 })).total;
}

/** One resolution by its exact number, or null. */
export async function fetchResolution(numero) {
    const { rows } = await searchResolutions({ numero }, { length: 10 });
    const wanted = String(numero).trim().toUpperCase();
    return rows.find(row => String(row.NumeroResolucion).trim().toUpperCase() === wanted) || null;
}

/** Permit numbers quoted in a resolution's text (e.g. "CNE/E/1439/GEN/2015", "PL/24035/TRA/OM/2022"). */
export function permitNumbersIn(text = '') {
    const found = String(text).match(/\b(?:CNE\/)?(?:E|PL|LP|G|H)\/[A-Z0-9-]+(?:\/[A-Z0-9-]+)*\/(?:19|20)?\d{2}\b/g) || [];
    return [...new Set(found.filter(number => !/^(?:CNE\/)?RES\//.test(number)))];
}

/**
 * Splits a "Con fundamento en …" paragraph into the instruments it cites and the article
 * numbers of each: [{ law: 'Ley del Sector Hidrocarburos', articles: ['1', '3', '76', …] }].
 * Only plain article numbers are kept (fracciones, incisos and párrafos are left out).
 */
export function parseFoundation(text = '') {
    const clean = String(text).replace(/\s+/g, ' ').replace(/^.*?\bfundamento en\s+(lo (?:previsto|dispuesto) en\s+)?/i, '');
    const result = [];
    // Each citation ends with "de la/del/de los <Instrumento>"; ';' separates them.
    for (const part of clean.split(/;|\.\s/)) {
        const m = /^(.*?)\s+(?:de la|del|de los|de las)\s+((?:Ley|Reglamento|Constituci[oó]n|C[oó]digo|Disposiciones)[^,;]*?)\s*(?:,|\.|$)/i.exec(part.trim());
        if (!m) continue;
        const numbers = m[1]
            .replace(/(fracci[oó]n(?:es)?|inciso|incisos|p[aá]rrafo|apartado)\s+[^,]*?(?=,|\sy\s|$)/gi, '')
            .match(/\b\d{1,3}(?:\s*(?:Bis|Ter|Qu[aá]ter))?\b/gi) || [];
        const articles = [...new Set(numbers.map(n => n.replace(/\s+/g, ' ').trim()))];
        if (articles.length) result.push({ law: m[2].replace(/\s+$/, '').trim(), articles });
    }
    return result;
}

export async function fetchAnnexes(permisoId) {
    const rows = await request(`${PUBLIC_API}api/Permisos/Anexos?permisoId=${encodeURIComponent(permisoId)}`);
    return Array.isArray(rows) ? rows : [];
}

/** "dd/mm/yyyy" → "yyyy-mm-dd"; resolutions without a date sort by the year in their number. */
export function resolutionSortKey(row) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(row.FechaResolucion || '').trim());
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const year = /\/(\d{4})$/.exec(String(row.NumeroResolucion || ''))?.[1];
    return year ? `${year}-12-31~` : '9999';
}

const hex = n => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
// The CNE drive wraps the record id in a random GUID-like token, the way its own pages build it.
const driveUrl = (action, id) => `${DRIVE}Drive/${action}/?id=${encodeURIComponent(btoa(`${hex(8)}-${hex(4)}-4${hex(3)}-${id}-${hex(12)}`))}`;

/** Link to the permit title PDF. */
export const permitPdfUrl = permisoId => driveUrl('ObtenerPermiso', permisoId);

/** Link to a resolution PDF (same link as the CNE resolutions search). */
export const resolutionPdfUrl = resolucionId => (resolucionId ? driveUrl('ObtenerResolucion', resolucionId) : null);

/** Public link of an annex when the registry publishes one; otherwise null. */
export function annexUrl(annex) {
    const url = annex?.UrlPublic;
    if (!url) return null;
    return /^https?:\/\//i.test(url) ? url : `${DRIVE}Drive/ObtenerHistoricoPermiso/${url}`;
}

/** Sector, activity and the acervo instruments that regulate it, read from the permit number. */
const SECTORS = {
    E: { id: 'electricidad', label: 'Electricidad', laws: ['LSE', 'RLSE', 'DACG-PERMISOS-GA', 'LCNE'] },
    PL: { id: 'petroliferos', label: 'Petrolíferos', laws: ['LSH', 'RLSH', 'LCNE'] },
    LP: { id: 'gaslp', label: 'Gas LP', laws: ['LSH', 'RLSH', 'LCNE'] },
    G: { id: 'gasnatural', label: 'Gas natural', laws: ['LSH', 'RLSH', 'LCNE'] },
};
const ACTIVITIES = {
    GEN: 'Generación', COG: 'Cogeneración', AUT: 'Autoabastecimiento', AUTC: 'Autoabastecimiento', PP: 'Pequeña producción',
    PIE: 'Producción independiente', IMP: 'Importación', EXP: 'Expendio', TRA: 'Transporte', ALM: 'Almacenamiento',
    DIS: 'Distribución', COM: 'Comercialización', COMP: 'Compresión', DESC: 'Descompresión', LICUE: 'Licuefacción',
    REG: 'Regasificación', SUM: 'Suministro', GES: 'Gestión de sistemas',
};
export function permitKind(numero = '') {
    const parts = String(numero).toUpperCase().replace(/^CNE\//, '').split('/');
    const sector = SECTORS[parts[0]] || null;
    const code = parts.slice(2).find(part => ACTIVITIES[part]);
    // Electricity numbers use EXP for export; fuels use it for retail (expendio).
    const activity = code === 'EXP' && sector?.id === 'electricidad' ? 'Exportación' : (code ? ACTIVITIES[code] : null);
    return { sector, activity };
}
