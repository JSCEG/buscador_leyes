import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { BETZ, BLOQUE, BORNES, CP_MAX, CURVA_V126, LAMBDA_OPT, LINEAS, PARTES, PARQUE, REMATE, SEPARACION, SITIOS, TURBINA, aerogenerador, anual, calcular, cp, deficit, densidad, estadoPlanta, fila, pasoPlanta, pose, puntasSueltas, reparto, revisar, vientoA, vientoTormenta, weibull } from '../conceptos-3d/eolica/modelo.js';
import { cablesSueltos } from '../conceptos-3d/planta-comun/lineas.js';
import { FUENTES } from '../conceptos-3d/eolica/fuentes.js';

const correr = (s, m, segundos) => { let r = s; for (let i = 0; i < segundos * 20; i++) r = pasoPlanta(r, m, 0.05); return r; };
const articulo = (archivo, n) => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    const lista = Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
    return lista.find(a => a.articulo_num === n && !a.transitorio_num).texto.replace(/\s+/g, ' ');
};

describe('Central eólica', () => {
    it('sus cifras salen de la física y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada cable toca un equipo, una torre u otro cable en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
    });

    it('cada cable llega a un borne: los de media tensión van delgados por la zanja y las líneas aéreas son tres fases', () => {
        expect(cablesSueltos(LINEAS, BORNES, REMATE)).toEqual([]);
        // los cables del parque: delgados, por el piso, y solo sus puntas en la caja del pie y en la caja de media tensión
        for (const id of ['col0', 'col1', 'col2']) {
            const L = LINEAS.find(l => l.id === id);
            expect(L.cable).toBe(true);
            expect(L.r).toBeLessThanOrEqual(0.02);
            for (const p of L.puntos.slice(1, -1)) expect(p[1]).toBeLessThanOrEqual(0.06);
        }
        const aereas = LINEAS.filter(l => l.apoyos);
        expect(aereas.map(l => l.id)).toEqual(['alta', 'rnt', 'rgd']);
        for (const L of aereas) {
            expect(L.oculto).toBe(true);
            for (const a of L.apoyos) expect(Math.hypot(...a.fase)).toBeGreaterThan(0.05);
        }
        // la RNT se amarra en el pórtico, pasa por las dos torres y baja a las boquillas de la reductora
        expect(LINEAS.find(l => l.id === 'rnt').apoyos.map(a => a.p)).toEqual([BORNES.porticoAmarre, BORNES.torre1, BORNES.torre2, BORNES.remateReductora, BORNES.altaReductora]);
    });

    it('el modelo da la curva publicada de la máquina hermana, a cerca de 1 % desde 6 m/s', () => {
        for (const [v, kw] of CURVA_V126.puntos.filter(([x]) => x >= 6 && x <= 20)) {
            expect(Math.abs(aerogenerador(v, { D: CURVA_V126.D }).mw * 1000 / kw - 1)).toBeLessThan(0.015);
        }
    });

    it('el viento lleva energía al cubo y ningún rotor pasa del límite de Betz', () => {
        const a = aerogenerador(4, { rho: 1.225 });
        const b = aerogenerador(8, { rho: 1.225 });
        expect(b.Pviento / a.Pviento).toBeCloseTo(8, 6);
        expect(BETZ).toBeCloseTo(16 / 27, 6);
        expect(CP_MAX).toBeLessThan(BETZ);
        for (let l = 1; l < 16; l += 0.5) expect(cp(l, 0)).toBeLessThanOrEqual(CP_MAX + 1e-6);
        expect(LAMBDA_OPT).toBeGreaterThan(7);
        expect(LAMBDA_OPT).toBeLessThan(9);
    });

    it('arranca, llega a su tamaño, suelta lo que sobra y se detiene', () => {
        expect(aerogenerador(2.9).mw).toBe(0);
        expect(aerogenerador(4).mw).toBeGreaterThan(0);
        expect(aerogenerador(11).mw).toBeGreaterThan(TURBINA.mw * 0.98);
        expect(aerogenerador(20).mw).toBeLessThanOrEqual(TURBINA.mw + 1e-6);
        expect(aerogenerador(15).beta).toBeGreaterThan(15);
        expect(aerogenerador(15).beta).toBeLessThan(30);
        expect(aerogenerador(7).beta).toBeLessThan(1);
        expect(aerogenerador(TURBINA.Vparo).mw).toBe(0);
        // con más viento, siempre más: hasta su tamaño nunca baja
        for (let v = 3; v < 22; v += 0.5) expect(aerogenerador(v + 0.5).mw).toBeGreaterThanOrEqual(aerogenerador(v).mw - 1e-4);
    });

    it('el reparto del viento suma 100 y lo que sigue de largo es lo que Betz no deja tomar', () => {
        for (const v of [5, 8, 11, 15, 20]) {
            const r = reparto(aerogenerador(v));
            expect(r.red + r.suelta + r.maquina + r.aspas + r.sigue).toBeCloseTo(1, 6);
            expect(r.sigue).toBeCloseTo(1 - BETZ, 6);
        }
        expect(reparto(aerogenerador(15)).suelta).toBeGreaterThan(reparto(aerogenerador(8)).suelta);
        expect(reparto(aerogenerador(25)).hay).toBe(false);
    });

    it('girar el aspa y desviar la góndola le quitan potencia', () => {
        const v = 9;
        const P = aerogenerador(v).mw;
        expect(aerogenerador(v, { paso: 10 }).mw).toBeLessThan(P);
        expect(aerogenerador(v, { paso: 90 }).mw).toBe(0);
        const d = [0, 15, 30, 45].map(desvio => aerogenerador(8, { desvio }).mw);
        for (let i = 1; i < d.length; i++) expect(d[i]).toBeLessThan(d[i - 1]);
        expect(1 - d[2] / d[0]).toBeGreaterThan(0.3);
        expect(1 - d[2] / d[0]).toBeLessThan(0.4);
    });

    it('más arriba hay más viento y más energía; el aire caliente y alto pesa menos', () => {
        expect(vientoA(6.84, 112)).toBeCloseTo(7.68, 1);
        const f = TURBINA.bujes.map(buje => anual({ buje }).factor);
        for (let i = 1; i < f.length; i++) expect(f[i]).toBeGreaterThan(f[i - 1]);
        expect(densidad(0, 15)).toBeCloseTo(1.225, 2);
        expect(densidad(0, 35)).toBeLessThan(densidad(0, 15));
        expect(densidad(1000, 15)).toBeLessThan(densidad(0, 15));
    });

    it('el reparto de los vientos de un mes suma una probabilidad de 1', () => {
        let total = 0;
        for (let v = 0; v < 40; v += 0.05) total += weibull(v + 0.025, 7) * 0.05;
        expect(total).toBeCloseTo(1, 2);
    });

    it('cada sitio da según el viento que mide NASA POWER, y queda arriba del promedio de México', () => {
        for (const S of Object.values(SITIOS)) expect(S.ws50).toHaveLength(12);
        const [r, i] = [anual({ sitio: 'reynosa' }), anual({ sitio: 'istmo' })];
        expect(i.gwh).toBeGreaterThan(r.gwh);
        expect(r.parque).toBeCloseTo(r.gwh * PARQUE.n, 6);
        expect(r.factor).toBeGreaterThan(0.322);
        expect(r.factor).toBeLessThan(0.55);
        // en el Istmo, los nortes de invierno
        expect(i.meses[0].gwh).toBeGreaterThan(i.meses[5].gwh * 1.5);
    });

    it('la estela se recupera con la distancia, y el de adelante no pierde nada', () => {
        const d = [3, 5, 7, 10, 12].map(x => deficit(x));
        for (let i = 1; i < d.length; i++) expect(d[i]).toBeLessThan(d[i - 1]);
        const f = [3, 7, 12].map(x => fila(9, 3, x));
        expect(f[0].perdida).toBeGreaterThan(f[1].perdida);
        expect(f[1].perdida).toBeGreaterThan(f[2].perdida);
        expect(f[1].lista[0].mw).toBeCloseTo(aerogenerador(9).mw, 6);
        expect(f[1].lista[2].mw).toBeLessThan(f[1].lista[1].mw);
        expect(SEPARACION).toBe(7);
    });

    it('con tormenta se detiene, y regresa hasta que baja el viento; el tiempo no depende de los cuadros', () => {
        const m = { v: 9, desvio: 0, paso: null };
        const s = { ...estadoPlanta(), tormenta: 0 };
        expect(Math.max(...[0.2, 0.4, 0.5, 0.6, 0.8].map(vientoTormenta))).toBeGreaterThan(TURBINA.Vparo);
        let lento = s;
        for (let i = 0; i < 16; i++) lento = pasoPlanta(lento, m, 0.25);
        const rapido = correr(s, m, 4);
        expect(lento.v).toBeCloseTo(rapido.v, 6);
        expect(lento.tormenta).toBeCloseTo(rapido.tormenta, 6);
        // en plena tormenta queda parado y de canto
        let t = s;
        let parado = false;
        for (let i = 0; i < 20 * 40; i++) { t = pasoPlanta(t, m, 0.05); if (t.parado) { parado = true; break; } }
        expect(parado).toBe(true);
        expect(calcular({ modo: 'viento', planta: t }).mw).toBe(0);
        // al final regresa: gira otra vez y las aspas vuelven a su sitio
        const fin = correr(t, m, 120);
        expect(fin.parado).toBe(false);
        expect(fin.rpm).toBeGreaterThan(5);
        expect(fin.beta).toBeLessThan(5);
        expect(calcular({ modo: 'viento', v: 9, planta: fin }).mw).toBeGreaterThan(2);
    });

    it('con las aspas de canto el rotor se frena solo, y mientras regresan no da de golpe', () => {
        const casiCanto = correr(estadoPlanta(), { v: 12, desvio: 0, paso: 90 }, 40);
        expect(casiCanto.rpm).toBeLessThan(1);
        const regresando = { ...estadoPlanta(), beta: 30, rpm: 8 };
        expect(calcular({ modo: 'viento', v: 9, planta: regresando }).mw).toBeLessThan(aerogenerador(9).mw * 0.2);
    });

    it('los modos llevan su potencia al tablero y a los cables', () => {
        expect(calcular({ modo: 'viento', v: 9 }).mw).toBeCloseTo(aerogenerador(9).mw, 6);
        expect(calcular({ modo: 'estela', v: 9, separacion: 7 }).fila.perdida).toBeCloseTo(fila(9, 3, 7).perdida, 6);
        // sin viento no corre nada por los cables
        const quieto = pose({ modo: 'viento', v: 1 });
        for (const L of LINEAS) expect(quieto.flujos[L.id]).toBe(0);
        const P = pose({ modo: 'viento', v: 12 });
        expect(LINEAS.some(L => P.flujos[L.id] > 0)).toBe(true);
    });

    it('la pose responde al desarme y sus puntos clave caben en el bloque', () => {
        expect(pose({ modo: 'viento', desarme: 1 }).desarme).toBe(1);
        for (const p of PARTES) {
            expect(p.vista).toBeTruthy();
            expect(p.ancla[0]).toBeGreaterThanOrEqual(BLOQUE.x[0]);
            expect(p.ancla[0]).toBeLessThanOrEqual(BLOQUE.x[1]);
            expect(p.ancla[1]).toBeGreaterThanOrEqual(BLOQUE.y[0]);
        }
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['eolica', 'eolica-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.eolica.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.eolica.fuentes.map(f => f.acervo);
        for (const siglas of ['LSE', 'RLSE', 'LCNE']) expect(acervos).toContain(siglas);
        // las Bases del Mercado de 2015 son referencia heredada: no se citan como vigentes
        expect(acervos).not.toContain('BME');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.eolica;
        expect(c.figura).toBe('eolica');
        expect(c.nivel).toBe(3);
        expect(c.antes).toEqual(['generador', 'transformador']);
        expect(c.partes).toHaveLength(PARTES.length);
        // Aprende y la figura se hablan por el número de la parte, así que el orden debe ser el mismo en los tres lugares
        const fuente = readFileSync('conceptos-3d/eolica/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.partes.map(p => p.nombre)).toContain('RNT y RGD');
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso, y no repite lo que no se pudo respaldar', () => {
        const c = CONCEPTO.eolica;
        const LSE = 'Ley_Sector_Electrico_chunks.json';
        const RLSE = 'RLSE_chunks.json';
        expect(articulo(LSE, 3)).toContain('El viento');
        expect(articulo(LSE, 3)).toContain('Manifestación de Impacto Social del Sector Energético');
        expect(articulo(LSE, 19)).toContain('0.7 MW');
        expect(articulo(LSE, 19)).toContain('Generadoras Exentas');
        expect(articulo(LSE, 30)).toContain('entre 0.7 y 20 MW');
        expect(articulo(LSE, 32)).toContain('respaldo propio');
        expect(articulo(LSE, 133)).toContain('pueblos y las comunidades indígenas y afromexicanas');
        expect(articulo(LSE, 134)).toContain('presencia de pueblos y comunidades');
        expect(articulo(LSE, 135)).toContain('consulta previa, libre e informada');
        expect(articulo(LSE, 136)).toContain('Manifestación de Impacto Social');
        expect(articulo(LSE, 137)).toContain('no requieran permiso');
        expect(articulo(LSE, 139)).toContain('noventa días naturales');
        expect(articulo(RLSE, 2)).toContain('Consulta Previa');
        expect(articulo(RLSE, 54)).toContain('exentos');
        expect(articulo(RLSE, 58)).toContain('trámite simplificado');
        expect(articulo(RLSE, 59)).toContain('respaldo propio');
        expect(articulo('LCNE_chunks.json', 8)).toContain('permisos de generación');
        const texto = JSON.stringify(c);
        expect(texto).toContain('Red Nacional de Transmisión');
        expect(texto).toContain('Redes Generales de Distribución');
        expect(texto).toContain('Sistema de Almacenamiento de Energía');
        expect(texto).toContain('Reynosa');
        expect(texto).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        // las Disposiciones de abril de 2026 no fijan el 30 %: solo se menciona como idea equivocada
        expect(c.errores.some(e => e.idea.includes('30 %'))).toBe(true);
        expect(c.claves.join(' ')).not.toContain('30 %');
    });
});
