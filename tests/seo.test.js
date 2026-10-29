import { describe, it, expect } from 'vitest';
import { slugify, lawPath, articlePath, learnPath, parseSeoPath, shareUrl } from '../src/lib/seo-paths.js';
import { resolveSeoPage, buildSitemap, serveSeoPage, describe as describeText } from '../server/seo.js';

const LAW = { id: 'law-1', siglas: 'LSE', titulo: 'Ley del Sector Eléctrico', fecha_publicacion: '2025-03-18' };
const ART_ID = '4446259e-1111-2222-3333-444444444444';
const NEXT_ID = '5556259e-1111-2222-3333-444444444444';
const ENV = { VITE_SUPABASE_URL: 'https://db.example', VITE_SUPABASE_ANON_KEY: 'anon' };

/** Fake Supabase REST: answers by table name. */
function fakeFetch(calls = []) {
    return async url => {
        calls.push(url);
        const body = url.includes('/leyes?') ? [LAW]
            : url.includes(`id=eq.${ART_ID}`) ? [{ id: ART_ID, ley_id: 'law-1', identificador: 'ARTICULO 12', contenido: '<p>Texto del artículo.</p>', titulo_nombre: 'Título Primero' }]
            : url.includes('ley_id=eq.') ? [{ id: ART_ID, identificador: 'ARTICULO 12' }, { id: NEXT_ID, identificador: 'ARTICULO 13' }]
            : url.includes('articulos?') ? [{ id: ART_ID, ley_id: 'law-1', identificador: 'ARTICULO 12' }]
            : [];
        return new Response(JSON.stringify(body), { status: 200 });
    };
}

describe('readable addresses', () => {
    it('slugs labels without accents or symbols', () => {
        expect(slugify('Artículo 12 Bis.')).toBe('articulo-12-bis');
        expect(lawPath(LAW)).toBe('/ley/lse');
        expect(lawPath({})).toBe('');
    });

    it('builds and parses a provision address', () => {
        const path = articlePath(LAW, { id: ART_ID, label: 'Artículo 12' });
        expect(path).toBe('/ley/lse/articulo-12-4446259e');
        expect(parseSeoPath(path)).toEqual({ type: 'article', law: 'lse', slug: 'articulo-12', idPrefix: '4446259e' });
        expect(articlePath(LAW, { id: 'not-a-uuid' })).toBe('');
    });

    it('parses instrument and learning addresses, rejects others', () => {
        expect(parseSeoPath('/ley/lse/')).toEqual({ type: 'law', law: 'lse' });
        expect(parseSeoPath(learnPath('motor'))).toEqual({ type: 'learn', id: 'motor' });
        expect(parseSeoPath('/api/x')).toBeNull();
        expect(learnPath('../x')).toBe('');
    });

    it('falls back to the hash address when there is no readable one', () => {
        expect(shareUrl('', '#ley-1', 'https://a.b')).toBe('https://a.b/#ley-1');
        expect(shareUrl('/ley/lse', '#ley-1', 'https://a.b')).toBe('https://a.b/ley/lse');
    });
});

