import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderAcervoView } from '../src/scripts/acervo-view.js';

const summaries = () => [
    { id: 'lse', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'Ley', fecha_publicacion: '2025-03-18', articulos: 120, temas_clave: ['electricidad'] },
    { id: 'lcne', titulo: 'Ley de la Comisión Nacional de Energía', siglas: 'LCNE', tipo: 'Ley', fecha_publicacion: '2024-03-18', articulos: 40, temas_clave: [] },
    { id: 'rlse', titulo: 'Reglamento de la Ley del Sector Eléctrico', siglas: 'RLSE', tipo: 'Reglamento', fecha_publicacion: '2025-10-01', articulos: 60, temas_clave: [] },
    { id: 'cne-1', titulo: 'Acuerdo de la Comisión Nacional de Energía sobre autoconsumo', siglas: 'CNE-1', tipo: 'acuerdo', fecha_publicacion: '2026-07-20', articulos: 8, temas_clave: [] },
    { id: 'cne-2', titulo: 'Acuerdo de la Comisión Nacional de Energía por el que se emiten las DACG de almacenamiento', siglas: 'CNE-2', tipo: 'acuerdo', fecha_publicacion: '2026-05-02', articulos: 12, temas_clave: [] },
    { id: 'sener-1', titulo: 'Acuerdo de la Secretaría de Energía sobre eficiencia', siglas: 'SENER-1', tipo: 'acuerdo', fecha_publicacion: '2024-01-15', articulos: 3, temas_clave: [] },
];
const frame = () => new Promise(resolve => setTimeout(resolve, 5));

