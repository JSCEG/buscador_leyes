import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderSearchResults } from '../src/scripts/search-results-view.js';

const summaries = [
    { id: 'lse', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'ley', fecha_publicacion: '2025-03-18', url_original: 'https://dof.gob.mx/lse' },
    { id: 'rlse', titulo: 'Reglamento de la Ley del Sector Eléctrico', siglas: 'RLSE', tipo: 'reglamento' },
];
const results = [
    { id: 'a1', ley_id: 'lse', ley_origen: 'Ley del Sector Eléctrico', siglas_ley: 'LSE', articulo_label: 'Artículo 124', titulo_nombre: 'TÍTULO SÉPTIMO', texto: 'El CENACE determina la interconexión de nuevas Centrales Eléctricas.' },
    { id: 'a2', ley_id: 'rlse', ley_origen: 'Reglamento de la Ley del Sector Eléctrico', siglas_ley: 'RLSE', articulo_label: 'Artículo 3', texto: 'Texto', fragmento: 'solicitudes de [[[interconexión]]] <td>' },
];

describe('search results view', () => {
    let container;
    beforeEach(() => { document.body.innerHTML = '<div id="r"></div>'; container = document.getElementById('r'); });

    it('escapes the query and marks matches in excerpts and server fragments', () => {
        renderSearchResults(container, { query: '<img src=x onerror=alert(1)> interconexión', results, total: 2, summaries, lawCounts: [{ ley_id: 'lse', count: 5 }, { ley_id: 'rlse', count: 2 }] });
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('h1').textContent).toContain('<img src=x');
        const snippets = [...container.querySelectorAll('.sr-snippet')];
        expect(snippets[0].querySelector('mark').textContent).toBe('interconexión');
        expect(snippets[1].innerHTML).toBe('solicitudes de <mark>interconexión</mark>');
        expect(container.querySelector('.sr-summary').textContent).toBe('2 coincidencias en 2 documentos');
    });

    it('offers collection and instrument facets with real counts and reports filter changes', () => {
        const onFilter = vi.fn();
        const filters = { type: 'all', law: 'all', artNum: '' };
        renderSearchResults(container, { query: 'red', results, total: 7, summaries, filters, onFilter, lawCounts: [{ ley_id: 'lse', count: 5 }, { ley_id: 'rlse', count: 2 }] });
        const groups = [...container.querySelectorAll('[data-facet-group]')].map(button => [button.dataset.facetGroup, button.querySelector('.sr-facet-count').textContent]);
        expect(groups).toEqual([['leyes', '5'], ['reglamentos', '2']]);
        container.querySelector('[data-facet-group="leyes"]').click();
        expect(onFilter).toHaveBeenLastCalledWith({ type: 'leyes', law: 'all', artNum: '' });
        container.querySelector('[data-facet-law="rlse"]').click();
        expect(onFilter).toHaveBeenLastCalledWith({ type: 'all', law: 'rlse', artNum: '' });
    });

    it('opens articles and toggles favourites without opening the article', () => {
        const onOpenArticle = vi.fn(), onToggleFavorite = vi.fn();
        renderSearchResults(container, { query: 'red', results, total: 2, summaries, onOpenArticle, onToggleFavorite });
        container.querySelector('[data-favorite="a1"]').click();
        expect(onToggleFavorite).toHaveBeenCalledWith('a1');
        expect(onOpenArticle).not.toHaveBeenCalled();
        container.querySelector('.sr-item[data-id="a2"] .sr-snippet').click();
        expect(onOpenArticle).toHaveBeenCalledWith('a2');
        expect(container.querySelector('.sr-item[data-id="a1"] a').getAttribute('href')).toBe('https://dof.gob.mx/lse');
    });
});

describe('search summary under filters', () => {
    it('counts only the instruments inside the active collection', () => {
        document.body.innerHTML = '<div id="r"></div>';
        const container = document.getElementById('r');
        renderSearchResults(container, { query: 'red', results, total: 5, summaries, filters: { type: 'leyes', law: 'all', artNum: '' }, lawCounts: [{ ley_id: 'lse', count: 5 }, { ley_id: 'rlse', count: 2 }] });
        expect(container.querySelector('.sr-summary').textContent).toBe('5 coincidencias en 1 documento');
    });
});

describe('search results, Búho', () => {
    let container;
    const active = () => container.querySelector('[data-view-mode][aria-pressed="true"]').dataset.viewMode;
    const render = (extra = {}) => renderSearchResults(container, { query: 'red', results, total: 2, summaries, lawCounts: [{ ley_id: 'lse', count: 1 }, { ley_id: 'rlse', count: 1 }], ...extra });
    beforeEach(() => { localStorage.clear(); document.body.innerHTML = '<div id="r"></div>'; container = document.getElementById('r'); });

    it('opens in the list by default', () => { render(); expect(active()).toBe('lista'); });
    it('respects a saved map preference', () => { localStorage.setItem('buscador-vista', 'mapa'); render(); expect(active()).toBe('mapa'); });
    it('names documents with a short title and secondary acronym', () => {
        render();
        const facet = container.querySelector('[data-facet-law="lse"]');
        expect(facet.querySelector('.sr-facet-sigla').textContent).toBe('LSE');
        expect(facet.querySelector('.sr-facet-label').textContent).toContain('Ley del Sector Eléctrico');
    });
    it('offers a folder per type with its matches', () => {
        render();
        const front = container.querySelector('.sr-folders [data-facet-group="leyes"]');
        expect(front.textContent).toContain('1 coincidencia');
        expect(front.getAttribute('aria-pressed')).toBe('false');
    });
    it('a filter change keeps the folders in place', () => {
        render();
        const node = container.querySelector('.sr-cf');
        render({ filters: { type: 'leyes', law: 'all', artNum: '' } });
        expect(container.querySelector('.sr-cf')).toBe(node);
        expect(node.hasAttribute('data-open')).toBe(true);
    });
    it('a second press on the open folder clears the type', () => {
        const onFilter = vi.fn();
        render({ onFilter, filters: { type: 'leyes', law: 'all', artNum: '' } });
        container.querySelector('.sr-folders [data-facet-group="leyes"]').click();
        expect(onFilter).toHaveBeenLastCalledWith({ type: 'all', law: 'all', artNum: '' });
    });
});


describe('opening the instrument from its results', () => {
    it('opens it from the little book and from the title, and does not open an article', () => {
        document.body.innerHTML = '<div id="r"></div>';
        const container = document.getElementById('r');
        const onOpenLaw = vi.fn(), onOpenArticle = vi.fn();
        renderSearchResults(container, { query: 'red', results, total: 2, summaries, onOpenLaw, onOpenArticle, lawCounts: [{ ley_id: 'lse', count: 1 }, { ley_id: 'rlse', count: 1 }] });
        const group = container.querySelector('.sr-group');
        group.querySelector('.sr-group-title [data-open-law]').click();
        group.querySelector('button.bu-mini').click();
        expect(onOpenLaw.mock.calls).toEqual([['lse'], ['lse']]);
        expect(onOpenArticle).not.toHaveBeenCalled();
        expect(group.querySelector('button.bu-mini').getAttribute('aria-label')).toContain('Abrir');
    });
});
