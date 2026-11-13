// Observe public reads only. A slow query or an error on one record is never
// sufficient to show maintenance: confirm with a separate indexed catalogue read.
export function observeAcervoFetch(fetcher, suspect, slowMs = 8500) {
    return async (input, init) => {
        const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
        const method = (init?.method || input.method || 'GET').toUpperCase();
        if (!(url.pathname.startsWith('/rest/v1/') && (method === 'GET' || method === 'HEAD'
            || /\/rpc\/(leyes_con_conteo|buscar_articulos)$/.test(url.pathname)))) return fetcher(input, init);
        const signal = init?.signal || input.signal;
        const check = () => { if (!signal?.aborted) suspect(); };
        const timer = setTimeout(check, slowMs);
        try {
            const response = await fetcher(input, init);
            if (response.status >= 500) check();
            return response;
        } catch (error) {
            if (error.name !== 'AbortError') check();
            throw error;
        } finally { clearTimeout(timer); }
    };
}

export async function acervoHealth(url, key, fetcher = fetch) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    try {
        const response = await fetcher(new URL('/rest/v1/leyes?select=id&limit=1', url), {
            headers: { apikey: key, Authorization: 'Bearer ' + key }, cache: 'no-store', signal: controller.signal,
        });
        if (!response.ok) return response.status >= 500 ? 'down' : 'unknown';
        return Array.isArray(await response.json()) ? 'up' : 'unknown';
    } catch { return 'down'; }
    finally { clearTimeout(timer); }
}
