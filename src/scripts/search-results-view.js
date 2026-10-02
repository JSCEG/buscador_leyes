import { ACERVO_GROUPS, getAcervoGroup } from '../lib/acervo-model.js';
import { pinButtonHtml } from './desk-view.js';
import { renderSearchGraph } from './search-graph-view.js';
import { collectionIcon } from '../lib/collection-icons.js';
import { contextSnippet, highlightTerms, markedFragment } from '../lib/search-snippet.js';
import '../styles/search.css';
import { emptyArt } from '../lib/empty-art.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const number = value => new Intl.NumberFormat('es-MX').format(value);
const plural = (count, one, many) => `${number(count)} ${count === 1 ? one : many}`;
const dateLabel = value => { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date) : ''; };
import { officialUrl as safeUrl } from '../lib/official-url.js';
const lawName = (item, law) => (item.ley_origen && item.ley_origen !== 'Desconocida' ? item.ley_origen : law?.titulo) || '';
const groupLabel = new Map(ACERVO_GROUPS.map(group => [group.id, group.label]));
const bookmark = filled => `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-3.5L6 21Z"/></svg>`;
const external = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

/**
 * Search results with collection/instrument facets. Pure rendering: data fetching,
 * favourites and navigation stay in the app and arrive as options/callbacks.
 */
const MODE_KEY = 'buscador-vista';
// The map is the default view; a click inside it shows the list once without changing that choice.
let listOnce = false;
const readMode = () => {
    if (listOnce) { listOnce = false; return 'lista'; }
    try { return localStorage.getItem(MODE_KEY) === 'lista' ? 'lista' : 'mapa'; } catch { return 'mapa'; }
};
const GRAPH_ICON = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><circle cx="4.5" cy="6" r="2"/><circle cx="19.5" cy="6" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="18.5" r="2"/><path d="M9.6 10.3 6.2 7.3M14.4 10.3l3.4-3M10 14.2l-2.6 3.3M14 14.2l2.6 2.8"/></svg>';
const LIST_ICON = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>';

