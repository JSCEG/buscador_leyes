import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { CONCEPTO, HILO_SECTOR, PUENTE_HILO, siguienteConcepto } from '../src/data/como-funciona.js';
import {
    AEREAS, BCS, BLOQUE, BORNES, COMBUSTIBLES, FACTOR_SEN, IEPS, LINEAS, MARGEN, NACIONAL, NOM085, PARTES, PRECIOS, RETIROS, TECNO, UNIDADES,
    cablesSueltos, eficiencia, minutosPlena, modoAislado, ordenMerito, porMWh, pose, puntasSueltas, revisar, unidadVapor,
} from '../conceptos-3d/termicas/modelo.js';
import { colgar } from '../conceptos-3d/termicas/lugar.js';
import { FUENTES } from '../conceptos-3d/termicas/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const RLSE = 'RLSE_chunks.json';
const r1 = x => Math.round(x * 10) / 10;
const r2 = x => Math.round(x * 100) / 100;

/** El .glb que arma Blender: su JSON trae las extras de cada malla. */
function glb() {
    const b = readFileSync('conceptos-3d/termicas/equipos.glb');
    const largo = b.readUInt32LE(12);
    return { bytes: b.length, json: JSON.parse(b.subarray(20, 20 + largo).toString('utf8')) };
}

