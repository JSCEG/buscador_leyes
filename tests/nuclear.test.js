import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { BLOQUE, DEF, FLUJO_NUCLEO, LIMITES, MESES_DENTRO, NUCLEO, PARTES, T_UNO, UNIDAD, aguaAPresion, aguaParaEnfriar, calcular, calorResidual, calorTotal, cicloVapor, composicion, enElCiclo, equilibrio, estadoReactor, kwPorTonelada, pasoReactor, pose, puntasSueltas, rejillaNucleo, revisar, sat, tSat, AGUA, P_DOMO } from '../conceptos-3d/nuclear/modelo.js';
import { FUENTES } from '../conceptos-3d/nuclear/fuentes.js';

const correr = (s, m, segundos) => { let r = s; for (let i = 0; i < segundos * 20; i++) r = pasoReactor(r, m, 0.05); return r; };

describe('Central nuclear', () => {
    it('sus cifras salen de la física y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada tubo toca un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
    });

    it('una unidad de Laguna Verde da lo que informan CFE y WNA', () => {
        const c = cicloVapor();
        expect(c.bruta).toBeCloseTo(810, 0);
        expect(c.neta).toBeCloseTo(777, 0);
        expect(c.eficiencia).toBeGreaterThan(0.33);
        expect(c.eficiencia).toBeLessThan(0.37);
        // lo que sale del núcleo como vapor es de 12 a 15 de cada 100 kilos
        expect(c.mv / FLUJO_NUCLEO).toBeGreaterThan(0.12);
        expect(c.mv / FLUJO_NUCLEO).toBeLessThan(0.15);
    });

    it('el calor no se pierde: entra por el vapor y sale por la red, la central y el mar', () => {
        const c = cicloVapor();
        const v = sat(AGUA, tSat(AGUA, P_DOMO));
        const a = sat(AGUA, c.tAgua);
        expect((c.mv * (v.hg - a.hf)) / 1000).toBeCloseTo(UNIDAD.termica, 3);
        expect(c.reparto.red + c.reparto.propia + c.reparto.mar).toBeCloseTo(1, 6);
        expect(c.bruta + c.Qmar).toBeCloseTo(UNIDAD.termica, 6);
    });

    it('un mar más caliente deja menos potencia', () => {
        expect(cicloVapor({ tMar: 32 }).neta).toBeLessThan(cicloVapor({ tMar: 27 }).neta);
        expect(cicloVapor({ tMar: 32 }).pC).toBeGreaterThan(cicloVapor({ tMar: 27 }).pC);
    });

    it('la potencia baja al meter las barras y al bajar las bombas', () => {
        expect(equilibrio({ barras: NUCLEO.b0, flujo: 1 })).toBeCloseTo(1, 3);
        const barras = [0.12, 0.2, 0.3, 0.4, 0.5].map(b => equilibrio({ barras: b, flujo: 1 }));
        for (let i = 1; i < barras.length; i++) expect(barras[i]).toBeLessThan(barras[i - 1]);
        expect(equilibrio({ barras: 0.7, flujo: 1 })).toBe(0);
        expect(equilibrio({ barras: NUCLEO.b0, flujo: 0.5 })).toBeLessThan(equilibrio({ barras: NUCLEO.b0, flujo: 1 }));
    });

    it('la reacción se asienta sola en el mismo equilibrio que muestra la gráfica', () => {
        const m = { barras: 0.3, flujo: 0.8, apagado: false };
        const fin = correr(estadoReactor(), m, 240);
        expect(fin.P).toBeCloseTo(equilibrio(m), 2);
        expect(Math.abs(fin.rho)).toBeLessThan(0.01);
    });

    it('no depende de la velocidad de los cuadros', () => {
        const m = { barras: 0.25, flujo: 1, apagado: false };
        let lento = estadoReactor();
        for (let i = 0; i < 40; i++) lento = pasoReactor(lento, m, 0.5);
        const rapido = correr(estadoReactor(), m, 20);
        expect(lento.P).toBeCloseTo(rapido.P, 2);
    });

    it('al apagar entran las barras, se frena la fisión y queda el calor del combustible', () => {
        const m = { barras: NUCLEO.b0, flujo: 1, apagado: true };
        const pronto = correr(estadoReactor(), m, 5);
        expect(pronto.b).toBeCloseTo(1, 3);
        expect(pronto.P).toBeLessThan(0.1);
        const luego = correr(pronto, m, 120);
        expect(luego.P).toBeLessThan(0.001);
        expect(calorTotal(luego)).toBeCloseTo(calorResidual(luego.t), 2);
        expect(calorTotal(luego)).toBeGreaterThan(0.02);
    });

    it('el calor que queda pasa por lo publicado y siempre baja', () => {
        expect(calorResidual(1)).toBeCloseTo(0.065, 6);
        expect(calorResidual(T_UNO.h)).toBeCloseTo(0.015, 6);
        expect(calorResidual(T_UNO.d)).toBeCloseTo(0.004, 6);
        expect(calorResidual(T_UNO.sem)).toBeCloseTo(0.002, 6);
        expect(kwPorTonelada(T_UNO.anio)).toBeCloseTo(10, 3);
        expect(kwPorTonelada(10 * T_UNO.anio)).toBeCloseTo(1, 3);
        let antes = 1;
        for (let x = 0; x < 8.5; x += 0.05) {
            const c = calorResidual(10 ** x);
            expect(c).toBeLessThanOrEqual(antes);
            antes = c;
        }
        expect(aguaParaEnfriar(UNIDAD.termica * calorResidual(T_UNO.sem))).toBeLessThan(aguaParaEnfriar(UNIDAD.termica * calorResidual(T_UNO.h)));
    });

    it('con agua a presión el primer circuito no hierve, y baja de presión sí', () => {
        const p = aguaAPresion();
        expect(p.hierve).toBe(false);
        expect(p.margen).toBeGreaterThan(15);
        expect(aguaAPresion({ pPrim: LIMITES.pPrim[0] }).hierve).toBe(true);
        expect(p.ciclo.pVapor).toBeLessThan(DEF.pPrim / 2);
        expect(calcular({ modo: 'presion', pPrim: 120 }).neta).toBe(0);
    });

    it('el combustible se cambia cada 18 meses y sale con lo que dice WNA', () => {
        expect(enElCiclo(18).recarga).toBe(true);
        expect(enElCiclo(0).recarga).toBe(false);
        expect(enElCiclo(9).recarga).toBe(false);
        const sale = composicion(MESES_DENTRO);
        expect(sale.u235 + sale.pu + sale.residuos + sale.u238).toBeLessThanOrEqual(100);
        expect(sale.u235).toBeCloseTo(1, 1);
        expect(sale.pu).toBeCloseTo(0.6, 1);
        expect(sale.residuos).toBeCloseTo(3, 1);
        expect(composicion(0).u235).toBeCloseTo(4, 6);
        expect(calcular({ modo: 'ciclo', mes: 18 }).neta).toBe(0);
        expect(calcular({ modo: 'ciclo', mes: 9 }).neta).toBeCloseTo(cicloVapor().neta, 6);
    });

    it('el núcleo se dibuja con los 444 ensambles y las 109 barras reales, sin repetir lugares', () => {
        const { ensambles, barras } = rejillaNucleo();
        expect(ensambles).toHaveLength(444);
        expect(barras).toHaveLength(109);
        expect(new Set(ensambles.map(String)).size).toBe(444);
        expect(new Set(barras.map(String)).size).toBe(109);
    });

    it('los modos entregan su propia potencia al tablero y a los tubos', () => {
        expect(calcular({ modo: 'operar' }).neta).toBeCloseTo(cicloVapor().neta, 6);
        expect(calcular({ modo: 'apagar', tApagado: 60 }).neta).toBe(0);
        expect(calcular({ modo: 'presion' }).neta).toBeCloseTo(aguaAPresion().ciclo.neta, 6);
        const apagada = pose({ modo: 'apagar', tApagado: 3600 });
        expect(apagada.flujos.vaporFuera0).toBe(0);
        expect(apagada.flujos.bypass).toBeGreaterThan(0);
        const sinRed = pose({ modo: 'apagar', tApagado: 3600, sinRed: true });
        expect(sinRed.flujos.bypass).toBe(0);
        expect(sinRed.flujos.rcicAgua1).toBeGreaterThan(0);
        expect(sinRed.flujos.dieselElec).toBe(1);
        expect(pose({ modo: 'operar' }).flujos.bypass).toBe(0);
        expect(pose({ modo: 'presion' }).flujos.calienteA).toBe(1);
    });

    it('la pose responde al desarme y sus puntos clave caben en el bloque', () => {
        expect(pose({ modo: 'operar', desarme: 1 }).desarme).toBe(1);
        for (const p of PARTES) {
            expect(p.vista).toBeTruthy();
            expect(p.ancla[1]).toBeGreaterThanOrEqual(BLOQUE.y[0]);
        }
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['nuclear', 'nuclear-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.nuclear.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.nuclear.fuentes.map(f => f.acervo);
        expect(acervos).toContain('LSE');
        expect(acervos).toContain('BME');
        expect(acervos).toContain('RISENER');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.nuclear;
        expect(c.figura).toBe('nuclear');
        expect(c.nivel).toBe(3);
        expect(c.antes).toEqual(['generador', 'ciclo-combinado']);
        expect(c.partes).toHaveLength(PARTES.length);
        // Aprende y la figura se hablan por el número de la parte, así que el orden debe ser el mismo en los tres lugares
        const fuente = readFileSync('conceptos-3d/nuclear/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const PARTES = FICHAS'));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-z]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.partes.map(p => p.nombre)).toContain('RNT y RGD');
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita la ley nuclear y la LSE, y explica las siglas de la red', () => {
        const c = CONCEPTO.nuclear;
        expect(c.ley.ficha.articulos.some(a => a.siglas === 'Ley nuclear' && a.refs.includes('15'))).toBe(true);
        expect(c.ley.ficha.articulos.some(a => a.siglas === 'LSE' && a.refs.includes('XXI'))).toBe(true);
        const texto = JSON.stringify(c);
        expect(texto).toContain('Red Nacional de Transmisión');
        expect(texto).toContain('Redes Generales de Distribución');
        expect(texto).toContain('agua en ebullición');
    });
});