export function renderSearchResults(container, {
    query, results = [], total = 0, ranked = false, lawCounts = [], summaries = [],
    filters = { type: 'all', law: 'all', artNum: '' },
    favoriteState = () => ({ fav: false, title: 'Guardar' }), relationBadge = () => '',
    onOpenArticle = () => {}, onToggleFavorite = () => {}, onFilter = () => {},
} = {}) {
    const mode = readMode();
    container.__srGraphDestroy?.();
    const lawById = new Map(summaries.map(law => [String(law.id), law]));
    const facetLaws = lawCounts.map(row => ({ law: lawById.get(String(row.ley_id)), count: row.count })).filter(row => row.law);
    const groupCounts = new Map();
    for (const { law, count } of facetLaws) { const id = getAcervoGroup(law); groupCounts.set(id, (groupCounts.get(id) || 0) + count); }
    const allMatches = facetLaws.reduce((sum, row) => sum + row.count, 0);
    const shownLaws = facetLaws.filter(row => filters.type === 'all' || getAcervoGroup(row.law) === filters.type);
    const activeLaw = filters.law !== 'all' ? lawById.get(String(filters.law)) : null;
    const hasFilters = filters.type !== 'all' || filters.law !== 'all' || filters.artNum;
    // The summary describes what is on screen; facet counts keep describing the whole query.
    const summaryLaws = activeLaw ? 1 : shownLaws.length;

    const facetButton = (attrs, active, icon, label, count, title = '') => `<li><button type="button" class="sr-facet ${active ? 'is-active' : ''}" ${attrs} aria-pressed="${active}" ${title ? `title="${esc(title)}"` : ''}>${icon}<span class="sr-facet-label">${label}</span><span class="sr-facet-count">${number(count)}</span></button></li>`;
    const facets = `<aside class="sr-facets" aria-label="Filtrar resultados">
        <section><h2>Colección</h2><ul class="sr-group-facets">
            ${facetButton('data-facet-group="all"', filters.type === 'all', `<span class="sr-ico" data-category="all">${collectionIcon('all', 15)}</span>`, 'Todas', allMatches)}
            ${ACERVO_GROUPS.filter(group => groupCounts.get(group.id)).map(group => facetButton(`data-facet-group="${group.id}"`, filters.type === group.id, `<span class="sr-ico" data-category="${group.id}">${collectionIcon(group.id, 15)}</span>`, esc(group.label), groupCounts.get(group.id))).join('')}
        </ul></section>
        <section><h2>Instrumento</h2><ul class="sr-law-facets">
            ${shownLaws.map((row, index) => facetButton(`data-facet-law="${esc(row.law.id)}"`, String(filters.law) === String(row.law.id), '', esc(row.law.siglas || row.law.titulo), row.count, row.law.titulo).replace('<li>', index >= 8 ? '<li class="sr-extra">' : '<li>')).join('')}
        </ul>${shownLaws.length > 8 ? `<button type="button" class="sr-more" data-more-laws aria-expanded="false">Ver ${shownLaws.length - 8} más</button>` : ''}</section>
        <section><h2><label for="sr-art-filter">Artículo o apartado</label></h2>
            <input id="sr-art-filter" class="sr-art" type="text" enterkeyhint="search" autocomplete="off" placeholder="Ej. 12, Transitorio" value="${esc(filters.artNum)}" maxlength="40">
        </section>
        ${hasFilters ? '<button type="button" class="sr-clear" data-clear-filters>Quitar filtros</button>' : ''}
    </aside>`;

    const chips = [
        filters.type !== 'all' ? `<button type="button" class="sr-chip" data-facet-group="all">${esc(groupLabel.get(filters.type) || filters.type)} ×</button>` : '',
        activeLaw ? `<button type="button" class="sr-chip" data-facet-law="${esc(activeLaw.id)}">${esc(activeLaw.siglas || activeLaw.titulo)} ×</button>` : '',
        filters.artNum ? `<button type="button" class="sr-chip" data-clear-art>Artículo: ${esc(filters.artNum)} ×</button>` : '',
    ].join('');

    const items = results.map((item, index) => {
        const law = lawById.get(String(item.ley_id));
        const group = law ? getAcervoGroup(law) : 'otros';
        const { fav, title } = favoriteState(item.id);
        const path = [item.titulo_nombre, item.capitulo_nombre].filter(Boolean).join(' · ');
        const excerpt = item.fragmento ? markedFragment(item.fragmento) : contextSnippet(item.texto, query);
        const dof = safeUrl(item.url_original || law?.url_original);
        return `<li class="sr-item" data-id="${esc(item.id)}" data-category="${group}" style="--i:${index}">
            <div class="sr-item-top">
                <span class="sr-ico" data-category="${group}">${collectionIcon(group, 15)}</span>
                <span class="sr-sigla">${esc(item.siglas_ley || law?.siglas || '')}</span>
                <span class="sr-law" title="${esc(lawName(item, law) || '')}">${esc(lawName(item, law) || '')}</span>
                ${dateLabel(item.fecha_publicacion || law?.fecha_publicacion) ? `<span class="sr-date">${dateLabel(item.fecha_publicacion || law?.fecha_publicacion)}</span>` : ''}
            </div>
            <h3 class="sr-title"><button type="button" class="sr-open" data-open-article="${esc(item.id)}">${highlightTerms(item.articulo_label || 'Disposición', query)}</button></h3>
            ${path ? `<p class="sr-path">${esc(path)}</p>` : ''}
            <p class="sr-snippet">${excerpt}</p>
            <div class="sr-actions">
                ${relationBadge(item.ley_id)}
                ${dof ? `<a class="sr-action" href="${esc(dof)}" target="_blank" rel="noopener noreferrer">Fuente oficial ${external}</a>` : ''}
                ${pinButtonHtml(item.id)}
                <button type="button" class="sr-action sr-fav ${fav ? 'is-fav' : ''}" data-favorite="${esc(item.id)}" title="${esc(title)}" aria-pressed="${fav}">${bookmark(fav)}<span>${fav ? 'Guardado' : 'Guardar'}</span></button>
            </div>
        </li>`;
    }).join('');

    const empty = `<div class="sr-empty">${emptyArt('search')}<h2>${hasFilters ? 'Sin resultados con estos filtros' : `Sin resultados para «${esc(query)}»`}</h2>
        <p>${hasFilters ? 'Quita algún filtro o busca en todas las colecciones.' : 'Prueba con otra palabra, un sinónimo o solo la raíz del término.'}</p>
        ${hasFilters ? '<button type="button" class="sr-clear" data-clear-filters>Quitar filtros</button>' : ''}</div>`;

    // Re-rendering after the article filter fires must not steal the user's cursor.
    const artFocus = document.activeElement?.id === 'sr-art-filter' ? document.activeElement.selectionStart : null;
    container.innerHTML = `<section class="sr-view" aria-labelledby="sr-heading">
        <header class="sr-head">
            <p class="sr-eyebrow">Resultados de búsqueda</p>
            <h1 id="sr-heading">«${esc(query)}»</h1>
            <p class="sr-summary" role="status">${total ? `${plural(total, 'coincidencia', 'coincidencias')}${summaryLaws ? ` en ${plural(summaryLaws, 'instrumento', 'instrumentos')}` : ''}${ranked ? ' · ordenadas por relevancia' : ''}` : 'Sin coincidencias'}</p>
            ${total ? `<div class="sr-view-switch" role="group" aria-label="Cómo ver los resultados"><button type="button" data-view-mode="lista" aria-pressed="${mode === 'lista'}">${LIST_ICON}Lista</button><button type="button" data-view-mode="mapa" aria-pressed="${mode === 'mapa'}">${GRAPH_ICON}Mapa de relaciones</button></div>` : ''}
        </header>
        <div class="sr-layout">${facets}<div class="sr-main"><section class="sr-graph" aria-label="Mapa de relaciones" ${mode === 'mapa' && total ? '' : 'hidden'}></section>${chips ? `<div class="sr-chips" aria-label="Filtros activos">${chips}</div>` : ''}${results.length ? `<ol class="sr-list">${items}</ol>` : empty}</div></div>
    </section>`;

    const root = container.querySelector('.sr-view');
    if (artFocus !== null) { const input = root.querySelector('#sr-art-filter'); input.focus(); input.setSelectionRange(artFocus, artFocus); }
    root.addEventListener('click', event => {
        const target = event.target.closest('button, a, .sr-item');
        if (!target || !root.contains(target)) return;
        if (target.matches('a')) return; // external source link
        if (target.dataset.viewMode) {
            try { localStorage.setItem(MODE_KEY, target.dataset.viewMode); } catch { /* ignore */ }
            root.querySelectorAll('[data-view-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === target)));
            showGraph(target.dataset.viewMode === 'mapa');
            return;
        }
        if (target.dataset.favorite) { event.stopPropagation(); onToggleFavorite(target.dataset.favorite); return; }
        if (target.dataset.facetGroup) return onFilter({ ...filters, type: target.dataset.facetGroup, law: 'all' });
        if (target.dataset.facetLaw) return onFilter({ ...filters, law: String(filters.law) === target.dataset.facetLaw ? 'all' : target.dataset.facetLaw });
        if (target.hasAttribute('data-clear-art')) return onFilter({ ...filters, artNum: '' });
        if (target.hasAttribute('data-clear-filters')) return onFilter({ type: 'all', law: 'all', artNum: '' });
        if (target.hasAttribute('data-more-laws')) {
            const open = target.getAttribute('aria-expanded') !== 'true';
            root.querySelector('.sr-law-facets').classList.toggle('is-open', open);
            target.setAttribute('aria-expanded', String(open));
            target.textContent = open ? 'Ver menos' : `Ver ${shownLaws.length - 8} más`;
            return;
        }
        if (target.closest('.rel-open-law')) return; // handled by the app's delegated listener
        const item = target.closest('.sr-item');
        if (item) onOpenArticle(item.dataset.id);
    });
    function showGraph(show) {
        const host = root.querySelector('.sr-graph');
        if (!host) return;
        host.hidden = !show;
        container.__srGraphDestroy?.();
        container.__srGraphDestroy = null;
        if (show) container.__srGraphDestroy = renderSearchGraph(host, {
            query, lawCounts, summaries, activeLaw: filters.law,
            onSelectLaw: lawId => { listOnce = true; onFilter({ ...filters, law: String(lawId) }); },
            onSelectGroup: group => { listOnce = true; onFilter({ ...filters, type: group, law: 'all' }); },
        });
    }
    if (mode === 'mapa' && total) showGraph(true);

    let timer;
    root.querySelector('#sr-art-filter')?.addEventListener('input', event => {
        clearTimeout(timer);
        timer = setTimeout(() => onFilter({ ...filters, artNum: event.target.value.trim() }), 400);
    });
}