describe('server pages', () => {
    it('describes text in at most 155 characters', () => {
        expect(describeText('palabra '.repeat(60)).length).toBeLessThanOrEqual(155);
    });

    it('resolves an instrument with links to its provisions', async () => {
        const page = await resolveSeoPage('/ley/lse', ENV, { fetcher: fakeFetch() });
        expect(page.status).toBe(200);
        expect(page.hash).toBe('#ley-law-1');
        expect(page.canonical).toBe('/ley/lse');
        expect(page.body).toContain('/ley/lse/articulo-12-4446259e');
        expect(page.jsonLd['@type']).toBe('Legislation');
    });

    it('resolves a provision and redirects an outdated slug', async () => {
        const page = await resolveSeoPage('/ley/lse/articulo-12-4446259e', ENV, { fetcher: fakeFetch() });
        expect(page.status).toBe(200);
        expect(page.hash).toBe(`#art-${ART_ID}`);
        expect(page.body).toContain('Texto del artículo.');
        const moved = await resolveSeoPage('/ley/lse/viejo-4446259e', ENV, { fetcher: fakeFetch() });
        expect(moved).toEqual({ status: 301, redirect: '/ley/lse/articulo-12-4446259e' });
    });

    it('answers 404 for unknown instruments and topics, 503 without configuration', async () => {
        expect((await resolveSeoPage('/ley/nada', ENV, { fetcher: fakeFetch() })).status).toBe(404);
        expect((await resolveSeoPage('/aprende/nada', ENV)).status).toBe(404);
        expect((await resolveSeoPage('/ley/lse', {})).status).toBe(503);
    });

    it('lists home, topics, instruments and provisions in the sitemap', async () => {
        const xml = await buildSitemap(ENV, { fetcher: fakeFetch() });
        expect(xml).toContain('<loc>https://buscador-juridico.com/</loc>');
        expect(xml).toContain('<loc>https://buscador-juridico.com/ley/lse</loc>');
        expect(xml).toContain('<loc>https://buscador-juridico.com/ley/lse/articulo-12-4446259e</loc>');
        expect(xml).toMatch(/\/aprende\/[a-z0-9-]+<\/loc>/);
    });
});

describe('server configuration', () => {
    it('reads the address and key the build leaves in the site when there are no runtime variables', async () => {
        const ASSETS = { fetch: async () => new Response(JSON.stringify({ url: 'https://db.example', key: 'anon' })) };
        const calls = [];
        const page = await resolveSeoPage('/ley/lse', { ASSETS }, { fetcher: fakeFetch(calls) });
        expect(page.status).toBe(200);
        expect(calls[0]).toMatch(/^https:\/\/db\.example\/rest\/v1\/leyes/);
    });
});

describe('edge cache of server pages', () => {
    it('answers a repeated visit from the cache, keyed by the deploy, without querying the acervo again', async () => {
        const store = new Map();
        const cache = { match: async req => store.get(req.url)?.clone(), put: async (req, res) => { store.set(req.url, res); } };
        const pending = [];
        const calls = [];
        const ASSETS = { fetch: async () => new Response('<html></html>', { headers: { ETag: '"abc-1"' } }) };
        const context = { request: new Request('https://buscador-juridico.com/ley/lse/viejo-4446259e'), env: { ...ENV, ASSETS }, waitUntil: p => pending.push(p) };
        const first = await serveSeoPage(context, { cache, fetcher: fakeFetch(calls) });
        await Promise.all(pending);
        expect(first.status).toBe(301);
        expect(first.headers.get('Location')).toBe('https://buscador-juridico.com/ley/lse/articulo-12-4446259e');
        expect([...store.keys()].filter(k => !k.includes('/__seo-data/'))).toEqual(['https://buscador-juridico.com/ley/lse/viejo-4446259e?v=abc1']);
        const queries = calls.length;
        const again = await serveSeoPage(context, { cache, fetcher: fakeFetch(calls) });
        expect(again.status).toBe(301);
        expect(calls.length).toBe(queries);
    });

    it('keeps the acervo data at the edge, so other pages of the same instrument do not query it again', async () => {
        const store = new Map();
        const cache = { match: async req => store.get(req.url)?.clone(), put: async (req, res) => { store.set(req.url, res); } };
        const calls = [];
        const visit = path => resolveSeoPage(path, ENV, { cache, origin: 'https://buscador-juridico.com', fetcher: fakeFetch(calls) });
        expect((await visit('/ley/lse')).status).toBe(200);
        expect(calls).toHaveLength(2);
        expect((await visit('/ley/lse/articulo-12-4446259e')).status).toBe(200);
        expect(calls).toHaveLength(3);
        expect(calls[2]).toContain(`id=eq.${ART_ID}`);
    });
});
