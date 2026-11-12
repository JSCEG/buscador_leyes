import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { BLOQUE, BORNES, CENTRAL, CLIMA, GIRO_MAX, LINEAS, MODULO, PARTES, POR_CADENA, PVGIS, REMATE, SAE_DEF, anual, calcular, central, cieloDelMes, curvaModulo, dia, diaConSAE, enHora, estadoPlanta, ghiDespejadoDia, giroSeguidor, inversor, luzDespejada, nubeTapa, pasoPlanta, pose, potenciaModulo, puntasSueltas, puntosModulo, revisar, solEn, tCelda } from '../conceptos-3d/fotovoltaica/modelo.js';
import { cablesSueltos } from '../conceptos-3d/planta-comun/lineas.js';
import { FUENTES } from '../conceptos-3d/fotovoltaica/fuentes.js';

const correr = (s, m, segundos) => { let r = s; for (let i = 0; i < segundos * 20; i++) r = pasoPlanta(r, m, 0.05); return r; };
const articulo = (archivo, n) => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    const lista = Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
    return lista.find(a => a.articulo_num === n && !a.transitorio_num).texto;
};

describe('Central fotovoltaica', () => {
    it('sus cifras salen de la física y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada cable toca un equipo, una fila u otro cable en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
    });

    it('cada cable llega a un borne: los de piso van delgados por la zanja y las líneas aéreas son tres fases', () => {
        expect(cablesSueltos(LINEAS, BORNES, REMATE)).toEqual([]);
        for (const L of LINEAS.filter(l => l.cable && !l.apoyos)) expect(L.r).toBeLessThanOrEqual(0.02);
        // cada cadena corre bajo el tubo del seguidor, baja por el último poste y va por el piso a su caja
        for (let i = 0; i < 6; i++) {
            const L = LINEAS.find(l => l.id === `cadena${i}`);
            expect(L.puntos[0]).toBe(BORNES[`cadena${i}`]);
            expect(L.puntos[1]).toBe(BORNES[`finFila${i}`]);
            for (const p of L.puntos.slice(2, -1)) expect(p[1]).toBeLessThanOrEqual(0.06);
            expect(L.puntos.at(-1)).toBe(BORNES[`cajaCadena${i}`]);
        }
        const aereas = LINEAS.filter(l => l.apoyos);
        expect(aereas.map(l => l.id)).toEqual(['mtPuente', 'alta', 'rnt', 'rgd']);
        for (const L of aereas) {
            expect(L.oculto).toBe(true);
            for (const a of L.apoyos) expect(Math.hypot(...a.fase)).toBeGreaterThan(0.05);
        }
        expect(LINEAS.find(l => l.id === 'rnt').apoyos.map(a => a.p)).toEqual([BORNES.porticoAmarre, BORNES.torre1, BORNES.torre2, BORNES.remateReductora, BORNES.altaReductora]);
    });

    it('el módulo da lo que dice su ficha técnica', () => {
        expect(potenciaModulo(1000, 25)).toBeCloseTo(MODULO.pmp, 6);
        expect(potenciaModulo(800, tCelda(20, 800))).toBeCloseTo(MODULO.pNoct, -1);
        expect(tCelda(20, 800)).toBeCloseTo(MODULO.noct, 6);
        // la curva pasa justo por sus tres puntos
        const c = curvaModulo(1000, 25);
        expect(c.i(0)).toBeCloseTo(MODULO.isc, 2);
        expect(c.i(MODULO.vmp)).toBeCloseTo(MODULO.imp, 2);
        expect(c.i(MODULO.voc)).toBe(0);
    });

    it('la cadena no pasa de 1,500 V ni con frío', () => {
        expect(POR_CADENA).toBe(28);
        expect(POR_CADENA * MODULO.voc * (1 + MODULO.gV * (0 - 25))).toBeLessThanOrEqual(MODULO.vSistema);
        expect((POR_CADENA + 1) * MODULO.voc * (1 + MODULO.gV * (0 - 25))).toBeGreaterThan(MODULO.vSistema);
    });

    it('el sol sale por el este, se mete por el oeste y en Sonora siempre pasa por el sur en invierno', () => {
        expect(solEn(8, 6).x).toBeGreaterThan(0);
        expect(solEn(16, 6).x).toBeLessThan(0);
        expect(solEn(12, 12).z).toBeGreaterThan(0.7);
        expect(solEn(12, 6).elev).toBeGreaterThan(solEn(12, 12).elev);
        expect(solEn(0, 6).elev).toBeLessThan(0);
        expect(luzDespejada(solEn(0, 6)).ghi).toBe(0);
    });

    it('cada mes da la luz que mide NASA POWER en el sitio', () => {
        for (let m = 1; m <= 12; m++) expect(ghiDespejadoDia(m) * cieloDelMes(m)).toBeCloseTo(CLIMA.ghi[m - 1], 6);
        const A = anual();
        expect(A.meses[5].gwh).toBeGreaterThan(A.meses[11].gwh * 1.5);
    });

    it('el reparto de la luz suma 100 y casi toda se vuelve calor', () => {
        const r = central().reparto;
        const suma = r.reflejo + r.polvo + r.calor + r.cables + r.inversor + r.transporte + r.red;
        expect(suma).toBeCloseTo(1, 6);
        expect(r.calor).toBeGreaterThan(0.7);
        expect(r.red).toBeGreaterThan(0.13);
        expect(r.red).toBeLessThan(0.2);
        expect(central({ hora: 0 }).red).toBe(0);
    });

    it('con calor y con polvo da menos', () => {
        const a = [5, 15, 25, 35, 45].map(tAire => central({ hora: 12, tAire }).pm);
        for (let i = 1; i < a.length; i++) expect(a[i]).toBeLessThan(a[i - 1]);
        // el calor baja el voltaje y casi no cambia la corriente
        const [frio, caliente] = [puntosModulo(1000, 25), puntosModulo(1000, 65)];
        expect(caliente.voc).toBeLessThan(frio.voc * 0.9);
        expect(caliente.isc).toBeGreaterThan(frio.isc);
        expect(central({ hora: 12, polvo: 10 }).pm).toBeLessThan(central({ hora: 12, polvo: 0 }).pm);
    });

    it('el seguidor mira al sol, regresa al amanecer y de noche se queda plano', () => {
        expect(giroSeguidor(solEn(9, 6))).toBeGreaterThan(0);
        expect(giroSeguidor(solEn(15, 6))).toBeLessThan(0);
        expect(giroSeguidor(solEn(0, 6))).toBe(0);
        for (let h = 5; h < 20; h += 0.25) expect(Math.abs(giroSeguidor(solEn(h, 6)))).toBeLessThanOrEqual(GIRO_MAX);
        // con el sol bajo se regresa para no hacerse sombra
        const bajo = solEn(5.75, 6);
        expect(Math.abs(giroSeguidor(bajo))).toBeLessThan(Math.abs(giroSeguidor(bajo, { regresa: false })));
    });

    it('el seguidor gana sobre la mesa fija, sobre todo temprano', () => {
        const [s, f] = [anual(), anual({ seguidor: false })];
        expect(s.gwh / f.gwh).toBeGreaterThan(1.15);
        expect(s.gwh / f.gwh).toBeLessThan(1.33);
        expect(central({ hora: 8, mes: 6 }).red).toBeGreaterThan(central({ hora: 8, mes: 6, seguidor: false }).red * 1.5);
        // sin recorte, queda cerca de lo que calcula PVGIS para el mismo punto
        expect(anual({ seguidor: false, ilr: 1 }).porKw / PVGIS.fija).toBeGreaterThan(0.92);
        expect(anual({ seguidor: false, ilr: 1 }).porKw / PVGIS.fija).toBeLessThan(1.12);
    });

    it('el inversor no entrega más que su tamaño, y sobredimensionar rinde cada vez menos', () => {
        expect(inversor(1100, 800).ca).toBe(800);
        expect(inversor(1100, 800).recorte).toBeGreaterThan(0);
        expect(inversor(400, 800).recorte).toBe(0);
        expect(central({ hora: 12, ilr: 1.6 }).ca).toBe(CENTRAL.mwCA);
        const f = [1, 1.2, 1.4, 1.6].map(ilr => anual({ ilr }).factorCA);
        expect(f[1] - f[0]).toBeGreaterThan(f[3] - f[2]);
        expect(anual({ ilr: 1.6 }).recorteFrac).toBeGreaterThan(anual({ ilr: 1.25 }).recorteFrac);
    });

    it('el SAEE no inventa energía: entrega lo que tomó menos sus pérdidas', () => {
        const S = diaConSAE();
        expect(S.entregado / S.cargado).toBeCloseTo(SAE_DEF.ida, 6);
        expect(S.entregado).toBeCloseTo(S.cap, 3);
        for (const f of S.filas) {
            expect(f.soc).toBeGreaterThanOrEqual(0);
            expect(f.soc).toBeLessThanOrEqual(1.0001);
            expect(f.carga * f.descarga).toBe(0);
        }
        // entrega cuando lo solar ya no alcanza
        expect(enHora(S.filas, 20, 'descarga')).toBeGreaterThan(0);
        expect(enHora(S.filas, 20, 'red')).toBe(0);
        const nada = diaConSAE({ pct: 0 });
        expect(nada.entregado).toBe(0);
        expect(nada.filas.every(f => f.total === f.red)).toBe(true);
    });

    it('la nube pasa y se va, y el tiempo no depende de los cuadros', () => {
        expect(nubeTapa(0)).toBe(0);
        expect(nubeTapa(0.5)).toBeCloseTo(1, 6);
        const m = { giro: 30, seguidor: true };
        const s = { ...estadoPlanta(), nube: 0 };
        let lento = s;
        for (let i = 0; i < 16; i++) lento = pasoPlanta(lento, m, 0.25);
        const rapido = correr(s, m, 4);
        expect(lento.nube).toBeCloseTo(rapido.nube, 6);
        expect(lento.giro).toBeCloseTo(rapido.giro, 6);
        expect(calcular({ modo: 'dia', planta: { ...estadoPlanta(), nube: 0.5 } }).red).toBeLessThan(calcular({ modo: 'dia' }).red * 0.5);
        expect(correr(s, m, 20).nube).toBe(1);
    });

    it('los modos llevan su potencia al tablero y a los cables', () => {
        expect(calcular({ modo: 'dia' }).red).toBeCloseTo(central().red, 6);
        expect(calcular({ modo: 'calor', tAire: 45 }).c.tAire).toBe(45);
        expect(calcular({ modo: 'seguidor', seguidor: false, hora: 8 }).red).toBeLessThan(calcular({ modo: 'seguidor', seguidor: true, hora: 8 }).red);
        expect(calcular({ modo: 'inversor', ilr: 1.6 }).c.mwCD0).toBeCloseTo(CENTRAL.mwCA * 1.6, 6);
        // de noche no corre nada por los cables, salvo que entregue el SAEE
        const noche = pose({ modo: 'dia', hora: 23 });
        for (const L of LINEAS) expect(noche.flujos[L.id]).toBe(0);
        const tarde = pose({ modo: 'sae', hora: 20 });
        expect(tarde.flujos.cadena0).toBe(0);
        expect(tarde.flujos.saeBus).toBeGreaterThan(0);
        expect(tarde.flujos.rnt).toBeGreaterThan(0);
        expect(pose({ modo: 'dia', hora: 12 }).flujos.cadena0).toBeGreaterThan(0);
        expect(pose({ modo: 'dia', hora: 23 }).noche).toBe(1);
        expect(pose({ modo: 'dia', hora: 12 }).noche).toBe(0);
    });

    it('un día despejado sube y baja con el sol', () => {
        const d = dia({ mes: 6 });
        expect(enHora(d.filas, 3, 'red')).toBe(0);
        expect(enHora(d.filas, 12, 'red')).toBeGreaterThan(700);
        expect(d.pico).toBeLessThanOrEqual(central().redMax + 0.001);
    });

    it('la pose responde al desarme y sus puntos clave caben en el bloque', () => {
        expect(pose({ modo: 'dia', desarme: 1 }).desarme).toBe(1);
        for (const p of PARTES) {
            expect(p.vista).toBeTruthy();
            expect(p.ancla[0]).toBeGreaterThanOrEqual(BLOQUE.x[0]);
            expect(p.ancla[0]).toBeLessThanOrEqual(BLOQUE.x[1]);
            expect(p.ancla[1]).toBeGreaterThanOrEqual(BLOQUE.y[0]);
        }
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['fotovoltaica', 'fotovoltaica-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.fotovoltaica.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.fotovoltaica.fuentes.map(f => f.acervo);
        for (const siglas of ['LSE', 'RLSE', 'LCNE']) expect(acervos).toContain(siglas);
        // las Bases del Mercado de 2015 son referencia heredada: no se citan como vigentes
        expect(acervos).not.toContain('BME');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.fotovoltaica;
        expect(c.figura).toBe('fotovoltaica');
        expect(c.nivel).toBe(3);
        expect(c.antes).toEqual(['cd-ca', 'generador', 'transformador']);
        expect(c.partes).toHaveLength(PARTES.length);
        // Aprende y la figura se hablan por el número de la parte, así que el orden debe ser el mismo en los tres lugares
        const fuente = readFileSync('conceptos-3d/fotovoltaica/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.partes.map(p => p.nombre)).toContain('RNT y RGD');
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso, y no repite lo que no se pudo respaldar', () => {
        const c = CONCEPTO.fotovoltaica;
        const LSE = 'Ley_Sector_Electrico_chunks.json';
        expect(articulo(LSE, 3)).toContain('La radiación solar');
        expect(articulo(LSE, 17)).toContain('Generación Distribuida');
        expect(articulo(LSE, 19)).toContain('0.7 MW');
        expect(articulo(LSE, 19)).toContain('Generadoras Exentas');
        expect(articulo(LSE, 30)).toContain('entre 0.7 y 20 MW');
        expect(articulo(LSE, 32)).toContain('respaldo propio');
        expect(articulo(LSE, 85)).toContain('Sistemas de Almacenamiento de Energía Eléctrica');
        expect(articulo('RLSE_chunks.json', 58)).toContain('trámite simplificado');
        expect(articulo('RLSE_chunks.json', 59)).toContain('respaldo propio');
        expect(articulo('LCNE_chunks.json', 8)).toContain('permisos de generación');
        const texto = JSON.stringify(c);
        expect(texto).toContain('Red Nacional de Transmisión');
        expect(texto).toContain('Redes Generales de Distribución');
        expect(texto).toContain('Sistema de Almacenamiento de Energía Eléctrica (SAEE)');
        expect(texto).toContain('Puerto Peñasco');
        // lo que decía antes y no aparece en la ley
        expect(texto).not.toContain('ventanilla');
        // la sigla del sitio es SAEE, con doble E
        expect(texto).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        // las Disposiciones de abril de 2026 no fijan el 30 %: solo se menciona como idea equivocada
        expect(c.errores.some(e => e.idea.includes('30 %'))).toBe(true);
        expect(c.claves.join(' ')).not.toContain('30 %');
    });
});
