import { describe, it, expect } from 'vitest';
import { computeStats } from '../src/lib/stats-model.js';

const law = (id, day, tipo = 'ley') => ({ id, siglas: `L${id}`, titulo: `Ley ${id}`, tipo, fecha_publicacion: day, articulos: 3 });

describe('publications per quarter', () => {
    it('details the last three years and groups older instruments in one bar', () => {
        const stats = computeStats([law(1, '2008-05-01'), law(2, '2015-11-02'), law(3, '2024-02-10'), law(4, '2026-07-01'), law(5, '2026-08-03')]);
        const [older, ...detailed] = stats.quarters;
        expect(older).toMatchObject({ older: true, year: '2024', total: 2 });
        expect(older.items.map(item => item.title)).toEqual(['L1', 'L2']);
        expect(detailed[0].key).toBe('2024-T1');
        expect(detailed.at(-1).key).toBe('2026-T3');
        expect(detailed.reduce((sum, quarter) => sum + quarter.total, 0)).toBe(3);
    });
    it('has no "before" bar when everything is recent', () => {
        const stats = computeStats([law(1, '2025-01-10'), law(2, '2026-03-01')]);
        expect(stats.quarters.some(quarter => quarter.older)).toBe(false);
        expect(stats.quarters[0].key).toBe('2025-T1');
    });
});
