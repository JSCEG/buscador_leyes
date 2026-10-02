/**
 * Defined terms: laws open with an article "Para los efectos de esta Ley, se entiende por: I. Término:
 * definición; II. …". This module reads that article (and, for a reglamento, the one of its law),
 * then marks the first use of each term in the text being read; hovering, focusing or tapping it
 * shows the official definition. Nothing is invented: terms and texts come from the acervo.
 */
import { supabase } from './supabase.js';
import '../styles/definitions.css';

const fold = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const DEFINES = /se\s+(?:entiende|entender[aá]|considera|entender[aá]n)[^:]{0,60}\bpor\s*:/i;
const MAX_DEFINITION = 700;

/** Plain text of an article that may come as reviewed HTML. */
function plainText(text) {
    return String(text || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr)>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

/**
 * Terms defined by a definitions article: Map(term → definition). Only fractions shaped like
 * "<roman>. <Term>: <definition>" count, and the term must start with a capital letter.
 */
export function parseDefinitions(text) {
    const body = plainText(text);
    const start = body.search(DEFINES);
    if (start < 0) return new Map();
    const list = body.slice(start).replace(DEFINES, '');
    const terms = new Map();
    for (const chunk of list.split(/(?:^|\n|\s{2,}|;\s*)(?=(?:[IVXLC]{1,7})\.\s+\S)/)) {
        const m = /^\s*[IVXLC]{1,7}\.\s+([^:\n]{2,90}?)\s*:\s*([\s\S]+)$/.exec(chunk);
        if (!m) continue;
        const term = m[1].replace(/\s+/g, ' ').trim();
        if (!/^[A-ZÁÉÍÓÚÑ]/.test(term) || /[.;]/.test(term) || term.split(' ').length > 10) continue;
        let definition = m[2].replace(/\s+/g, ' ').trim().replace(/[;.,]\s*(?:y|e|o)?\s*$/i, '').trim();
        if (definition.length > MAX_DEFINITION) definition = `${definition.slice(0, MAX_DEFINITION).replace(/\s+\S*$/, '')}…`;
        if (definition && !terms.has(term)) terms.set(term, definition);
    }
    return terms;
}

const cache = new Map();

/** Laws whose definitions apply to `law`: itself and, for "Reglamento de la Ley …", that law. */
export function glossaryLaws(law, summaries = []) {
    const key = text => fold(text).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(word => word && !/^(de|del|la|las|los|el|y)$/.test(word)).join(' ');
    const laws = [law];
    const parentName = /^Reglamento de (?:la |el )?(Ley .+)$/i.exec(String(law?.titulo || ''))?.[1];
    if (parentName) {
        const parent = summaries.find(item => key(item.titulo) === key(parentName));
        if (parent) laws.push(parent);
    }
    return laws.filter(Boolean);
}

/**
 * Glossary for a law: { terms: Map(term → { definition, source }), articleIds: Set }.
 * `source` names the instrument that defines the term. Cached per law.
 */
export function loadGlossary(law, summaries = []) {
    if (!law?.id) return Promise.resolve({ terms: new Map(), articleIds: new Set() });
    if (cache.has(law.id)) return cache.get(law.id);
    const laws = glossaryLaws(law, summaries);
    const promise = supabase
        .from('articulos')
        .select('id, ley_id, contenido')
        .in('ley_id', laws.map(item => item.id))
        .or('contenido.ilike.%se entiende%por:%,contenido.ilike.%se entenderá%por:%,contenido.ilike.%se considera%por:%')
        .limit(12)
        .then(({ data, error }) => {
            if (error) throw error;
            const terms = new Map();
            const articleIds = new Set();
            // The instrument's own definitions win over those of its law.
            for (const item of laws) {
                for (const row of (data || []).filter(r => String(r.ley_id) === String(item.id))) {
                    const found = parseDefinitions(row.contenido);
                    if (found.size < 3) continue;
                    articleIds.add(String(row.id));
                    for (const [term, definition] of found) if (!terms.has(term)) terms.set(term, { definition, source: item.siglas || item.titulo });
                }
            }
            return { terms, articleIds };
        })
        .catch(() => { cache.delete(law.id); return { terms: new Map(), articleIds: new Set() }; });
    cache.set(law.id, promise);
    return promise;
}

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SKIP = 'a, button, mark.def-term, .def-term, script, style, textarea, input, select, code';

/**
 * Marks the first use of each term inside `container`. Laws define terms "en singular o plural",
 * so a final s/es also matches. Returns how many terms were marked.
 */
export function markTerms(container, terms) {
    if (!container || !terms?.size) return 0;
    const names = [...terms.keys()].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${names.map(escapeRegExp).join('|')})(?:es|s)?(?![\\p{L}\\p{N}])`, 'u');
    const done = new Set();
    let marked = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: node => (node.parentElement?.closest(SKIP) || !node.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (let node of nodes) {
        let guard = 0;
        while (node && guard++ < 50) {
            const m = pattern.exec(node.nodeValue);
            if (!m) break;
            const term = m[1];
            const index = m.index;
            if (done.has(term)) {
                // Already marked: keep looking after this occurrence.
                const rest = node.splitText(index + m[0].length);
                node = rest;
                continue;
            }
            done.add(term);
            const match = node.splitText(index);
            const rest = match.splitText(m[0].length);
            const span = document.createElement('span');
            span.className = 'def-term';
            span.tabIndex = 0;
            span.dataset.term = term;
            span.setAttribute('role', 'button');
            span.setAttribute('aria-describedby', 'def-tip');
            span.textContent = match.nodeValue;
            match.replaceWith(span);
            marked++;
            node = rest;
        }
    }
    return marked;
}

let tip = null;
let tipFor = null;
let glossaryFor = new WeakMap();

function hideTip() {
    if (!tip) return;
    tip.hidden = true;
    tipFor?.setAttribute('aria-expanded', 'false');
    tipFor = null;
}

function showTip(span) {
    const entry = glossaryFor.get(span.closest('[data-def-scope]'))?.get(span.dataset.term);
    if (!entry) return;
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'def-tip';
        tip.className = 'def-tip';
        tip.setAttribute('role', 'tooltip');
        tip.hidden = true;
        document.body.append(tip);
    }
    tip.innerHTML = '';
    const head = document.createElement('p');
    head.className = 'def-tip-head';
    head.textContent = `${span.dataset.term} · definido en ${entry.source}`;
    const body = document.createElement('p');
    body.className = 'def-tip-body';
    body.textContent = entry.definition;
    tip.append(head, body);
    tip.hidden = false;
    tipFor?.setAttribute('aria-expanded', 'false');
    tipFor = span;
    span.setAttribute('aria-expanded', 'true');
    const rect = span.getBoundingClientRect();
    const width = Math.min(380, window.innerWidth - 24);
    tip.style.width = `${width}px`;
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12));
    tip.style.left = `${left}px`;
    const below = rect.bottom + 10;
    const height = tip.offsetHeight;
    tip.style.top = `${below + height > window.innerHeight - 8 ? Math.max(8, rect.top - height - 10) : below}px`;
}

let listening = false;
function listen() {
    if (listening) return;
    listening = true;
    document.addEventListener('mouseover', event => {
        const span = event.target.closest?.('.def-term');
        if (span) showTip(span);
        else if (tipFor && !event.target.closest?.('.def-tip')) hideTip();
    });
    document.addEventListener('focusin', event => {
        const span = event.target.closest?.('.def-term');
        if (span) showTip(span); else hideTip();
    });
    document.addEventListener('click', event => {
        const span = event.target.closest?.('.def-term');
        if (span) { event.stopPropagation(); if (tipFor === span) hideTip(); else showTip(span); return; }
        if (!event.target.closest?.('.def-tip')) hideTip();
    }, true);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && tipFor) { event.stopPropagation(); const span = tipFor; hideTip(); span.focus(); }
        else if ((event.key === 'Enter' || event.key === ' ') && event.target.closest?.('.def-term')) { event.preventDefault(); showTip(event.target.closest('.def-term')); }
    }, true);
    window.addEventListener('scroll', hideTip, { passive: true, capture: true });
    window.addEventListener('resize', hideTip);
}

/**
 * Marks defined terms in an article being read. `isCurrent` lets the caller drop the result when
 * another article opened meanwhile.
 */
export async function decorateDefinitions(container, { law, articleId, summaries = [], isCurrent = () => true } = {}) {
    if (!container || !law) return 0;
    const { terms, articleIds } = await loadGlossary(law, summaries);
    // The definitions article itself already reads as a glossary.
    if (!terms.size || articleIds.has(String(articleId)) || !isCurrent() || !container.isConnected) return 0;
    const map = new Map([...terms].map(([term, entry]) => [term, entry]));
    container.dataset.defScope = '';
    glossaryFor.set(container, map);
    listen();
    return markTerms(container, terms);
}

/** For tests. */
export function resetDefinitions() { cache.clear(); glossaryFor = new WeakMap(); hideTip(); }
