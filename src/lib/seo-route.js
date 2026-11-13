/**
 * Arriving at a readable address (/ley/…, /aprende/…; see seo-paths.js). The server page sets
 * window.__SEO_ROUTE__ with the app route of that content and adds a copy of the text for crawlers
 * (#seo-ssr); the app drops that copy and opens the same content at its usual hash address. Without
 * the server page (local development), the address is resolved here against the acervo.
 * Must run before the UI reads the initial hash.
 */
import { parseSeoPath, lawSlug } from './seo-paths.js';
import { withReading } from './book-share.js';

/** @returns {boolean} whether the visit came through a readable address */
export function takeSeoRoute({ resolve = resolveSeoRoute } = {}) {
    const route = window.__SEO_ROUTE__;
    const search = location.search;
    document.getElementById('seo-ssr')?.remove();
    if (route?.hash) {
        history.replaceState(null, '', `/${withReading(route.hash, search)}`);
        return true;
    }
    const parsed = parseSeoPath(location.pathname);
    if (!parsed) return false;
    if (parsed.type === 'learn') {
        history.replaceState(null, '', `/#como-funciona=${parsed.id}`);
        return true;
    }
    const originalAddress = location.href;
    resolve(parsed).then(hash => {
        if (location.href !== originalAddress) return;
        history.replaceState(null, '', '/');
        location.hash = hash ? withReading(hash, search) : '#acervo';
    }).catch(() => {
        // Keep the readable address for the recovery reload.
        if (location.href === originalAddress) window.dispatchEvent(new Event('acervo:check-service'));
    });
    return true;
}

/** App hash of an instrument or provision address, from Supabase. */
export async function resolveSeoRoute(parsed) {
    const { supabase } = await import('./supabase.js');
    const { data: laws, error } = await supabase.from('leyes').select('id, siglas, titulo');
    if (error) throw error;
    const law = (laws || []).find(item => lawSlug(item) === parsed.law);
    if (!law) return '';
    if (parsed.type === 'law') return `#ley-${law.id}`;
    // The 8 hex characters are the start of the provision's UUID: a range finds it.
    const { data, error: articleError } = await supabase.from('articulos').select('id').eq('ley_id', law.id)
        .gte('id', `${parsed.idPrefix}-0000-0000-0000-000000000000`).lte('id', `${parsed.idPrefix}-ffff-ffff-ffff-ffffffffffff`).limit(1);
    if (articleError) throw articleError;
    return data?.[0] ? `#art-${data[0].id}` : `#ley-${law.id}`;
}
