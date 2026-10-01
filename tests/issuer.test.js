import { describe, expect, it } from 'vitest';
import { issuerId } from '../src/lib/issuer.js';

describe('issuerId', () => {
    it('reads the authority named in the title', () => {
        expect(issuerId({ tipo: 'acuerdo', titulo: 'Acuerdo de la Comisión Nacional de Energía por el que se emiten los formatos' })).toBe('cne');
        expect(issuerId({ tipo: 'dacg', titulo: 'Acuerdo Núm. A/108/2024 por el que la Comisión Reguladora de Energía expide las disposiciones' })).toBe('cre');
        expect(issuerId({ tipo: 'programa', titulo: 'Programa Institucional del Centro Nacional de Control de Energía 2026-2030' })).toBe('cenace');
        expect(issuerId({ tipo: 'acuerdo', titulo: 'Acuerdo por el que la Secretaría de Energía emite el Plan de Desarrollo del Sector Eléctrico' })).toBe('sener');
    });

    it('assigns laws, law reforms and regulations by their nature', () => {
        expect(issuerId({ tipo: 'ley', titulo: 'Ley del Sector Eléctrico' })).toBe('congreso');
        expect(issuerId({ tipo: 'decreto', titulo: 'Decreto por el que se reforman, adicionan y derogan diversas disposiciones de la Ley de Ingresos sobre Hidrocarburos' })).toBe('congreso');
        expect(issuerId({ tipo: 'decreto', titulo: 'Decreto por el que se reforman y derogan diversas disposiciones del Reglamento de la Ley de Ingresos sobre Hidrocarburos' })).toBe('ejecutivo');
        expect(issuerId({ tipo: 'reglamento', titulo: 'Reglamento Interior de la Comisión Nacional de Energía' })).toBe('ejecutivo');
    });

    it('uses acronyms and overrides, and never guesses', () => {
        expect(issuerId({ tipo: 'convocatoria', siglas: 'ASEA-CONV-GNC', titulo: 'Convocatoria dirigida a las Unidades de Inspección' })).toBe('asea');
        expect(issuerId({ tipo: 'acuerdo', siglas: 'CATALOGO-CONUEE', titulo: 'Acuerdo por el que se emiten las Disposiciones Reglamentarias para el Catálogo' })).toBe('conuee');
        expect(issuerId({ tipo: 'acuerdo', siglas: 'CONV-GEN-2-M4', titulo: 'Acuerdo por el que se emite la cuarta modificación a la Segunda Convocatoria' })).toBe('otra');
    });
});
