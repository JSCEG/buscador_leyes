import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACERVO_GROUPS, getAcervoGroup, groupAcervo, selectAcervo, acervoIssuers, acervoReels } from '../src/lib/acervo-model.js';

const realCatalog = JSON.parse(readFileSync('revision-acervo/incorporacion-autoconsumo-2026-09-18/despues-verificado/leyes.json', 'utf8'));
const instrument = siglas => realCatalog.find(item => item.siglas === siglas);

describe('navigation collections versus legal document type', () => {
    it('groups the complete audited 41-instrument collection exactly once without rewriting metadata', () => {
        const before = JSON.stringify(realCatalog);
        const grouped = groupAcervo(realCatalog);
        expect(Object.fromEntries(grouped.map(group => [group.id, group.items.length]))).toEqual({
            leyes: 10, reglamentos: 9, acuerdos: 5, dacg: 3, convocatorias: 13, normas: 0, otros: 1,
        });
        const flattened = grouped.flatMap(group => group.items);
        expect(flattened).toHaveLength(41);
        expect(new Set(flattened.map(item => item.id)).size).toBe(41);
        expect(flattened.every(item => realCatalog.includes(item))).toBe(true);
        expect(JSON.stringify(realCatalog)).toBe(before);
    });

    it('places the SAE issuing agreement with DACG but keeps forms and incidental mentions with agreements', () => {
        const issuance = instrument('ACUERDO-CNE-16/04/2026-DACG-SAE');
        expect(getAcervoGroup(issuance)).toBe('dacg');
        expect(issuance.tipo).toBe('acuerdo');
        for (const siglas of ['FORMATOS-SAEE', 'FORMATO-AUTOCONSUMO', 'AUTOCONSUMO-0.7-20', 'VENTANILLA-AUTOCONSUMO']) {
            expect(getAcervoGroup(instrument(siglas))).toBe('acuerdos');
        }
        expect(getAcervoGroup({ tipo: 'acuerdo', titulo: 'Acuerdo por el que se emiten los lineamientos para aplicar las disposiciones administrativas de carácter general' })).toBe('acuerdos');
        expect(getAcervoGroup({ tipo: 'acuerdo', titulo: 'Acuerdo sobre la difusión de convocatorias y DACG' })).toBe('acuerdos');
        expect(getAcervoGroup({ tipo: 'acuerdo', titulo: 'Acuerdo por el que se publican los formatos de las convocatorias' })).toBe('acuerdos');
    });

    it.each(['emiten', 'expiden', 'establecen'])('recognizes an agreement that directly %s DACG by its operative object', verb => {
        expect(getAcervoGroup({ tipo: 'acuerdo', titulo: `ACUERDO de la Comisión por el que se ${verb} las Disposiciones Administrativas de Carácter General para almacenamiento` })).toBe('dacg');
    });

    it('keeps convocatorias and their actual modifications together while retaining acuerdo/otros metadata', () => {
        const calls = realCatalog.filter(item => item.siglas.startsWith('CONV-'));
        expect(calls).toHaveLength(13);
        expect(calls.every(item => getAcervoGroup(item) === 'convocatorias')).toBe(true);
        expect(instrument('CONV-GEN-2').tipo).toBe('otros');
        expect(instrument('CONV-GEN-2-M4').tipo).toBe('acuerdo');
        expect(getAcervoGroup({ titulo: 'Acuerdo por el que se modifica la Primera Convocatoria para proyectos' })).toBe('convocatorias');
    });

    it('honors explicit specific types even when titles mention other document types', () => {
        expect(getAcervoGroup({ tipo: 'ley', titulo: 'Ley de instrumentos y convocatorias' })).toBe('leyes');
        expect(getAcervoGroup({ tipo: ' Reglamento ', titulo: 'Disposiciones administrativas de carácter general' })).toBe('reglamentos');
        expect(getAcervoGroup({ tipo: 'DACG', titulo: 'Acuerdo regulatorio' })).toBe('dacg');
        expect(getAcervoGroup({ tipo: 'nom', titulo: 'Norma aplicable a los acuerdos' })).toBe('normas');
        expect(getAcervoGroup({ tipo: 'decreto', titulo: 'Decreto por el que se expide la Ley del Sector Eléctrico' })).toBe('otros');
        expect(getAcervoGroup({ tipo: 'circular', titulo: 'Ley de referencia mencionada en una circular' })).toBe('otros');
    });

    it('keeps unfamiliar and missing document types discoverable and handles an empty collection', () => {
        const unknown = { id: 'circular', tipo: 'circular', titulo: 'Circular de prueba' };
        const missing = { id: 'missing', titulo: 'Documento sin clasificación' };
        const otherGroup = groupAcervo([unknown, missing]).find(group => group.id === 'otros');
        expect(otherGroup.items).toEqual([unknown, missing]);
        expect(getAcervoGroup({ titulo: 'Reglamento Interior de la Secretaría de Energía' })).toBe('reglamentos');
        expect(getAcervoGroup({ titulo: 'NOM-001-SEDE Instalaciones eléctricas' })).toBe('normas');
        expect(getAcervoGroup(null)).toBe('otros');
        expect(groupAcervo(undefined).every(group => group.items.length === 0)).toBe(true);
        expect(groupAcervo([]).map(group => group.id)).toEqual(ACERVO_GROUPS.map(group => group.id));
    });
});

