import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderFavoritesView } from '../src/scripts/favorites-view.js';

const summaries = [{ id: 'lse', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'ley' }];
const items = [
    { id: 'a1', ley_id: 'lse', ley_origen: 'Ley del Sector Eléctrico', siglas_ley: 'LSE', articulo_label: 'Artículo 1', texto: 'Texto uno' },
    { id: 'a2', ley_id: 'lse', ley_origen: 'Ley del Sector Eléctrico', siglas_ley: 'LSE', articulo_label: 'Artículo 2 <b>', texto: 'Texto dos' },
];
const notes = { a2: '<script>x</script> revisar plazo' };

describe('saved articles view', () => {
    let container;
    beforeEach(() => { document.body.innerHTML = '<div id="f"></div>'; container = document.getElementById('f'); });

    it('shows favourites and noted articles together, with escaped notes', () => {
        renderFavoritesView(container, { items, summaries, favoriteIds: new Set(['a1']), getNote: id => notes[id] || '' });
        expect(container.querySelectorAll('.fv-item')).toHaveLength(2);
        expect(container.querySelector('script')).toBeNull();
        expect(container.querySelector('.fv-note p').textContent).toBe('<script>x</script> revisar plazo');
        expect(container.querySelector('[data-id="a2"] .sr-open').textContent).toBe('Artículo 2 <b>');
        expect(container.querySelector('[data-id="a2"] .fv-only-note')).not.toBeNull();
        expect([...container.querySelectorAll('[data-filter] span')].map(node => node.textContent)).toEqual(['2', '1', '1']);
    });

    it('filters, removes favourites and opens articles within the visible list', () => {
        const onFilter = vi.fn(), onRemoveFavorite = vi.fn(), onOpenArticle = vi.fn();
        renderFavoritesView(container, { items, summaries, favoriteIds: new Set(['a1']), getNote: id => notes[id] || '', filter: 'notas', onFilter, onRemoveFavorite, onOpenArticle });
        expect([...container.querySelectorAll('.fv-item')].map(node => node.dataset.id)).toEqual(['a2']);
        container.querySelector('[data-filter="favoritos"]').click();
        expect(onFilter).toHaveBeenCalledWith('favoritos');
        container.querySelector('.fv-item .sr-snippet').click();
        expect(onOpenArticle).toHaveBeenCalledWith('a2', [items[1]]);
        renderFavoritesView(container, { items, summaries, favoriteIds: new Set(['a1']), getNote: () => '', onRemoveFavorite, onOpenArticle });
        container.querySelector('[data-remove="a1"]').click();
        expect(onRemoveFavorite).toHaveBeenCalledWith('a1');
    });

    it('explains the empty state and links to the library', () => {
        const onBrowse = vi.fn();
        renderFavoritesView(container, { items: [], onBrowse });
        expect(container.textContent).toContain('Aún no guardas nada');
        container.querySelector('[data-browse]').click();
        expect(onBrowse).toHaveBeenCalled();
    });
});
