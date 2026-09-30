import { describe, expect, it } from 'vitest';
import { indexLabel, isGuide, ordinalValue } from '../src/lib/index-label.js';

const label = (articulo_label, tipo_articulo = 'ordinario') => indexLabel({ articulo_label, tipo_articulo }).short;

describe('index labels', () => {
    it('shows a plan (PLADESHi) by its own structure, never by position', () => {
        expect(label('Artículo Único · Expedición del plan')).toBe('Art. Único');
        expect(label('Presentación e índices del plan', 'anexo')).toBe('Índice');
        expect(label('Apartado 1.1 Marco jurídico')).toBe('1.1');
        expect(label('Apartado 1.5.1 Estrategia para Estabilizar los Precios de la Gasolina y GLP')).toBe('1.5.1');
        expect(label('Apartado 2.2.1.1. Pozos de Desarrollo')).toBe('2.2.1.1');
        expect(label('Preámbulo del acuerdo', 'preambulo')).toBe('Preámb.');
        expect(label('Transitorio ÚNICO', 'transitorio')).toBe('T. Único');
        expect(label('Firma del acuerdo', 'complementario')).toBe('Firma');
        expect(indexLabel({ articulo_label: 'Apartado 1.1 Marco jurídico', tipo_articulo: 'ordinario' }).kind).toBe('apartado');
    });

    it('keeps numbered articles of a law readable', () => {
        expect(label('Artículo 27')).toBe('Art. 27');
        expect(label('Artículo 12 Bis')).toBe('Art. 12 Bis');
        expect(label('Artículo Décimo Segundo')).toBe('Art. 12º');
        expect(label('Transitorio Vigésimo Primero', 'transitorio')).toBe('T. 21º');
        expect(label('Transitorio Segundo · decreto', 'transitorio')).toBe('T. 2º Dec.');
        expect(label('Transitorio Primero · ley', 'transitorio')).toBe('T. 1º');
    });

    it('covers the other structures of the acervo', () => {
        expect(label('Disposición Trigésima quinta')).toBe('Disp. 35ª');
        expect(label('Disposición 18.- Declaración de integridad')).toBe('Disp. 18');
        expect(label('Cláusula Décima')).toBe('Cláus. 10ª');
        expect(label('Numeral 3.12.1')).toBe('Num. 3.12.1');
        expect(label('Modificación al artículo 6o.')).toBe('Mod. 6º');
        expect(label('Seguimiento · Objetivo T2.3: Unificar capacidades')).toBe('Obj. T2.3');
        expect(label('Anexo estadístico · Tabla A1.6', 'anexo')).toBe('Tabla A1.6');
        expect(label('Apéndice A · Numeral 11.1.4 Revisión')).toBe('A·11.1.4');
        expect(ordinalValue('Decimoprimera')).toBe(11);
    });

    it('identifies the editorial guide apart from official text', () => {
        const guide = { articulo_label: 'Guía · documentos relacionados', tipo_articulo: 'complementario' };
        expect(isGuide(guide)).toBe(true);
        expect(indexLabel(guide)).toEqual({ short: 'Guía', kind: 'guia' });
        expect(isGuide({ articulo_label: 'Nota editorial · alcance', tipo_articulo: 'complementario' })).toBe(true);
        expect(isGuide({ articulo_label: 'Firma del acuerdo', tipo_articulo: 'complementario' })).toBe(false);
    });
});
