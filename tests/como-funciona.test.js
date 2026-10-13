import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { CONCEPTOS, CONCEPTO, comoFuncionaRoute } from '../src/data/como-funciona.js';
import { tramiteById } from '../src/data/tramites.js';

describe('¿Cómo funciona?', () => {
    it('reads its routes', () => {
        expect(comoFuncionaRoute('#como-funciona')).toEqual({ id: null });
        expect(comoFuncionaRoute('#como-funciona=fotovoltaica')).toEqual({ id: 'fotovoltaica' });
        expect(comoFuncionaRoute('#como-funcionan')).toBeNull();
        expect(comoFuncionaRoute('#reto')).toBeNull();
    });
    it('has a figure in both themes, real trámite guides and well-formed questions', () => {
        expect(new Set(CONCEPTOS.map(c => c.id)).size).toBe(CONCEPTOS.length);
        for (const c of CONCEPTOS) {
            expect(CONCEPTO[c.id]).toBe(c);
            expect(existsSync(`public/conceptos/${c.figura}.html`)).toBe(true);
            expect(existsSync(`public/conceptos/${c.figura}-light.html`)).toBe(true);
            for (const id of c.tramites) expect(tramiteById(id)).not.toBeNull();
            expect(c.fuentes.length).toBeGreaterThan(0);
            for (const f of c.fuentes) {
                expect(f.autor && f.titulo && f.fecha).toBeTruthy();
                if (f.url) expect(f.url).toMatch(/^https:\/\//);
            }
            for (const q of c.preguntas) expect(q.opciones[q.correcta]).toBeTruthy();
        }
    });
});
