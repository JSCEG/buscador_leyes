import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO, PUENTE_HILO } from '../src/data/como-funciona.js';
import { ARMAZON, BLOQUE, CONUEE, EFICIENCIA, LINEAS, MOTOR, NORMA, PARTES, PERDIDAS, PRUEBAS, TNOM, arranque, calor, carga, estadoPlanta, gira, motorEn, parMaximo, pasoPlanta, pose, puntasSueltas, revisar, sincrona } from '../conceptos-3d/motor/modelo.js';
import { FUENTES } from '../conceptos-3d/motor/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LPTE = 'LPTE_chunks.json';
const r1 = x => Math.round(x * 10) / 10;

describe('El motor', () => {
    it('sus cifras salen del modelo y coinciden con la tesis y la norma', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada cable toca un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('el motor y sus pruebas son los de la tesis de la FES Aragón', () => {
        expect(MOTOR).toMatchObject({ marca: 'WEG', hp: 2, kW: 1.492, polos: 4, f: 60, V: 460, Vyy: 230, rpm: 1765, clase: 'F', nema: 'B', letra: 'L' });
        expect(PRUEBAS.arranque).toMatchObject({ I: 25.202, par: 20.93 });
        expect(PRUEBAS.maximo.par).toBe(26.23);
        expect(PRUEBAS.plena).toMatchObject({ I: 3.114, rpm: 1761.9 });
        expect(PRUEBAS.temperatura).toMatchObject({ aumento: 53.86, permitido: 115 });
        expect(EFICIENCIA).toHaveLength(6);
        expect(EFICIENCIA[2].slice(0, 2)).toEqual([100.8, 83.9]);
        expect(EFICIENCIA[5].slice(0, 2)).toEqual([25.0, 67.8]);
        // las pérdidas de la prueba dan su 83.9 % a plena carga (83.95, que la tesis redondea hacia abajo)
        const perd = Object.values(PERDIDAS).reduce((a, b) => a + b, 0);
        expect(Math.abs(((EFICIENCIA[2][2] - perd) / EFICIENCIA[2][2]) * 100 - 83.9)).toBeLessThan(0.1);
        expect(ARMAZON.at(-1)).toEqual([4, 61.5]);
    });

    it('la norma de 2025 y la guía de la CONUEE', () => {
        expect(NORMA).toMatchObject({ y2002: 84.0, y2025: 86.5, vigor: 180 });
        expect(CONUEE).toMatchObject({ industria: 61, motores: 2.6, factor: [65, 100] });
        expect(carga({ carga: 1 }).cumple2025).toBe(false);
        expect(carga({ carga: 1 }).cumple2002).toBe(true);
        // un año a 75 %: gasta más que uno de la norma de 2025
        const extra = carga({ carga: 0.75, anual: 4000 }).extra;
        expect(extra).toBeGreaterThan(100);
        expect(extra).toBeLessThan(250);
        expect(carga({ carga: 0.25 }).enRango).toBe(false);
        expect(carga({ carga: 0.8 }).enRango).toBe(true);
    });

    it('cómo gira: el campo a 120 f ÷ P y el rotor un poco atrás', () => {
        expect(sincrona()).toBe(1800);
        expect(sincrona(30)).toBe(900);
        expect(r1(TNOM)).toBe(8.1);
        const g = gira({});
        expect(Math.round(g.rpm)).toBe(1761);
        expect(r1(g.deslizamiento)).toBe(2.1);
        expect(r1(g.par)).toBe(8.1);
        // con variador a 30 Hz baja el voltaje y la corriente casi no cambia
        expect(r1(gira({ f: 30 }).I)).toBe(3.1);
        expect(gira({ f: 75 }).debil).toBe(true);
        // a cada carga medida, la velocidad del modelo cae a menos de 6 vueltas de la medida
        for (const r of EFICIENCIA) expect(Math.abs(carga({ carga: r[3] / TNOM }).rpm - r[4])).toBeLessThan(6);
    });

    it('el par al arrancar y el máximo son los de la prueba', () => {
        expect(r1(motorEn(MOTOR.V, 60, 0).par)).toBe(20.9);
        const m = parMaximo();
        expect(Math.abs(m.par - PRUEBAS.maximo.par)).toBeLessThan(0.5);
        expect(m.rpm).toBeGreaterThan(1300);
        expect(m.rpm).toBeLessThan(1650);
    });

    it('el arranque: directo pide de golpe; el suave y el variador, poco a poco', () => {
        const d = arranque({ metodo: 'directo' });
        const s = arranque({ metodo: 'suave' });
        const v = arranque({ metodo: 'variador' });
        expect(r1(d.pico)).toBe(26.9);
        expect(d.llega).toBeLessThan(0.5);
        expect(d.veces).toBeGreaterThan(8);
        expect(s.pico).toBeLessThan(d.pico / 2);
        expect(v.pico).toBeLessThan(PRUEBAS.plena.I);
        expect(v.llega).toBeGreaterThan(s.llega);
        // la escena lo pasa en cámara lenta: un segundo en unos tres
        let p = estadoPlanta();
        for (let i = 0; i < 30; i++) p = pasoPlanta(p, { modo: 'arranque', arrancar: true }, 0.1);
        expect(r1(p.tArr)).toBe(1);
        expect(pasoPlanta(p, { modo: 'gira', arrancar: true }, 0.1).tArr).toBe(-1);
    });

    it('la eficiencia según la carga sigue a la medida', () => {
        for (const r of EFICIENCIA) expect(Math.abs(carga({ carga: r[3] / TNOM }).efPct - r[1])).toBeLessThan(2.5);
        expect(carga({ carga: 0.25 }).efPct).toBeLessThan(carga({ carga: 1 }).efPct - 10);
        expect(carga({ carga: 0.05 }).efPct).toBeLessThan(40);
    });

    it('la temperatura: a plena carga sube lo de la prueba y el armazón sigue lo medido', () => {
        expect(calor({ horas: 99, carga: 1 }).final).toBeCloseTo(PRUEBAS.temperatura.aumento, 6);
        expect(calor({ horas: 99, carga: 1.3 }).final).toBeGreaterThan(PRUEBAS.temperatura.aumento);
        expect(calor({ horas: 99, carga: 1.3 }).pasa).toBe(false);
        expect(calor({ horas: 0 }).aumento).toBe(0);
        for (const [h, t] of ARMAZON.slice(1)) expect(Math.abs(calor({ horas: h, carga: 1, ambiente: 21.5 }).armazon - t)).toBeLessThan(6);
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        expect(pose({ modo: 'gira' }).rpm).toBeGreaterThan(1700);
        expect(pose({ modo: 'arranque' }).flujos.red).toBe(0);
        expect(pose({ modo: 'arranque', planta: { t: 0, tArr: 0.05 } }).activo.golpe).toBeGreaterThan(0);
        expect(pose({ modo: 'carga', carga: 1 }).activo.alarma).toBeGreaterThan(0);
        expect(pose({ modo: 'carga', carga: 0.2 }).flujos.eje).toBeLessThan(pose({ modo: 'carga', carga: 1 }).flujos.eje);
        expect(pose({ modo: 'calor', horas: 4 }).activo.calor).toBeGreaterThan(pose({ modo: 'calor', horas: 0 }).activo.calor);
    });

    it('sus puntos clave caben en el bloque', () => {
        expect(PARTES).toHaveLength(14);
        for (const p of PARTES) {
            expect(p.vista).toBeTruthy();
            expect(p.ancla[0]).toBeGreaterThanOrEqual(BLOQUE.x[0]);
            expect(p.ancla[0]).toBeLessThanOrEqual(BLOQUE.x[1]);
            expect(p.ancla[2]).toBeGreaterThanOrEqual(BLOQUE.z[0]);
            expect(p.ancla[2]).toBeLessThanOrEqual(BLOQUE.z[1]);
        }
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['motor', 'motor-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.motor.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https:\/\//);
            expect(f.para).toBeTruthy();
            expect(f.fecha).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        expect(CONCEPTO.motor.fuentes.map(f => f.acervo)).toContain('LPTE');
        // el motor anterior, de pila y electroimanes, ya no se usa
        const fuente = readFileSync('conceptos-3d/motor/main.js', 'utf8');
        expect(fuente).not.toContain('../comun/');
        expect(fuente).not.toContain('Pila (corriente directa)');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.motor;
        expect(c.figura).toBe('motor');
        expect(c.nivel).toBe(1);
        expect(c.antes).toEqual(['cd-ca']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/motor/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO.motor;
        expect(articulo(LPTE, 3)).toContain('VII. Eficiencia Energética: Todas las acciones que conlleven a una reducción, económicamente viable, de la cantidad de energía que se requiere para satisfacer las necesidades energéticas de los servicios y bienes que demanda la sociedad, asegurando un nivel de servicio igual o superior');
        expect(articulo(LPTE, 10)).toContain('La CONUEE es un órgano administrativo desconcentrado de la Secretaría que cuenta con autonomía técnica y operativa. Tiene por objeto promover la Eficiencia Energética');
        expect(articulo(LPTE, 11)).toContain('I. Promover el uso óptimo de la energía, desde su explotación hasta su uso final');
        expect(articulo(LPTE, 11)).toContain('VI. Expedir, con la aprobación de la Secretaría, las Normas Oficiales Mexicanas en materia de Eficiencia Energética');
        expect(c.ley.siglas).toEqual(['LPTE']);
        expect(c.resumen).toContain('Universidad Nacional Autónoma de México (UNAM)');
        expect(JSON.stringify(c)).toContain('Comisión Nacional para el Uso Eficiente de la Energía (CONUEE)');
        // el puente con el resto de la ruta: la norma pide eficiencia, no factor de potencia
        expect(PUENTE_HILO.motor.regulacion).toContain('LPTE, art. 11');
        expect(PUENTE_HILO.motor.regulacion).toContain(`${NORMA.y2025} %`);
        expect(PUENTE_HILO.motor.regulacion).not.toContain('factor de potencia');
        expect(PUENTE_HILO.motor.fisica).toContain(`${CONUEE.industria} %`);
    });
});