describe('Las centrales térmicas', () => {
    it('sus cifras salen del modelo y coinciden con las fuentes', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada tubo toca un equipo y cada cable llega a un borne, un poste o el piso', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(cablesSueltos()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('las líneas aéreas son tres fases que cuelgan entre apoyos', () => {
        expect(Object.keys(AEREAS)).toEqual(['aRed', 'turbogasRed', 'rnt', 'aislado']);
        for (const [id, apoyos] of Object.entries(AEREAS)) {
            const linea = LINEAS.find(l => l.id === id);
            expect(linea.oculto).toBe(true);
            expect(linea.apoyos).toBe(apoyos);
            // cada apoyo abre sus fases a los lados y el conductor cuelga por debajo de la recta entre apoyos
            for (const a of apoyos) expect(Math.hypot(...a.fase)).toBeGreaterThan(0.05);
            for (const k of [-1, 0, 1]) {
                const p = colgar(apoyos, k);
                const medio = p[8];
                const a = p[0];
                const b = p[16];
                expect(medio[1]).toBeLessThan((a[1] + b[1]) / 2);
            }
        }
        // las fases llegan a las tres barras de la subestación y a las tres boquillas de los transformadores
        expect(AEREAS.aRed.at(-1).p).toBe(BORNES.barraOeste);
        expect(AEREAS.aRed.at(-1).fase).toEqual([0, 0.03, 0.3]);
        expect(AEREAS.turbogasRed[0].fase).toEqual([0.08, 0, 0]);
    });

    it('usa el régimen probado de la EIA y el CO2 de cada combustible', () => {
        expect(TECNO.vapor.regimen).toEqual({ carbon: 10040, combustoleo: 10319, gas: 10293 });
        expect(TECNO.turbogas.regimen).toEqual({ gas: 10975, diesel: 13145 });
        expect(TECNO.motores.regimen).toEqual({ combustoleo: 10484 });
        expect(COMBUSTIBLES.carbon.co2).toBe(93.24);
        expect(COMBUSTIBLES.combustoleo.co2).toBe(75.09);
        expect(COMBUSTIBLES.gas.co2).toBe(52.91);
        expect(COMBUSTIBLES.combustoleo.azufre).toBe(0.044);
        expect(r1(eficiencia('vapor', 'carbon') * 100)).toBe(34);
        expect(r2(porMWh('vapor', 'carbon').co2)).toBe(0.94);
        expect(r2(porMWh('vapor', 'combustoleo').co2)).toBe(0.77);
        expect(r2(porMWh('vapor', 'gas').co2)).toBe(0.54);
        expect(r1(porMWh('vapor', 'combustoleo').so2)).toBe(21.5);
        expect(FACTOR_SEN[2024]).toBe(0.444);
    });

    it('la unidad de vapor de 350 MW, del tamaño de las duales de Petacalco', () => {
        const u = unidadVapor({ carga: 1, comb: 'carbon' });
        expect(UNIDADES.vapor).toBe(350);
        expect(Math.round(u.th)).toBe(141);
        expect(r1(u.marM3s)).toBe(17.6);
        // no baja de su carga mínima
        expect(unidadVapor({ carga: 0.2 }).carga).toBe(TECNO.vapor.minimo);
        // a media carga aprovecha menos
        expect(unidadVapor({ carga: 0.5 }).eta).toBeLessThan(u.eta);
    });

    it('lo que tarda cada una en llegar a plena carga', () => {
        expect(minutosPlena('vapor')).toBe(160);
        expect(minutosPlena('vapor', true)).toBe(460);
        expect(minutosPlena('turbogas')).toBe(9);
        expect(minutosPlena('turbogas', true)).toBe(11);
        expect(minutosPlena('motores')).toBe(2);
        expect(minutosPlena('motores', true)).toBe(5);
    });

    it('el costo de combustible de cada MWh con los precios que pagó la CFE en 2024', () => {
        expect(PRECIOS.combustoleo).toBe(13.73);
        expect(PRECIOS.diesel).toBe(36.52);
        expect(PRECIOS.gas).toBe(3.52);
        const orden = ordenMerito({});
        expect(orden.map(o => o.id)).toEqual(['vaporGas', 'turbogasGas', 'vaporCarbon', 'vaporCombustoleo', 'motoresCombustoleo', 'turbogasDiesel']);
        expect(orden.map(o => Math.round(o.usd))).toEqual([36, 39, 68, 142, 144, 480]);
        expect(Math.round(orden.find(o => o.id === 'vaporCarbon').impuesto)).toBe(19);
        expect(Math.round(orden.find(o => o.id === 'vaporCombustoleo').impuesto)).toBe(60);
        expect(orden.find(o => o.id === 'vaporGas').impuesto).toBe(0);
        expect(IEPS.combustoleo.cuota).toBe(0.229975);
        expect(IEPS.carbon.cuota).toBe(47.1189);
        // con el gas caro, el carbón pasa adelante
        expect(ordenMerito({ gas: 9 })[0].id).toBe('vaporCarbon');
    });

    it('las cifras del país, los retiros, la norma y Baja California Sur son las publicadas', () => {
        expect(NACIONAL.mw).toMatchObject({ carbon: 5463, convencional: 11300, combustionInterna: 717, turbogas: 3953, total: 90543 });
        expect(NACIONAL.gwh).toMatchObject({ carbon: 12968, convencional: 28228, combustionInterna: 3847, turbogas: 12017, total: 352305 });
        expect(NACIONAL.gwh.carbon + NACIONAL.gwh.convencional + NACIONAL.gwh.combustionInterna + NACIONAL.gwh.turbogas).toBe(57060);
        expect(RETIROS.sustituye).toEqual({ convencional: 1631, turbogas: 33, combustionInterna: 142 });
        expect(RETIROS.candidatas.carbon).toBe(0);
        expect(NOM085.so2).toEqual({ valle: 550, criticas: 600, resto: 2200 });
        expect(BCS.pico2024).toBe(689);
        expect(MARGEN.sibcs).toBe(0.35);
        expect(Math.round(modoAislado({}).instalada)).toBe(930);
        expect(Math.round(modoAislado({ anio: 2039 }).pico)).toBe(1121);
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        expect(pose({ modo: 'vapor', comb: 'carbon' }).activo.patio).toBe(1);
        expect(pose({ modo: 'vapor', comb: 'gas' }).activo.patio).toBe(0);
        expect(pose({ modo: 'vapor', comb: 'gas' }).flujos.banda).toBe(0);
        expect(pose({ modo: 'arranque', minuto: 9 }).activo.turbogas).toBe(1);
        expect(pose({ modo: 'arranque', minuto: 9 }).activo.vapor).toBe(0);
    });

    it('los equipos de Blender llegan con su punto clave, su material y su giro', () => {
        const { bytes, json } = glb();
        expect(bytes).toBeLessThan(700 * 1024);
        expect(json.extensionsUsed).toContain('EXT_meshopt_compression');
        const ids = new Set(PARTES.map(p => p.id));
        const materiales = new Set(['marfil', 'grafito', 'acero', 'torre', 'cobre', 'guinda', 'concreto', 'tanque', 'gabinete', 'trafo', 'porcelana', 'carbon', 'llama', 'vidrioV', 'techo']);
        const giros = new Set(['rotor', 'rueda', 'precalentador', 'turbogas', 'radiador']);
        const mallas = json.nodes.filter(n => n.mesh !== undefined);
        expect(mallas.length).toBeGreaterThan(50);
        for (const n of mallas) {
            expect(ids.has(n.extras.parte)).toBe(true);
            expect(materiales.has(n.extras.mat)).toBe(true);
            if (n.extras.gira) expect(giros.has(n.extras.vel)).toBe(true);
        }
        // cada punto clave tiene algo modelado
        const conMalla = new Set(mallas.map(n => n.extras.parte));
        for (const id of ids) expect(conMalla.has(id)).toBe(true);
        // la sombra horneada viaja como _AO
        expect(json.meshes.some(m => m.primitives.some(p => '_AO' in p.attributes))).toBe(true);
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
        const paginas = ['termicas', 'termicas-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.termicas.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https:\/\//);
            expect(f.para).toBeTruthy();
            expect(f.fecha).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        expect(CONCEPTO.termicas.fuentes.map(f => f.acervo)).toEqual(expect.arrayContaining(['LSE', 'RLSE']));
        for (const p of paginas) expect(p).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        // la página lleva el modelo de Blender adentro y no pesa de más
        expect(statSync('public/conceptos/termicas.html').size).toBeLessThan(2.2 * 1024 * 1024);
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.termicas;
        expect(c.figura).toBe('termicas');
        expect(c.nivel).toBe(3);
        expect(c.antes).toEqual(['ciclo-combinado']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/termicas/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect([...fichas.matchAll(/accion: '/g)]).toHaveLength(PARTES.length);
        expect(c.revisado).toBeNull();
        expect(c.tramites).toEqual(['generacion']);
        expect(siguienteConcepto('cogeneracion').id).toBe('termicas');
        expect(siguienteConcepto('termicas').id).toBe('eolica');
        const etapa = HILO_SECTOR.electricidad.etapas.find(e => e.ids.includes('termicas'));
        expect(etapa.ids.slice(2, 5)).toEqual(['cogeneracion', 'termicas', 'eolica']);
        expect(PUENTE_HILO.cogeneracion.transicion).toContain('térmicas');
        expect(PUENTE_HILO.termicas.transicion).toContain('eólica');
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO.termicas;
        expect(articulo(LSE, 3)).toContain('XVII. Despacho Económico de Carga');
        expect(articulo(LSE, 3)).toContain('XXI. Energías Limpias: Aquellas fuentes de energía');
        expect(articulo(LSE, 3)).not.toMatch(/XXI\. Energías Limpias[\s\S]*(combustóleo|carbón mineral)[\s\S]*XXII\./);
        expect(articulo(LSE, 10)).toContain('XIII. Desarrollar los programas vinculantes para la instalación y retiro de Centrales Eléctricas');
        expect(articulo(LSE, 12)).toContain('instalación y retiro de las Centrales Eléctricas');
        expect(articulo(LSE, 22)).toContain('Notificar al CENACE los retiros programados de sus Centrales Eléctricas');
        expect(articulo(LSE, 79)).toContain('no se consideran pequeños sistemas eléctricos');
        expect(articulo(LSE, 81)).toContain('esquemas especiales para la operación de los pequeños sistemas eléctricos');
        expect(articulo(LSE, 117)).toContain('determina la asignación y despacho de las Centrales Eléctricas');
        expect(articulo(LSE, 120)).toContain('se deben basar en los costos de dichas Centrales Eléctricas');
        expect(articulo(LSE, 155)).toContain('cuyo retiro haya sido programado sea necesaria para asegurar la Confiabilidad');
        expect(articulo(RLSE, 8)).toContain('retiro de Centrales Eléctricas');
        expect(c.ley.siglas).toEqual(['LSE', 'RLSE']);
        expect(JSON.stringify(c)).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        expect(JSON.stringify(c)).not.toContain('DGMESNIE');
    });
});
