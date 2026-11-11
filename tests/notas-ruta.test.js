import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO, CONCEPTOS, HILO_SECTOR, PUENTE_HILO, siguienteConcepto } from '../src/data/como-funciona.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const LSH = 'LSH_chunks.json';

describe('Las notas de la ruta de Aprende', () => {
    it('cada nota y cada paso de la ruta apuntan a un tema que existe', () => {
        for (const id of Object.keys(PUENTE_HILO)) expect(CONCEPTO[id], id).toBeTruthy();
        for (const hilo of Object.values(HILO_SECTOR)) for (const etapa of hilo.etapas) for (const id of etapa.ids) expect(CONCEPTO[id], id).toBeTruthy();
        // cada tema de la ruta sale en uno de sus pasos
        for (const [sector, hilo] of Object.entries(HILO_SECTOR)) {
            const enPasos = hilo.etapas.flatMap(e => e.ids);
            expect(enPasos).toEqual(CONCEPTOS.filter(c => c.sector === sector).map(c => c.id));
        }
    });

    it('cada transición habla del tema que sigue', () => {
        const nombre = { voltaje: 'volt', 'cd-ca': 'alterna', motor: 'motor', generador: 'generador', transformador: 'transformador', inversor: 'inversor', 'ciclo-combinado': 'ciclo combinado', eolica: 'eólica', 'planeacion-desarrollo-mixto': 'planeación', gasoductos: 'gasoductos', 'almacenamiento-tar': 'Almacenamiento', refinacion: 'refinería', 'asignaciones-hidrocarburos': 'Asignaciones', 'mercado-hidrocarburos': 'gasolina' };
        for (const [id, nota] of Object.entries(PUENTE_HILO)) {
            const sig = siguienteConcepto(id);
            if (!sig) continue;
            expect(nombre[sig.id], `${id} → ${sig.id}`).toBeTruthy();
            expect(nota.transicion, `${id} → ${sig.id}`).toContain(nombre[sig.id]);
        }
    });

    it('lo que dicen de la Ley del Sector Eléctrico está en sus artículos', () => {
        expect(articulo(LSE, 4)).toContain('El Suministro Eléctrico es un servicio de interés público');
        expect(articulo(LSE, 3)).toContain('XII. Control Operativo del Sistema Eléctrico Nacional: Actividad estratégica exclusiva del Estado que refiere a la emisión de instrucciones relativas a: a) La asignación y despacho');
        expect(articulo(LSE, 124)).toContain('I. Ejercer el Control Operativo del Sistema Eléctrico Nacional');
        expect(articulo(LSE, 3)).toContain('XL. Red Eléctrica: Sistema integrado por líneas, subestaciones y equipos de transformación');
        expect(articulo(LSE, 3)).toContain('XLII. Redes Generales de Distribución: Redes Eléctricas que se utilizan para distribuir energía eléctrica al público en general');
        expect(articulo(LSE, 19)).toContain('Todas las Centrales Eléctricas con capacidad igual o mayor a 0.7 MW deben contar con permiso de generación vigente');
        expect(articulo(LSE, 11)).toContain('I. Otorgar los permisos a los que se refiere esta Ley');
        expect(articulo(LSE, 22)).toContain('II. Operar sus Centrales Eléctricas cumpliendo las bases y Reglas del Mercado Eléctrico Mayorista, así como las instrucciones del CENACE');
        expect(articulo(LSE, 57)).toContain('El Servicio Público de Transmisión y Distribución de Energía Eléctrica es un área estratégica exclusiva del Estado');
        expect(articulo(LSE, 110)).toContain('El CENACE opera el Mercado Eléctrico Mayorista');
        expect(articulo(LSE, 117)).toContain('Con base en criterios de Seguridad de Despacho, Confiabilidad y eficiencia económica, el CENACE determina la asignación y despacho de las Centrales Eléctricas');
        expect(articulo(LSE, 12)).toContain('El Estado debe mantener al menos el cincuenta y cuatro por ciento del promedio de la energía inyectada a la red, en un año calendario');
        expect(articulo(LSE, 38)).toContain('I. Producción de largo plazo; II. Inversión mixta');
        // la ley no habla de 60 Hz ni de un 46 % para particulares
        expect(articulo(LSE, 1) + articulo(LSE, 4)).not.toContain('60 Hz');
        expect(PUENTE_HILO.electricidad.regulacion).not.toContain('60 Hz');
        expect(HILO_SECTOR.electricidad.resumen).not.toContain('46 %');
    });

    it('lo que dicen de la Ley del Sector Hidrocarburos está en sus artículos', () => {
        expect(articulo(LSH, 1)).toContain('Corresponde a la Nación la propiedad directa, inalienable e imprescriptible de todos los Hidrocarburos que se encuentren en el subsuelo');
        expect(articulo(LSH, 8)).toContain('La planeación del sector hidrocarburos tiene carácter vinculante y está a cargo de la Secretaría de Energía');
        expect(articulo(LSH, 11)).toContain('orden de prelación siguiente: I. Asignación para Desarrollo Propio, y II. Asignación para Desarrollo Mixto');
        expect(articulo(LSH, 13)).toContain('exclusivamente a Petróleos Mexicanos quien debe fungir como Operador Petrolero');
        expect(articulo(LSH, 24)).toContain('Petróleos Mexicanos mantiene el derecho exclusivo sobre la Asignación');
        expect(articulo(LSH, 31)).toContain('no menor al cuarenta por ciento');
        expect(articulo(LSH, 76)).toContain('b) La Formulación, Transporte, Almacenamiento, Distribución, Comercialización, Expendio al Público y despacho para autoconsumo de Petrolíferos');
        expect(articulo(LSH, 76)).toContain('entrega semanal de información relacionada con controles volumétricos');
        // los artículos 80 y 89 son la solicitud y la revocación, no el permiso ni los controles
        expect(PUENTE_HILO['mercado-hidrocarburos'].regulacion).not.toContain('art. 80');
    });

    it('usan los términos que pidió el sitio y no repiten lo que ya se corrigió', () => {
        const todo = JSON.stringify(PUENTE_HILO) + JSON.stringify(HILO_SECTOR);
        expect(todo).not.toContain('SAEE');
        expect(todo).not.toContain('certificados bajo el Código de Red');
        expect(todo).not.toContain('reduce proporcionalmente la corriente y las pérdidas');
        expect(PUENTE_HILO['cd-ca'].regulacion).toContain('Sistema de Almacenamiento de Energía (SAE)');
    });
});
