/**
 * Server pages for search engines (Cloudflare Pages Functions: functions/ley, functions/aprende,
 * functions/sitemap.xml). Each readable address (see src/lib/seo-paths.js) answers the normal app
 * page with its own title, description, canonical address, Open Graph tags and JSON-LD, plus the
 * text of the instrument or provision so crawlers that do not run scripts can read it. The app
 * removes that text when it starts and opens the same content (window.__SEO_ROUTE__.hash).
 *
 * Data comes from the public, read-only Supabase REST API with the anon key the app already ships.
 */
import { friendlyLabel, friendlyText } from '../src/lib/friendly-text.js';
import { SITE_URL, slugify, lawSlug, lawPath, articlePath, learnPath, parseSeoPath } from '../src/lib/seo-paths.js';
import { CONCEPTOS, CONCEPTO } from '../src/data/como-funciona.js';

const LAWS_TTL = 6 * 3600;
const PAGE_TTL = 24 * 3600;
const SITEMAP_TTL = 43200;

export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Plain text of stored article HTML/Markdown, for descriptions and the crawler copy. */
export function plainText(value) {
    return friendlyText(String(value ?? ''))
        .replace(/<(?:br|\/p|\/tr|\/li|\/h\d|\/div|\/table)\s*\/?>/gi, '\n')
        .replace(/<\/t[dh]>/gi, ' · ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/^#{1,6}\s+/gm, '')
        .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** First sentences up to ~155 characters, cut on a word. */
export function describe(text, max = 155) {
    const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max - 1);
    return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).replace(/[\s,;:.·-]+$/, '')}…`;
}

/**
 * Supabase address and anon key. First the seo-config.json the build leaves in the site, so the server
 * pages read the same acervo as the app they decorate; runtime variables only when it is missing.
 */
async function config(env) {
    const built = env?.ASSETS ? await env.ASSETS.fetch('https://assets.local/seo-config.json').then(r => (r.ok ? r.json() : {})).catch(() => ({})) : {};
    const url = built.url || env?.VITE_SUPABASE_URL || env?.SUPABASE_URL;
    const key = built.key || env?.VITE_SUPABASE_ANON_KEY || env?.SUPABASE_ANON_KEY;
    return url && key ? { url: url.replace(/\/+$/, ''), key } : null;
}

/**
 * One read of the REST API. The cf options alone did not keep Supabase answers at the edge (every
 * server page still asked for the whole list of instruments), so with a cache and the site's origin
 * the answer is also kept in this site's own edge cache under /__seo-data/.
 */
async function rest(cfg, path, { fetcher = fetch, ttl = PAGE_TTL, cache = null, origin = '' } = {}) {
    const key = cache && origin ? new Request(`${origin}/__seo-data/${path}`) : null;
    const hit = key && await cache.match(key).catch(() => null);
    if (hit) return hit.json();
    const response = await fetcher(`${cfg.url}/rest/v1/${path}`, {
        headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, Accept: 'application/json' },
        cf: { cacheTtl: ttl, cacheEverything: true },
    });
    if (!response.ok) throw Object.assign(new Error(`supabase ${new URL(cfg.url).host} ${response.status}: ${(await response.text()).slice(0, 200)}`), { status: response.status });
    const body = await response.text();
    if (key) await cache.put(key, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttl}` } })).catch(() => {});
    return JSON.parse(body);
}

export const getLaws = (cfg, opts) => rest(cfg, 'leyes?select=id,siglas,titulo,tipo,fecha_publicacion,fecha_ultima_reforma,url_original&order=titulo.asc', { ...opts, ttl: LAWS_TTL });
const lawIndex = (cfg, lawId, opts) => rest(cfg, `articulos?select=id,identificador,orden,titulo_nombre,capitulo_nombre&ley_id=eq.${encodeURIComponent(lawId)}&order=orden.asc`, opts);
const articleById = async (cfg, id, opts) => (await rest(cfg, `articulos?select=id,ley_id,identificador,contenido,titulo_nombre,capitulo_nombre&id=eq.${encodeURIComponent(id)}`, opts))[0] || null;

