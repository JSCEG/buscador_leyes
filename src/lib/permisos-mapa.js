/**
 * Permisos CNE sobre Azure, sin la CNE en vivo (desde el 26/11/2026 el registro público exige reCAPTCHA).
 * Fuente principal: /api/permisos/* (snier-permisos-api, con la clave del servidor). Respaldo: la API DGMESNIE
 * /api/mapa/* (sin clave), que lee las mismas tablas de Azure (*_autorizado y Ligas_Permisos_CNE).
 * Si un campo no viene, queda null: nunca se rellena.
 */
import { getPermisos } from './permisos-api.js';

// Tablas que /api/mapa/buscar no cubre: se leen completas con /api/mapa/cne-lista y se filtran aquí.
/** Cuántos permisos lista la pestaña sin texto. */
export const RECIENTES = 100;

export const TABLAS_LISTA = ['transporte', 'comercializacion', 'infraestructura', 'suministro', 'terceros'];

const fold = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
/** Número de permiso normalizado: mayúsculas, sin «CNE/», sin ceros a la izquierda en cada segmento. */
export const numeroNorm = n => fold(n).replace(/^CNE\//, '').split('/').map(s => s.replace(/^0+(?=\d)/, '')).join('/');
const MERCADO = { electricidad: 'Electricidad', 'gas-lp': 'Gas LP', 'gas-natural': 'Gas natural', petroliferos: 'Petrolíferos' };
// Consecutivo del número: el primer segmento numérico (LP/856/EXP/ES/2026 → 856).
const consecutivo = n => Number((String(n).split('/').find(s => /^\d+$/.test(s))) || 0);
export const https = u => (typeof u === 'string' && /^https:\/\//i.test(u.trim()) ? u.trim() : null);
const coord = v => (v === null || v === undefined || v === '' || !Number.isFinite(+v) ? null : +v);

/** Fila de /api/mapa/buscar → fila de la vista Permisos. */
export function desdeBuscar(r = {}) {
    const latitud = coord(r.latitud), longitud = coord(r.longitud);
    return {
        numero: r.numeroPermiso || '', numeroNorm: numeroNorm(r.numeroPermiso), razonSocial: r.nombre || null, tabla: r.tipo || null, mercado: MERCADO[r.tipo] || null,
        tipo: r.tipoPermiso || null, estatus: r.vigente === true ? 'Vigente' : r.vigente === false ? 'No vigente' : (r.estatus || null),
        estatusFuente: r.estatus || null, entidad: r.entidad || null, municipio: r.municipio || null,
        latitud, longitud, coordenadasValidas: latitud !== null && longitud !== null, ligaPermiso: null, ligaResolucion: null,
    };
}

/** Fila de /api/mapa/cne-lista → fila de la vista Permisos. */
export function desdeLista(r = {}, tabla = null) {
    const latitud = coord(r.latitud), longitud = coord(r.longitud);
    return {
        id: r.id ?? null, numero: r.numeroPermiso || '', numeroNorm: r.numeroPermisoNorm || numeroNorm(r.numeroPermiso), razonSocial: r.razonSocial || null,
        tabla, tipo: r.tipoPermiso || null, mercado: r.mercado || null, estatus: r.estatus || null, estatusFuente: r.estatusCne || null,
        efId: r.efId || null, entidad: r.entidad || null, municipio: r.municipio || null, fechaActualizacion: r.fechaActualizacion || null,
        latitud, longitud, coordenadasValidas: latitud !== null && longitud !== null,
        ligaPermiso: https(r.ligaPermiso), ligaResolucion: https(r.ligaResolucion),
    };
}

/** Filtra en el navegador: texto sobre número y titular, actividad y estatus. */
export function filtrar(filas, { numero = '', titular = '', tabla = '', estatus = '' } = {}) {
    const num = numeroNorm(numero), txt = fold(titular);
    return filas.filter(f => (!tabla || f.tabla === tabla) && (!estatus || f.estatus === estatus)
        && (!num || f.numeroNorm.includes(num) || fold(f.numero).includes(fold(numero)))
        && (!txt || fold(f.razonSocial).includes(txt) || fold(f.numero).includes(txt)));
}

async function getJson(path, signal) {
    const response = await fetch(`/api/mapa/${path}`, { signal, credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status });
    return response.json();
}

/**
 * Búsqueda de permisos CNE en Azure por /api/mapa. Devuelve { total, rows } con la página pedida.
 * Sin texto (menos de 2 caracteres) y fuera de las tablas de lista, los últimos RECIENTES permisos: { …, recientes: true }.
 */
export async function buscarPermisosMapa({ numero = '', titular = '', tabla = '', estatus = '', start = 0, pageSize = 20 } = {}, { signal } = {}) {
    const termino = String(numero || titular || '').trim();
    let filas;
    if (TABLAS_LISTA.includes(tabla)) {
        const body = await getJson(`cne-lista?tabla=${tabla}${estatus ? `&estatus=${encodeURIComponent(estatus)}` : ''}`, signal);
        filas = (body?.filas || []).map(r => desdeLista(r, tabla));
    } else if (termino.length < 2) {
        // Sin texto: los últimos RECIENTES permisos. La búsqueda no trae la fecha, así que se leen por el año que va al
        // final del número (el año en curso y, si no alcanza, el anterior), del consecutivo más alto al más bajo.
        const anio = new Date().getFullYear();
        let todas = [];
        for (const a of [anio, anio - 1]) {
            const body = await getJson(`buscar?q=${encodeURIComponent(`/${a}`)}&limite=500`, signal);
            const delAnio = (body?.resultados || []).map(desdeBuscar).filter(f => f.numeroNorm.endsWith(`/${a}`))
                .sort((x, y) => consecutivo(y.numeroNorm) - consecutivo(x.numeroNorm) || x.numeroNorm.localeCompare(y.numeroNorm));
            todas = todas.concat(filtrar(delAnio, { tabla, estatus }));
            if (todas.length >= RECIENTES) break;
        }
        todas = todas.slice(0, RECIENTES);
        return { total: todas.length, rows: todas.slice(start, start + pageSize), recientes: true };
    } else {
        const body = await getJson(`buscar?q=${encodeURIComponent(termino)}&limite=500`, signal);
        filas = (body?.resultados || []).map(desdeBuscar);
    }
    const todas = filtrar(filas, { numero, titular, tabla, estatus });
    return { total: todas.length, rows: todas.slice(start, start + pageSize) };
}

/**
 * Búsqueda de la pestaña Permisos: /api/permisos/permisos (autoridad CNE) y, si falla (salvo 401), el respaldo
 * /api/mapa. Sin texto, los últimos RECIENTES (sólo el respaldo sabe ordenarlos por consecutivo).
 */
export async function buscarPermisos({ numero = '', titular = '', tabla = '', estatus = '', start = 0, pageSize = 20 } = {}, { signal } = {}) {
    const num = String(numero || '').trim();
    const txt = String(titular || '').trim();
    if (!num && !txt && !TABLAS_LISTA.includes(tabla)) {
        // Sin texto, el año en curso del consecutivo mayor al menor. /api/permisos no ordena así.
        return buscarPermisosMapa({ numero, titular, tabla, estatus, start, pageSize }, { signal });
    }
    const params = { autoridad: 'CNE', page: Math.floor(start / pageSize) + 1, pageSize };
    if (tabla) params.tabla = tabla;
    if (estatus) params.estatus = estatus;
    // q: búsqueda parcial (mínimo 2 caracteres); numero: exacta o parcial.
    if (num && !txt) {
        if (num.length >= 2) params.q = num; else params.numero = num;
    } else {
        if (num) params.numero = num;
        if (txt.length >= 2) params.q = txt;
    }
    try {
        const data = await getPermisos('permisos', params, signal);
        return { total: Number(data?.total) || 0, rows: Array.isArray(data?.data) ? data.data : [] };
    } catch (e) {
        if (e?.status === 401 || signal?.aborted) throw e;
        return buscarPermisosMapa({ numero, titular, tabla, estatus, start, pageSize }, { signal });
    }
}

const mismoNumero = (a, b) => !!a && !!b && numeroNorm(a) === numeroNorm(b);

/** Un permiso por su número exacto (ligas profundas, Mi escritorio). null si no está en Azure. */
export async function permisoPorNumero(numero, { signal } = {}) {
    const result = await buscarPermisos({ numero, pageSize: 10 }, { signal });
    return result.rows.find(row => mismoNumero(row.numero, numero) || mismoNumero(row.numeroNorm, numero))
        || (result.rows.length === 1 ? result.rows[0] : null);
}

/** Ligas de un permiso por /api/mapa/ligas (Ligas_Permisos_CNE): título, resolución principal y resoluciones con número. */
export async function ligasPermiso(numero, { signal } = {}) {
    const body = await getJson(`ligas?numero=${encodeURIComponent(String(numero).trim())}`, signal);
    const resoluciones = (body?.resoluciones || []).map(r => ({ numero: r?.numero || null, liga: https(r?.liga) })).filter(r => r.liga);
    return { encontrado: !!body?.encontrado, ligaPermiso: https(body?.ligaPermiso), ligaResolucion: https(body?.ligaResolucion), resoluciones };
}

/**
 * Ligas de un permiso con /api/permisos/ligas como fuente principal y /api/mapa/ligas de respaldo. Las dos leen
 * Ligas_Permisos_CNE. Las resoluciones llevan su número cuando la tabla lo trae (numerosResolucion, separado por «;»).
 */
export async function ligasDePermiso(numero, { signal } = {}) {
    try {
        const res = await getPermisos('ligas', { numero, pageSize: 5 }, signal);
        const data = res?.data || [];
        const hit = data.find(x => mismoNumero(x.numeroPermiso, numero) || mismoNumero(x.numeroPermisoNorm, numero)) || data[0] || null;
        if (!hit) return { encontrado: false, ligaPermiso: null, ligaResolucion: null, resoluciones: [] };
        const ligas = String(hit.ligasResoluciones || '').split(';');
        const numeros = String(hit.numerosResolucion || '').split(';');
        const resoluciones = ligas.map((l, i) => ({ numero: numeros[i]?.trim() || null, liga: https(l) })).filter(r => r.liga);
        return { encontrado: true, ligaPermiso: https(hit.ligaPermiso), ligaResolucion: https(hit.ligaResolucion), resoluciones };
    } catch (e) {
        if (e?.status === 401 || signal?.aborted) throw e;
        return ligasPermiso(numero, { signal });
    }
}

/**
 * Ligas al título de muchos permisos, `concurrencia` a la vez. Devuelve filas { numeroPermiso, ligaPermiso } (sólo las
 * que tienen https). Un permiso que falla se omite; si fallan todos, lanza el último error.
 */
export async function ligasDeMuchos(numeros, { concurrencia = 12, onAvance = () => {}, signal } = {}) {
    const lista = [...new Set((numeros || []).map(n => String(n ?? '').trim()).filter(Boolean))];
    const filas = [];
    let hechos = 0, fallas = 0, ultimo = null, i = 0;
    const trabajador = async () => {
        while (i < lista.length) {
            const numero = lista[i++];
            try {
                const l = await ligasPermiso(numero, { signal });
                if (l.ligaPermiso) filas.push({ numeroPermiso: numero, ligaPermiso: l.ligaPermiso });
            } catch (e) {
                if (e?.status === 401 || signal?.aborted) throw e;
                fallas++; ultimo = e;
            }
            onAvance(++hechos, lista.length);
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrencia, lista.length) }, trabajador));
    if (lista.length && fallas === lista.length) throw ultimo;
    return filas;
}
