import { describe, expect, it } from 'vitest';
import { shortTitle } from '../src/lib/short-title.js';

describe('shortTitle', () => {
    it('drops the issuing boilerplate and the introducing verb', () => {
        expect(shortTitle('Acuerdo de la Comisión Nacional de Energía por el que se emite la metodología para la determinación del cargo correspondiente al servicio de transmisión')).toBe('Metodología para la determinación del cargo correspondiente al servicio de transmisión');
        expect(shortTitle('Acuerdo por el que la Secretaría de Energía emite el Plan de Desarrollo del Sector Eléctrico')).toBe('Plan de Desarrollo del Sector Eléctrico');
        expect(shortTitle('Aviso mediante el cual se informa la publicación del Programa Institucional 2026-2030 del Centro Nacional de Control de Energía')).toBe('Publicación del Programa Institucional 2026-2030 del Centro Nacional de Control de Energía');
    });

    it('keeps the verb when the change itself is the point', () => {
        expect(shortTitle('Decreto por el que se reforman y derogan diversas disposiciones del Reglamento de la Ley de Ingresos sobre Hidrocarburos')).toBe('Reforma diversas disposiciones del Reglamento de la Ley de Ingresos sobre Hidrocarburos');
        expect(shortTitle('Acuerdo por el que se modifican, eliminan y adicionan diversas disposiciones de los Lineamientos para la migración voluntaria')).toBe('Modifica diversas disposiciones de los Lineamientos para la migración voluntaria');
        expect(shortTitle('Decreto por el que se aprueba el Plan Nacional de Desarrollo 2025-2030 para la transformación')).toBe('Aprueba el Plan Nacional de Desarrollo 2025-2030 para la transformación');
    });

    it('leaves short, patternless or addressed titles alone', () => {
        expect(shortTitle('Ley del Sector Eléctrico')).toBeNull();
        expect(shortTitle('Convocatoria para la atención prioritaria de solicitudes de permisos de generación eléctrica e interconexión')).toBeNull();
        expect(shortTitle('Aviso por el que se informa a todos los participantes del mercado eléctrico mayorista y a la población en general')).toBeNull();
    });
});
