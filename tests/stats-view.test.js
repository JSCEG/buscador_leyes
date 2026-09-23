import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeStats } from '../src/lib/stats-model.js';
import { renderStatsView } from '../src/scripts/stats-view.js';

const summaries = () => [
    { id: 'lse', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'Ley', fecha_publicacion: '2025-03-18', articulos: 120, temas_clave: ['Electricidad', 'Texto original'] },
    { id: 'lcne', titulo: 'Ley de la Comisión Nacional de Energía', siglas: 'LCNE', tipo: 'Ley', fecha_publicacion: '2025-03-18', articulos: 48, temas_clave: ['electricidad', 'Regulación'] },
    { id: 'rlse', titulo: 'Reglamento de la Ley del Sector Eléctrico', siglas: 'RLSE', tipo: 'Reglamento', fecha_publicacion: '2025-10-01', articulos: 220, temas_clave: ['Electricidad'] },
    { id: 'conv', titulo: 'Convocatoria para proyectos de autoconsumo', siglas: 'CONV-1', tipo: 'Convocatoria', fecha_publicacion: '2026-02-12', articulos: 8, temas_clave: ['Autoconsumo'] },
    { id: 'sin-fecha', titulo: 'Aviso <sin> fecha', tipo: 'aviso', articulos: 2 },
];
const today = new Date('2026-03-01T00:00:00Z');

describe('computeStats', () => {
    it('aggregates totals, collections, quarters and topics from the acervo model', () => {
        const stats = computeStats(summaries(), { today });
        expect(stats.total).toBe(5);
        expect(stats.totalFragments).toBe(398);
        expect(stats.recent).toBe(4);
        expect(stats.latestDay).toBe('2026-02-12');
        expect(stats.groups.map(group => [group.id, group.count, group.fragments])).toEqual([
            ['leyes', 2, 168], ['reglamentos', 1, 220], ['convocatorias', 1, 8], ['otros', 1, 2],
        ]);
        // Empty quarters in between stay on the axis so gaps are visible.
        expect(stats.quarters.map(quarter => `${quarter.key}:${quarter.total}`)).toEqual(['2025-T1:2', '2025-T2:0', '2025-T3:0', '2025-T4:1', '2026-T1:1']);
        expect(stats.top[0].law.id).toBe('rlse');
        // Case/accents are merged; editorial tags are not subjects.
        expect(stats.topics.map(topic => [topic.label, topic.count])).toEqual([['Electricidad', 3], ['Autoconsumo', 1], ['Regulación', 1]]);
    });

    it('tolerates an empty or malformed catalogue', () => {
        const stats = computeStats([null, 'x']);
        expect(stats.total).toBe(0);
        expect(stats.quarters).toEqual([]);
        expect(stats.latestDay).toBeNull();
    });
});

describe('Statistics dashboard', () => {
    let container, view;
    beforeEach(() => {
        document.body.innerHTML = '<div id="stats"></div>';
        container = document.getElementById('stats');
        vi.stubGlobal('requestAnimationFrame', callback => setTimeout(callback, 0));
    });
    afterEach(() => { view?.destroy(); vi.unstubAllGlobals(); });

    it('renders KPIs, charts and an escaped, sortable table', () => {
        view = renderStatsView(container, summaries(), { today });
        expect([...container.querySelectorAll('.st-kpi-value')].map(node => node.textContent)).toEqual(['5', '398', '4', 'Leyes']);
        expect(container.querySelectorAll('.st-col')).toHaveLength(5);
        expect(container.querySelectorAll('.st-legend-item')).toHaveLength(4);
        expect(container.querySelectorAll('tbody tr')).toHaveLength(5);
        expect(container.querySelector('tbody tr').dataset.lawId).toBe('rlse');
        expect(container.innerHTML).toContain('Aviso &lt;sin&gt; fecha');
        container.querySelector('[data-sort="name"]').click();
        expect(container.querySelector('tbody tr').dataset.lawId).toBe('sin-fecha');
        expect(container.querySelector('[data-sort="name"]').closest('th').getAttribute('aria-sort')).toBe('ascending');
    });

    it('filters the table by text and collection', () => {
        view = renderStatsView(container, summaries(), { today });
        const search = container.querySelector('.st-search');
        search.value = 'electrico';
        search.dispatchEvent(new Event('input'));
        expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
        const filter = container.querySelector('.st-filter');
        filter.value = 'reglamentos';
        filter.dispatchEvent(new Event('change'));
        expect(container.querySelector('.st-table-status').textContent).toBe('1 de 5 instrumentos');
    });

    it('hands navigation back to the app', () => {
        const onOpenLaw = vi.fn();
        const onOpenGroup = vi.fn();
        view = renderStatsView(container, summaries(), { today, onOpenLaw, onOpenGroup });
        container.querySelector('.st-bar-row[data-law-id="lse"]').click();
        container.querySelector('.st-legend-item[data-group="reglamentos"]').click();
        container.querySelector('tbody tr[data-law-id="conv"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(onOpenLaw.mock.calls.map(([law]) => law.id)).toEqual(['lse', 'conv']);
        expect(onOpenGroup).toHaveBeenCalledWith('reglamentos');
    });
});
