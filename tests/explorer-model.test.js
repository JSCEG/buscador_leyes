import { describe, expect, it } from 'vitest';
import catalog from '../src/data/explorer-catalog.json';
import legacy from '../src/data/legacy-temas.json';
import { EXPLORER_LIMITS, escapeHtml, getEntityReferences, getNeighborhood, searchEntities, validateCatalog } from '../src/lib/explorer-model.js';

const ARTICLE = 'cc0ff4c9-59ad-4f8c-acb3-906e691b33ae';
const copy = value => JSON.parse(JSON.stringify(value));
const entity = (id, type = 'concepto') => ({ id, type, title: id, description: `Descripción de ${id}`, aliases: [], references: [] });
const relation = (source, target) => ({
    id: `${source}-${target}`, source, target, type: 'asociacion-tematica', label: 'Relación temática',
    description: 'Asociación editorial para la consulta.', references: [], reviewStatus: 'editorial',
});
function smallCatalog() {
    return {
        schemaVersion: 1, revision: 1, updatedAt: '2026-09-19T00:00:00.000Z',
        topics: [{ id: 'tema', title: 'Tema', summary: 'Colección de ejemplo.', rootEntityId: 'a', entityIds: ['a', 'b', 'c', 'd'] }],
        entities: [entity('a'), entity('b', 'instrumento'), entity('c'), entity('d')],
        relations: [relation('a', 'b'), relation('b', 'c'), relation('c', 'a'), relation('c', 'd')],
    };
}

