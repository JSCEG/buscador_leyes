import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { AJUSTE, ARREGLO, BLOQUE, LINEAS, MEDIDO, MODULOS, PARTES, PLANTA, RED, TRAFO, TRIO, armonicasOnda, cadena, calor, canal, dia, eficiencia, eficienciaCEC, energiaDia, estadoPlanta, limiteOrden, maxPorCalor, onda, pasoPlanta, pose, puntasSueltas, red, revisar, tiempoFrecuencia, tiempoTension } from '../conceptos-3d/inversor/modelo.js';
import { FUENTES } from '../conceptos-3d/inversor/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const r1 = x => Math.round(x * 10) / 10;

describe('El inversor', () => {
    it('sus cifras salen del modelo y coinciden con la tesis, la ficha y la regla', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada cable toca un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('la planta y sus equipos son los de la tesis del IER-UNAM', () => {
        expect(PLANTA).toMatchObject({ kWp: 42.84, modulos: 168, inversores: 2, inclinacion: 19, irradiacion: 6.2 });
        expect(MEDIDO).toMatchObject({ inversores: 35.9, transformador: 32 });
        expect(MODULOS.yingli).toMatchObject({ P: 250, Vmp: 29.8, Imp: 8.39, Voc: 37.6, Isc: 8.92, gP: -0.42, gV: -0.32 });
        expect(MODULOS.solarever).toMatchObject({ P: 260, Vmp: 31.52, Imp: 8.25, Voc: 38.82, Isc: 8.83, noct: 45 });
        expect(ARREGLO).toEqual({ serie: 14, cadenas: 3, canales: 2 });
        expect(TRIO).toMatchObject({ P: 20000, Pmax: 22000, V: 480, Pcanal: 12000, Vmax: 1000, arranque: 360, plena: [450, 800], opera: [200, 950], Icanal: 25, thd: 3, efMax: 98.2, efCEC: 97.5, umbral: 65, reduce: 45, kg: 71 });
        expect(TRAFO).toEqual({ kVA: 45, alta: 480, baja: 220 });
    });

    it('las reglas son las de la generación distribuida (CRE, RES/142/2017)', () => {
        expect(RED.tdd).toBe(5);
        expect(RED.cd).toBe(0.5);
        expect(RED.isla).toBe(0.5);
        expect(RED.vuelta).toEqual({ espera: 300, f: [59.3, 60.5] });
        expect(RED.tension).toEqual([[50, 0.16], [88, 2], [110, Infinity], [120, 1], [Infinity, 0.16]]);
        expect(limiteOrden(7)).toBe(4);
        expect(limiteOrden(13)).toBe(2);
        expect(limiteOrden(41)).toBe(0.3);
        // los ajustes de ejemplo caben en lo que permite la regla
        expect(AJUSTE.baja).toBeGreaterThanOrEqual(RED.frecuencia.bajaMin);
        expect(AJUSTE.baja).toBeLessThanOrEqual(RED.frecuencia.bajaMax);
        expect(AJUSTE.alta).toBeLessThanOrEqual(RED.frecuencia.altaMax);
    });

    it('un día: las cadenas, los seguidores y lo que se midió', () => {
        const c = cadena('yingli', 1000, 25);
        expect(r1(c.I(0))).toBe(8.9);
        expect(Math.round(c.I(417.2) * 100) / 100).toBe(8.39);
        const n = dia({ hora: 13.6 });
        expect(r1(n.Pac / 1000)).toBe(35.8);
        expect(Math.round(n.Tc)).toBe(66);
        expect(Math.round(n.inv[0].canales[0].V)).toBe(374);
        expect(r1(n.inv[0].canales[0].I)).toBe(24.7);
        expect(canal('yingli', 1000, 66).plena).toBe(false);
        expect(dia({ hora: 7 }).Pac).toBe(0);
        expect(dia({ hora: 9, nubes: 0.6 }).Pac).toBeLessThan(dia({ hora: 9 }).Pac / 2);
        expect(energiaDia()).toBeGreaterThan(200);
    });

    it('la onda: más pulsos, menos distorsión; y la resonancia del filtro', () => {
        expect(Math.round(onda({ N: 1 }).tdd)).toBe(59);
        expect(onda({ N: 1 }).cumple).toBe(false);
        expect(r1(onda({ N: 60 }).tdd)).toBe(14.7);
        expect(r1(onda({}).tdd)).toBe(0.1);
        expect(onda({}).cumple).toBe(true);
        expect(onda({}).conmuta).toBe(32040);
        // con poca carga, la misma distorsión pesa más contra la corriente de ese momento
        expect(onda({ s: 0.1 }).thd).toBeCloseTo(onda({}).tdd * 10, 6);
        expect(armonicasOnda(267).v1).toBeGreaterThan(1.5);
    });

    it('con la red: los tiempos para desconectarse, la isla y la espera para volver', () => {
        expect(tiempoTension(100)).toBe(Infinity);
        expect(tiempoTension(80)).toBe(2);
        expect(tiempoTension(130)).toBe(0.16);
        expect(tiempoFrecuencia(60)).toBe(Infinity);
        expect(tiempoFrecuencia(62.5)).toBe(0.16);
        expect(red({ v: 100, f: 60 }).opera).toBe(true);
        expect(red({ f: 60.8 }).vuelve).toBe(false);
        // se va la luz: sale antes de medio segundo
        let s = estadoPlanta();
        const m = { modo: 'red', apagon: true, v: 100, f: 60 };
        for (let i = 0; i < 20; i++) s = pasoPlanta(s, m, 0.1);
        expect(s.conectado).toBe(false);
        expect(s.tIsla).toBeLessThan(RED.isla);
        // vuelve la luz: espera 5 minutos (aquí 60 veces más rápido)
        s = pasoPlanta(s, { ...m, apagon: false }, 0.1);
        expect(s.espera).toBe(RED.vuelta.espera);
        for (let i = 0; i < 60; i++) s = pasoPlanta(s, { ...m, apagon: false }, 0.1);
        expect(s.conectado).toBe(true);
        // a 115 %, aguanta un segundo antes de salir (el reloj corre 10 veces más rápido)
        let t = estadoPlanta();
        t = pasoPlanta(t, { modo: 'red', apagon: false, v: 115, f: 60 }, 0.05);
        expect(t.conectado).toBe(true);
        for (let i = 0; i < 4; i++) t = pasoPlanta(t, { modo: 'red', apagon: false, v: 115, f: 60 }, 0.05);
        expect(t.conectado).toBe(false);
    });

    it('el calor: la eficiencia de la ficha y lo que baja con el aire caliente', () => {
        expect(r1(eficienciaCEC() * 100)).toBe(97.5);
        expect(r1(eficiencia(0.2) * 100)).toBe(98.2);
        const c = calor({ carga: 0.75, ta: 35 });
        expect(Math.round(c.perd)).toBe(429);
        expect(r1(c.ef * 100)).toBe(97.2);
        expect(maxPorCalor(55)).toBeLessThan(TRIO.Pmax);
        expect(calor({ carga: 1, ta: 55 }).recorta).toBe(true);
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        expect(pose({ modo: 'dia', hora: 13.6 }).flujos.cd1).toBeGreaterThan(pose({ modo: 'dia', hora: 9 }).flujos.cd1);
        expect(pose({ modo: 'dia', hora: 7 }).flujos.ca1).toBe(0);
        expect(pose({ modo: 'onda', N: 1 }).activo.alarma).toBe(1);
        expect(pose({ modo: 'red', planta: { ...estadoPlanta(), conectado: false } }).conectado).toBe(false);
        expect(pose({ modo: 'calor', carga: 1, ta: 55 }).activo.alarma).toBe(1);
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
        const paginas = ['inversor', 'inversor-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.inversor.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https:\/\//);
            expect(f.para).toBeTruthy();
            expect(f.fecha).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        expect(CONCEPTO.inversor.fuentes.map(f => f.acervo)).toContain('LSE');
        // el banco de pruebas anterior, con su osciloscopio, ya no se usa
        const fuente = readFileSync('conceptos-3d/inversor/main.js', 'utf8');
        expect(fuente).not.toContain('../comun/');
        expect(fuente).not.toContain('Osciloscopio');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.inversor;
        expect(c.figura).toBe('inversor');
        expect(c.nivel).toBe(2);
        expect(c.antes).toEqual(['cd-ca', 'transformador']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/inversor/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO.inversor;
        const a3 = articulo(LSE, 3);
        expect(a3).toContain('XXII. Generación Distribuida: Generación de energía eléctrica que cumple con las siguientes características: a) Se realiza por una Generadora Exenta');
        expect(a3).toContain('interconectada a un circuito de distribución que contenga una alta concentración de Centros de Carga');
        expect(a3).toContain('XXIV. Generadora Exenta: Persona propietaria o poseedora de una o varias Centrales Eléctricas que no requieren ni cuenten con permiso para generar');
        expect(articulo(LSE, 24)).toContain('Las Generadoras Exentas únicamente pueden vender su energía eléctrica y Productos Asociados a través de una Suministradora o dedicar su producción a consumo propio');
        expect(articulo(LSE, 25)).toContain('Centrales Eléctricas con capacidad menor a 0.7 MW');
        expect(articulo(LSE, 26)).toContain('cuenta con acceso a las Redes Generales de Distribución cuando es técnicamente factible');
        expect(articulo(LSE, 26)).toContain('Las especificaciones técnicas generales requeridas para la interconexión de nuevas Centrales Eléctricas deben incluir provisiones específicas para la Generación Distribuida');
        expect(c.ley.siglas).toEqual(['LSE']);
        expect(c.resumen).toContain('Instituto de Energías Renovables (IER)');
        expect(JSON.stringify(c)).not.toContain('SAEE');
    });
});
