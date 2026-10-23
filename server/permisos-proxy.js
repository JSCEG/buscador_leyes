/**
 * CNE and SENER permits API (Codex, services/permisos-api/API.md): one handler for Cloudflare Pages
 * (functions/api/permisos/[endpoint].js) and the local dev server (server/reader-dev.js).
 *
 * The API asks for an X-Api-Key that must never reach the browser, so the key lives here as a server
 * secret (PERMISOS_API_KEY). The browser calls /api/permisos/<endpoint>; only whitelisted endpoints and
 * validated params go upstream, and answers are cached at the edge (the API itself says no-store, and it
 * allows 600 requests a minute per client).
 */
export const PERMISOS_API_URL = 'https://snier-permisos-api.azurewebsites.net/api/v1';

export const TABLES = ['electricidad', 'petroliferos', 'gas-lp', 'gas-natural', 'transporte', 'comercializacion', 'infraestructura',
    'suministro', 'terceros', 'asignaciones', 'comercio-exterior', 'contratos-ee', 'pozos', 'biocombustibles'];
export const MARKETS = ['Petrolíferos', 'Gas natural', 'Gas LP', 'Petróleo crudo', 'Petroquímicos', 'Electricidad', 'Varios', 'Biocombustibles'];

const TEXT = /^[\p{L}\p{N} .,;:()/_&'+-]{1,120}$/u;
const NUMBER = /^[\p{L}\p{N} ./_()-]{1,80}$/u;
const intIn = (min, max) => value => /^\d{1,6}$/.test(value) && Number(value) >= min && Number(value) <= max;

/** What each query param may hold. */
const PARAMS = {
    tabla: value => TABLES.includes(value),
    autoridad: value => value === 'CNE' || value === 'SENER',
    mercado: value => MARKETS.includes(value),
    estatus: value => value === 'Vigente' || value === 'No vigente',
    ef: value => /^(\d{2}|--)$/.test(value),
    mpo: value => /^\d{3}$/.test(value),
    tipo: value => TEXT.test(value),
    numero: value => NUMBER.test(value),
    page: intIn(1, 100000),
    pageSize: intIn(1, 500),
};
const FILTERS = ['tabla', 'autoridad', 'mercado', 'estatus', 'ef', 'mpo', 'tipo', 'numero', 'page', 'pageSize'];

/** endpoint → { upstream path, allowed params, required params, edge cache seconds } */
const ENDPOINTS = {
    permisos: { path: 'permisos', keys: FILTERS, seconds: 3600 },
    puntos: { path: 'puntos', keys: FILTERS, seconds: 3600 },
    estados: { path: 'estados', keys: FILTERS, seconds: 3600 },
    municipios: { path: 'municipios', keys: FILTERS, seconds: 3600 },
    'sin-ubicacion': { path: 'sin-ubicacion', keys: FILTERS, seconds: 3600 },
    detalle: { path: 'detalle', keys: FILTERS, required: ['tabla', 'numero'], seconds: 3600 },
    ligas: { path: 'ligas', keys: ['numero', 'mercado', 'page', 'pageSize'], seconds: 86400 },
    'asignaciones-municipios': { path: 'asignaciones/municipios', keys: ['numero', 'estatus', 'mercado', 'tipo', 'ef', 'mpo', 'page', 'pageSize'], seconds: 3600 },
    actualizaciones: { path: 'actualizaciones', keys: ['tabla', 'autoridad', 'page', 'pageSize'], seconds: 600 },
    catalogo: { path: 'catalogo', keys: [], seconds: 86400 },
};
const TIMEOUT = 30000;

const problem = (status, code) => new Response(JSON.stringify({ code }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

/** Upstream URL for a whitelisted endpoint, or null when the params are not acceptable. */
export function upstreamUrl(endpoint, searchParams, base = PERMISOS_API_URL) {
    const spec = Object.hasOwn(ENDPOINTS, endpoint) ? ENDPOINTS[endpoint] : null;
    if (!spec) return null;
    const keys = [...searchParams.keys()];
    if (new Set(keys).size !== keys.length) return null;
    if (keys.some(key => !spec.keys.includes(key) || !PARAMS[key](searchParams.get(key)))) return null;
    if ((spec.required || []).some(key => !searchParams.get(key))) return null;
    if (searchParams.get('mpo') && !/^\d{2}$/.test(searchParams.get('ef') || '')) return null;
    // A stable order, so the same question shares one cache entry.
    const params = new URLSearchParams(keys.sort().map(key => [key, searchParams.get(key)]));
    const query = params.toString();
    return `${base.replace(/\/+$/, '')}/${spec.path}${query ? `?${query}` : ''}`;
}

/**
 * @param {Request} request
 * @param {string} endpoint
 * @param {{ key?: string, base?: string, fetcher?: typeof fetch, cache?: Cache | null }} [options]
 */
export async function servePermisos(request, endpoint, { key, base = PERMISOS_API_URL, fetcher = globalThis.fetch, cache = globalThis.caches?.default } = {}) {
    if (!Object.hasOwn(ENDPOINTS, endpoint)) return problem(404, 'unknown-endpoint');
    if (request.method !== 'GET') return problem(405, 'method-not-allowed');
    const upstream = upstreamUrl(endpoint, new URL(request.url).searchParams, base || PERMISOS_API_URL);
    if (!upstream) return problem(400, 'invalid-params');
    if (!key) return problem(503, 'not-configured');

    const cacheKey = new Request(`https://permisos.cache/${upstream.slice(upstream.indexOf('/api/v1/') + 8)}`);
    const cached = cache ? await cache.match(cacheKey) : null;
    if (cached) return cached;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    let upstreamResponse;
    try {
        upstreamResponse = await fetcher(upstream, { signal: controller.signal, redirect: 'manual', headers: { Accept: 'application/json', 'X-Api-Key': key } });
    } catch (error) {
        return problem(error?.name === 'AbortError' ? 504 : 502, error?.name === 'AbortError' ? 'upstream-unavailable' : 'upstream-error');
    } finally {
        clearTimeout(timer);
    }
    // The API's own errors stay generic here: an auth problem is ours to fix, not the visitor's.
    if (upstreamResponse.status === 404) return problem(404, 'not-found');
    if (upstreamResponse.status === 400) return problem(400, 'invalid-params');
    if (upstreamResponse.status === 429) return problem(503, 'busy');
    if (!upstreamResponse.ok) return problem(502, upstreamResponse.status === 401 || upstreamResponse.status === 403 ? 'upstream-auth' : 'upstream-error');

    const body = await upstreamResponse.text();
    const response = new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${ENDPOINTS[endpoint].seconds}` },
    });
    if (cache) await cache.put(cacheKey, response.clone());
    return response;
}