describe('acervo selection', () => {
    it('matches accents, acronyms and topic words together without changing stored text', () => {
        const laws = [
            { id: 'a', tipo: 'ley', titulo: 'Ley de Energía', siglas: 'LÉ', temas_clave: ['Planeación vinculante', 'Hidrógeno'] },
            { id: 'b', tipo: 'reglamento', titulo: 'Reglamento de Energía', siglas: 'RE', temas_clave: ['Almacenamiento'] },
            { id: 'c', tipo: 'circular', titulo: 'Circular', siglas: 'CIR', temas_clave: 'Transición energética' },
        ];
        expect(selectAcervo(laws, { query: '  le   hidrogeno  ', group: 'leyes' })).toEqual([laws[0]]);
        expect(selectAcervo(laws, { query: 'ENERGÍA' })).toEqual(selectAcervo(laws, { query: 'energia' }));
        expect(selectAcervo(laws, { query: 'transicion', group: 'otros' })).toEqual([laws[2]]);
        expect(selectAcervo(laws, { query: 'almacenamiento', group: 'leyes' })).toEqual([]);
        expect(selectAcervo(realCatalog, { query: 'DACG-PERMISOS-GA', group: 'dacg' })).toEqual([instrument('DACG-PERMISOS-GA')]);
    });

    it('returns a new sorted array, preserves original objects and uses natural Spanish title order', () => {
        const laws = [
            Object.freeze({ id: 'b', titulo: 'Norma 10', tipo: 'nom' }),
            Object.freeze({ id: 'a', titulo: 'Ámbito energético', tipo: 'otros' }),
            Object.freeze({ id: 'c', titulo: 'Norma 2', tipo: 'nom' }),
        ];
        const frozen = Object.freeze(laws);
        const selected = selectAcervo(frozen);
        expect(selected.map(item => item.id)).toEqual(['a', 'c', 'b']);
        expect(selected).not.toBe(frozen);
        expect(selected[0]).toBe(laws[1]);
        expect(frozen.map(item => item.id)).toEqual(['b', 'a', 'c']);
        expect(groupAcervo(selected).find(group => group.id === 'normas').items.map(item => item.id)).toEqual(['c', 'b']);
    });

    it('sorts valid publication dates in either direction and leaves absent or invalid dates last', () => {
        const laws = [
            { id: 'missing', titulo: 'Sin fecha', fecha_publicacion: null },
            { id: 'old', titulo: 'Antiguo', fecha_publicacion: '2025-03-18' },
            { id: 'recent', titulo: 'Reciente', fecha_publicacion: '2026-09-10' },
            { id: 'impossible', titulo: 'Fecha imposible', fecha_publicacion: '2026-02-30' },
            { id: 'invalid', titulo: 'Fecha inválida', fecha_publicacion: 'ayer' },
            { id: 'recent-tie', titulo: 'Actualización', fecha_publicacion: '2026-09-10' },
        ];
        expect(selectAcervo(laws, { sort: 'date-newest' }).map(item => item.id)).toEqual(['recent-tie', 'recent', 'old', 'impossible', 'invalid', 'missing']);
        expect(selectAcervo(laws, { sort: 'date-oldest' }).map(item => item.id)).toEqual(['old', 'recent-tie', 'recent', 'impossible', 'invalid', 'missing']);
    });

    it('handles absent fields and unknown filters without dropping valid unknown instruments', () => {
        const laws = [{ id: 'unknown', tipo: 'sin-taxonomia', temas_clave: [null, 2, 'Litio'] }, { id: 'a', titulo: 'Acuerdo' }];
        expect(selectAcervo(laws, { query: 'litio', group: 'otros' })).toEqual([laws[0]]);
        expect(selectAcervo(laws, { group: 'not-a-group' })).toEqual([]);
        expect(selectAcervo(laws, { sort: 'unknown-sort' })).toEqual(selectAcervo(laws));
        expect(selectAcervo(null)).toEqual([]);
        expect(selectAcervo([null, false, [], ...laws])).toHaveLength(2);
    });
});

