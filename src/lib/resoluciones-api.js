/**
 * CNE resolutions and regulatory framework from Azure (dbo.Resoluciones_CNE, dbo.Resoluciones_Permisos_CNE,
 * dbo.MarcoRegulatorio), through the server proxy /api/permisos/<endpoint> (server/permisos-proxy.js keeps the key).
 * The CNE site is never called live: since 26/11/2026 it requires reCAPTCHA.
 * A field that does not come stays null: nothing is filled in.
 */
import { getPermisos } from './permisos-api.js';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
/** "2026-09-23" → "23 sep 2026"; anything else → ''. */
export function fechaLabel(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
    return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
}

export const https = u => (typeof u === 'string' && /^https:\/\//i.test(u.trim()) ? u.trim() : null);
const text = v => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** One resolution of the API, with only https links and empty text as null. */
export function resolucion(row = {}) {
    return {
        id: row.resolucionId ?? null, numero: text(row.numero) || '', fecha: text(row.fecha), tipo: text(row.tipo),
        modalidad: text(row.modalidad), acta: text(row.acta), mercado: text(row.mercado),
        ligaResolucion: https(row.ligaResolucion), ligaActa: https(row.ligaActa),
        permisos: Array.isArray(row.permisos) ? row.permisos.map(p => ({ numero: text(p?.numeroPermiso), tabla: text(p?.tabla) })).filter(p => p.numero) : [],
    };
}

/** Year → { desde, hasta } of that year. */
const yearRange = anio => (/^\d{4}$/.test(String(anio || '')) ? { desde: `${anio}-01-01`, hasta: `${anio}-12-31` } : {});

/** Filters of the tab → params of /resoluciones and /resoluciones/conteo. */
export function filtrosResoluciones({ numero = '', texto = '', fecha = '', tipo = '', modalidad = '', acta = '' } = {}) {
    const q = String(texto || '').trim();
    return {
        numero: String(numero || '').trim() || undefined,
        q: q.length >= 2 ? q : undefined,
        tipo: String(tipo || '').trim() || undefined,
        modalidad: String(modalidad || '').trim() || undefined,
        acta: String(acta || '').trim() || undefined,
        ...yearRange(fecha),
    };
}

/** Search, newest first: { total, rows }. */
export async function buscarResoluciones(filters = {}, { start = 0, pageSize = 20, signal } = {}) {
    const data = await getPermisos('resoluciones', { ...filtrosResoluciones(filters), orden: 'fecha_desc', page: Math.floor(start / pageSize) + 1, pageSize }, signal);
    return { total: Number(data?.total) || 0, rows: (data?.items || []).map(resolucion) };
}

/** One resolution by its number, with the permits it touches; null when it does not exist. */
export async function resolucionPorNumero(numero, { signal } = {}) {
    try {
        return resolucion(await getPermisos('resolucion', { numero: String(numero).trim() }, signal));
    } catch (e) {
        if (e?.status === 404) return null;
        throw e;
    }
}

/** Resolutions of one permit, newest first (no date last); [] when there are none. */
export async function resolucionesDePermiso(numero, { signal } = {}) {
    try {
        const data = await getPermisos('permiso-resoluciones', { numero: String(numero).trim(), pageSize: 100 }, signal);
        return (data?.items || []).map(resolucion).sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
    } catch (e) {
        if (e?.status === 404) return [];
        throw e;
    }
}

/** Counts: { total, porTipo: [{ tipo, total }], porAnio: [{ anio, total }] } (tipo and anio may be null). */
export async function conteoResoluciones(filters = {}, { signal } = {}) {
    const data = await getPermisos('resoluciones-conteo', filtrosResoluciones(filters), signal);
    return {
        total: Number(data?.total) || 0,
        porTipo: (data?.porTipo || []).map(r => ({ tipo: text(r?.tipo), total: Number(r?.total) || 0 })),
        porAnio: (data?.porAnio || []).map(r => ({ anio: Number.isInteger(r?.anio) ? r.anio : null, total: Number(r?.total) || 0 })),
    };
}

/** Regulatory framework (agreements, resolutions, rules) by text over its proemio, newest first: { total, rows }. */
export async function marcoRegulatorio({ q = '', tipo = '', desde = '', hasta = '' } = {}, { start = 0, pageSize = 20, signal } = {}) {
    const term = String(q || '').trim();
    const data = await getPermisos('marco-regulatorio', {
        q: term.length >= 2 ? term : undefined, tipo: tipo || undefined, desde: desde || undefined, hasta: hasta || undefined,
        orden: 'fecha_desc', page: Math.floor(start / pageSize) + 1, pageSize,
    }, signal);
    return {
        total: Number(data?.total) || 0,
        rows: (data?.items || []).map(r => ({ id: r?.id ?? null, numero: text(r?.numero) || '', fecha: text(r?.fecha), tipo: text(r?.tipo), proemio: text(r?.proemio), link: https(r?.link) })),
    };
}
