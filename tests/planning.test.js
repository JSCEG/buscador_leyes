import { describe, it, expect } from 'vitest';
import { isPlanning } from '../src/lib/planning.js';
import { selectAcervo } from '../src/lib/acervo-model.js';

const laws = [
    { id: 1, siglas: 'PND', tipo: 'plan', titulo: 'Plan Nacional de Desarrollo 2025-2030', fecha_publicacion: '2025-04-15' },
    { id: 2, siglas: 'PND-DECRETO', tipo: 'decreto', titulo: 'Decreto por el que se aprueba el Plan Nacional de Desarrollo 2025-2030', fecha_publicacion: '2025-04-15' },
    { id: 3, siglas: 'PLADESE', tipo: 'acuerdo', titulo: 'Acuerdo por el que la Secretaría de Energía emite el Plan de Desarrollo del Sector Eléctrico', fecha_publicacion: '2025-10-17' },
    { id: 4, siglas: 'PROGRAMA-CENACE', tipo: 'programa', titulo: 'Programa Institucional del Centro Nacional de Control de Energía 2026-2030', fecha_publicacion: '2026-04-30' },
    { id: 5, siglas: 'LPTE', tipo: 'ley', titulo: 'Ley de Planeación y Transición Energética', fecha_publicacion: '2025-03-18' },
    { id: 6, siglas: 'LSE', tipo: 'ley', titulo: 'Ley del Sector Eléctrico', fecha_publicacion: '2025-03-18' },
    { id: 7, siglas: 'CONV-GEN-2', tipo: 'otros', titulo: 'Segunda Convocatoria … alineados a la planeación vinculante', fecha_publicacion: '2026-05-11' },
];

describe('planning filter', () => {
    it('recognises plans, programmes, their approving decrees and the planning framework', () => {
        expect(laws.filter(isPlanning).map(law => law.siglas)).toEqual(['PND', 'PND-DECRETO', 'PLADESE', 'PROGRAMA-CENACE', 'LPTE']);
    });
    it('filters the acervo across collections', () => {
        expect(selectAcervo(laws, { group: 'planeacion', sort: 'date-oldest' }).map(law => law.siglas))
            .toEqual(['LPTE', 'PND-DECRETO', 'PND', 'PLADESE', 'PROGRAMA-CENACE']);
        expect(selectAcervo(laws, { group: 'planeacion', query: 'eléctrico' }).map(law => law.siglas)).toEqual(['PLADESE']);
        // By title, planning instruments follow their hierarchy, each decree right after its plan.
        expect(selectAcervo(laws, { group: 'planeacion' }).map(law => law.siglas)).toEqual(['PND', 'PND-DECRETO', 'PLADESE', 'PROGRAMA-CENACE', 'LPTE']);
    });
});
