import { describe, expect, it } from 'vitest';
import { DURACION, MOMENTOS, estado, revisar } from '../intro-3d/modelo.js';

describe('estado de la intro 3D', () => {
    it('inicia como emblema, sin cuerpo desplegado ni módulos', () => {
        const e = estado(0);
        expect(e.despliegue).toBe(0);
        expect(e.modulos.every(m => m.f === 0)).toBe(true);
    });

    it('completa el despliegue antes del desmontaje', () => {
        expect(estado(MOMENTOS.abre).despliegue).toBe(1);
    });

    it.each([16 / 9, 9 / 16])('mantiene siete módulos con aspecto %s', aspecto => {
        expect(estado(4, aspecto).modulos).toHaveLength(7);
    });

    it('termina ensamblado, con módulos ocultos y cámara frontal', () => {
        const e = estado(DURACION - 1 / 60);
        expect(e.abierto).toBe(0);
        expect(e.despliegue).toBe(0);
        expect(e.camara.az).toBe(0);
        expect(e.modulos.every(m => m.f === 0 && m.etiqueta === 0)).toBe(true);
    });

    it('aleja la cámara vertical antes de que las alas alcancen los bordes', () => {
        expect(estado(1.8, 9 / 16).camara.d).toBeGreaterThanOrEqual(20);
    });

    it('no reporta colisiones ni separaciones insuficientes', () => {
        expect(revisar()).toEqual([]);
    });

    it('inicia el desmontaje desde la pose ensamblada', () => {
        const e = estado(MOMENTOS.abre);
        expect(e.despliegue).toBe(1);
        expect(e.abierto).toBe(0);
    });

    it.each([16 / 9, 9 / 16])('muestra las siete secciones con la apertura completa en aspecto %s', aspecto => {
        const e = estado(4, aspecto);
        expect(e.abierto).toBe(1);
        expect(e.modulos.every(m => m.f > 0.99)).toBe(true);
    });

    it('recompone las piezas antes de presentar el nombre', () => {
        expect(estado(MOMENTOS.nombre).abierto).toBe(0);
    });

    it.each([16 / 9, 9 / 16])('mantiene opacidades válidas durante todo el recorrido en aspecto %s', aspecto => {
        for (let t = 0; t <= DURACION; t += 1 / 30) {
            for (const m of estado(t, aspecto).modulos) {
                expect(m.etiqueta).toBeGreaterThanOrEqual(0);
                expect(m.etiqueta).toBeLessThanOrEqual(1);
            }
        }
    });

    it('es determinista para el mismo tiempo y formato', () => {
        expect(estado(4.2, 9 / 16)).toEqual(estado(4.2, 9 / 16));
    });
});