describe('Acervo', () => {
    let container, view;
    const rows = () => [...container.querySelectorAll('.ac-group')].map(group => group.dataset.row);
    const cardIds = root => [...(root || container).querySelectorAll('.ac-card')].map(card => card.dataset.lawId);
    const chooseIssuer = value => {
        const select = container.querySelector('.ac-issuer select');
        select.value = value; select.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const chooseType = value => container.querySelector(`.ac-filter[data-group="${value}"]`).click();
    function search(value) {
        const field = container.querySelector('input[type="search"]');
        field.value = value; field.dispatchEvent(new Event('input', { bubbles: true }));
        return field;
    }

    beforeEach(() => {
        document.body.innerHTML = '<div id="acervo"></div>';
        container = document.getElementById('acervo');
        vi.stubGlobal('requestAnimationFrame', callback => setTimeout(callback, 0));
        vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    });
    afterEach(() => { view?.destroy(); vi.unstubAllGlobals(); });

    it('opens with the latest documents and a row per populated type, as book covers', () => {
        view = renderAcervoView(container, summaries());
        expect(rows()).toEqual(['recientes', 'leyes', 'reglamentos', 'acuerdos', 'dacg']);
        expect(cardIds(container.querySelector('[data-row="recientes"]'))[0]).toBe('cne-1');
        expect(container.querySelector('.ac-card .sh-cover')).not.toBeNull();
        expect(container.querySelector('.ac-total').textContent).toBe('6 documentos');
    });
    it('features the newest document and steps through the next ones', () => {
        view = renderAcervoView(container, summaries());
        const open = () => container.querySelector('[data-featured-open]').dataset.featuredOpen;
        expect(open()).toBe('cne-1');
        container.querySelector('[data-featured-next]').click();
        expect(open()).toBe('cne-2');
        expect(container.querySelector('.ac-cartel-pos').textContent).toBe('2 de 5');
        container.querySelector('[data-featured-prev]').click();
        container.querySelector('[data-featured-prev]').click();
        expect(open()).toBe('lcne');
    });
    it('a chosen authority rearranges the rows by type and updates the featured document', () => {
        const onStateChange = vi.fn();
        view = renderAcervoView(container, summaries(), { onStateChange });
        chooseIssuer('sener');
        expect(cardIds()).toEqual(expect.arrayContaining(['sener-1']));
        expect(container.querySelector('[data-featured-open]').dataset.featuredOpen).toBe('sener-1');
        chooseIssuer('cne');
        expect(rows()).toEqual(['acuerdos', 'dacg']);
        expect(container.querySelector('[data-featured-open]').dataset.featuredOpen).toBe('cne-1');
        expect(onStateChange.mock.lastCall[0].issuer).toBe('cne');
    });
    it('a chosen type shows its rows by authority, and «Ver todos» narrows to one', () => {
        view = renderAcervoView(container, summaries());
        chooseType('acuerdos');
        expect(rows()).toEqual(['sener', 'cne']);
        container.querySelector('[data-row="cne"] .ac-see-all').click();
        expect(container.querySelector('.ac-results-grid')).not.toBeNull();
        expect(cardIds()).toEqual(['cne-1']);
        expect(container.querySelector('.ac-result-status').textContent).toBe('1 documento en Acuerdos de CNE.');
    });
    it('offers the types as a menu too, in step with the buttons', () => {
        view = renderAcervoView(container, summaries());
        const select = container.querySelector('.ac-type select');
        expect([...select.options].map(option => option.value)).toEqual(['all', 'leyes', 'reglamentos', 'acuerdos', 'dacg']);
        select.value = 'leyes'; select.dispatchEvent(new Event('change', { bubbles: true }));
        expect(container.querySelector('.ac-filter[data-group="leyes"]').getAttribute('aria-pressed')).toBe('true');
        chooseType('all');
        expect(container.querySelector('.ac-type select').value).toBe('all');
    });
    it('counts follow the other filter and types without documents leave the bar', () => {
        view = renderAcervoView(container, summaries());
        chooseIssuer('cne');
        expect(container.querySelector('.ac-filter[data-group="acuerdos"] .ac-filter-count').textContent).toBe('1');
        expect(container.querySelector('.ac-filter[data-group="leyes"]').hidden).toBe(true);
        expect(container.querySelector('.ac-issuer select').value).toBe('cne');
    });
    it('searches without replacing the field or losing focus, in a grid without the featured document', () => {
        view = renderAcervoView(container, summaries());
        const field = container.querySelector('input[type="search"]');
        field.focus();
        const typed = search('autoconsumo');
        expect(container.querySelector('input[type="search"]')).toBe(typed);
        expect(document.activeElement).toBe(typed);
        expect(cardIds()).toEqual(['cne-1']);
        expect(container.querySelector('.ac-cartel').hidden).toBe(true);
    });
    it('passes the exact original summary and the row positions to navigation', async () => {
        const items = summaries();
        const onOpenLaw = vi.fn();
        view = renderAcervoView(container, items, { onOpenLaw });
        await frame();
        const row = container.querySelector('.ac-row[data-group="leyes"]');
        row.scrollLeft = 50;
        container.querySelector('.ac-row[data-group="leyes"] [data-law-id="lse"]').click();
        expect(onOpenLaw.mock.calls[0][0]).toBe(items[0]);
        expect(onOpenLaw.mock.calls[0][1].rowScroll.leyes).toBe(50);
    });
    it('restores row positions from state, also after a search', async () => {
        view = renderAcervoView(container, summaries(), { state: { rowScroll: { leyes: 25 } } });
        await frame();
        expect(container.querySelector('.ac-row[data-group="leyes"]').scrollLeft).toBe(25);
        search('Ley');
        search('');
        await frame();
        expect(container.querySelector('.ac-row[data-group="leyes"]').scrollLeft).toBe(25);
    });
    it('keeps the arrows in step with the row', async () => {
        view = renderAcervoView(container, summaries());
        const row = container.querySelector('.ac-row[data-group="leyes"]');
        Object.defineProperty(row, 'scrollWidth', { configurable: true, value: 600 });
        Object.defineProperty(row, 'clientWidth', { configurable: true, value: 200 });
        row.scrollBy = ({ left }) => { row.scrollLeft += left; };
        window.dispatchEvent(new Event('resize'));
        await frame();
        const previous = row.parentElement.querySelector('.ac-arrow-prev');
        const next = row.parentElement.querySelector('.ac-arrow-next');
        expect(previous.disabled).toBe(true);
        expect(next.disabled).toBe(false);
        next.click();
        expect(row.scrollLeft).toBeGreaterThan(0);
        expect(previous.disabled).toBe(false);
    });
    it('sorts a grid by the chosen order and keeps it', () => {
        view = renderAcervoView(container, summaries());
        chooseType('acuerdos');
        chooseIssuer('sener');
        search('energía');
        const sort = container.querySelector('select[aria-label="Ordenar documentos"]');
        expect(sort.closest('.ac-sort').hidden).toBe(false);
        search('');
        chooseIssuer('all');
        search('acuerdo');
        expect(cardIds()[0]).toBe('cne-1');
        sort.value = 'date-oldest'; sort.dispatchEvent(new Event('change', { bubbles: true }));
        expect(cardIds()[0]).toBe('sener-1');
    });
    it('explains an empty result and lets the reader start over', () => {
        view = renderAcervoView(container, summaries());
        search('sin coincidencias');
        expect(container.querySelector('.ac-empty')).not.toBeNull();
        container.querySelector('.ac-reset').click();
        expect(container.querySelector('.ac-empty')).toBeNull();
        expect(container.querySelector('input[type="search"]').value).toBe('');
        expect(rows()[0]).toBe('recientes');
    });
    it('«Quitar filtros» clears the search and both filters', () => {
        const onStateChange = vi.fn();
        view = renderAcervoView(container, summaries(), { onStateChange, state: { group: 'acuerdos', issuer: 'cne', query: 'auto' } });
        expect(container.querySelector('input[type="search"]').value).toBe('auto');
        container.querySelector('.ac-reset-filters').click();
        expect(onStateChange.mock.lastCall[0]).toMatchObject({ query: '', group: 'all', issuer: 'all' });
        expect(container.querySelector('.ac-status-row').hidden).toBe(true);
    });
    it('keeps untrusted titles as text and does not invent dates or counts', () => {
        view = renderAcervoView(container, [{ id: 'x', titulo: '<img src=x onerror=alert(1)>', siglas: null, tipo: 'acuerdo' }]);
        expect(container.querySelector('img[src="x"]')).toBeNull();
        expect(container.querySelector('.ac-card').getAttribute('aria-label')).toContain('<img src=x');
        expect(container.querySelector('.ac-cartel').hidden).toBe(true);
    });
    it('ignores values it does not know in the initial state', () => {
        view = renderAcervoView(container, summaries(), { state: { group: 'nada', issuer: 'nadie', sort: 'raro' } });
        expect(view.captureState()).toMatchObject({ group: 'all', issuer: 'all', sort: 'date-newest' });
    });
    it('links to the shelf and to the figures', () => {
        const onShowShelf = vi.fn();
        const onOpenStats = vi.fn();
        view = renderAcervoView(container, summaries(), { onShowShelf, onOpenStats });
        container.querySelector('[data-show-shelf]').click();
        expect(onShowShelf).toHaveBeenCalledOnce();
        [...container.querySelectorAll('.ac-links button')].find(button => button.textContent === 'Estadísticas').click();
        expect(onOpenStats).toHaveBeenCalledOnce();
    });
    it('cleans up when remounted without letting an old destroy clear the new view', () => {
        const first = renderAcervoView(container, summaries());
        view = renderAcervoView(container, summaries());
        first.destroy();
        expect(container.querySelector('.ac-library')).not.toBeNull();
    });
});

describe('Acervo while hidden', () => {
    it('keeps where the reader left a row when the row reports 0 because it is hidden', async () => {
        vi.stubGlobal('requestAnimationFrame', callback => setTimeout(callback, 0));
        vi.stubGlobal('cancelAnimationFrame', clearTimeout);
        document.body.innerHTML = '<div id="acervo"></div>';
        const view = renderAcervoView(document.getElementById('acervo'), summaries(), { state: { rowScroll: { leyes: 80 } } });
        await frame();
        const row = document.querySelector('.ac-row[data-group="leyes"]');
        row.scrollLeft = 0; // what a browser reports under display: none (no layout, no scroll event)
        expect(view.captureState().rowScroll.leyes).toBe(80);
        view.destroy();
        vi.unstubAllGlobals();
    });
});
