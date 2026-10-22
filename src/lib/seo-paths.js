/**
 * Readable addresses for search engines and shared links, used by the app and by the server pages
 * (functions/ley, functions/aprende, functions/sitemap.xml):
 *   /ley/lse                          an instrument (by its siglas)
 *   /ley/lse/articulo-12-4446259e     one of its provisions (label + first 8 characters of its id)
 *   /aprende/motor                    a «¿Cómo funciona?» topic
 * The id fragment is what finds a provision; the label is only there to be read, so a renamed
 * provision keeps working and redirects to its current address.
 */
import { friendlyLabel } from './friendly-text.js';

export const SITE_URL = 'https://buscador-juridico.com';

/** «Artículo 12 Bis» → «articulo-12-bis». */
export function slugify(value, max = 80) {
    return String(value ?? '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        .slice(0, max).replace(/-+$/, '');
}

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @param {{ siglas?: string, titulo?: string }} law */
export const lawSlug = law => slugify(law?.siglas || law?.titulo);

/** Address of an instrument, or '' when it has no siglas or title. */
export function lawPath(law) {
    const slug = lawSlug(law);
    return slug ? `/ley/${slug}` : '';
}

/**
 * Address of a provision. `label` is its identificador as stored or as shown (both give the same
 * slug); '' when the instrument or the id is unknown.
 * @param {{ siglas?: string, titulo?: string }} law
 * @param {{ id: string, label?: string, identificador?: string, articulo_label?: string }} article
 */
export function articlePath(law, article) {
    const base = lawPath(law);
    const id = String(article?.id ?? '');
    if (!base || !ID.test(id)) return '';
    const label = friendlyLabel(article.label ?? article.articulo_label ?? article.identificador ?? '');
    return `${base}/${slugify(label, 60) || 'disposicion'}-${id.slice(0, 8).toLowerCase()}`;
}

export const learnPath = id => (/^[a-z0-9-]+$/.test(String(id ?? '')) ? `/aprende/${id}` : '');

/**
 * What a pathname points to, or null.
 * @returns {{ type: 'law', law: string } | { type: 'article', law: string, slug: string, idPrefix: string } | { type: 'learn', id: string } | null}
 */
export function parseSeoPath(pathname) {
    const path = String(pathname ?? '').replace(/\/+$/, '');
    let match = /^\/ley\/([a-z0-9-]+)$/.exec(path);
    if (match) return { type: 'law', law: match[1] };
    match = /^\/ley\/([a-z0-9-]+)\/(?:([a-z0-9-]*)-)?([0-9a-f]{8})$/.exec(path);
    if (match) return { type: 'article', law: match[1], slug: match[2] || '', idPrefix: match[3] };
    match = /^\/aprende\/([a-z0-9-]+)$/.exec(path);
    if (match) return { type: 'learn', id: match[1] };
    return null;
}

/** Absolute address for sharing, or the app's own hash address when there is no readable one. */
export const shareUrl = (path, fallbackHash, origin = SITE_URL) => (path ? `${origin}${path}` : `${origin}/${fallbackHash}`);
