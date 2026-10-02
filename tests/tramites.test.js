import { describe, it, expect } from 'vitest';
import { TRAMITES, tramiteById } from '../src/data/tramites.js';

describe('tramites catalogue', () => {
    it('has unique ids and the fields the guide reads', () => {
        expect(new Set(TRAMITES.map(t => t.id)).size).toBe(TRAMITES.length);
        for (const t of TRAMITES) {
            expect(t.title).toBeTruthy();
            for (const key of ['base', 'rules', 'forms', 'calls']) expect(Array.isArray(t[key])).toBe(true);
            expect(t.articles.query.length).toBeGreaterThanOrEqual(3);
            expect(t.articles.in.length).toBeGreaterThan(0);
        }
    });
    it('finds a guide by id', () => {
        expect(tramiteById('generacion').title).toMatch(/generación/);
        expect(tramiteById('nada')).toBeNull();
    });
});
