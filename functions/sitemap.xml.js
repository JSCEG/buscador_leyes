import { buildSitemap } from '../server/seo.js';

const HEADERS = { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=43200' };

/**
 * Every readable address, regenerated from the acervo. Building it takes a few seconds (one query per
 * thousand provisions), so the result is kept in the edge cache for 12 hours and crawlers get it at once.
 */
export async function onRequestGet({ request, env, waitUntil }) {
    const key = new Request(new URL('/sitemap.xml', request.url).toString());
    const cache = typeof caches !== 'undefined' ? caches.default : null;
    const cached = await cache?.match(key);
    if (cached) return cached;
    try {
        const response = new Response(await buildSitemap(env), { headers: HEADERS });
        if (cache) waitUntil(cache.put(key, response.clone()));
        return response;
    } catch (error) {
        console.warn('[seo] sitemap failed', error?.message);
        return new Response('', { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
}

/** HEAD gets the sitemap's headers, not those of the app page. */
export async function onRequestHead(context) {
    const response = await onRequestGet(context);
    return new Response(null, { status: response.status, headers: response.headers });
}
