/**
 * Anonymous usage counters (see supabase/migrations/202610010001_uso.sql): one visit per browser
 * session, one visitor per browser, and each search and article read. Fire-and-forget; the site works
 * the same if the counters are unavailable. Search terms that found results are counted per day for
 * «Lo más buscado», without user or address (202610290001_uso_busquedas.sql). The server uses a
 * short-lived keyed digest of the network address to limit abusive counter requests.
 */
import { supabase } from './supabase.js';

const enabled = () => !import.meta.env?.DEV && typeof navigator !== 'undefined' && !navigator.webdriver;

function count(metrica) {
    if (!enabled()) return;
    supabase.rpc('registrar_uso', { p_metrica: metrica }).then(() => {}, () => {});
}

function once(storage, key, metrica) {
    try {
        if (storage.getItem(key)) return;
        storage.setItem(key, '1');
    } catch { /* storage blocked: still count, just not de-duplicated */ }
    count(metrica);
}

export function trackVisit() {
    once(sessionStorage, 'uso-visita', 'visita');
    once(localStorage, 'uso-visitante', 'visitante');
}

let lastSearch = '';
/** Counts a search once per distinct query in a row (re-renders and filters don't count again). */
export function trackSearch(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q || q === lastSearch) return;
    lastSearch = q;
    count('busqueda');
}

/**
 * The term as «Lo más buscado» stores it: lower case, single spaces, 2 to 80 characters. Null for what
 * looks like personal data (an e-mail address or six or more digits in a row), which is never sent.
 */
export function searchTerm(query) {
    const term = String(query || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (term.length < 2 || term.length > 80 || term.includes('@') || /\d{6,}/.test(term)) return null;
    return term;
}

const termsThisSession = new Set();
/** Records a search term once per session, only when it found results (see uso_busquedas.sql). */
export function trackSearchTerm(query, results) {
    const term = searchTerm(query);
    if (!enabled() || !term || !(results > 0) || termsThisSession.has(term)) return;
    termsThisSession.add(term);
    supabase.rpc('registrar_busqueda', { p_termino: term }).then(() => {}, () => {});
}

export async function fetchTopSearches(limit = 10) {
    const { data, error } = await supabase.rpc('top_busquedas', { p_limite: limit, p_dias: 30 });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
}

function countItem(tipo, id) {
    if (!enabled()) return;
    supabase.rpc('registrar_item', { p_tipo: tipo, p_id: String(id) }).then(() => {}, () => {});
}

const readThisSession = new Set();
/** Counts an article read once per article per session (daily total and "most read"). */
export function trackRead(id) {
    if (!id || readThisSession.has(String(id))) return;
    readThisSession.add(String(id));
    count('lectura');
    countItem('articulo', id);
}

const lawsThisSession = new Set();
/** Counts a law opened once per law per session ("most consulted"). */
export function trackLaw(law) {
    const id = law && typeof law === 'object' ? law.id : null;
    if (!id || lawsThisSession.has(String(id))) return;
    lawsThisSession.add(String(id));
    countItem('ley', id);
}

export async function fetchUsageSummary() {
    const { data, error } = await supabase.rpc('resumen_uso');
    if (error) throw error;
    return data;
}

export async function fetchTopConsulted(limit = 8) {
    const { data, error } = await supabase.rpc('top_consultados', { p_limite: limit });
    if (error) throw error;
    return data;
}
