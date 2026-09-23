import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderAcervoView } from '../src/scripts/acervo-view.js';

const summaries = () => [
    { id: 'lse', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'Ley', fecha_publicacion: '2025-03-18', articulos: 120, temas_clave: ['electricidad'] },
    { id: 'lcne', titulo: 'Ley de la Comisión Nacional de Energía', siglas: 'LCNE', tipo: 'Ley', fecha_publicacion: '2025-03-18', articulos: 48, temas_clave: ['regulación', 'energía'] },
    { id: 'rlse', titulo: 'Reglamento de la Ley del Sector Eléctrico', siglas: 'RLSE', tipo: 'Reglamento', fecha_publicacion: '2025-10-01', articulos: 220, temas_clave: ['electricidad'] },
    { id: 'saee', titulo: 'Acuerdo por el que se emiten las Disposiciones administrativas de carácter general en materia de almacenamiento', siglas: 'SAEE', tipo: 'Acuerdo', fecha_publicacion: '2025-03-07', articulos: 50, temas_clave: ['almacenamiento'] },
    { id: 'conv', titulo: 'Convocatoria para proyectos de autoconsumo', siglas: 'CONV-1', tipo: 'Convocatoria', fecha_publicacion: '2026-02-12', articulos: 8, temas_clave: ['autoconsumo'] },
];
const frame = () => new Promise(resolve => setTimeout(resolve, 5));

