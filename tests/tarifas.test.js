import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO, PUENTE_HILO, siguienteConcepto } from '../src/data/como-funciona.js';
import { AJUSTE, BASE, BLOQUE, DAC, LIMITE_DAC, LINEAS, NEGOCIO, PARTES, SUBSIDIO, TARIFAS, TEMPERATURA, anio, cobro, cobroDac, costoReal, modoNegocio, pose, puntasSueltas, revisar } from '../conceptos-3d/tarifas/modelo.js';
import { porKwhVariable } from '../conceptos-3d/tarifas/costos.js';
import { FUENTES } from '../conceptos-3d/tarifas/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const todo = archivo => lista(archivo).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const RLSE = 'RLSE_chunks.json';
const c2 = x => Math.round(x * 100) / 100;

describe('Las tarifas y el recibo de luz', () => {
    it('sus cifras salen del modelo y coinciden con las fuentes', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada cable toca un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('las tarifas 1 a 1F de 2026 cobran por bloques, como las publica la CFE', () => {
        expect(TARIFAS['1'].fuera.bloques).toEqual([['Básico', 75, 1.144], ['Intermedio', 65, 1.389], ['Excedente', Infinity, 4.067]]);
        expect(TARIFAS['1F'].verano.bloques).toEqual([['Básico', 300, 0.854], ['Intermedio bajo', 900, 1.054], ['Intermedio alto', 1300, 2.566], ['Excedente', Infinity, 4.054]]);
        expect(TEMPERATURA).toEqual({ 1: null, '1A': 25, '1B': 28, '1C': 30, '1D': 31, '1E': 32, '1F': 33 });
        const r = cobro('1', 150, false);
        expect(c2(r.energia)).toBe(216.76);
        expect(Math.round(r.total)).toBe(251);
        expect(c2(cobro('1', 400, false).medio)).toBe(3.08);
        expect(cobro('1', 10, false).cobrar).toBe(25);
        // el ajuste de cada mes es la inflación de noviembre a noviembre repartida en doce
        expect(AJUSTE.factor).toBe(1.00311);
        expect((AJUSTE.inpcNov25 / AJUSTE.inpcNov24) ** (1 / 12)).toBeCloseTo(1.00311, 5);
    });

    it('lo que cuesta cada eslabón suma lo que publica la CNE y lo que cobra la CFE a una tienda', () => {
        expect(c2(costoReal(150, 0, 'central').total)).toBe(390.74);
        expect(costoReal(150, 0, 'central').categoria).toBe('DB1');
        expect(costoReal(151, 0, 'central').categoria).toBe('DB2');
        const k = costoReal(150, cobro('1', 150, false).energia, 'central');
        expect(Math.round(k.aportacion)).toBe(174);
        expect(Math.round(k.pagaPct * 100)).toBe(55);
        expect(Math.round(costoReal(100, cobro('1', 100, false).energia, 'central').pagaPct * 100)).toBe(43);
        // desde unos 232 kWh al mes, la tarifa 1 cobra más que el costo
        const cruce = Array.from({ length: 1000 }, (_, i) => i + 25).find(x => cobro('1', x, false).energia >= costoReal(x, 0, 'central').total);
        expect(cruce).toBe(232);
        expect(c2(porKwhVariable('central', 'PDBT'))).toBe(3.57);
        expect(NEGOCIO.pdbt.central).toEqual({ fijo: 54.05, kwh: 3.565 });
        expect(Math.round(porKwhVariable('central', 'PDBT') * 1000)).toBe(3565);
        expect(Math.round(porKwhVariable('noroeste', 'PDBT') * 1000)).toBe(3254);
        expect(modoNegocio({ tienda: 900 }).pdbt.medio).toBeGreaterThan(cobro('1', SUBSIDIO.kwhMedio, false).medio * 2);
    });

    it('la DAC se decide con el promedio de 12 meses y no tiene aportación', () => {
        expect(LIMITE_DAC).toEqual({ 1: 250, '1A': 300, '1B': 400, '1C': 850, '1D': 1000, '1E': 2000, '1F': 2500 });
        expect(DAC.fijo).toBe(146.01);
        expect(DAC.regiones.central.kwh).toBe(6.869);
        expect(DAC.regiones.noroeste.kwh).toBe(6.435);
        expect(c2(cobroDac('central', 300).energia)).toBe(c2(146.01 + 300 * 6.869));
        const debajo = anio({ tarifa: '1', horasClima: 5.6 });
        const arriba = anio({ tarifa: '1', horasClima: 5.7 });
        expect(c2(arriba.horasLimite)).toBe(5.67);
        expect(debajo.enDac).toBe(false);
        expect(arriba.enDac).toBe(true);
        expect(Math.round(debajo.pago / 100) * 100).toBe(8600);
        expect(Math.round(arriba.pago / 1000)).toBe(26);
        expect(arriba.aportacion).toBe(0);
        // en la 1F ni tres minisplits todo el día pasan el límite
        expect(anio({ tarifa: '1F', horasClima: 24, equipos: 3, region: 'noroeste' }).enDac).toBe(false);
        expect(Math.round(BASE)).toBe(153);
    });

    it('el subsidio y los usuarios', () => {
        expect(SUBSIDIO.pef2026).toBe(87768.8);
        expect(SUBSIDIO.real2025).toBe(84805.5);
        expect(SUBSIDIO.domesticos2025).toBe(44.4);
        expect(SUBSIDIO.kwhMedio).toBe(149);
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        expect(pose({ modo: 'recibo', kwh: 100 }).activo.aporte).toBeGreaterThan(0.5);
        expect(pose({ modo: 'recibo', kwh: 600 }).activo.aporte).toBe(0);
        expect(pose({ modo: 'dac', horasClima: 8, mes: 6 }).activo.aporte).toBe(0);
        expect(pose({ modo: 'dac', horasClima: 8, mes: 6 }).activo.clima).toBeGreaterThan(pose({ modo: 'dac', horasClima: 2, mes: 6 }).activo.clima);
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
        const paginas = ['tarifas', 'tarifas-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO['tarifas-recibo'].fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https:\/\//);
            expect(f.para).toBeTruthy();
            expect(f.fecha).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        expect(CONCEPTO['tarifas-recibo'].fuentes.map(f => f.acervo)).toEqual(expect.arrayContaining(['LSE', 'RLSE']));
        for (const p of paginas) expect(p).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO['tarifas-recibo'];
        expect(c.figura).toBe('tarifas');
        expect(c.nivel).toBe(4);
        expect(c.antes).toEqual(['distribucion', 'mercado-cenace']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/tarifas/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        // cada ficha trae su botón de acción
        expect([...fichas.matchAll(/accion: '/g)]).toHaveLength(PARTES.length);
        expect(c.revisado).toBeNull();
        expect(siguienteConcepto('mercado-cenace').id).toBe('tarifas-recibo');
        expect(siguienteConcepto('tarifas-recibo').id).toBe('planeacion-desarrollo-mixto');
        expect(PUENTE_HILO['mercado-cenace'].transicion).toContain('recibo');
        expect(PUENTE_HILO['tarifas-recibo'].transicion).toContain('planeación');
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO['tarifas-recibo'];
        expect(articulo(LSE, 3)).toContain('LIV. Suministradora de Servicios Básicos: Empresa Pública del Estado que ofrece de manera exclusiva el Suministro Básico');
        expect(articulo(LSE, 3)).toContain('LVII. Suministro Básico: El Suministro Eléctrico sujeto a regulación tarifaria que se contrate y que no sea Usuario Calificado');
        expect(articulo(LSE, 63)).toContain('la Suministradora de Servicios Básicos ofrece el Suministro Básico a todas las personas que lo soliciten, siempre que ello sea técnicamente factible');
        expect(articulo(LSE, 11)).toContain('IV. Expedir y aplicar la regulación tarifaria a que se deben sujetar la transmisión, la distribución, la operación de la Suministradora de Servicios Básicos, la operación del CENACE');
        expect(articulo(LSE, 158)).toContain('las metodologías para determinar el cálculo y ajuste de las Tarifas Reguladas');
        expect(articulo(LSE, 159)).toContain('El Ejecutivo Federal puede determinar, mediante Acuerdo, un mecanismo de fijación de tarifas distinto');
        expect(articulo(LSE, 159)).toContain('debe transparentar los componentes de la tarifa final que determine la CNE');
        expect(articulo(LSE, 132)).toContain('programas de Justicia Energética con apoyos focalizados');
        expect(todo(RLSE)).toContain('pueden incluirse en el registro de Usuarios Calificados a los que hace referencia el artículo 153 del presente reglamento, aquellos Centros de Carga que tengan una demanda igual o mayor a 1 MW');
        expect(c.ley.siglas).toEqual(['LSE', 'RLSE']);
        expect(JSON.stringify(c)).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        expect(JSON.stringify(c)).not.toContain('DGMESNIE');
        expect(c.resumen).toContain('Comisión Nacional de Energía (CNE)');
    });
});
