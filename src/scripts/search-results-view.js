import { ACERVO_GROUPS, getAcervoGroup } from '../lib/acervo-model.js';
import { pinButtonHtml } from './desk-view.js';
import { renderSearchGraph } from './search-graph-view.js';
import { collectionIcon } from '../lib/collection-icons.js';
import { shortTitle } from '../lib/short-title.js';
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
// FilterSheet (phones): the filters open in a bottom sheet; it stays open while the user picks.
let sheetOpen = false;
// The list is the default view. With the map chosen, a click inside it shows the list once without changing that choice.
let listOnce = false;
const readMode = () => {
    if (listOnce) { listOnce = false; return 'lista'; }
    try { return localStorage.getItem(MODE_KEY) === 'mapa' ? 'mapa' : 'lista'; } catch { return 'lista'; }
};
const FOLDER_SHAPE = 'M0 14A8 8 0 0 1 8 6H44C52 6 53 0 60 0H116A8 8 0 0 1 124 8V104A8 8 0 0 1 116 112H8A8 8 0 0 1 0 104Z';
const lawLabel = law => shortTitle(law.titulo) || law.titulo || law.siglas || 'Documento';
const GRAPH_ICON = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><circle cx="4.5" cy="6" r="2"/><circle cx="19.5" cy="6" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="18.5" r="2"/><path d="M9.6 10.3 6.2 7.3M14.4 10.3l3.4-3M10 14.2l-2.6 3.3M14 14.2l2.6 2.8"/></svg>';
const LIST_ICON = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>';

