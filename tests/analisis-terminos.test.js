import { describe, expect, it } from 'vitest';
import data from '../src/data/analisis-terminos.json';
import { SECTORS } from '../src/scripts/terms-view.js';

describe('automatic term map data', () => {
    it('has cross-instrument terms with a known sector and valid links', () => {
        expect(data.terms.length).toBeGreaterThan(50);
        const ids = new Set(data.terms.map(t => t.id));
        expect(ids.size).toBe(data.terms.length);
        for (const term of data.terms) {
            expect(SECTORS[term.sector]).toBeTruthy();
            expect(term.instruments.length).toBeGreaterThanOrEqual(2);
            for (const r of term.related) expect(ids.has(r.id)).toBe(true);
        }
    });

    it('leaves out generic single words and keeps sector ones', () => {
        const labels = new Set(data.terms.map(t => t.label.toLowerCase()));
        for (const generic of ['donde', 'documento', 'bases', 'sistema', 'decreto']) expect(labels.has(generic)).toBe(false);
        expect(labels.has('almacenamiento')).toBe(true);
    });
});
