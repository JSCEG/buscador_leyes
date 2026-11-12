import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { AEREAS, AUX_FLASH, BLOQUE, BORNES, DEF, ETA_GEN, LINEAS, M_TOTAL, PARTES, REMATE, binario, calcular, enAnio, flash, pSepOptimo, pose, puntasSueltas, revisar, seco, treintaAnios } from '../conceptos-3d/geotermica/modelo.js';
import { cablesSueltos, colgar } from '../conceptos-3d/planta-comun/lineas.js';
import { FUENTES } from '../conceptos-3d/geotermica/fuentes.js';

describe('Central geotérmica', () => {
    it('sus cifras salen de la física y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada tubo toca un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
    });

    it('cada cable llega a un borne: cajas de terminales, boquillas, pórtico, crucetas y el marco de la reductora', () => {
        expect(cablesSueltos(LINEAS, BORNES, REMATE)).toEqual([]);
        // del generador al transformador va un ducto de barras, no un cable que cuelga; el de la binaria va delgado por el piso
        const gen = LINEAS.find(l => l.id === 'gen');
        expect(gen.oculto).toBe(true);
        expect(gen.cable).toBeFalsy();
        expect(gen.puntos[0]).toBe(BORNES.generador);
        expect(gen.puntos.at(-1)).toBe(BORNES.trafoBaja);
        const bin = LINEAS.find(l => l.id === 'genBin');
        expect(bin.cable).toBe(true);
        expect(bin.r).toBeLessThanOrEqual(0.02);
        for (const p of bin.puntos.slice(1, -1)) expect(p[1]).toBeLessThanOrEqual(0.06);
        // las líneas aéreas son tres fases que cuelgan entre apoyos, sin tubo
        expect(Object.keys(AEREAS)).toEqual(['trafoPortico', 'rnt', 'rgd']);
        for (const [id, apoyos] of Object.entries(AEREAS)) {
            const linea = LINEAS.find(l => l.id === id);
            expect(linea.oculto).toBe(true);
            expect(linea.apoyos).toBe(apoyos);
            for (const a of apoyos) expect(Math.hypot(...a.fase)).toBeGreaterThan(0.05);
            for (const k of [-1, 0, 1]) {
                const p = colgar(apoyos, k);
                expect(p[8][1]).toBeLessThan((p[0][1] + p[16][1]) / 2);
            }
        }
        expect(AEREAS.trafoPortico[0].p).toBe(BORNES.trafoAlta);
        expect(AEREAS.rnt[0].p).toBe(BORNES.portico);
        expect(AEREAS.rnt.at(-1).p).toBe(BORNES.reductoraAlta);
    });

    it('el vapor flasheado cuadra: el vapor y el agua suman lo que sale de los pozos', () => {
        const f = flash();
        expect(f.mv + f.mb).toBeCloseTo(M_TOTAL, 6);
        expect(f.x).toBeCloseTo(0.252, 2);
        expect(f.bruta).toBeCloseTo((f.mv * f.t.dh * ETA_GEN) / 1000, 6);
        expect(f.neta).toBeCloseTo(f.bruta * (1 - AUX_FLASH), 6);
        // lo que se evapora en la torre es lo único que no regresa
        expect(f.regresa + f.evap).toBeCloseTo(M_TOTAL, 6);
    });

    it('el reparto del calor no se pasa del calor que entró', () => {
        const { electricidad, torre, regresa } = flash().reparto;
        expect(electricidad + torre + regresa).toBeLessThanOrEqual(1.001);
        expect(electricidad + torre + regresa).toBeGreaterThan(0.95);
    });

    it('la presión del separador tiene un punto óptimo y a más temperatura hay más potencia', () => {
        const optimo = pSepOptimo(DEF.tempYac);
        expect(optimo).toBeGreaterThan(4);
        expect(optimo).toBeLessThan(10);
        const mejor = flash({ pSep: optimo }).bruta;
        expect(flash({ pSep: 2 }).bruta).toBeLessThan(mejor);
        expect(flash({ pSep: 24 }).bruta).toBeLessThan(mejor);
        expect(flash({ tempYac: 300 }).neta).toBeGreaterThan(flash({ tempYac: 240 }).neta);
    });

    it('el vapor seco da menos vapor si se le pide más presión', () => {
        expect(seco({ pSeco: 20 }).mv).toBeLessThan(seco({ pSeco: 8 }).mv);
    });

    it('la binaria no evapora agua, no suelta gases y regresa toda el agua', () => {
        const b = binario();
        expect(b.evap).toBe(0);
        expect(b.gases).toBe(0);
        expect(b.regresa).toBe(M_TOTAL);
        expect(b.Tout).toBeGreaterThanOrEqual(70);
        expect(binario({ tempBin: 170 }).neta).toBeGreaterThan(binario({ tempBin: 130 }).neta);
    });

    it('a 30 años, reinyectar sostiene más potencia que no hacerlo', () => {
        const con = enAnio(30, DEF.reinyecta).mw;
        const sin = enAnio(30, 0).mw;
        expect(con).toBeGreaterThan(sin);
        expect(con).toBeLessThan(flash().neta);
        expect(treintaAnios(DEF.reinyecta)).toHaveLength(121);
        expect(enAnio(0, DEF.reinyecta).mw).toBeCloseTo(flash().neta, 6);
    });

    it('los modos entregan su propia potencia al tablero', () => {
        expect(calcular({ modo: 'flash' }).neta).toBeCloseTo(flash().neta, 6);
        expect(calcular({ modo: 'binario' }).neta).toBeCloseTo(binario().neta, 6);
        expect(calcular({ modo: 'seco' }).neta).toBeCloseTo(seco().neta, 6);
    });

    it('la pose responde al desarme y sus puntos clave caben en el bloque', () => {
        expect(pose({ modo: 'flash' })).toBeTruthy();
        for (const p of PARTES) {
            expect(p.vista).toBeTruthy();
            expect(p.ancla[1]).toBeGreaterThanOrEqual(BLOQUE.y[0]);
        }
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['geotermica', 'geotermica-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.geotermica.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.geotermica.fuentes.map(f => f.acervo);
        expect(acervos).toContain('LGeo');
        expect(acervos).toContain('LSE');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.geotermica;
        expect(c.figura).toBe('geotermica');
        expect(c.partes).toHaveLength(PARTES.length);
        // Aprende y la figura se hablan por el número de la parte, así que el orden debe ser el mismo en los tres lugares
        const fuente = readFileSync('conceptos-3d/geotermica/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const PARTES = FICHAS'));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-z]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.partes.map(p => p.nombre)).toContain('RNT y RGD');
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita la reinyección de la Ley de Geotermia y explica las siglas de la red', () => {
        const c = CONCEPTO.geotermica;
        expect(c.ley.ficha.articulos.some(a => a.siglas === 'LGeo' && a.refs.includes('29'))).toBe(true);
        const texto = JSON.stringify(c);
        expect(texto).toContain('Red Nacional de Transmisión');
        expect(texto).toContain('Redes Generales de Distribución');
    });
});