describe('acervo reels', () => {
    const laws = [
        { id: 'lse', titulo: 'Ley del Sector Eléctrico', tipo: 'ley', fecha_publicacion: '2025-03-18' },
        { id: 'prosener', titulo: 'Programa Sectorial de Energía', siglas: 'PROSENER', tipo: 'plan', fecha_publicacion: '2025-10-01' },
        { id: 'dacg-cne', titulo: 'Acuerdo de la Comisión Nacional de Energía por el que se emiten las DACG de almacenamiento', tipo: 'acuerdo', fecha_publicacion: '2026-05-02' },
        { id: 'acuerdo-cne', titulo: 'Acuerdo de la Comisión Nacional de Energía sobre autoconsumo', tipo: 'acuerdo', fecha_publicacion: '2026-07-20' },
        { id: 'acuerdo-sener', titulo: 'Acuerdo de la Secretaría de Energía sobre eficiencia', tipo: 'acuerdo', fecha_publicacion: '2024-01-15' },
        { id: 'sin-fecha', titulo: 'Acuerdo sin autoridad identificada', tipo: 'acuerdo' },
    ];
    const ids = row => row.items.map(law => law.id);

    it('filters by the authority that issued the document', () => {
        expect(selectAcervo(laws, { issuer: 'cne', sort: 'title' }).map(law => law.id).sort()).toEqual(['acuerdo-cne', 'dacg-cne']);
        expect(selectAcervo(laws, { issuer: 'cne', group: 'dacg' }).map(law => law.id)).toEqual(['dacg-cne']);
    });
    it('lists only authorities with documents, with their counts', () => {
        const issuers = acervoIssuers(laws);
        expect(issuers.find(item => item.id === 'cne')).toMatchObject({ short: 'CNE', count: 2 });
        expect(issuers.find(item => item.id === 'pemex')).toBeUndefined();
        expect(issuers.reduce((sum, item) => sum + item.count, 0)).toBe(laws.length);
    });
    it('opens with the latest documents and a row per type', () => {
        const reels = acervoReels(laws);
        expect(reels.layout).toBe('rows');
        expect(reels.rows[0].id).toBe('recientes');
        expect(ids(reels.rows[0])[0]).toBe('acuerdo-cne');
        expect(ids(reels.rows[0])).not.toContain('sin-fecha');
        expect(reels.rows.map(row => row.id)).toEqual(expect.arrayContaining(['leyes', 'acuerdos', 'dacg']));
    });
    it('an authority shows its documents by type', () => {
        const reels = acervoReels(laws, { issuer: 'cne' });
        expect(reels.layout).toBe('rows');
        expect(reels.rows.map(row => row.id)).toEqual(['acuerdos', 'dacg']);
    });
    it('a type shows its documents by authority', () => {
        const reels = acervoReels(laws, { group: 'acuerdos' });
        expect(reels.layout).toBe('rows');
        expect(reels.rows.map(row => row.id)).toEqual(expect.arrayContaining(['sener', 'cne', 'otra']));
        expect(reels.rows.flatMap(ids).sort()).toEqual(['acuerdo-cne', 'acuerdo-sener', 'sin-fecha']);
    });
    it('uses a grid for a search, for both filters, or when a single row would remain', () => {
        expect(acervoReels(laws, { query: 'autoconsumo' }).layout).toBe('grid');
        expect(acervoReels(laws, { group: 'acuerdos', issuer: 'cne' }).layout).toBe('grid');
        const single = acervoReels(laws, { group: 'dacg' });
        expect(single.layout).toBe('grid');
        expect(single.items.map(law => law.id)).toEqual(['dacg-cne']);
    });
    it('features the newest dated documents of the selection', () => {
        expect(acervoReels(laws).featured.map(law => law.id).slice(0, 2)).toEqual(['acuerdo-cne', 'dacg-cne']);
        expect(acervoReels(laws, { issuer: 'sener' }).featured[0].id).toBe('prosener');
        expect(acervoReels([{ id: 'x', titulo: 'Acuerdo sin fecha', tipo: 'acuerdo' }]).featured).toEqual([]);
    });
});