describe('Acervo library view', () => {
    let container, view;
    beforeEach(() => {
        document.body.innerHTML = '<div id="acervo"></div>';
        container = document.getElementById('acervo');
        vi.stubGlobal('requestAnimationFrame', callback => setTimeout(callback, 0));
        vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    });
    afterEach(() => { view?.destroy(); vi.unstubAllGlobals(); });

    function search(value) {
        const field = container.querySelector('input[type="search"]');
        field.value = value; field.dispatchEvent(new Event('input', { bubbles: true }));
        return field;
    }

    it('shows only populated collections with compact native cards and original category metadata', () => {
        view = renderAcervoView(container, summaries());
        expect([...container.querySelectorAll('.ac-group h2')].map(heading => heading.textContent)).toEqual(['Leyes2', 'Reglamentos1', 'DACG1', 'Convocatorias1']);
        expect(container.querySelectorAll('.ac-card')).toHaveLength(5);
        const dacgCard = container.querySelector('[data-law-id="saee"]');
        expect(dacgCard.querySelector('.ac-card-category').textContent).toBe('Acuerdo');
        expect(dacgCard.getAttribute('aria-label')).toContain(summaries()[3].titulo);
        expect(dacgCard.title).toBe(summaries()[3].titulo);
        expect(container.querySelector('.ac-total').textContent).toBe('5 instrumentos');
        expect(container.textContent).not.toMatch(/vigente/i);
        expect(container.querySelector('img')).toBeNull();
    });

    it('filters without replacing the search field, losing focus or moving its text selection', () => {
        const changed = vi.fn();
        view = renderAcervoView(container, summaries(), { onStateChange: changed });
        const input = container.querySelector('input[type="search"]'); input.focus();
        search('regulacion');
        expect(container.querySelector('input[type="search"]')).toBe(input);
        expect(document.activeElement).toBe(input);
        expect(container.querySelectorAll('.ac-results-grid .ac-card')).toHaveLength(1);
        expect(container.querySelector('.ac-card').dataset.lawId).toBe('lcne');
        expect(container.querySelector('.ac-result-status').textContent).toMatch(/1 instrumento/);
        expect(container.querySelector('[data-group="leyes"] .ac-filter-count').textContent).toBe('1');
        expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'regulacion' }));
    });

    it('opens a full group through Ver todos and retains group filtering during search', () => {
        view = renderAcervoView(container, summaries());
        container.querySelector('[aria-label="Ver todos: Leyes"]').click();
        expect(view.captureState().group).toBe('leyes');
        expect(container.querySelectorAll('.ac-results-grid .ac-card')).toHaveLength(2);
        search('electricidad');
        expect(container.querySelectorAll('.ac-card')).toHaveLength(1);
        expect(container.querySelector('.ac-card').dataset.lawId).toBe('lse');
        expect(container.querySelector('[data-group="leyes"]').getAttribute('aria-pressed')).toBe('true');
    });

    it('captures row position before opening and passes the exact original summary to navigation', async () => {
        const laws = summaries(); const onOpenLaw = vi.fn(); const onStateChange = vi.fn();
        view = renderAcervoView(container, laws, { onOpenLaw, onStateChange });
        await frame();
        container.querySelector('.ac-row[data-group="leyes"]').scrollLeft = 272;
        container.querySelector('[data-law-id="lse"]').click();
        expect(onOpenLaw).toHaveBeenCalledWith(laws[0], expect.objectContaining({ rowScroll: { leyes: 272, reglamentos: 0, dacg: 0, convocatorias: 0 } }));
        expect(onOpenLaw.mock.calls[0][0]).toBe(laws[0]);
        expect(onStateChange).toHaveBeenLastCalledWith(onOpenLaw.mock.calls[0][1]);
    });

    it('restores row offsets from state, including after entering and clearing a query', async () => {
        view = renderAcervoView(container, summaries(), { state: { rowScroll: { leyes: 190 } } });
        expect(view.captureState().rowScroll.leyes).toBe(190);
        await frame();
        expect(container.querySelector('.ac-row[data-group="leyes"]').scrollLeft).toBe(190);
        search('LCNE'); search('');
        expect(view.captureState().rowScroll.leyes).toBe(190);
        await frame();
        expect(container.querySelector('.ac-row[data-group="leyes"]').scrollLeft).toBe(190);
        const captured = view.captureState(); captured.rowScroll.leyes = 0;
        expect(view.captureState().rowScroll.leyes).toBe(190);
    });

    it('sorts filtered cards using publication date and preserves selected sort on rerender', () => {
        view = renderAcervoView(container, summaries(), { state: { query: 'electricidad', sort: 'date-newest' } });
        expect([...container.querySelectorAll('.ac-card')].map(card => card.dataset.lawId)).toEqual(['rlse', 'lse']);
        const sort = container.querySelector('select'); sort.value = 'date-oldest'; sort.dispatchEvent(new Event('change'));
        expect([...container.querySelectorAll('.ac-card')].map(card => card.dataset.lawId)).toEqual(['lse', 'rlse']);
        expect(view.captureState().sort).toBe('date-oldest');
        expect(container.querySelector('select')).toBe(sort);
    });

    it('updates available carousel arrows and supports clicking them without hover', async () => {
        view = renderAcervoView(container, summaries()); await frame();
        const row = container.querySelector('.ac-row[data-group="leyes"]');
        Object.defineProperty(row, 'scrollWidth', { configurable: true, value: 900 });
        Object.defineProperty(row, 'clientWidth', { configurable: true, value: 300 });
        row.scrollBy = vi.fn(({ left }) => { row.scrollLeft += left; });
        window.dispatchEvent(new Event('resize')); await frame();
        const previous = container.querySelector('[aria-label="Anteriores en Leyes"]');
        const next = container.querySelector('[aria-label="Siguientes en Leyes"]');
        expect(previous.disabled).toBe(true); expect(next.disabled).toBe(false);
        next.click(); expect(row.scrollBy).toHaveBeenCalled(); expect(previous.disabled).toBe(false);
        row.scrollLeft = 600; row.dispatchEvent(new Event('scroll'));
        expect(next.disabled).toBe(true);
    });

    it('renders an empty result and lets the user reset query/group', () => {
        view = renderAcervoView(container, summaries(), { state: { group: 'leyes', query: 'sin-coincidencias' } });
        expect(container.querySelector('.ac-empty h2').textContent).toBe('No encontramos instrumentos');
        container.querySelector('.ac-reset').click();
        expect(view.captureState()).toMatchObject({ query: '', group: 'all' });
        expect(container.querySelectorAll('.ac-card')).toHaveLength(5);
        expect(document.activeElement).toBe(container.querySelector('input'));
    });

    it('keeps untrusted titles as text and does not invent dates or fragment counts', () => {
        const unsafe = { id: 'unsafe', titulo: '<img src=x onerror=alert(1)>', tipo: 'Acuerdo', fecha_publicacion: '2026-02-31', articulos: undefined };
        view = renderAcervoView(container, [unsafe]);
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('.ac-card-title').textContent).toBe(unsafe.titulo);
        expect(container.textContent).toContain('Fecha no disponible');
        expect(container.textContent).toContain('Sin conteo');
    });

    it('summarises the library, lists the latest publications and hides the panel while filtering', () => {
        const onOpenLaw = vi.fn(), onOpenStats = vi.fn();
        view = renderAcervoView(container, summaries(), { onOpenLaw, onOpenStats });
        const overview = container.querySelector('.ac-overview');
        expect([...overview.querySelectorAll('.ac-stat strong')].map(node => node.textContent)).toEqual(['5', '446', '4']);
        expect([...overview.querySelectorAll('[data-latest-id]')].map(node => node.dataset.latestId)).toEqual(['conv', 'rlse', 'lcne', 'lse', 'saee']);
        overview.querySelector('[data-latest-id="conv"]').click();
        expect(onOpenLaw.mock.calls[0][0].id).toBe('conv');
        overview.querySelector('.ac-stats-link').click();
        expect(onOpenStats).toHaveBeenCalled();
        search('ley');
        expect(overview.hidden).toBe(true);
    });

    it('cleans up when remounted without letting an old destroy clear the new view', async () => {
        const old = renderAcervoView(container, summaries());
        view = renderAcervoView(container, [summaries()[0]]);
        old.destroy(); await frame();
        expect(container.querySelectorAll('.ac-card')).toHaveLength(1);
        view.destroy(); expect(container.childElementCount).toBe(0);
    });
});
