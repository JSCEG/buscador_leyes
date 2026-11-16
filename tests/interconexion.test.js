import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { CONCEPTO, HILO_SECTOR, PUENTE_HILO, siguienteConcepto } from '../src/data/como-funciona.js';
import {
    AEREAS, BLOQUE, BORNES, CASO, CONV_TOTAL, CORTO_MVA, ESTUDIOS, ETAPAS, HUECO, LINEAS, PARTES, PROYECTOS, REMATE, SCR, SEGUNDA, TABLA_I1, TIPO, TOTAL_DIAS, VECINO,
    cablesSueltos, costos, envolvente, falla, flujo, msPermitidos, pose, puntasSueltas, revisar, tramite,
} from '../conceptos-3d/interconexion/modelo.js';
import { colgar } from '../conceptos-3d/interconexion/lugar.js';
import { cablesSueltos as revisarCables } from '../conceptos-3d/planta-comun/lineas.js';
import { FUENTES } from '../conceptos-3d/interconexion/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const RLSE = 'RLSE_chunks.json';
const r3 = x => Math.round(x * 1000) / 1000;

describe('Cómo se conecta una central a la red', () => {
    it('sus cifras salen del modelo y coinciden con las fuentes', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada cable llega a un borne y las líneas aéreas son tres fases que cuelgan', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(cablesSueltos()).toEqual([]);
        expect(revisarCables(LINEAS, BORNES, REMATE)).toEqual([]);
        for (const [id, apoyos] of Object.entries(AEREAS)) {
            const linea = LINEAS.find(l => l.id === id);
            expect(linea.oculto).toBe(true);
            for (const a of apoyos) expect(Math.hypot(...a.fase)).toBeGreaterThan(0.05);
            for (const k of [-1, 0, 1]) {
                const p = colgar(apoyos, k);
                expect(p[8][1]).toBeLessThan((p[0][1] + p[16][1]) / 2);
            }
        }
        // la línea de enlace llega a las tres fases del marco de la bahía de la central
        expect(AEREAS.enlace.at(-1).p).toBe(BORNES.marco_central);
        // la fibra óptica va por la punta de las torres, en un solo hilo
        expect(LINEAS.find(l => l.id === 'fibra').fases).toBe(1);
    });

    it('reproduce el estudio de la tesis de la UNAM', () => {
        expect(CASO.mw).toBe(90.001);
        expect(CASO.linea).toMatchObject({ km: 4.762, r: 0.07276, x: 0.46685, amperes: 900 });
        expect(r3(flujo({ fp: 'unidad' }).vInv)).toBeCloseTo(CASO.tesis.vInvFp1, 2);
        expect(r3(flujo({ fp: 'entrega' }).vInv)).toBeCloseTo(CASO.tesis.vInvEntrega, 2);
        expect(r3(flujo({ fp: 'absorbe' }).vInv)).toBeCloseTo(CASO.tesis.vInvAbsorbe, 2);
        expect(flujo({ fp: 'entrega' }).mvar).toBeCloseTo(29.58, 1);
        expect(Math.round(flujo({ fp: 'entrega' }).carga * 100)).toBe(105);
        expect(flujo({ fp: 'entrega', banco: true }).sobrecarga).toBe(false);
        expect(Math.round(flujo({}).amperes)).toBe(452);
        expect(Math.round(flujo({}).perdLinea * 1000)).toBe(212);
        expect(Math.round(CORTO_MVA)).toBe(2770);
        expect(Math.round(SCR)).toBe(31);
        expect(TIPO).toBe('D');
    });

    it('la curva del Código de Red para una central de inversores tipo D', () => {
        expect(HUECO.asincrona).toEqual([[0, 0], [0.25, 0], [0.35, 0], [0.45, 0], [1.05, 0.45], [1.5, 0.9]]);
        expect(envolvente(0.3)).toBe(0);
        expect(envolvente(1.5)).toBe(0.9);
        expect(msPermitidos(0)).toBe(450);
        expect(falla({ ms: 150 }).debeQuedarse).toBe(true);
        expect(falla({ ms: 700 }).debeQuedarse).toBe(false);
        expect(falla({ ms: 700, residual: 0.5 }).debeQuedarse).toBe(true);
        // la potencia vuelve después de liberar la falla
        expect(falla({ ms: 150, t: 0.1 }).p).toBeLessThan(0.2);
        expect(falla({ ms: 150, t: 0.6 }).p).toBeCloseTo(1, 2);
    });

    it('los pasos y los costos salen del manual del CENACE y de la convocatoria', () => {
        const fila = TABLA_I1.find(f => f.mw[0] === 30);
        expect([fila.indicativo, fila.impacto, fila.instalaciones, fila.validacion, fila.total, fila.costo]).toEqual([15, 30, 25, 30, 100, 1784111]);
        expect(ESTUDIOS.dias).toBe(70);
        expect(ETAPAS.map(e => e.id)).toEqual(['solicitud', 'indicativo', 'impacto', 'instalaciones', 'contrato', 'obra', 'inspeccion', 'pruebas']);
        expect(tramite({ dia: 0 }).obra).toBe(0);
        expect(tramite({ dia: TOTAL_DIAS }).comercial).toBe(true);
        expect(tramite({ dia: 200 }).etapa.id).toBe('obra');
        expect(CONV_TOTAL).toEqual({ mw: 5970, mdp: 11990, proyectos: 34 });
        expect(PROYECTOS.filter(p => p.compartida)).toHaveLength(9);
        expect(Math.round(VECINO.parte)).toBe(439);
        expect(Math.round(costos().linea * 10) / 10).toBe(14.4);
        expect(costos({ modalidad: 'planeacion', refuerzo: 100 }).red).toBe(100);
        expect(SEGUNDA).toMatchObject({ saee: 0.3, horas: 3 });
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ modo: 'pasos', dia: 0 }).obra).toBe(0);
        expect(pose({ modo: 'pasos', dia: 0 }).flujos.enlace).toBe(0);
        expect(pose({ modo: 'pasos', dia: 0 }).flujos.vieja).toBeGreaterThan(0);
        expect(pose({ modo: 'pasos', dia: TOTAL_DIAS }).flujos.enlace).toBeGreaterThan(0);
        expect(pose({ modo: 'linea', mw: 0 }).flujos.enlace).toBe(0);
        expect(pose({ modo: 'falla', ms: 150, tf: 0.05 }).falla.enFalla).toBe(true);
        expect(pose({ modo: 'falla', ms: 150, tf: 0.05 }).flujos.red2).toBe(0);
        expect(pose({ modo: 'paga' }).refuerzo).toBe(true);
        expect(pose({ desarme: 1 }).desarme).toBe(1);
    });

    it('sus puntos clave caben en el bloque', () => {
        expect(PARTES).toHaveLength(13);
        for (const p of PARTES) {
            expect(p.vista).toBeTruthy();
            expect(p.ancla[0]).toBeGreaterThanOrEqual(BLOQUE.x[0]);
            expect(p.ancla[0]).toBeLessThanOrEqual(BLOQUE.x[1]);
            expect(p.ancla[2]).toBeGreaterThanOrEqual(BLOQUE.z[0]);
            expect(p.ancla[2]).toBeLessThanOrEqual(BLOQUE.z[1]);
        }
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        const paginas = ['interconexion', 'interconexion-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.interconexion.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        expect(CONCEPTO.interconexion.fuentes.map(f => f.acervo)).toEqual(expect.arrayContaining(['LSE', 'RLSE', 'MODELOS-INTERCONEXION', 'CONV-GEN-1', 'CONV-GEN-2']));
        for (const p of paginas) expect(p).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        expect(statSync('public/conceptos/interconexion.html').size).toBeLessThan(1.2 * 1024 * 1024);
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.interconexion;
        expect(c.figura).toBe('interconexion');
        expect(c.nivel).toBe(4);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/interconexion/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect([...fichas.matchAll(/accion: '/g)]).toHaveLength(PARTES.length);
        expect(c.revisado).toBeNull();
        expect(siguienteConcepto('almacenamiento-energia').id).toBe('interconexion');
        expect(siguienteConcepto('interconexion').id).toBe('mercado-cenace');
        const etapa = HILO_SECTOR.electricidad.etapas.find(e => e.ids.includes('interconexion'));
        expect(etapa.num).toBe('V');
        expect(etapa.ids[0]).toBe('interconexion');
        expect(PUENTE_HILO['almacenamiento-energia'].transicion).toContain('conecta');
        expect(PUENTE_HILO.interconexion.transicion).toContain('CENACE');
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO.interconexion;
        expect(articulo(LSE, 19)).toContain('Todas las Centrales Eléctricas con capacidad igual o mayor a 0.7 MW deben contar con permiso de generación vigente');
        expect(articulo(LSE, 11)).toContain('Expedir modelos de contrato de interconexión de Centrales Eléctricas');
        expect(articulo(LSE, 48)).toContain('están obligadas a interconectar a sus redes las Centrales Eléctricas cuyos representantes lo soliciten');
        expect(articulo(LSE, 48)).toContain('obras de conexión, obras de interconexión y obras de refuerzo determinadas por el CENACE');
        expect(articulo(LSE, 48)).toContain('dentro de los diez días hábiles siguientes a la notificación de la orden');
        expect(articulo(LSE, 48)).toContain('dentro de las setenta y dos horas siguientes');
        expect(articulo(LSE, 49)).toContain('En ningún caso el permiso de generación se toma como criterio para la prelación de solicitudes de interconexión');
        expect(articulo(LSE, 179)).toContain('dentro de los 7 días naturales siguientes');
        expect(articulo(LSE, 184)).toContain('multa del diez por ciento de los ingresos brutos percibidos en el año anterior');
        expect(articulo(LSE, 184)).toContain('Conectar Centrales Eléctricas al Sistema Eléctrico Nacional sin contar con el contrato de interconexión correspondiente');
        expect(articulo(RLSE, 27)).toContain('no implica aprobación alguna para la interconexión o conexión');
        expect(articulo(RLSE, 67)).toContain('capacidades de interconexión máximas sin refuerzos');
        expect(articulo(RLSE, 130)).toContain('solución técnica más económica');
        expect(c.ley.siglas).toEqual(['LSE', 'RLSE', 'MODELOS-INTERCONEXION', 'CONV-GEN-1', 'CONV-GEN-2']);
        expect(JSON.stringify(c)).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        expect(JSON.stringify(c)).not.toContain('DGMESNIE');
    });
});
