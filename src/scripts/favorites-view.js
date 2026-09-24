import { getAcervoGroup } from '../lib/acervo-model.js';
import { collectionIcon } from '../lib/collection-icons.js';
import { contextSnippet } from '../lib/search-snippet.js';
import '../styles/search.css';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const bookmark = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-3.5L6 21Z"/></svg>';
const compareIcon = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 4v16M15 4v16M4 8h5M15 16h5"/></svg>';
const FILTERS = [['todos', 'Todos'], ['notas', 'Con nota'], ['favoritos', 'Favoritos']];

/**
 * Saved articles: favourites and articles with a personal note, in one place.
 * Data, favourites, notes and navigation stay in the app and arrive as callbacks.
 */
export function renderFavoritesView(container, {
    items = [], summaries = [], favoriteIds = new Set(), getNote = () => '', filter = 'todos', compareIds = [],
    onOpenArticle = () => {}, onRemoveFavorite = () => {}, onToggleCompare = () => {}, onExport = () => {}, onFilter = () => {}, onBrowse = () => {},
} = {}) {
    const lawById = new Map(summaries.map(law => [String(law.id), law]));
    const withNote = items.filter(item => getNote(item.id));
    const favorites = items.filter(item => favoriteIds.has(item.id));
    const shown = filter === 'notas' ? withNote : filter === 'favoritos' ? favorites : items;
    const counts = { todos: items.length, notas: withNote.length, favoritos: favorites.length };

    const card = (item, index) => {
        const law = lawById.get(String(item.ley_id));
        const group = law ? getAcervoGroup(law) : 'otros';
        const note = getNote(item.id);
        const isFav = favoriteIds.has(item.id);
        const comparing = compareIds.includes(item.id);
        const path = [item.titulo_nombre, item.capitulo_nombre].filter(Boolean).join(' · ');
        return `<li class="sr-item fv-item" data-id="${esc(item.id)}" data-category="${group}" style="--i:${index}">
            <div class="sr-item-top">
                <span class="sr-ico" data-category="${group}">${collectionIcon(group, 15)}</span>
                <span class="sr-sigla">${esc(item.siglas_ley || law?.siglas || '')}</span>
                <span class="sr-law" title="${esc(item.ley_origen || law?.titulo || '')}">${esc(item.ley_origen || law?.titulo || '')}</span>
            </div>
            <h3 class="sr-title"><button type="button" class="sr-open" data-open-article="${esc(item.id)}">${esc(item.articulo_label || 'Fragmento')}</button></h3>
            ${path ? `<p class="sr-path">${esc(path)}</p>` : ''}
            ${note ? `<div class="fv-note"><span>Tu nota</span><p>${esc(note)}</p></div>` : ''}
            <p class="sr-snippet">${contextSnippet(item.texto, '', 240)}</p>
            <div class="sr-actions">
                <button type="button" class="sr-action ${comparing ? 'is-fav' : ''}" data-compare="${esc(item.id)}" aria-pressed="${comparing}" ${!comparing && compareIds.length >= 2 ? 'disabled' : ''}>${compareIcon}<span>${comparing ? 'Comparando' : 'Comparar'}</span></button>
                ${isFav ? `<button type="button" class="sr-action sr-fav is-fav" data-remove="${esc(item.id)}" title="Quitar de favoritos">${bookmark}<span>Quitar</span></button>` : '<span class="fv-only-note">Solo nota</span>'}
            </div>
        </li>`;
    };

    const empty = items.length
        ? `<div class="sr-empty"><h2>Nada en esta vista</h2><p>${filter === 'notas' ? 'Todavía no has escrito notas en tus artículos.' : 'No tienes favoritos en esta lista.'}</p></div>`
        : `<div class="sr-empty"><h2>Aún no guardas nada</h2><p>Usa el botón de guardar en cualquier artículo, o escribe una nota, y aparecerá aquí para que lo encuentres rápido.</p><button type="button" class="sr-clear" data-browse>Ir al acervo</button></div>`;

    container.innerHTML = `<section class="sr-view fv-view" aria-labelledby="fv-heading">
        <header class="sr-head fv-head">
            <div>
                <p class="sr-eyebrow">Tu biblioteca</p>
                <h1 id="fv-heading">Guardados</h1>
                <p class="sr-summary">${items.length ? `${plural(favorites.length, 'favorito', 'favoritos')} · ${plural(withNote.length, 'artículo con nota', 'artículos con nota')}` : 'Tus artículos guardados y tus notas, en un solo lugar.'}</p>
            </div>
            ${items.length ? `<details class="fv-export">
                <summary class="sr-clear">Exportar</summary>
                <div class="fv-export-menu">
                    <button type="button" data-export="html">Documento para imprimir (HTML)</button>
                    <button type="button" data-export="csv">Hoja de cálculo (CSV)</button>
                </div>
            </details>` : ''}
        </header>
        ${items.length ? `<div class="fv-filters" role="group" aria-label="Mostrar">${FILTERS.map(([id, label]) => `<button type="button" class="sr-chip ${filter === id ? 'is-active' : ''}" data-filter="${id}" aria-pressed="${filter === id}">${label} <span>${counts[id]}</span></button>`).join('')}</div>` : ''}
        ${shown.length ? `<ol class="sr-list">${shown.map(card).join('')}</ol>` : empty}
    </section>`;

    const root = container.querySelector('.fv-view');
    root.addEventListener('click', event => {
        const target = event.target.closest('button, .sr-item');
        if (!target || !root.contains(target)) return;
        if (target.dataset.remove) { event.stopPropagation(); return onRemoveFavorite(target.dataset.remove); }
        if (target.dataset.compare) { event.stopPropagation(); return onToggleCompare(target.dataset.compare); }
        if (target.dataset.export) { target.closest('details')?.removeAttribute('open'); return onExport(target.dataset.export, shown); }
        if (target.dataset.filter) return onFilter(target.dataset.filter);
        if (target.hasAttribute('data-browse')) return onBrowse();
        const item = target.closest('.sr-item');
        if (item) onOpenArticle(item.dataset.id, shown);
    });
}
