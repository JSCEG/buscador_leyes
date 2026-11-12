import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO, HILO_SECTOR, PUENTE_HILO, siguienteConcepto } from '../src/data/como-funciona.js';
import { BLOQUE, CEL, FP, INGENIOS, LINEAS, NACIONAL, PARTES, PLANTA, REF_E, REF_H, cuenta, dia, fp, hora, ingenio, operar, pose, puntasSueltas, refE, revisar, vaporMinimo } from '../conceptos-3d/cogeneracion/modelo.js';
import { FUENTES } from '../conceptos-3d/cogeneracion/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const RLSE = 'RLSE_chunks.json';
// las Disposiciones de Cogeneración de la CNE, tal como se cotejaron contra el DOF para el acervo
const DACG = JSON.parse(readFileSync('revision-acervo/sincronizacion-dacg-cogeneracion-2026-09-30/articulos-verificados.json', 'utf8'));
const dacg = id => DACG.find(r => r.identificador === id).contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('La cogeneración', () => {
    it('sus cifras salen del modelo y coinciden con las fuentes', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada tubo y cada cable tocan un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('usa los valores de referencia vigentes de la CRE (A/018/2023)', () => {
        expect(REF_E).toEqual([[0.5, 0.31], [6, 0.34], [15, 0.37], [50, 0.41], [150, 0.44], [300, 0.47], [Infinity, 0.5]]);
        expect(REF_H.vapor).toBe(0.9);
        expect(FP.at(-1)[1]).toBe(0.99);
        expect(refE(PLANTA.mw)).toBe(0.47);
        expect(fp(PLANTA.kv)).toBe(0.98);
    });

    it('la planta de ejemplo ahorra 21 % y 36 de cada 100 MWh salen libres de combustible', () => {
        const op = operar({ vapor: PLANTA.vaporBase });
        expect(op.E).toBe(277);
        expect(Math.round(op.F)).toBe(815);
        expect(op.H).toBe(382.5);
        expect(Math.round(op.total * 100)).toBe(81);
        const k = cuenta(op);
        expect(Math.round(k.separadoE)).toBe(601);
        expect(k.separadoH).toBe(425);
        expect(Math.round(k.EP)).toBe(1026);
        expect(Math.round(k.AEP)).toBe(212);
        expect(Math.round(k.APEP * 100)).toBe(21);
        expect(Math.round(k.ELC * 10) / 10).toBe(99.5);
        expect(Math.round(k.pctELC * 1000) / 10).toBe(35.9);
        expect(k.eficiente).toBe(true);
        // unos 796 mil certificados al año con 8,000 horas
        expect(Math.round((k.ELC * PLANTA.horasAnio) / 1000)).toBe(796);
        expect(CEL.requisito2026).toBe(0.139);
    });

    it('con poco vapor deja de ahorrar, y contra un ciclo nuevo necesita más', () => {
        expect(Math.round(vaporMinimo('regla'))).toBe(251);
        expect(Math.round(vaporMinimo('nuevo'))).toBe(404);
        expect(cuenta(operar({ vapor: 250 })).eficiente).toBe(false);
        expect(cuenta(operar({ vapor: 252 })).eficiente).toBe(true);
        expect(Math.round(cuenta(operar({ vapor: 500 }), { ref: 'nuevo' }).APEP * 100)).toBe(9);
    });

    it('la energía obligada sigue al vapor y la despachable entra solo si se pide', () => {
        const h = hora({ h: 12 });
        expect(h.vapor).toBe(440);
        expect(Math.round(h.obligada)).toBe(61);
        expect(h.maximoRed).toBe(149);
        expect(h.aRed).toBe(h.obligada);
        expect(hora({ h: 12, maximo: true }).aRed).toBe(149);
        // dar la despachable tira calor por la chimenea
        expect(hora({ h: 12, maximo: true }).op.tirado).toBeGreaterThan(40);
        const d = dia(false);
        expect(d).toHaveLength(24);
        for (const x of d) expect(x.obligada).toBeLessThanOrEqual(x.maximoRed);
    });

    it('el ingenio sigue la zafra 2025/26 de la CONADESUCA', () => {
        expect(INGENIOS.zafra.ingenios).toBe(47);
        expect(INGENIOS.zafra.caniaT).toBe(49605341);
        expect(INGENIOS.porTonelada.kwh).toBe(22.128);
        expect(Math.round(ingenio({ excedente: 72 }).nacionalGWh / 10) * 10).toBe(3570);
        expect(ingenio({ mes: 7 }).zafra).toBe(false);
        expect(ingenio({ mes: 1 }).pctELC).toBe(1);
    });

    it('las cifras del país son las del PLADESE', () => {
        expect(NACIONAL.mw.at(-1)).toEqual([2024, 2293]);
        expect(NACIONAL.gwh2024).toBe(3912);
        expect(NACIONAL.nuevas.reduce((s, [, mw]) => s + mw, 0)).toBe(2422);
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        expect(pose({ modo: 'juntos', separado: true }).activo.caldera).toBe(1);
        expect(pose({ modo: 'juntos' }).activo.caldera).toBe(0);
        expect(pose({ modo: 'juntos', vapor: 150 }).activo.chimenea).toBeGreaterThan(pose({ modo: 'juntos', vapor: 500 }).activo.chimenea);
        expect(pose({ modo: 'ingenio', mes: 1 }).activo.zafra).toBe(1);
        expect(pose({ modo: 'ingenio', mes: 7 }).activo.zafra).toBe(0);
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
        const paginas = ['cogeneracion', 'cogeneracion-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.cogeneracion.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https:\/\//);
            expect(f.para).toBeTruthy();
            expect(f.fecha).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.cogeneracion.fuentes.map(f => f.acervo);
        expect(acervos).toEqual(expect.arrayContaining(['LSE', 'RLSE', 'DACG-COGENERACION', 'MIGRACION-PERMISOS', 'CEL-REQUISITOS-2025-2026']));
        for (const p of paginas) expect(p).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.cogeneracion;
        expect(c.figura).toBe('cogeneracion');
        expect(c.nivel).toBe(3);
        expect(c.antes).toEqual(['ciclo-combinado']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/cogeneracion/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        // cada ficha trae su botón de acción
        expect([...fichas.matchAll(/accion: '/g)]).toHaveLength(PARTES.length);
        expect(c.revisado).toBeNull();
        expect(c.tramites).toEqual(['cogeneracion', 'migracion']);
        expect(siguienteConcepto('ciclo-combinado').id).toBe('cogeneracion');
        expect(siguienteConcepto('cogeneracion').id).toBe('termicas');
        const etapa = HILO_SECTOR.electricidad.etapas.find(e => e.ids.includes('cogeneracion'));
        expect(etapa.ids.slice(1, 4)).toEqual(['ciclo-combinado', 'cogeneracion', 'termicas']);
        expect(PUENTE_HILO['ciclo-combinado'].transicion).toContain('cogeneración');
        expect(PUENTE_HILO.cogeneracion.transicion).toContain('térmicas');
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO.cogeneracion;
        expect(articulo(LSE, 3)).toContain('k) La energía generada por centrales de cogeneración eficiente, en términos de los criterios de eficiencia emitidos por la CNE');
        expect(articulo(LSE, 3)).toContain('l) La energía generada por ingenios azucareros que cumplan con los criterios de eficiencia que establezca la CNE');
        expect(articulo(LSE, 18)).toContain('El permiso de generación puede comprender la modalidad de cogeneración');
        expect(articulo(LSE, 41)).toContain('Es realizada conjuntamente con vapor u otro tipo de energía térmica secundaria');
        expect(articulo(LSE, 41)).toContain('combustibles producidos en los propios procesos industriales');
        expect(articulo(LSE, 42)).toContain('únicamente para la potencia que pueda obtenerse utilizando la energía térmica no aprovechada');
        expect(articulo(LSE, 43)).toContain('Se otorga despacho obligado a la energía eléctrica producida mediante el proceso de cogeneración');
        expect(articulo(RLSE, 89)).toContain('de manera secuencial, a partir de una sola fuente de energía');
        expect(articulo(RLSE, 90)).toContain('se puede dar en las figuras de autoconsumo y de generación para el Mercado Eléctrico Mayorista');
        expect(articulo(RLSE, 91)).toContain('disposiciones administrativas de carácter general en materia de cogeneración');
        expect(articulo(RLSE, 92)).toContain('reglas de despacho obligado');
        expect(articulo(RLSE, 191)).toContain('por el porcentaje de energía libre de combustible fósil');
        expect(dacg('Numeral 1.4')).toContain('Energía Eléctrica Obligada: Energía eléctrica generada por la Central Eléctrica');
        expect(dacg('Numeral 1.4')).toContain('Energía Despachable: Corresponde a la energía eléctrica que puede producir la Central Eléctrica');
        expect(dacg('Numeral 2.6')).toContain('debe definirse en función de la Demanda Térmica');
        expect(dacg('Numeral 2.8')).toContain('Demanda Térmica esperada al 80% del tiempo de operación anual');
        expect(dacg('Numeral 3.7')).toContain('durante un periodo continuo de seis meses');
        expect(dacg('Transitorio SEGUNDO')).toContain('se deben aplicar los instrumentos vigentes en materia de Cogeneración Eficiente');
        expect(c.ley.siglas).toEqual(['LSE', 'RLSE', 'DACG-COGENERACION', 'MIGRACION-PERMISOS', 'CEL-REQUISITOS-2025-2026']);
        expect(JSON.stringify(c)).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        expect(JSON.stringify(c)).not.toContain('DGMESNIE');
        expect(c.resumen).toContain('Comisión Nacional de Energía (CNE)');
    });
});
