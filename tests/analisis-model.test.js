import { describe, expect, it } from 'vitest';
import seed from '../src/data/explorer-catalog.json';
import { topicOverview, matchAcervo, topicAcervo, acervoThemes, isThematicLink } from '../src/lib/analisis-model.js';

const laws = [
    { id: 'pnd', titulo: 'Plan Nacional de Desarrollo 2025-2030', siglas: 'PND', tipo: 'plan', temas_clave: [] },
    { id: 'pnd-decreto', titulo: 'Decreto por el que se aprueba el Plan Nacional de Desarrollo 2025-2030', siglas: 'PND-DECRETO', tipo: 'decreto' },
    { id: 'lcne', titulo: 'Ley de la Comisión Nacional de Energía', siglas: 'LCNE', tipo: 'ley', temas_clave: ['Planeación Vinculante'] },
    { id: 'ricne', titulo: 'Reglamento Interior de la Comisión Nacional de Energía', siglas: 'RICNE', tipo: 'reglamento' },
    { id: 'acuerdo-cne', titulo: 'Acuerdo de la Comisión Nacional de Energía por el que se emiten formatos', tipo: 'acuerdo', temas_clave: ['planeacion vinculante', 'Modificación'] },
];
const entity = id => seed.entities.find(item => item.id === id);

describe('analisis model', () => {
    it('groups a topic by entity type and separates the root', () => {
        const overview = topicOverview(seed, 'planeacion-vinculante');
        expect(overview.root.id).toBe('tema-planeacion-vinculante');
        expect(overview.groups.instrumento.map(item => item.id)).toContain('pladese');
        expect(overview.members).toBe(11);
        expect(overview.typedRelations).toEqual([]);
        expect(seed.relations.every(isThematicLink)).toBe(true);
    });

    it('matches instruments by acronym and title, authorities by their organic law', () => {
        expect(matchAcervo(entity('pnd'), laws).map(law => law.id)).toEqual(['pnd']);
        expect(matchAcervo(entity('cne'), laws).map(law => law.id)).toEqual(['lcne', 'ricne']);
    });

    it('builds topic and theme indexes from temas_clave, merging case and accents', () => {
        expect(topicAcervo(seed.topics[0], laws).map(law => law.id)).toEqual(['lcne', 'acuerdo-cne']);
        expect(acervoThemes(laws).map(theme => [theme.label, theme.count])).toEqual([['Planeación Vinculante', 2]]);
    });
});
