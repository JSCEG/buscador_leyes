/**
 * Search landing extras: key terms of the acervo, latest publications and the reader's recent
 * searches, as three cards under the search box. Clicking a chip runs that search.
 */
import { loadTerms, SECTORS } from './terms-view.js';
import { shortTitle } from '../lib/short-title.js';
import { getAcervoGroup } from '../lib/acervo-model.js';
import { collectionIcon } from '../lib/collection-icons.js';
import '../styles/search-landing.css';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const day = value => { const d = new Date(`${String(value).slice(0, 10)}T12:00:00`); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); };
const ICON = {
    terms: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="2.6"/><circle cx="5" cy="6" r="1.8"/><circle cx="19" cy="6" r="1.8"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="18" cy="18" r="1.8"/><path d="M10 10.4 6.4 7.2M14 10.4l3.6-3.2M10.2 13.9l-2.8 3.2M13.8 13.9l2.7 2.6"/></svg>',
    recent: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    history: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>',
};

/**
 * @param {HTMLElement} host
 * @param {{ summaries: object[], history: string[], onSearch: Function, onOpenLaw: Function, onOpenTerms: Function }} options
 */
export async function renderSearchLanding(host, { summaries = [], history = [], onSearch = () => {}, onOpenLaw = () => {}, onOpenTerms = () => {} } = {}) {
    let terms = [];
    try { terms = (await loadTerms()).terms; } catch { terms = []; }
    const top = [...terms].sort((a, b) => b.instruments.length - a.instruments.length).slice(0, 10);
    const latest = summaries.filter(law => law.fecha_publicacion).sort((a, b) => String(b.fecha_publicacion).localeCompare(String(a.fecha_publicacion))).slice(0, 4);
    const recent = history.slice(0, 6);

    host.innerHTML = `<div class="sl-grid">
        <section class="sl-card" aria-labelledby="sl-terms">
            <header><span class="sl-ico">${ICON.terms}</span><h2 id="sl-terms">Términos clave del acervo</h2></header>
            <p class="sl-note">Los más usados en leyes, reglamentos y acuerdos.</p>
            <div class="sl-chips">${top.map(t => `<button type="button" class="sl-chip" data-sl-search="${esc(t.label)}" style="--c:${SECTORS[t.sector]?.color || '#9b2247'}">${esc(t.label)}</button>`).join('') || '<span class="sl-note">Sin datos todavía.</span>'}</div>
            <button type="button" class="sl-link" data-sl-terms>Ver el mapa de términos →</button>
        </section>
        <section class="sl-card" aria-labelledby="sl-latest">
            <header><span class="sl-ico">${ICON.recent}</span><h2 id="sl-latest">Publicado recientemente</h2></header>
            <ol class="sl-latest">${latest.map(law => {
                const group = getAcervoGroup(law);
                return `<li><button type="button" data-sl-law="${esc(law.id)}" title="${esc(law.titulo)}"><span class="sl-law-ico" data-category="${group}">${collectionIcon(group, 14)}</span><span class="sl-law-text"><strong>${esc(shortTitle(law.titulo) || law.titulo)}</strong><small>${esc(law.siglas || '')} · ${esc(day(law.fecha_publicacion))}</small></span></button></li>`;
            }).join('')}</ol>
        </section>
        <section class="sl-card" aria-labelledby="sl-history">
            <header><span class="sl-ico">${ICON.history}</span><h2 id="sl-history">Tus búsquedas recientes</h2></header>
            ${recent.length
                ? `<div class="sl-chips">${recent.map(q => `<button type="button" class="sl-chip sl-chip-plain" data-sl-search="${esc(q)}">${esc(q)}</button>`).join('')}</div>`
                : '<p class="sl-note">Aquí aparecerán tus últimas búsquedas para retomarlas con un clic.</p>'}
        </section>
    </div>`;

    host.onclick = event => {
        const b = event.target.closest('button');
        if (!b) return;
        if (b.dataset.slSearch) onSearch(b.dataset.slSearch);
        else if (b.dataset.slLaw) onOpenLaw(b.dataset.slLaw);
        else if (b.hasAttribute('data-sl-terms')) onOpenTerms();
    };
}