const dateOf = value => (/^\d{4}-\d{2}-\d{2}/.test(String(value ?? '')) ? String(value).slice(0, 10) : '');
const longDate = value => {
    const d = dateOf(value);
    if (!d) return '';
    const [y, m, day] = d.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
};
const paragraphs = text => text.split(/\n{2,}|\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');

/**
 * What a readable address shows: head tags, crawler copy and the app route.
 * @returns {Promise<{ status: number, redirect?: string, title?: string, description?: string, canonical?: string, jsonLd?: object, body?: string, hash?: string, type?: string }>}
 */
export async function resolveSeoPage(pathname, env, opts = {}) {
    const route = parseSeoPath(pathname);
    if (!route) return { status: 404 };

    if (route.type === 'learn') {
        const concept = CONCEPTO[route.id];
        if (!concept) return { status: 404 };
        const canonical = learnPath(concept.id);
        const defs = (concept.definiciones || []).map(d => `<dt>${esc(d.termino)}</dt><dd>${esc(d.texto)}</dd>`).join('');
        return {
            status: 200, type: 'article', canonical, hash: `#como-funciona=${concept.id}`,
            title: `¿Cómo funciona? ${concept.titulo} · Buscador Jurídico`,
            description: describe(concept.resumen),
            jsonLd: { '@context': 'https://schema.org', '@type': 'LearningResource', name: concept.titulo, description: concept.resumen, inLanguage: 'es-MX', url: `${SITE_URL}${canonical}`, isAccessibleForFree: true, provider: { '@type': 'Organization', name: 'Buscador Jurídico', url: SITE_URL } },
            body: `<nav><a href="/">Buscador Jurídico</a> › <a href="/#como-funciona">¿Cómo funciona?</a></nav>
                <h1>${esc(concept.titulo)}</h1><p>${esc(concept.resumen)}</p>
                ${defs ? `<h2>Definiciones</h2><dl>${defs}</dl>` : ''}
                <h2>En palabras simples</h2><ol>${(concept.claves || []).map(c => `<li>${esc(c)}</li>`).join('')}</ol>
                <h2>Otros temas</h2><ul>${CONCEPTOS.filter(c => c.id !== concept.id).map(c => `<li><a href="${learnPath(c.id)}">${esc(c.titulo)}</a></li>`).join('')}</ul>`,
        };
    }

    const cfg = await config(env);
    if (!cfg) return { status: 503 };
    const laws = await getLaws(cfg, opts);
    const law = laws.find(l => lawSlug(l) === route.law);
    if (!law) return { status: 404 };
    const index = await lawIndex(cfg, law.id, opts);

    if (route.type === 'law') {
        const canonical = lawPath(law);
        const published = longDate(law.fecha_publicacion);
        const reformed = longDate(law.fecha_ultima_reforma);
        const meta = [published && `publicado el ${published}`, reformed && `última reforma: ${reformed}`, `${index.length.toLocaleString('es-MX')} disposiciones`].filter(Boolean).join(' · ');
        return {
            status: 200, type: 'website', canonical, hash: `#ley-${law.id}`,
            title: `${law.siglas ? `${law.siglas} · ` : ''}${law.titulo} · Buscador Jurídico`,
            description: describe(`${law.titulo}${law.siglas ? ` (${law.siglas})` : ''}: texto completo, ${meta}. Consulta cada artículo, búscalo y compártelo.`),
            jsonLd: { '@context': 'https://schema.org', '@type': 'Legislation', name: law.titulo, alternateName: law.siglas || undefined, legislationDate: dateOf(law.fecha_publicacion) || undefined, dateModified: dateOf(law.fecha_ultima_reforma) || undefined, legislationJurisdiction: 'MX', inLanguage: 'es-MX', url: `${SITE_URL}${canonical}`, sameAs: law.url_original || undefined },
            body: `<nav><a href="/">Buscador Jurídico</a> › <a href="/#acervo">Acervo</a></nav>
                <h1>${esc(law.titulo)}</h1>${law.siglas ? `<p>${esc(law.siglas)}</p>` : ''}<p>${esc(meta)}</p>
                ${law.url_original ? `<p><a href="${esc(law.url_original)}" rel="nofollow noopener">Fuente oficial</a></p>` : ''}
                <h2>Contenido</h2><ol>${index.map(a => `<li><a href="${articlePath(law, a)}">${esc(friendlyLabel(a.identificador))}</a></li>`).join('')}</ol>`,
        };
    }

    const match = index.find(a => String(a.id).toLowerCase().startsWith(route.idPrefix));
    if (!match) return { status: 404 };
    const canonical = articlePath(law, match);
    if (canonical !== String(pathname).replace(/\/+$/, '')) return { status: 301, redirect: canonical };
    const article = await articleById(cfg, match.id, opts);
    if (!article) return { status: 404 };
    const label = friendlyLabel(article.identificador);
    const text = plainText(article.contenido);
    const location = [article.titulo_nombre, article.capitulo_nombre].map(v => friendlyText(v || '').trim()).filter(Boolean).join(' · ');
    const at = index.findIndex(a => a.id === match.id);
    const near = [index[at - 1], index[at + 1]].filter(Boolean);
    return {
        status: 200, type: 'article', canonical, hash: `#art-${article.id}`,
        title: `${label} · ${law.siglas || law.titulo} · Buscador Jurídico`,
        description: describe(`${label} · ${law.titulo}. ${text}`),
        jsonLd: { '@context': 'https://schema.org', '@type': 'Legislation', name: `${label} · ${law.titulo}`, legislationJurisdiction: 'MX', inLanguage: 'es-MX', url: `${SITE_URL}${canonical}`, isPartOf: { '@type': 'Legislation', name: law.titulo, url: `${SITE_URL}${lawPath(law)}` }, text: describe(text, 1000) },
        body: `<nav><a href="/">Buscador Jurídico</a> › <a href="${lawPath(law)}">${esc(law.siglas || law.titulo)}</a></nav>
            <h1>${esc(label)}</h1><p><a href="${lawPath(law)}">${esc(law.titulo)}</a>${location ? ` · ${esc(location)}` : ''}</p>
            <div>${paragraphs(text)}</div>
            ${near.length ? `<p>${near.map(a => `<a href="${articlePath(law, a)}">${esc(friendlyLabel(a.identificador))}</a>`).join(' · ')}</p>` : ''}`,
    };
}

/** The app page with the tags and crawler copy of a resolved address (Cloudflare HTMLRewriter). */
export function decorate(response, page) {
    const url = `${SITE_URL}${page.canonical}`;
    // With scripts the app replaces the crawler copy at once; hide it so it never flashes.
    const head = `<script>document.documentElement.classList.add('seo-js')</script>
<style>.seo-js #seo-ssr{display:none}#seo-ssr{max-width:760px;margin:24px auto;padding:0 16px;font:16px/1.7 system-ui,sans-serif;color:#2b2326}</style>
<link rel="canonical" href="${esc(url)}">
<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, '\\u003c')}</script>
<script>window.__SEO_ROUTE__=${JSON.stringify({ hash: page.hash, path: page.canonical }).replace(/</g, '\\u003c')};</script>`;
    const setContent = value => ({ element: el => el.setAttribute('content', value) });
    return new HTMLRewriter()
        .on('title', { element: el => el.setInnerContent(page.title) })
        .on('meta[name="description"]', setContent(page.description))
        .on('meta[property="og:title"]', setContent(page.title))
        .on('meta[property="og:description"]', setContent(page.description))
        .on('meta[property="og:type"]', setContent(page.type || 'website'))
        .on('meta[property="og:url"]', setContent(url))
        .on('meta[name="twitter:title"]', setContent(page.title))
        .on('meta[name="twitter:description"]', setContent(page.description))
        .on('link[rel="canonical"]', { element: el => el.remove() })
        .on('head', { element: el => el.append(head, { html: true }) })
        .on('body', { element: el => el.prepend(`<article id="seo-ssr" class="seo-ssr">${page.body}</article>`, { html: true }) })
        .transform(response);
}

/** Request handler for a readable address. */
export async function serveSeoPage(context, opts = {}) {
    const { request, env } = context;
    const url = new URL(request.url);
    const app = await env.ASSETS.fetch(new URL('/', url));
    // Crawlers walk thousands of these pages; each one is built once a day per data center and then
    // served from the edge cache, so Supabase is not queried on every visit. The key carries the app
    // page's ETag: a new deploy (new asset names) never serves a page built for the previous one.
    const cache = opts.cache ?? (typeof caches !== 'undefined' ? caches.default : null);
    const version = (app.headers.get('ETag') || '').replace(/[^A-Za-z0-9]/g, '');
    const key = new Request(`${url.origin}${url.pathname}?v=${version}`);
    const cached = cache && await cache.match(key);
    if (cached) return cached;
    const store = response => {
        if (cache && context.waitUntil) context.waitUntil(cache.put(key, response.clone()));
        return response;
    };
    let page;
    try { page = await resolveSeoPage(url.pathname, env, { ...opts, cache, origin: url.origin }); } catch (error) {
        console.warn('[seo] page failed', { path: url.pathname, message: error?.message });
        return app;
    }
    if (page.status === 301) {
        const moved = Response.redirect(new URL(page.redirect, url).toString(), 301);
        return store(new Response(null, { status: 301, headers: { Location: moved.headers.get('Location'), 'Cache-Control': `public, max-age=3600, s-maxage=${PAGE_TTL}` } }));
    }
    if (page.status !== 200) {
        if (page.status === 503) return app;
        const notFound = new Response(app.body, { status: 404, headers: app.headers });
        const missing = new HTMLRewriter().on('head', { element: el => el.append('<meta name="robots" content="noindex">', { html: true }) }).transform(notFound);
        const headers = new Headers(missing.headers);
        headers.set('Cache-Control', 'public, max-age=0, s-maxage=3600');
        return store(new Response(missing.body, { status: 404, headers }));
    }
    const response = decorate(app, page);
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', `public, max-age=0, s-maxage=${PAGE_TTL}`);
    return store(new Response(response.body, { status: 200, headers }));
}

/** sitemap.xml: home, «¿Cómo funciona?» topics, every instrument and every provision. */
export async function buildSitemap(env, opts = {}) {
    const cfg = await config(env);
    const urls = [{ loc: `${SITE_URL}/`, priority: '1.0' }];
    for (const c of CONCEPTOS) urls.push({ loc: `${SITE_URL}${learnPath(c.id)}`, priority: '0.6' });
    if (cfg) {
        const laws = await getLaws(cfg, { ...opts, ttl: SITEMAP_TTL });
        const byId = new Map(laws.map(l => [l.id, l]));
        for (const law of laws) urls.push({ loc: `${SITE_URL}${lawPath(law)}`, lastmod: dateOf(law.fecha_ultima_reforma || law.fecha_publicacion), priority: '0.8' });
        for (let from = 0; ; from += 1000) {
            const rows = await rest(cfg, `articulos?select=id,ley_id,identificador&order=ley_id.asc,orden.asc&offset=${from}&limit=1000`, { ...opts, ttl: SITEMAP_TTL });
            for (const row of rows) {
                const law = byId.get(row.ley_id);
                const path = law && articlePath(law, row);
                if (path) urls.push({ loc: `${SITE_URL}${path}`, lastmod: dateOf(law.fecha_ultima_reforma || law.fecha_publicacion), priority: '0.5' });
            }
            if (rows.length < 1000) break;
        }
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
}

export { slugify };
