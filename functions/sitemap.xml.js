import { buildSitemap } from '../server/seo.js';

/** Every readable address, regenerated from the acervo and cached at the edge for 12 hours. */
export async function onRequestGet({ env }) {
    try {
        return new Response(await buildSitemap(env), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=43200' } });
    } catch (error) {
        console.warn('[seo] sitemap failed', error?.message);
        return new Response('', { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
}
