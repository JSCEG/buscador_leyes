/**
 * Narrow proxy to the CNE public registry, served from our own domain (functions/api/cne/[endpoint].js).
 * Some phone networks cannot reach the CNE servers directly; through the proxy the browser only talks
 * to buscador-juridico.com. Only the three endpoints the app uses are forwarded, with validated
 * parameters; nothing in the request becomes an arbitrary upstream URL. GET answers are cached at the
 * edge for ten minutes so repeated lookups do not reach the CNE again.
 */
const UPSTREAM = {
    permisos: { method: 'POST', url: 'https://api-creweb.cne.gob.mx/api/Permisos/ObtenerPermisosPaginados', params: [] },
    resoluciones: { method: 'GET', url: 'https://api-publico.cne.gob.mx/api/Resoluciones/', params: ['resolucionId', 'tipoEntidad', 'aoData'] },
    anexos: { method: 'GET', url: 'https://api-publico.cne.gob.mx/api/Permisos/Anexos', params: ['permisoId'] },
};
const MAX_BODY = 8 * 1024;
const MAX_QUERY = 6 * 1024;
const TIMEOUT = 25000;
const CACHE_SECONDS = 600;

function problem(status, code) {
    return new Response(JSON.stringify({ code }), {
        status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}

/** Upstream URL for a GET with only the allowed parameters, or null when something else is sent. */
export function upstreamUrl(endpoint, search) {
    const target = UPSTREAM[endpoint];
    if (!target || target.method !== 'GET' || search.length > MAX_QUERY) return null;
    const params = new URLSearchParams(search);
    const keys = [...params.keys()];
    if (!keys.length || keys.some(key => !target.params.includes(key))) return null;
    if (params.has('resolucionId') && !/^\d{1,9}$/.test(params.get('resolucionId'))) return null;
    if (params.has('tipoEntidad') && !/^\d{1,2}$/.test(params.get('tipoEntidad'))) return null;
    if (params.has('permisoId') && !/^\d{1,9}$/.test(params.get('permisoId'))) return null;
    if (params.has('aoData')) {
        try { if (!Array.isArray(JSON.parse(params.get('aoData')))) return null; } catch { return null; }
    }
    const out = new URLSearchParams();
    for (const key of target.params) if (params.has(key)) out.set(key, params.get(key));
    return `${target.url}?${out}`;
}

export async function serveCne(request, endpoint, { fetcher = globalThis.fetch, cache = globalThis.caches?.default } = {}) {
    const target = Object.hasOwn(UPSTREAM, endpoint) ? UPSTREAM[endpoint] : null;
    if (!target) return problem(404, 'unknown-endpoint');
    if (request.method !== target.method) return problem(405, 'method-not-allowed');

    let upstream;
    let init;
    if (target.method === 'GET') {
        upstream = upstreamUrl(endpoint, new URL(request.url).search);
        if (!upstream) return problem(400, 'invalid-parameters');
        init = { method: 'GET', headers: { Accept: 'application/json' } };
        const hit = cache && await cache.match(request).catch(() => null);
        if (hit) return hit;
    } else {
        const body = await request.text();
        if (body.length > MAX_BODY) return problem(413, 'body-too-large');
        try { if (!JSON.parse(body)?.parameters) return problem(400, 'invalid-body'); } catch { return problem(400, 'invalid-body'); }
        upstream = target.url;
        init = { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' }, body };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
        const response = await fetcher(upstream, { ...init, redirect: 'manual', signal: controller.signal });
        if (!response.ok) {
            await response.body?.cancel();
            return problem(502, 'upstream-error');
        }
        const text = await response.text();
        const answer = new Response(text, {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': target.method === 'GET' ? `public, max-age=${CACHE_SECONDS}` : 'no-store',
            },
        });
        if (target.method === 'GET' && cache) await cache.put(request, answer.clone()).catch(() => {});
        return answer;
    } catch {
        return problem(504, 'upstream-unavailable');
    } finally {
        clearTimeout(timer);
    }
}
