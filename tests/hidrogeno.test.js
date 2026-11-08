import { describe, it, expect } from 'vitest';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { readFileSync } from 'node:fs';
import { BATERIA, COMPROMISO, PARTES, PASO_HORAS, calcular, compromisoEnHora, diaCompleto, enHora, nocheEnHora, pose, revisar } from '../conceptos-3d/hidrogeno/modelo.js';
import { FUENTES } from '../conceptos-3d/hidrogeno/fuentes.js';

const suma = c => diaCompleto().reduce((a, f) => a + f[c] * PASO_HORAS, 0);

describe('Planta de hidrógeno', () => {
    it('sus cifras salen de la física y de los equipos', () => {
        expect(revisar()).toEqual([]);
    });

    it('en un día la red recibe todo lo prometido y la energía cuadra', () => {
        expect(suma('falta')).toBeCloseTo(0, 3);
        expect(suma('directo') + suma('carga') + suma('elec') + suma('vertido')).toBeCloseTo(suma('ren'), 6);
        for (const f of diaCompleto()) expect(f.red).toBeCloseTo(compromisoEnHora(f.h), 6);
    });

    it('las baterías regresan lo que dice la fuente y no se pasan de sus límites', () => {
        expect(suma('descarga') / suma('carga')).toBeCloseTo(BATERIA.eficiencia, 1);
        for (const f of diaCompleto()) {
            expect(f.soc).toBeGreaterThanOrEqual(BATERIA.minimo - 1e-6);
            expect(f.soc).toBeLessThanOrEqual(1 + 1e-6);
            expect(Math.max(f.carga, f.descarga)).toBeLessThanOrEqual(BATERIA.mw + 1e-6);
            // nunca se cargan y entregan al mismo tiempo
            expect(Math.min(f.carga, f.descarga)).toBeCloseTo(0, 6);
        }
    });

    it('primero entregan las baterías; después, el hidrógeno guardado', () => {
        expect(enHora(20).descarga).toBeGreaterThan(1);
        expect(enHora(20).saeH2).toBe(0);
        expect(enHora(3).saeH2).toBeGreaterThan(0.5);
        expect(enHora(3).descarga).toBe(0);
        expect(enHora(12).elec).toBeGreaterThan(2);
    });

    it('el reloj da la vuelta sin brincos', () => {
        expect(enHora(23.999).nivel).toBeCloseTo(enHora(0).nivel, 2);
        expect(enHora(23.999).soc).toBeCloseTo(enHora(0).soc, 2);
        expect(enHora(24).h).toBe(0);
        expect(nocheEnHora(13)).toBe(0);
        expect(nocheEnHora(1)).toBe(1);
        expect(COMPROMISO.tarde).toBeGreaterThan(COMPROMISO.noche);
    });

    it('en «Un día» cada flujo lee el reparto de esa hora', () => {
        const tarde = pose({ proceso: 'dia', hora: 20 });
        expect(tarde.flujos.descarga).toBeGreaterThan(0);
        expect(tarde.flujos.carga).toBe(0);
        expect(tarde.f.pila).toBe(0);
        const madrugada = pose({ proceso: 'dia', hora: 3 });
        expect(madrugada.f.pila).toBeGreaterThan(0);
        expect(madrugada.flujos.descarga).toBe(0);
        expect(madrugada.f.red).toBeGreaterThan(0);
        const mediodia = pose({ proceso: 'dia', hora: 12 });
        expect(mediodia.f.verde).toBeGreaterThan(0);
        expect(mediodia.flujos.alta).toBeGreaterThan(0);
        expect(mediodia.horaSol).toBeCloseTo((12 - 6.5) / 12, 6);
    });

    it('los demás procesos no cambian al agregar las baterías', () => {
        expect(calcular({ proceso: 'verde', carga: 1, sol: 1 }).dia).toBeNull();
        expect(pose({ proceso: 'verde', carga: 1 }).flujos.bus).toBe(0);
        expect(pose({ proceso: 'pila', carga: 1 }).f.red).toBeGreaterThan(0.8);
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['hidrogeno', 'hidrogeno-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.hidrogeno.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        expect(CONCEPTO.hidrogeno.fuentes.some(f => f.acervo === 'LSE')).toBe(true);
    });

    it('su ficha de Aprende tiene una parte por cada punto clave y usa SAE, no «pila»', () => {
        const c = CONCEPTO.hidrogeno;
        expect(c.figura).toBe('hidrogeno');
        expect(c.partes).toHaveLength(PARTES.length);
        expect(JSON.stringify(c)).not.toMatch(/\bpilas?\b/i);
        expect(c.partes.map(p => p.nombre)).toContain('SAE de baterías');
        expect(c.partes.map(p => p.nombre)).toContain('SAE de hidrógeno');
        expect(c.revisado).toBeNull();
    });
});
