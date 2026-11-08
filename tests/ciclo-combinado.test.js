import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { ARRANQUES, BLOQUE, DEF, EQUIPO, LINEAS, PARTES, RECUPERADOR, arranque, bulboHumedo, calcular, central, estadoPlanta, pasoPlanta, pose, puntasSueltas, revisar, tEnQueDa, turbinaGas } from '../conceptos-3d/ciclo-combinado/modelo.js';
import { FUENTES } from '../conceptos-3d/ciclo-combinado/fuentes.js';

const correr = (s, m, segundos) => { let r = s; for (let i = 0; i < segundos * 20; i++) r = pasoPlanta(r, m, 0.05); return r; };
const articulo = (archivo, n) => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    const lista = Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
    return lista.find(a => a.articulo_num === n && !a.transitorio_num).texto;
};

describe('Central de ciclo combinado', () => {
    it('sus cifras salen de la física y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada tubo toca un equipo o a otro tubo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
    });

    it('la turbina de gas da lo que publica Siemens', () => {
        const g = turbinaGas();
        expect(g.W).toBeCloseTo(EQUIPO.potenciaTG, -1);
        expect(g.eficiencia).toBeGreaterThan(0.395);
        expect(g.eficiencia).toBeLessThan(0.408);
        expect(g.mEsc).toBeGreaterThan(632);
        expect(g.mEsc).toBeLessThan(648);
        expect(g.tEscape).toBeGreaterThan(622);
        expect(g.tEscape).toBeLessThan(638);
    });

    it('en 1×1 y 2×1 da lo del catálogo, con cerca de 60 de cada 100', () => {
        const uno = central({ dos: false });
        const dos = central();
        expect(uno.neta).toBeGreaterThan(EQUIPO.unoPorUno - 8);
        expect(uno.neta).toBeLessThan(EQUIPO.unoPorUno + 8);
        expect(dos.neta).toBeGreaterThan(EQUIPO.dosPorUno - 12);
        expect(dos.neta).toBeLessThan(EQUIPO.dosPorUno + 12);
        expect(dos.eficiencia).toBeGreaterThanOrEqual(0.595);
        expect(dos.eficiencia).toBeLessThan(0.615);
        // la turbina de vapor da cerca de la mitad de lo que dan las de gas, y es una sola
        expect(dos.brutaVapor / dos.brutaGas).toBeGreaterThan(0.48);
        expect(dos.brutaVapor / dos.brutaGas).toBeLessThan(0.55);
    });

    it('el reparto del gas cuadra con la potencia que sale a la red', () => {
        const { reparto: r } = central();
        expect(r.gas + r.vapor - r.propia).toBeCloseTo(r.red, 6);
        // lo que falta para cien es lo poco que se calientan los generadores
        const suma = r.gas + r.vapor + r.torre + r.chimenea;
        expect(suma).toBeGreaterThan(0.98);
        expect(suma).toBeLessThanOrEqual(1);
    });

    it('en ciclo abierto no hay vapor, gasta más gas por MWh y los gases salen calientes', () => {
        const ab = central({ abierto: 1 });
        const cc = central();
        expect(ab.brutaVapor).toBe(0);
        expect(ab.Qc).toBe(0);
        expect(ab.tChim).toBeCloseTo(ab.g.tEscape, 6);
        expect(ab.Qgas).toBeCloseTo(cc.Qgas, 6);
        expect(cc.eficiencia / ab.eficiencia).toBeGreaterThan(1.4);
        expect(ab.co2MWh).toBeGreaterThan(cc.co2MWh);
    });

    it('dentro del recuperador los gases siempre van más calientes que el agua', () => {
        const r = central().r;
        const gases = q => r.tChim + ((r.T4 - r.tChim) * q) / r.Q;
        for (const [q, t] of r.perfil) expect(gases(q)).toBeGreaterThan(t);
        for (let i = 1; i < r.perfil.length; i++) {
            expect(r.perfil[i][0]).toBeGreaterThanOrEqual(r.perfil[i - 1][0]);
            expect(r.perfil[i][1]).toBeGreaterThanOrEqual(r.perfil[i - 1][1]);
        }
        expect(r.tAP).toBeLessThanOrEqual(RECUPERADOR.aMax);
    });

    it('con calor o con altura da menos, y el enfriador recupera una parte', () => {
        const a = [5, 15, 25, 35, 45].map(tAire => central({ tAire }).neta);
        for (let i = 1; i < a.length; i++) expect(a[i]).toBeLessThan(a[i - 1]);
        const h = [0, 1000, 2240].map(altitud => central({ altitud }).neta);
        for (let i = 1; i < h.length; i++) expect(h[i]).toBeLessThan(h[i - 1]);
        expect(central({ tAire: 40, humedad: 28, enfriar: true }).neta).toBeGreaterThan(central({ tAire: 40, humedad: 28 }).neta);
        // el enfriador no puede bajar del bulbo húmedo
        expect(turbinaGas({ tAire: 40, humedad: 28, enfriar: true }).tAireC).toBeGreaterThan(bulboHumedo(40, 0.28));
        // el modelo llega a los 770 MW de Empalme I con calor de Sonora
        expect(tEnQueDa(EQUIPO.empalme1)).toBeGreaterThan(30);
        expect(tEnQueDa(EQUIPO.empalme1)).toBeLessThan(42);
    });

    it('al bajar la carga, la turbina de gas responde primero y la de vapor le sigue después', () => {
        const m = { modo: 'combinado', carga: 0.6 };
        const pronto = correr(estadoPlanta(), m, 4);
        expect(pronto.tg).toBeCloseTo(0.6, 3);
        expect(pronto.lenta).toBeGreaterThan(0.75);
        const luego = correr(pronto, m, 60);
        expect(luego.lenta).toBeCloseTo(0.6, 3);
    });

    it('no depende de la velocidad de los cuadros', () => {
        const m = { modo: 'abierto', carga: 0.8 };
        let lento = estadoPlanta();
        for (let i = 0; i < 40; i++) lento = pasoPlanta(lento, m, 0.25);
        const rapido = correr(estadoPlanta(), m, 10);
        expect(lento.tg).toBeCloseTo(rapido.tg, 6);
        expect(lento.vapor).toBeCloseTo(rapido.vapor, 2);
        expect(lento.abierto).toBeCloseTo(rapido.abierto, 6);
    });

    it('el arranque dura lo publicado y termina con las dos turbinas a plena carga', () => {
        expect(ARRANQUES.caliente.total).toBe(30);
        expect(ARRANQUES.frio.total).toBe(240);
        for (const tipo of ['caliente', 'frio']) {
            expect(arranque(0, tipo).tg).toBe(0);
            const fin = arranque(ARRANQUES[tipo].total, tipo);
            expect(fin.tg).toBe(1);
            expect(fin.vapor).toBe(1);
            let antes = 0;
            for (let m = 0; m <= ARRANQUES[tipo].total; m += 2) {
                const a = arranque(m, tipo);
                expect(a.tg + a.vapor).toBeGreaterThanOrEqual(antes);
                antes = a.tg + a.vapor;
            }
        }
        // la de vapor siempre va detrás de la de gas
        expect(arranque(10, 'caliente').vapor).toBeLessThan(arranque(10, 'caliente').tg);
        expect(calcular({ modo: 'arranque', min: 0 }).neta).toBe(0);
    });

    it('los modos llevan su potencia al tablero y a los tubos', () => {
        expect(calcular({ modo: 'combinado' }).neta).toBeCloseTo(central().neta, 6);
        expect(calcular({ modo: 'abierto' }).neta).toBeCloseTo(central({ abierto: 1 }).neta, 6);
        expect(calcular({ modo: 'clima', tAire: 35 }).neta).toBeCloseTo(central({ tAire: 35 }).neta, 6);
        const combinado = pose({ modo: 'combinado' });
        expect(combinado.flujos.chimA).toBeGreaterThan(0);
        expect(combinado.flujos.pasoA).toBe(0);
        const abierta = pose({ modo: 'abierto' });
        expect(abierta.flujos.chimA).toBe(0);
        expect(abierta.flujos.pasoA).toBeGreaterThan(0);
        expect(abierta.flujos.apA).toBe(0);
        expect(abierta.flujos.torreVa).toBe(0);
        // con una sola turbina de gas, el segundo tren se queda quieto
        const uno = pose({ modo: 'combinado', dos: false });
        for (const L of LINEAS.filter(l => l.tren === 'B')) expect(uno.flujos[L.id]).toBe(0);
        expect(uno.flujos.apA).toBeGreaterThan(0);
    });

    it('la pose responde al desarme y sus puntos clave caben en el bloque', () => {
        expect(pose({ modo: 'combinado', desarme: 1 }).desarme).toBe(1);
        expect(DEF.tAire).toBe(15);
        for (const p of PARTES) {
            expect(p.vista).toBeTruthy();
            expect(p.ancla[0]).toBeGreaterThanOrEqual(BLOQUE.x[0]);
            expect(p.ancla[0]).toBeLessThanOrEqual(BLOQUE.x[1]);
            expect(p.ancla[1]).toBeGreaterThanOrEqual(BLOQUE.y[0]);
        }
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['ciclo-combinado', 'ciclo-combinado-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO['ciclo-combinado'].fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO['ciclo-combinado'].fuentes.map(f => f.acervo);
        for (const siglas of ['LSE', 'RLSE', 'LCNE', 'LSH']) expect(acervos).toContain(siglas);
        // las Bases del Mercado de 2015 son referencia heredada: no se citan como vigentes
        expect(acervos).not.toContain('BME');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO['ciclo-combinado'];
        expect(c.figura).toBe('ciclo-combinado');
        expect(c.nivel).toBe(3);
        expect(c.antes).toEqual(['generador', 'transformador']);
        expect(c.partes).toHaveLength(PARTES.length);
        // Aprende y la figura se hablan por el número de la parte, así que el orden debe ser el mismo en los tres lugares
        const fuente = readFileSync('conceptos-3d/ciclo-combinado/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.partes.map(p => p.nombre)).toContain('RNT y RGD');
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso, y explica las siglas de la red', () => {
        const c = CONCEPTO['ciclo-combinado'];
        const LSE = 'Ley_Sector_Electrico_chunks.json';
        expect(articulo(LSE, 19)).toContain('0.7 MW');
        expect(articulo(LSE, 37)).toContain('contratos de interconexión');
        expect(articulo(LSE, 40)).toContain('cincuenta y cuatro por ciento');
        expect(articulo(LSE, 114)).toContain('contrato de Participante del Mercado');
        // el 114 no habla de interconexión: eso está en el 37 y el 49
        expect(articulo(LSE, 114)).not.toContain('interconexión');
        expect(articulo(LSE, 117)).toContain('asignación y despacho');
        expect(articulo(LSE, 3)).toContain('Energías Limpias: Aquellas');
        expect(articulo(LSE, 3)).not.toMatch(/Energías Limpias: Aquellas[\s\S]*gas natural[\s\S]*XXII\./);
        expect(articulo('LCNE_chunks.json', 8)).toContain('permisos de generación');
        expect(articulo('LSH_chunks.json', 100)).toContain('gestor y administrador independiente');
        expect(articulo('LSH_chunks.json', 104)).toContain('acceso abierto');
        const refs = c.ley.ficha.articulos.map(a => `${a.siglas} ${a.refs}`).join(' | ');
        expect(refs).toContain('Arts. 49, 114 y 117');
        expect(refs).toContain('LSH Arts. 99, 100 y 104');
        const texto = JSON.stringify(c);
        expect(texto).toContain('Red Nacional de Transmisión');
        expect(texto).toContain('Redes Generales de Distribución');
        expect(texto).toContain('Empalme');
    });
});
