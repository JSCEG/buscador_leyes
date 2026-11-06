/**
 * Search landing: topics to start from, with the key terms map, and the latest publications.
 * Clicking a topic runs that search. Recent searches live in the empty search box.
 */
import { loadTerms } from './terms-view.js';
import { shortTitle } from '../lib/short-title.js';
import { getAcervoGroup } from '../lib/acervo-model.js';
import { isJudgment, judgmentCase, instrumentTypeLabel } from '../lib/judgment.js';
import '../styles/search-landing.css';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const day = value => { const d = new Date(`${String(value).slice(0, 10)}T12:00:00`); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); };
const STARTERS = ['Interconexión', 'Autoconsumo', 'Planeación vinculante', 'Permisos de generación', 'Almacenamiento', 'CENACE'];
const TOPICS_SHOWN = 12;

/**
 * @param {HTMLElement} host
 * @param {{ summaries: object[], onSearch: Function, onOpenLaw: Function, onOpenTerms: Function }} options
 */
export async function renderSearchLanding(host, { summaries = [], onSearch = () => {}, onOpenLaw = () => {}, onOpenTerms = () => {} } = {}) {
    let terms = [];
    try { terms = (await loadTerms()).terms; } catch { terms = []; }
    const top = [...terms].sort((a, b) => b.instruments.length - a.instruments.length).map(term => term.label);
    const topics = [...new Set([...STARTERS, ...top])].slice(0, TOPICS_SHOWN);
    const latest = summaries.filter(law => law.fecha_publicacion).sort((a, b) => String(b.fecha_publicacion).localeCompare(String(a.fecha_publicacion))).slice(0, 3);

    host.innerHTML = `<div class="sl-grid">
        <section class="sl-card bu-cristal" aria-labelledby="sl-terms">
            <h2 id="sl-terms">Temas para empezar</h2>
            <div class="sl-chips">${topics.map(topic => `<button type="button" class="sl-chip" data-sl-search="${esc(topic)}">${esc(topic)}</button>`).join('')}</div>
            <button type="button" class="sl-link" data-sl-terms>Ver el mapa de términos →</button>
        </section>
        <section class="sl-card bu-cristal" aria-labelledby="sl-latest">
            <h2 id="sl-latest">Publicado recientemente</h2>
            <ol class="sl-latest">${latest.map(law => {
                const group = getAcervoGroup(law);
                const judgment = isJudgment(law);
                const name = (judgment && judgmentCase(law)?.label) || shortTitle(law.titulo) || law.titulo;
                const lead = judgment ? instrumentTypeLabel(law) : law.siglas || '';
                return `<li><button type="button" data-sl-law="${esc(law.id)}" data-category="${group}" title="${esc(law.titulo)}"><span class="bu-mini is-ch" aria-hidden="true"></span><span class="sl-law-text"><strong>${esc(name)}</strong><small>${esc([lead, day(law.fecha_publicacion)].filter(Boolean).join(' · '))}</small></span></button></li>`;
            }).join('')}</ol>
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