describe('versioned explorer catalog', () => {
    it('loads the complete legacy migration with real article UUIDs and explicitly unresolved aliases', () => {
        expect(validateCatalog(catalog)).toEqual({ valid: true, errors: [] });
        expect(catalog.topics.map(topic => topic.id)).toEqual(legacy.map(topic => topic.id));
        const references = [...catalog.entities, ...catalog.relations].flatMap(item => item.references);
        const migratedAliases = new Set(references.map(reference => reference.legacyArticleId).filter(Boolean));
        const legacyAliases = new Set(legacy.flatMap(topic => [
            ...topic.articulosClave.map(article => article.id),
            ...topic.cadena.flatMap(level => level.nodos.flatMap(node => node.articulos)),
        ]));
        expect(migratedAliases).toEqual(legacyAliases);
        expect(migratedAliases.size).toBe(27);
        for (const topic of legacy) {
            const current = catalog.topics.find(item => item.id === topic.id);
            expect(current.entityIds).toEqual(expect.arrayContaining(topic.cadena.flatMap(level => level.nodos.map(node => node.id))));
        }
        expect(new Set(references.filter(reference => reference.legacyArticleId && !reference.articleId).map(reference => reference.legacyArticleId))).toEqual(new Set([
            'LCPE-Art-002', 'LCPE-Art-008', 'RCPE-Art-012', 'RCPE-Art-015', 'LPTE-Art-110', 'BME-Art-126', 'BME-Art-1-2-6',
        ]));
        expect(references.every(reference => !reference.articleId || /^[a-f0-9-]{36}$/i.test(reference.articleId))).toBe(true);
        expect(references.every(reference => !reference.quote)).toBe(true);
        expect(catalog.relations.every(item => item.reviewStatus === 'editorial')).toBe(true);
    });

    it('adds an unrelated collection, instrument and relation through data without special-case code', () => {
        const updated = copy(catalog);
        updated.revision++;
        updated.entities.push(entity('coleccion-nueva'), { ...entity('documento-nuevo', 'instrumento'), aliases: ['NUEVO-2026'] });
        updated.relations.push(relation('coleccion-nueva', 'documento-nuevo'));
        updated.topics.push({ id: 'nueva', title: 'Nueva colección', summary: 'Contenido agregado desde datos.', rootEntityId: 'coleccion-nueva', entityIds: ['coleccion-nueva', 'documento-nuevo'] });
        expect(validateCatalog(updated).valid).toBe(true);
        expect(searchEntities(updated, 'nuevo-2026', { topicId: 'nueva' }).map(item => item.id)).toEqual(['documento-nuevo']);
        expect(getNeighborhood(updated, 'coleccion-nueva', { topicId: 'nueva' }).entities.map(item => item.id)).toEqual(['coleccion-nueva', 'documento-nuevo']);
        expect(searchEntities(catalog, 'nuevo-2026')).toEqual([]);
    });

    it('rejects unknown versions, invalid revision/date, malformed shapes and duplicate identifiers', () => {
        for (const input of [null, undefined, [], 'catalog']) expect(validateCatalog(input).valid).toBe(false);
        const invalid = smallCatalog();
        invalid.schemaVersion = 2;
        invalid.revision = 1.5;
        invalid.updatedAt = 'ayer';
        invalid.entities.push(copy(invalid.entities[0]));
        invalid.topics.push(copy(invalid.topics[0]));
        invalid.relations.push(copy(invalid.relations[0]));
        const result = validateCatalog(invalid);
        expect(result.valid).toBe(false);
        for (const path of ['schemaVersion', 'revision', 'updatedAt', 'entities[4].id', 'topics[1].id', 'relations[4].id']) {
            expect(result.errors.some(error => error.startsWith(path))).toBe(true);
        }
    });

    it('rejects dangling entity references, a root outside its topic and repeated topic members', () => {
        const invalid = smallCatalog();
        invalid.topics[0].entityIds = ['b', 'b', 'missing'];
        invalid.relations[0].target = 'missing';
        const errors = validateCatalog(invalid).errors;
        expect(errors.some(error => error.includes('rootEntityId'))).toBe(true);
        expect(errors.some(error => error.includes('repetida'))).toBe(true);
        expect(errors.some(error => error.includes('no existe'))).toBe(true);
        expect(errors.some(error => error.startsWith('relations[0].target'))).toBe(true);
    });

    it('keeps external evidence separate from unresolved legacy references', () => {
        const draft = smallCatalog();
        draft.entities[0].references = [
            { label: 'Artículo de ejemplo', articleId: ARTICLE },
            { label: 'Fuente externa', url: 'https://www.dof.gob.mx/nota_detalle.php?codigo=1' },
            { label: 'Pendiente de localizar', legacyArticleId: 'BME-Art-126' },
        ];
        expect(validateCatalog(draft).valid).toBe(true);
        draft.entities[0].references[0].articleId = 'LPTE-Art-002';
        expect(validateCatalog(draft).errors.some(error => error.includes('UUID real'))).toBe(true);
        draft.entities[0].references[0] = { label: 'Sin ubicación' };
        expect(validateCatalog(draft).valid).toBe(false);
        draft.entities[0].references = [];
        draft.relations[0].reviewStatus = 'verificada';
        draft.relations[0].references = [{ label: 'Pendiente', legacyArticleId: 'BME-Art-126' }];
        expect(validateCatalog(draft).errors.some(error => error.includes('localizable'))).toBe(true);
    });

    it.each(['javascript:alert(1)', 'data:text/html,<svg onload=alert(1)>', '//example.com', 'file:///tmp/doc.pdf', 'https://user:pass@example.com', 'https://example.com\n/path'])('rejects an unsafe source URL: %s', url => {
        const draft = smallCatalog();
        draft.entities[0].references = [{ label: 'Fuente', url }];
        expect(validateCatalog(draft).valid).toBe(false);
    });

    it('bounds catalog arrays, nested text, identifiers and unknown properties', () => {
        const draft = smallCatalog();
        draft.topics = Array(EXPLORER_LIMITS.topics + 1).fill(draft.topics[0]);
        draft.entities[0].description = 'a'.repeat(12001);
        draft.entities[0].aliases = Array(EXPLORER_LIMITS.aliases + 1).fill('alias');
        draft.entities[1].id = '<img onerror=alert(1)>';
        draft.entities[2].html = '<script>attack()</script>';
        draft.relations[0].references = Array(EXPLORER_LIMITS.references + 1).fill({ label: 'Artículo', articleId: ARTICLE });
        const { errors } = validateCatalog(draft);
        for (const path of ['topics', 'entities[0].description', 'entities[0].aliases', 'entities[1].id', 'entities[2]', 'relations[0].references']) {
            expect(errors.some(error => error.startsWith(path))).toBe(true);
        }
        expect(errors.length).toBeLessThanOrEqual(100);
    });
});

