import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { CONCEPTOS, CONCEPTO, NIVELES, siguienteConcepto, comoFuncionaRoute } from '../src/data/como-funciona.js';
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
    it('forms a learning route from the basics up to the power plants', () => {
        expect(CONCEPTOS.map(c => c.id).slice(0, 7)).toEqual(['electricidad', 'voltaje', 'cd-ca', 'motor', 'generador', 'transformador', 'fotovoltaica']);
        const levels = NIVELES.map(n => n.id);
        // One route per sector, each going up through the levels.
        const sectors = [...new Set(CONCEPTOS.map(c => c.sector))];
        expect(sectors).toEqual(['electricidad', 'hidrocarburos']);
        for (const sector of sectors) {
            const route = CONCEPTOS.filter(c => c.sector === sector);
            let seen = new Set();
            let last = 0;
            for (const c of route) {
                expect(levels).toContain(c.nivel);
                expect(c.nivel).toBeGreaterThanOrEqual(last);
                last = c.nivel;
                // "Antes mira" only points back along the same route.
                for (const id of c.antes || []) expect(seen.has(id)).toBe(true);
                seen.add(c.id);
                if (c.ley) for (const siglas of c.ley.siglas) expect(typeof siglas).toBe('string');
            }
            expect(siguienteConcepto(route.at(-1).id)).toBeNull();
        }
        expect(siguienteConcepto('electricidad').id).toBe('voltaje');
        expect(siguienteConcepto('nada')).toBeNull();
    });
    it('gives the basics an academic structure: definitions, formulas with examples, wrong ideas', () => {
        for (const c of CONCEPTOS.filter(item => item.nivel === 1)) {
            expect(c.definiciones?.length).toBeGreaterThan(0);
            for (const d of c.definiciones) expect(d.termino && d.texto).toBeTruthy();
            for (const f of c.formulas || []) expect(f.expresion && f.lectura && f.ejemplo).toBeTruthy();
            expect(c.errores?.length).toBeGreaterThan(0);
            for (const e of c.errores) expect(e.idea && e.realidad).toBeTruthy();
        }
    });
});
