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

/** Route of the Permisos view: { permit } for #permiso=<number>, {} for #permisos, otherwise null. */
export function permitsRoute(hash = '') {
    if (hash === '#permisos') return {};
    const m = /^#permiso=(.+)$/.exec(hash);
    if (!m) return null;
    try { return { permit: decodeURIComponent(m[1]) }; } catch { return null; }
}

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

/** Resolutions of a permit's file (expediente), oldest first. */
export async function fetchResolutions(expedienteId) {
    const rows = await request(`${PUBLIC_API}api/Resoluciones/?resolucionId=${encodeURIComponent(expedienteId)}&tipoEntidad=2`);
    return (Array.isArray(rows) ? rows : []).map(row => ({ ...row, sortKey: resolutionSortKey(row) })).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
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
