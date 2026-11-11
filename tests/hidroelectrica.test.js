import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { AGUA, BLOQUE, CENTRAL, DEF, ETA, FIN_EVENTO, GOLPE_M, LINEAS, NIVEL, PARTES, REPARTO_MES, TIPOS, UNIDAD, VAIVEN, VIAJE, VOL_UTIL, anual, areaKm2, calcular, demandaEn, dia, enEvento, enHora, enSerie, estadoPlanta, etaTurbina, fugas, kwhPorM3, nivelDe, nivelEnMes, pasoPlanta, pose, potenciaMax, puntasSueltas, rechazo, reparto, revisar, terreno, unidad, volumen, CAVERNA, CORTINA, MAQUINA, Y } from '../conceptos-3d/hidroelectrica/modelo.js';
import { FUENTES } from '../conceptos-3d/hidroelectrica/fuentes.js';

const correr = (s, m, segundos) => { let r = s; for (let i = 0; i < segundos * 20; i++) r = pasoPlanta(r, m, 0.05); return r; };
const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).find(a => a.articulo_num === n && !a.transitorio_num).texto.replace(/\s+/g, ' ');
const ZD = NIVEL.abajo + UNIDAD.Hd + UNIDAD.perdida;

describe('Central hidroeléctrica', () => {
    it('sus cifras salen de la física y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada tubo y cable toca un equipo en sus dos puntas, y el agua no se sale del embalse', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(fugas()).toEqual([]);
    });

    it('en su punto de diseño da lo publicado, y la potencia crece con el agua y con la caída', () => {
        const u = unidad(1, ZD);
        expect(u.Q).toBeCloseTo(UNIDAD.Qd, 0);
        expect(u.Hn).toBeCloseTo(UNIDAD.Hd, 0);
        expect(u.P).toBeGreaterThan(372);
        expect(u.P).toBeLessThanOrEqual(UNIDAD.Pmax);
        const P = [0.2, 0.4, 0.6, 0.8, 1].map(a => unidad(a, ZD).P);
        for (let i = 1; i < P.length; i++) expect(P[i]).toBeGreaterThan(P[i - 1]);
        const N = [NIVEL.NAMINO, 540, ZD].map(potenciaMax);
        for (let i = 1; i < N.length; i++) expect(N[i]).toBeGreaterThan(N[i - 1]);
    });

    it('el generador pone el tope, y con el embalse bajo no llega a su tamaño', () => {
        const lleno = unidad(1, NIVEL.NAMO);
        expect(lleno.tope).toBe(true);
        expect(lleno.P).toBeCloseTo(UNIDAD.Pmax, 1);
        expect(lleno.a).toBeLessThan(1);
        const bajo = unidad(1, NIVEL.NAMINO);
        expect(bajo.tope).toBe(false);
        expect(bajo.P).toBeCloseTo(240, -1);
    });

    it('la turbina tiene su mejor punto antes del tope, y evita la media carga', () => {
        expect(etaTurbina(ETA.apertura)).toBeGreaterThan(etaTurbina(1));
        expect(etaTurbina(ETA.apertura)).toBeGreaterThan(etaTurbina(0.5));
        expect(etaTurbina(0.1)).toBe(0);
        expect(unidad(0.5, ZD).aspera).toBe(true);
        expect(unidad(ETA.apertura, ZD).aspera).toBe(false);
        // con el embalse bajo y todo abierto no es media carga, aunque dé poco
        expect(unidad(1, NIVEL.NAMINO).aspera).toBe(false);
        expect(unidad(0.05, ZD).P).toBe(0);
    });

    it('un metro cúbico deja lo que dice la ficha, y el reparto del agua suma 100', () => {
        expect(kwhPorM3(NIVEL.NAMO)).toBeCloseTo(0.46, 2);
        expect(kwhPorM3(NIVEL.NAMINO)).toBeCloseTo(0.31, 2);
        expect(kwhPorM3(ZD)).toBeCloseTo(0.42, 2);
        const R = reparto(unidad(ETA.apertura, ZD));
        expect(R.rozamiento + R.turbina + R.generador + R.transformador + R.red).toBeCloseTo(1, 6);
        expect(R.red).toBeGreaterThan(0.9);
        expect(reparto(unidad(0, ZD)).hay).toBe(false);
    });

    it('la curva del embalse da las cifras publicadas', () => {
        expect(volumen(NIVEL.NAME)).toBeCloseTo(2392, 0);
        expect(VOL_UTIL()).toBeGreaterThan(1375);
        expect(VOL_UTIL()).toBeLessThan(1410);
        expect(areaKm2(NIVEL.NAME)).toBeGreaterThan(31);
        expect(areaKm2(NIVEL.NAME)).toBeLessThan(CENTRAL.areaHa / 100 + 2);
        expect(nivelDe(volumen(540))).toBeCloseTo(540, 4);
    });

    it('un día concentra el agua en las horas de más demanda', () => {
        const D = dia({ agua: AGUA.promedio, z: DEF.nivel });
        expect(D.usado / (AGUA.promedio * 86400)).toBeGreaterThan(0.97);
        expect(D.usado / (AGUA.promedio * 86400)).toBeLessThan(1.03);
        expect(D.horasTope).toBeCloseTo(4.5, 0);
        expect(D.punta).toBeGreaterThan(0.5);
        expect(D.P(4)).toBe(0);
        expect(D.P(20.5)).toBeCloseTo(D.Ptot, 0);
        expect(demandaEn(20.5)).toBeCloseTo(1, 2);
        expect(enHora(4).n).toBe(0);
        expect(enHora(20.5).n).toBe(2);
        // con más agua trabaja más horas y baja más el embalse
        const mas = dia({ agua: 180, z: DEF.nivel });
        expect(mas.mwh).toBeGreaterThan(D.mwh);
        expect(mas.bajaM).toBeGreaterThan(D.bajaM);
    });

    it('un año sigue a la lluvia; el seco no se llena, y el lluvioso vierte', () => {
        expect(REPARTO_MES.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6);
        expect(REPARTO_MES.slice(6, 10).reduce((a, b) => a + b, 0)).toBeCloseTo(75, 1);
        const [n, s, l] = ['normal', 'seco', 'lluvioso'].map(tipo => anual({ tipo }));
        expect(n.gwh).toBeGreaterThan(1100);
        expect(n.gwh).toBeLessThan(1330);
        expect(n.factor).toBeCloseTo(CENTRAL.factor, 1);
        expect(n.zMax).toBeCloseTo(NIVEL.NAMO, 0);
        expect(s.zMax).toBeLessThan(NIVEL.NAMO - 8);
        expect(s.zMin).toBeGreaterThanOrEqual(NIVEL.NAMINO - 0.001);
        expect(s.gwh).toBeLessThan(n.gwh * 0.85);
        expect(l.vierte).toBeGreaterThan(100);
        expect(l.gwh).toBeGreaterThan(n.gwh);
        expect(TIPOS.seco.k).toBeLessThan(1);
        // baja en el estiaje y sube en las lluvias
        expect(nivelEnMes(6)).toBeLessThan(nivelEnMes(1));
        expect(nivelEnMes(10)).toBeGreaterThan(nivelEnMes(7));
        // el nivel es continuo al dar la vuelta al año
        expect(Math.abs(nivelEnMes(12.49) - nivelEnMes(0.51))).toBeLessThan(0.5);
    });

    it('al cerrar en 9 s da lo que calcula la tesina, y cerrar es un compromiso', () => {
        const R = rechazo({ tc: UNIDAD.cierre, z: ZD });
        expect(R.sobrePresion).toBeGreaterThan(0.1);
        expect(R.sobrePresion).toBeLessThan(0.182);
        expect(R.sobreVelocidad).toBeGreaterThan(0.34);
        expect(R.sobreVelocidad).toBeLessThan(0.4143);
        expect(R.metros).toBeCloseTo(21, 0);
        expect(VIAJE).toBeCloseTo(0.33, 2);
        expect(GOLPE_M).toBeCloseTo(845, -1);
        const presion = [2, 5, 9, 15, 30].map(tc => rechazo({ tc, z: ZD }).sobrePresion);
        const velocidad = [2, 5, 9, 15, 30].map(tc => rechazo({ tc, z: ZD }).sobreVelocidad);
        for (let i = 1; i < 5; i++) {
            expect(presion[i]).toBeLessThan(presion[i - 1]);
            expect(velocidad[i]).toBeGreaterThan(velocidad[i - 1]);
        }
        // muy rápido pasa de la presión permitida; muy lento, de la velocidad permitida; 9 s queda en medio
        expect(rechazo({ tc: 2, z: ZD }).sobrePresion).toBeGreaterThan(UNIDAD.presionPermitida[1]);
        expect(rechazo({ tc: 30, z: ZD }).sobreVelocidad).toBeGreaterThan(UNIDAD.velPermitida);
        expect(R.sobrePresion).toBeLessThan(UNIDAD.presionPermitida[0]);
        expect(R.sobreVelocidad).toBeLessThan(UNIDAD.velPermitida);
        expect(R.nMax).toBeLessThan(UNIDAD.Kr);
    });

    it('las series del cierre se leen en segundos', () => {
        const R = rechazo({ tc: UNIDAD.cierre, z: ZD });
        expect(enSerie(R.y, 0)).toBeCloseTo(1, 6);
        expect(enSerie(R.y, 4.5)).toBeCloseTo(0.5, 1);
        expect(enSerie(R.y, 9.1)).toBe(0);
        const E = enEvento(R, 5);
        expect(E.t).toBe(5);
        expect(E.y).toBeCloseTo(1 - 5 / 9, 1);
        expect(E.n).toBeGreaterThan(1.1);
        // en la galería el nivel primero baja
        expect(enEvento(R, 15).gal).toBeLessThan(0);
        expect(VAIVEN.periodo).toBeGreaterThan(60);
        expect(R.h.at(-1)).toBeCloseTo((ZD - NIVEL.abajo) / UNIDAD.Hd, 2);
    });

    it('si cae la línea deja de dar potencia, y luego se reconecta ya en su velocidad', () => {
        const s = { ...estadoPlanta({ a: 1, z: ZD }), ev: 0 };
        const m = { a1: 1, a2: 1, z: ZD, vierte: 0, tc: UNIDAD.cierre, lentitud: 1 };
        expect(calcular({ modo: 'cierre', planta: s, tc: UNIDAD.cierre }).P).toBe(0);
        const durante = correr(s, m, 12);
        expect(durante.ev).toBeGreaterThan(11);
        expect(durante.a1).toBe(0);
        expect(durante.n).toBeGreaterThan(1.3);
        const despues = correr(durante, m, FIN_EVENTO - 12 + 2);
        expect(despues.ev).toBeNull();
        expect(calcular({ modo: 'cierre', planta: despues, tc: UNIDAD.cierre }).P).toBe(0);
        const fin = correr(despues, m, 40);
        expect(fin.n).toBeCloseTo(1, 2);
        expect(fin.a1).toBeCloseTo(1, 2);
        expect(calcular({ modo: 'cierre', planta: fin, tc: UNIDAD.cierre }).P).toBeGreaterThan(700);
    });

    it('el tiempo no depende de los cuadros', () => {
        const m = { a1: 0.5, a2: 0.5, z: 540, vierte: 0, tc: 9, lentitud: 1 };
        let lento = estadoPlanta({ a: 0.9, z: 575 });
        for (let i = 0; i < 16; i++) lento = pasoPlanta(lento, m, 0.25);
        const rapido = correr(estadoPlanta({ a: 0.9, z: 575 }), m, 4);
        expect(lento.a1).toBeCloseTo(rapido.a1, 3);
        expect(lento.z).toBeCloseTo(rapido.z, 3);
    });

    it('los modos llevan su agua al tablero y a los tubos', () => {
        const u = unidad(0.6, 560);
        const L = calcular({ modo: 'agua', a: 60, nivel: 560 });
        expect(L.P).toBeCloseTo(2 * u.P, 6);
        expect(L.Q).toBeCloseTo(2 * u.Q, 6);
        const cerrado = pose({ modo: 'agua', a: 0 });
        expect(cerrado.flujos.tubo).toBe(0);
        expect(cerrado.flujos.desfogue).toBe(0);
        const P = pose({ modo: 'agua', a: 100 });
        expect(P.flujos.tubo).toBeGreaterThan(0.9);
        expect(calcular({ modo: 'ano', tipo: 'lluvioso', mes: 9 }).vierte).toBeGreaterThan(0);
        expect(LINEAS.some(l => l.id === 'vierte')).toBe(true);
    });

    it('la pose responde al desarme, sus puntos clave caben en el bloque, y la caverna queda bajo tierra', () => {
        expect(pose({ modo: 'agua', desarme: 1 }).desarme).toBe(1);
        for (const p of PARTES) {
            expect(p.vista).toBeTruthy();
            expect(p.ancla[0]).toBeGreaterThanOrEqual(BLOQUE.x[0]);
            expect(p.ancla[0]).toBeLessThanOrEqual(BLOQUE.x[1]);
            expect(p.ancla[1]).toBeGreaterThanOrEqual(BLOQUE.y[0]);
        }
        for (const x of [CAVERNA.x[0], MAQUINA.x, CAVERNA.x[1]]) for (const z of [0.6, 1.5, 2.6, 3.2]) expect(terreno(x, z)).toBeGreaterThan(CAVERNA.y[1]);
        // la cortina no entra a la caverna
        expect(CORTINA.z[1]).toBeLessThan(CAVERNA.z[0]);
        expect(Y(NIVEL.NAMO)).toBeLessThan(CORTINA.alto);
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['hidroelectrica', 'hidroelectrica-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.hidroelectrica.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.hidroelectrica.fuentes.map(f => f.acervo);
        for (const siglas of ['LSE', 'RLSE', 'LCNE', 'LPTE']) expect(acervos).toContain(siglas);
        expect(acervos).not.toContain('BME');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.hidroelectrica;
        expect(c.figura).toBe('hidroelectrica');
        expect(c.nivel).toBe(3);
        expect(c.antes).toEqual(['generador', 'transformador']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/hidroelectrica/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.partes.map(p => p.nombre)).toContain('RNT y RGD');
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso, y sus cifras son las del modelo', () => {
        const c = CONCEPTO.hidroelectrica;
        const LSE = 'Ley_Sector_Electrico_chunks.json';
        const RLSE = 'RLSE_chunks.json';
        expect(articulo(LSE, 3)).toContain('La energía proveniente de centrales hidroeléctricas');
        expect(articulo(LSE, 3)).toContain('Manifestación de Impacto Social del Sector Energético');
        expect(articulo(LSE, 19)).toContain('0.7 MW');
        expect(articulo(LSE, 88)).toContain('recurso hidráulico');
        expect(articulo(LSE, 90)).toContain('Instituto de Administración y Avalúos de Bienes Nacionales');
        expect(articulo(LSE, 119)).toContain('restricciones hidrológicas');
        expect(articulo(LSE, 119)).toContain('Comisión Nacional del Agua');
        expect(articulo(LSE, 133)).toContain('pueblos y las comunidades indígenas y afromexicanas');
        expect(articulo(LSE, 134)).toContain('presencia de pueblos y comunidades');
        expect(articulo(LSE, 135)).toContain('consulta previa, libre e informada');
        expect(articulo(LSE, 136)).toContain('Manifestación de Impacto Social');
        expect(articulo(LSE, 139)).toContain('noventa días naturales');
        expect(articulo(RLSE, 2)).toContain('Consulta Previa');
        expect(articulo(RLSE, 23)).toContain('recurso hidráulico');
        expect(articulo(RLSE, 23)).toContain('En ningún caso se debe iniciar la construcción');
        expect(lista(RLSE).find(a => a.id === 'RLSE-Trans-10').texto.replace(/\s+/g, ' ')).toContain('plantas de rebombeo');
        expect(articulo('LCNE_chunks.json', 8)).toContain('permisos de generación');
        expect(articulo('LPTE_chunks.json', 3)).toContain('El movimiento del agua en cauces naturales o en aquellos artificiales con embalses ya existentes');
        const texto = JSON.stringify(c);
        expect(texto).toContain('Red Nacional de Transmisión');
        expect(texto).toContain('Redes Generales de Distribución');
        expect(texto).toContain('La Yesca');
        expect(texto).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        // la Ley de Aguas no está en el acervo: se avisa, y va en las fuentes con su liga
        const aguas = c.ley.ficha.articulos.find(a => a.siglas === 'Ley de Aguas Nacionales');
        expect(aguas.nota).toContain('No está en el acervo');
        expect(c.fuentes.some(f => f.url?.includes('LeyesBiblio/pdf/LAN.pdf'))).toBe(true);
        // las cifras escritas a mano en la ficha
        expect(Math.round(anual().gwh)).toBe(1261);
        expect(texto).toContain('1,261 GWh');
        expect(Math.round(potenciaMax(NIVEL.NAMINO))).toBe(240);
        expect(texto).toContain('240 de sus 380 MW');
        expect((1000 * 9.81 * UNIDAD.Qd * UNIDAD.Hd * 0.94) / 1e6).toBeCloseTo(375, 0);
        expect(kwhPorM3(NIVEL.NAMO) / kwhPorM3(NIVEL.NAMINO)).toBeCloseTo(1.46, 1);
        expect(c.errores.length).toBeGreaterThanOrEqual(5);
    });
});
