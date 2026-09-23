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
        expect(container.querySelector('.sr-summary').textContent).toBe('2 coincidencias en 2 instrumentos');
    });

    it('offers collection and instrument facets with real counts and reports filter changes', () => {
        const onFilter = vi.fn();
        const filters = { type: 'all', law: 'all', artNum: '' };
        renderSearchResults(container, { query: 'red', results, total: 7, summaries, filters, onFilter, lawCounts: [{ ley_id: 'lse', count: 5 }, { ley_id: 'rlse', count: 2 }] });
        const groups = [...container.querySelectorAll('[data-facet-group]')].map(button => [button.dataset.facetGroup, button.querySelector('.sr-facet-count').textContent]);
        expect(groups).toEqual([['all', '7'], ['leyes', '5'], ['reglamentos', '2']]);
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