describe('query and graph helpers', () => {
    it('matches accents and aliases, while combining topic and entity-type filters', () => {
        expect(searchEntities(catalog, 'transicion', { type: 'instrumento' }).map(item => item.id)).toContain('estrategia');
        expect(searchEntities(catalog, 'PLADESE', { topicId: 'planeacion-vinculante', type: 'instrumento' }).map(item => item.id)).toEqual(['pladese']);
        expect(searchEntities(catalog, 'PLADESE', { topicId: 'justicia-energetica' })).toEqual([]);
        expect(searchEntities(catalog, '', { topicId: 'missing' })).toEqual([]);
        expect(searchEntities(catalog, '')) .toHaveLength(catalog.entities.length);
    });

    it('traverses cycles once, preserves edge direction and bounds traversal depth', () => {
        const draft = smallCatalog();
        const before = copy(draft);
        expect(getNeighborhood(draft, 'a', { depth: 0 })).toEqual({ entities: [draft.entities[0]], relations: [] });
        expect(getNeighborhood(draft, 'a').entities.map(item => item.id)).toEqual(['a', 'b', 'c']);
        const graph = getNeighborhood(draft, 'a', { depth: 99 });
        expect(graph.entities.map(item => item.id)).toEqual(['a', 'b', 'c', 'd']);
        expect(graph.relations).toEqual(draft.relations);
        expect(getNeighborhood(draft, 'missing')).toEqual({ entities: [], relations: [] });
        expect(draft).toEqual(before);
    });

    it('does not traverse through nodes excluded by type or topic filters', () => {
        const draft = smallCatalog();
        draft.relations = [relation('a', 'b'), relation('b', 'c')];
        expect(getNeighborhood(draft, 'a', { depth: 6, type: 'concepto' }).entities.map(item => item.id)).toEqual(['a']);
        draft.topics[0].entityIds = ['a', 'c'];
        expect(getNeighborhood(draft, 'a', { depth: 6, topicId: 'tema' }).entities.map(item => item.id)).toEqual(['a']);
        expect(getNeighborhood(draft, 'a', { type: 'instrumento' })).toEqual({ entities: [], relations: [] });
    });

    it('escapes malicious catalog text without interpreting HTML', () => {
        const payload = '<img src=x onerror="alert(1)"><script>attack()</script> & \'texto\'';
        const container = document.createElement('div');
        container.innerHTML = `<p>${escapeHtml(payload)}</p>`;
        expect(container.querySelector('img,script')).toBeNull();
        expect(container.textContent).toBe(payload);
        expect(escapeHtml(null)).toBe('');
    });

    it('deduplicates evidence from both ends and preserves distinct unresolved references', () => {
        const draft = smallCatalog();
        draft.entities[0].references = [{ articleId: ARTICLE, label: 'Referencia directa' }, { legacyArticleId: 'BME-Art-126', label: 'Pendiente A' }];
        draft.relations[0].references = [{ articleId: ARTICLE, label: 'Otra etiqueta', quote: 'Texto de referencia.' }];
        draft.relations[2].references = [{ legacyArticleId: 'BME-Art-1-2-6', label: 'Pendiente B' }];
        const before = copy(draft);
        expect(getEntityReferences(draft, 'a')).toEqual([
            { articleId: ARTICLE, label: 'Referencia directa', quote: 'Texto de referencia.' },
            { legacyArticleId: 'BME-Art-126', label: 'Pendiente A' },
            { legacyArticleId: 'BME-Art-1-2-6', label: 'Pendiente B' },
        ]);
        expect(getEntityReferences(draft, 'missing')).toEqual([]);
        expect(draft).toEqual(before);
    });
});
