import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO, PUENTE_HILO } from '../src/data/como-funciona.js';
import { ATB, BLOQUE, CENTRAL, CONVOCATORIA, DIAS, EIA, HOMER, LINEAS, MESES, NASA, PARTES, SAEE, aislado, anio, despacho, dieselLh, factorPlanta, junto, mercado, perfilAnual, perfilMes, pose, puntasSueltas, revisar, solMes, tolling, totalConvocatoria } from '../conceptos-3d/saee/modelo.js';
import { PML } from '../conceptos-3d/saee/precios.js';
import { FUENTES } from '../conceptos-3d/saee/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const RLSE = 'RLSE_chunks.json';
const DACG = JSON.parse(readFileSync('revision-acervo/sincronizacion-dacg-sae-2026-10-05/articulos-verificados.json', 'utf8'));
const numeral = id => DACG.find(a => a.identificador === id).contenido.replace(/\s+/g, ' ');
const r1 = x => Math.round(x * 10) / 10;

describe('El almacenamiento de energía (SAEE)', () => {
    it('sus cifras salen del modelo y coinciden con las fuentes', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada cable toca un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('los precios son un año seguido del CENACE en la zona de Chihuahua', () => {
        expect(PML.zona).toBe('Chihuahua');
        expect(PML.desde).toBe('2025-11-01');
        expect(PML.hasta).toBe('2026-10-30');
        expect(DIAS).toHaveLength(364);
        for (const d of DIAS) expect(d.h).toHaveLength(24);
        expect(MESES.map(m => m.corto)).toEqual(['nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct']);
        const p = perfilAnual();
        expect(Math.round(Math.min(...p))).toBe(186);
        expect(p.indexOf(Math.min(...p))).toBe(11);
        expect(Math.round(Math.max(...p))).toBe(994);
        expect(p.indexOf(Math.max(...p))).toBe(20);
        // hubo horas con precio negativo
        expect(Math.min(...DIAS.flatMap(d => d.h))).toBeLessThan(0);
    });

    it('la batería compra barato, vende caro y regresa 85 de cada 100', () => {
        expect(ATB).toMatchObject({ ida: 0.85, vida: 15, ciclosDia: 1 });
        expect(EIA.ida).toBe(0.82);
        const d = despacho(perfilMes(10), { P: 100, E: 300 });
        expect(d.entregada / d.tomada).toBeCloseTo(0.85, 9);
        expect(Math.round(d.ganancia / 1000)).toBe(617);
        // carga a media mañana y entrega en la noche
        expect(d.carga.slice(8, 12).every(x => x > 0)).toBe(true);
        expect(d.descarga.slice(19, 22).every(x => x > 0)).toBe(true);
        const a = anio();
        expect(r1(a.total / 1e6)).toBe(82.9);
        expect(Math.round(a.porMW / 1000)).toBe(829);
        const tercerTrimestre = a.meses.slice(9).reduce((s, m) => s + m.ganancia, 0);
        expect(tercerTrimestre / a.total).toBeGreaterThan(0.5);
        expect(mercado({ mes: 10, hora: 20.5 }).descarga).toBe(100);
    });

    it('la convocatoria: 935 MW de 3 horas, 245 en la región Norte', () => {
        expect(totalConvocatoria()).toBe(935);
        expect(CONVOCATORIA.horas).toBe(3);
        expect(SAEE).toEqual({ P: 100, horas: 3 });
        expect(Object.fromEntries(CONVOCATORIA.regiones).Norte).toBe(245);
        expect(CONVOCATORIA.registroHasta).toBe('1 de marzo de 2027');
    });

    it('junto a la central: guarda lo que no cabe en el contrato y nunca entrega más que él', () => {
        expect(CENTRAL).toMatchObject({ mwCA: 240, contrato: 200 });
        const mayo = junto({ mes: 6, pct: 30 });
        expect(Math.round(mayo.tirada)).toBe(112);
        expect(Math.round(mayo.recuperada)).toBe(112);
        expect(Math.max(...mayo.red)).toBeLessThanOrEqual(CENTRAL.contrato + 1e-9);
        expect(junto({ mes: 6, pct: 0 }).extra).toBeCloseTo(0, 6);
        expect(factorPlanta()).toBeGreaterThan(0.24);
        expect(r1(solMes(4).horas.reduce((s, x) => s + x, 0))).toBe(r1(NASA.ghi[4]));
    });

    it('el tolling: la Almacenadora cobra fijo y la CFE se queda con el riesgo', () => {
        const t = tolling({ pago: 60 });
        expect(r1(t.mercadoAnio / 1e6)).toBe(82.9);
        expect(r1(t.fijoAnio / 1e6)).toBe(72);
        expect(r1(t.cfeAnio / 1e6)).toBe(10.9);
        expect(t.mesesPierde).toBe(6);
        expect(Math.round(t.empate)).toBe(69);
        // un año malo no le cambia nada a la Almacenadora
        const malo = tolling({ pago: 60, factor: 0.6 });
        expect(malo.almacenadoraAnio).toBe(t.almacenadoraAnio);
        expect(malo.cfeAnio).toBeLessThan(0);
        // con inversión mixta, 54 % del pago regresa a la CFE
        expect(tolling({ pago: 60, esquema: 'mixta' }).cfeConParte - t.cfeAnio).toBeCloseTo(0.54 * t.fijoAnio, 3);
    });

    it('sin red: la batería le quita diésel a la mina (curva de HOMER)', () => {
        expect(dieselLh(HOMER.ejemplo.kW, 25)).toBeCloseTo(8.48, 1);
        expect(dieselLh(HOMER.ejemplo.kW, 50)).toBeCloseTo(15.3, 1);
        const sin = aislado({ mes: 6, horasMina: 0 });
        const con = aislado({ mes: 6, horasMina: 4 });
        expect(Math.round(sin.litros)).toBe(5297);
        expect(Math.round(con.litros)).toBe(2788);
        expect(con.deSol).toBeGreaterThan(sin.deSol);
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        expect(pose({ modo: 'mercado', mes: 10, hora: 20.5 }).activo.descarga).toBe(1);
        expect(pose({ modo: 'mercado', mes: 10, hora: 9.5 }).activo.carga).toBeGreaterThan(0);
        expect(pose({ modo: 'central', mes: 6, hora: 12.5, pct: 0 }).activo.tirada).toBeGreaterThan(0);
        expect(pose({ modo: 'aislado', mes: 6, hora: 2, horasMina: 0 }).activo.diesel).toBeGreaterThan(0);
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
        const paginas = ['saee', 'saee-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO['almacenamiento-energia'].fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https:\/\//);
            expect(f.para).toBeTruthy();
            expect(f.fecha).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        expect(CONCEPTO['almacenamiento-energia'].fuentes.map(f => f.acervo)).toEqual(expect.arrayContaining(['LSE', 'RLSE']));
        for (const p of paginas) expect(p).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO['almacenamiento-energia'];
        expect(c.figura).toBe('saee');
        expect(c.nivel).toBe(3);
        expect(c.antes).toEqual(['fotovoltaica', 'inversor']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/saee/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
        expect(c.tramites).toContain('almacenamiento');
        expect(PUENTE_HILO['almacenamiento-energia'].transicion).toContain('CENACE');
    });

    it('la ficha cita artículos y numerales que sí dicen eso', () => {
        const c = CONCEPTO['almacenamiento-energia'];
        expect(articulo(LSE, 3)).toContain('L. Sistema de Almacenamiento de Energía Eléctrica: Conjunto de componentes');
        expect(articulo(LSE, 3)).toContain('que permiten extraer energía eléctrica de una Red Eléctrica o de una fuente de energía y almacenarla para su posterior uso o inyección');
        expect(articulo(LSE, 85)).toContain('pueden ofrecer energía y Productos Asociados');
        expect(articulo(LSE, 31)).toContain('La Central Eléctrica no debe estar interconectada a la Red Nacional de Transmisión o a las Redes Gene');
        expect(articulo(LSE, 32)).toContain('tener respaldo propio mediante Sistemas de Almacenamiento de Energía Eléctrica o pagarlo a la Empresa Pública del Estado');
        expect(articulo(RLSE, 2)).toContain('I. Almacenadora: Persona física o moral titular de uno o varios permisos de almacenamiento otorgado por la CNE');
        expect(articulo(RLSE, 193)).toContain('Todos los Sistemas de Almacenamiento de Energía Eléctrica no asociados a una Central Eléctrica o Centro de Carga con capacidad mayor o igual a 0.7 MW, requieren permiso de almacenamiento otorgado por la CNE');
        expect(articulo(RLSE, 193)).toContain('Los Sistemas de Almacenamiento de Energía Eléctrica que forman parte de una Central Eléctrica con permiso de generación, no requieren permiso de almacenamiento');
        expect(articulo(RLSE, 195)).toContain('no pueden recibir Certificados de Energía Limpia');
        expect(numeral('1.4.')).toContain('XXVIII. Sistemas de Almacenamiento de Energía Eléctrica no Asociados o SAEE no Asociado: SAEE integrado por una Almacenadora');
        expect(numeral('2.13.10.')).toContain('duración de almacenamiento igual o mayor a tres horas pueden acreditar Potencia');
        expect(numeral('3.1.')).toContain('Los SAEE-CE pueden ser integrados exclusivamente por Centrales Eléctricas de Energías Renovables');
        expect(numeral('3.14.')).toContain('no puede exceder la capacidad establecida en su contrato de Interconexión');
        expect(numeral('4.3.')).toContain('no debe ser inyectada a la RNT o las RGD, ni ser objeto de venta');
        expect(numeral('6.2.')).toContain('Los SAEE-RNT/RGD son de propiedad exclusiva de la Transportista o la Distribuidora');
        expect(numeral('6.3.')).toContain('no está sujeta a pagos ni a contraprestación alguna');
        expect(numeral('7.4.')).toContain('deben solicitar ante la CNE el permiso de almacenamiento de energía eléctrica');
        expect(numeral('2.11.3.')).toContain('puede determinar que no es necesaria la integración de un SAEE');
        expect(c.ley.siglas).toEqual(['LSE', 'RLSE', 'ACUERDO-CNE-16/04/2026-DACG-SAE', 'CONV-ESTRATEGICOS']);
        expect(JSON.stringify(c)).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        expect(c.resumen).toContain('Comisión Nacional de Energía (CNE)');
    });
});