export function renderSearchResults(container, {
    query, results = [], total = 0, ranked = false, lawCounts = [], summaries = [],
    filters = { type: 'all', law: 'all', artNum: '' },
    favoriteState = () => ({ fav: false, title: 'Guardar' }), relationBadge = () => '',
    onOpenArticle = () => {}, onOpenLaw = () => {}, onToggleFavorite = () => {}, onFilter = () => {},
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
    const activeCount = [filters.type !== 'all', filters.law !== 'all', Boolean(filters.artNum)].filter(Boolean).length;
    const facets = `<aside class="sr-facets" id="sr-facets" aria-label="Filtrar resultados">
        <div class="sr-sheet-head"><span class="sr-sheet-grab" aria-hidden="true"></span><h2 class="sr-sheet-title">Filtros</h2><button type="button" class="sr-sheet-x" data-sheet-close aria-label="Cerrar filtros">×</button></div>
        <section><h2>Documento</h2><ul class="sr-law-facets">
            ${shownLaws.map((row, index) => facetButton(`data-facet-law="${esc(row.law.id)}"`, String(filters.law) === String(row.law.id), '', `${esc(lawLabel(row.law))}${row.law.siglas ? `<small class="sr-facet-sigla">${esc(row.law.siglas)}</small>` : ''}`, row.count, row.law.titulo).replace('<li>', index >= 8 ? '<li class="sr-extra">' : '<li>')).join('')}
        </ul>${shownLaws.length > 8 ? `<button type="button" class="sr-more" data-more-laws aria-expanded="false">Ver ${shownLaws.length - 8} más</button>` : ''}</section>
        <section><h2><label for="sr-art-filter">Artículo o apartado</label></h2>
            <input id="sr-art-filter" class="sr-art" type="text" enterkeyhint="search" autocomplete="off" placeholder="Ej. 12, Transitorio" value="${esc(filters.artNum)}" maxlength="40">
        </section>
        ${hasFilters ? '<button type="button" class="sr-clear" data-clear-filters>Quitar filtros</button>' : ''}
        <div class="sr-sheet-foot">${hasFilters ? '<button type="button" class="sr-sheet-clear" data-clear-filters>Limpiar</button>' : ''}<button type="button" class="sr-sheet-done" data-sheet-close>Ver ${plural(total, 'resultado', 'resultados')}</button></div>
    </aside>`;

    const chips = [
        filters.type !== 'all' ? `<button type="button" class="sr-chip" data-facet-group="${esc(filters.type)}">${esc(groupLabel.get(filters.type) || filters.type)} ×</button>` : '',
        activeLaw ? `<button type="button" class="sr-chip" data-facet-law="${esc(activeLaw.id)}">${esc(activeLaw.siglas || activeLaw.titulo)} ×</button>` : '',
        filters.artNum ? `<button type="button" class="sr-chip" data-clear-art>Artículo: ${esc(filters.artNum)} ×</button>` : '',
    ].join('');

    const folders = ACERVO_GROUPS.filter(group => groupCounts.get(group.id)).map(group => {
        const open = filters.type === group.id;
        return `<div class="sr-cf" data-category="${group.id}"${open ? ' data-open' : ''}>
            <div class="bu-cf-fondo"><svg viewBox="0 0 124 112" preserveAspectRatio="none" aria-hidden="true"><path d="${FOLDER_SHAPE}"/></svg></div>
            <span class="sr-cf-hoja" style="--d:2"></span><span class="sr-cf-hoja" style="--d:1"></span><span class="sr-cf-hoja" style="--d:0"></span>
            <button type="button" class="bu-cf-frente" data-facet-group="${group.id}" aria-pressed="${open}"><b>${esc(group.label)}</b><small><span class="sr-facet-count">${number(groupCounts.get(group.id))}</span> ${groupCounts.get(group.id) === 1 ? 'coincidencia' : 'coincidencias'}</small></button>
        </div>`;
    }).join('');

    const itemHtml = (item, index) => {
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
    };
    const groups = [];
    const groupOf = new Map();
    results.forEach((item, index) => {
        const key = String(item.ley_id ?? lawName(item, null) ?? '');
        if (!groupOf.has(key)) { groupOf.set(key, { key, item, rows: [] }); groups.push(groupOf.get(key)); }
        groupOf.get(key).rows.push(itemHtml(item, index));
    });
    const countFor = id => lawCounts.find(row => String(row.ley_id) === String(id))?.count;
    const items = groups.map(({ key, item, rows }) => {
        const law = lawById.get(key);
        const group = law ? getAcervoGroup(law) : 'otros';
        const matches = countFor(key) ?? rows.length;
        const sigla = item.siglas_ley || law?.siglas || '';
        const year = dateLabel(item.fecha_publicacion || law?.fecha_publicacion);
        return `<section class="sr-group bu-cristal" data-category="${group}">
            <header class="sr-group-head">
                ${law ? `<button type="button" class="bu-mini sr-group-book" data-open-law="${esc(law.id)}" aria-label="Abrir ${esc(lawLabel(law))}"><span>${esc(sigla)}</span></button>` : `<span class="bu-mini" aria-hidden="true"><span>${esc(sigla)}</span></span>`}
                <div class="sr-group-text">
                    <span class="sr-group-type">${esc(groupLabel.get(group) || 'Otros')}</span>
                    <h2 class="sr-group-title">${law ? `<button type="button" class="sr-group-open" data-open-law="${esc(law.id)}">${esc(lawLabel(law))}<span aria-hidden="true"> ↗</span></button>` : esc(lawName(item, law) || 'Documento')}</h2>
                    <p class="sr-group-count">${esc([sigla, year, plural(matches, 'coincidencia', 'coincidencias')].filter(Boolean).join(' · '))}</p>
                </div>
                ${!activeLaw && law && matches > rows.length ? `<button type="button" class="sr-group-more" data-facet-law="${esc(law.id)}">Ver todas</button>` : ''}
            </header>
            <ol class="sr-list">${rows.join('')}</ol>
        </section>`;
    }).join('');

    const empty = `<div class="sr-empty">${emptyArt('search')}<h2>${hasFilters ? 'Sin resultados con estos filtros' : `Sin resultados para «${esc(query)}»`}</h2>
        <p>${hasFilters ? 'Quita algún filtro o busca en todas las colecciones.' : 'Prueba con otra palabra, un sinónimo o solo la raíz del término.'}</p>
        ${hasFilters ? '<button type="button" class="sr-clear" data-clear-filters>Quitar filtros</button>' : ''}</div>`;

    // A filter change on the same search keeps the folders' nodes, so opening them animates; only the list fades.
    const previous = container.__srQuery === query ? container.querySelector('.sr-folders') : null;
    container.__srQuery = query;
    // Re-rendering after the article filter fires must not steal the user's cursor.
    const artFocus = document.activeElement?.id === 'sr-art-filter' ? document.activeElement.selectionStart : null;
    container.innerHTML = `<section class="sr-view" aria-labelledby="sr-heading">
        <header class="sr-head">
            <p class="sr-eyebrow">Resultados de búsqueda</p>
            <h1 id="sr-heading">«${esc(query)}»</h1>
            <p class="sr-summary" role="status">${total ? `${plural(total, 'coincidencia', 'coincidencias')}${summaryLaws ? ` en ${plural(summaryLaws, 'documento', 'documentos')}` : ''}${ranked ? ' · ordenadas por relevancia' : ''}` : 'Sin coincidencias'}</p>
            ${total ? `<div class="sr-view-switch" role="group" aria-label="Cómo ver los resultados"><button type="button" data-view-mode="lista" aria-pressed="${mode === 'lista'}">${LIST_ICON}Lista</button><button type="button" data-view-mode="mapa" aria-pressed="${mode === 'mapa'}">${GRAPH_ICON}Mapa de relaciones</button></div>` : ''}
        </header>
        ${folders ? `<div class="sr-folders" role="group" aria-label="Filtrar por tipo">${folders}</div>` : ''}
        <div class="sr-layout">${facets}<div class="sr-main"><button type="button" class="sr-filter-btn" data-sheet-open aria-controls="sr-facets" aria-expanded="${sheetOpen}"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></svg>Filtros${activeCount ? ` <span class="bux-count">${activeCount}</span>` : ''}</button><section class="sr-graph" aria-label="Mapa de relaciones" ${mode === 'mapa' && total ? '' : 'hidden'}></section>${chips ? `<div class="sr-chips" aria-label="Filtros activos">${chips}</div>` : ''}${results.length ? `<div class="sr-groups">${items}</div>` : empty}</div></div>
        <div class="sr-sheet-scrim" data-sheet-close aria-hidden="true"></div>
    </section>`;

    const root = container.querySelector('.sr-view');
    const freshFolders = root.querySelector('.sr-folders');
    if (previous && freshFolders) {
        freshFolders.replaceWith(previous);
        previous.querySelectorAll('.sr-cf').forEach(folder => {
            const open = folder.dataset.category === filters.type;
            folder.toggleAttribute('data-open', open);
            folder.querySelector('[aria-pressed]').setAttribute('aria-pressed', String(open));
        });
        if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) root.querySelector('.sr-main')?.animate?.([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    root.classList.toggle('is-sheet-open', sheetOpen);
    if (artFocus !== null) { const input = root.querySelector('#sr-art-filter'); input.focus(); input.setSelectionRange(artFocus, artFocus); }
    root.addEventListener('click', event => {
        const sheetToggle = event.target.closest('[data-sheet-open], [data-sheet-close]');
        if (sheetToggle && root.contains(sheetToggle)) {
            sheetOpen = sheetToggle.hasAttribute('data-sheet-open');
            root.classList.toggle('is-sheet-open', sheetOpen);
            root.querySelector('.sr-filter-btn')?.setAttribute('aria-expanded', String(sheetOpen));
            return;
        }
        const target = event.target.closest('button, a, .sr-item');
        if (!target || !root.contains(target)) return;
        if (target.matches('a')) return; // external source link
        if (target.dataset.viewMode) {
            try { localStorage.setItem(MODE_KEY, target.dataset.viewMode); } catch { /* ignore */ }
            root.querySelectorAll('[data-view-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === target)));
            showGraph(target.dataset.viewMode === 'mapa');
            return;
        }
        if (target.dataset.openLaw) return onOpenLaw(target.dataset.openLaw);
        if (target.dataset.favorite) { event.stopPropagation(); onToggleFavorite(target.dataset.favorite); return; }
        if (target.dataset.facetGroup) return onFilter({ ...filters, type: filters.type === target.dataset.facetGroup ? 'all' : target.dataset.facetGroup, law: 'all' });
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
