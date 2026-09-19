/** Pure data contract for the thematic explorer. It never reads or writes Supabase. */
export const EXPLORER_LIMITS = Object.freeze({
    topics: 200,
    entities: 2000,
    relations: 6000,
    references: 100,
    aliases: 30,
    textCharacters: 2000000,
    depth: 6,
});

const ENTITY_TYPES = new Set(['concepto', 'instrumento', 'autoridad']);
const ID = /^[a-z0-9][a-z0-9_-]{0,99}$/;
const ARTICLE_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const LEGACY_ARTICLE_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();

/** Validate an untrusted parsed JSON catalog without changing it or throwing for bad input.
 * Article IDs refer to the external acervo: format is checked here; resolution belongs to the reader.
 */
export function validateCatalog(input) {
    const errors = [];
    let textCharacters = 0;
    const fail = (path, message) => {
        if (errors.length < 100) errors.push(`${path}: ${message}`);
    };
    const object = (value, path, allowedKeys) => {
        if (!isObject(value)) {
            fail(path, 'debe ser un objeto.');
            return false;
        }
        for (const key of Object.keys(value)) {
            if (!allowedKeys.includes(key)) fail(path, `campo no admitido: ${key.slice(0, 80)}.`);
        }
        return true;
    };
    const string = (value, path, max, optional = false) => {
        if (optional && value === undefined) return true;
        if (typeof value !== 'string' || !value.trim() || value.length > max) {
            fail(path, `debe ser texto no vacío de hasta ${max} caracteres.`);
            return false;
        }
        textCharacters += value.length;
        if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) fail(path, 'contiene caracteres de control.');
        return true;
    };
    const id = (value, path) => {
        if (!string(value, path, 100)) return false;
        if (!ID.test(value)) {
            fail(path, 'usa únicamente letras minúsculas ASCII, números, guiones o guiones bajos.');
            return false;
        }
        return true;
    };
    const array = (value, path, max, min = 0) => {
        if (!Array.isArray(value) || value.length > max || value.length < min) {
            fail(path, `debe ser una lista de ${min} a ${max} elementos.`);
            return null;
        }
        return value;
    };
    const references = (value, path) => {
        const rows = array(value, path, EXPLORER_LIMITS.references);
        if (!rows) return;
        rows.forEach((reference, index) => {
            const here = `${path}[${index}]`;
            if (!object(reference, here, ['articleId', 'legacyArticleId', 'label', 'quote', 'url'])) return;
            if (string(reference.articleId, `${here}.articleId`, 36, true) && reference.articleId !== undefined && !ARTICLE_ID.test(reference.articleId)) {
                fail(`${here}.articleId`, 'debe ser el UUID real del artículo en el acervo.');
            }
            if (string(reference.legacyArticleId, `${here}.legacyArticleId`, 160, true)
                && reference.legacyArticleId !== undefined && !LEGACY_ARTICLE_ID.test(reference.legacyArticleId)) fail(`${here}.legacyArticleId`, 'identificador heredado no válido.');
            string(reference.label, `${here}.label`, 240);
            string(reference.quote, `${here}.quote`, 12000, true);
            if (!reference.articleId && !reference.url && !reference.legacyArticleId) fail(here, 'requiere articleId, url o una referencia heredada pendiente.');
            if (string(reference.url, `${here}.url`, 2048, true) && reference.url !== undefined) {
                try {
                    const url = new URL(reference.url);
                    if (!/^https?:\/\//i.test(reference.url) || !['http:', 'https:'].includes(url.protocol)
                        || reference.url !== reference.url.trim() || /[\r\n\t]/.test(reference.url)
                        || url.username || url.password) throw new Error('unsafe URL');
                } catch {
                    fail(`${here}.url`, 'debe ser una URL absoluta http o https sin credenciales.');
                }
            }
        });
    };
    if (!object(input, 'catálogo', ['schemaVersion', 'revision', 'updatedAt', 'topics', 'entities', 'relations', 'migrationNotes'])) {
        return { valid: false, errors };
    }
    if (input.schemaVersion !== 1) fail('schemaVersion', 'se requiere la versión 1.');
    if (!Number.isSafeInteger(input.revision) || input.revision < 1) fail('revision', 'debe ser un entero positivo seguro.');
    if (!string(input.updatedAt, 'updatedAt', 40) || !ISO_DATE.test(input.updatedAt) || !Number.isFinite(Date.parse(input.updatedAt))) {
        fail('updatedAt', 'debe ser una fecha y hora ISO válida con zona horaria.');
    }
    const topics = array(input.topics, 'topics', EXPLORER_LIMITS.topics, 1) || [];
    const entities = array(input.entities, 'entities', EXPLORER_LIMITS.entities, 1) || [];
    const relations = array(input.relations, 'relations', EXPLORER_LIMITS.relations) || [];
    const entityIds = new Set();
    const topicIds = new Set();
    const relationIds = new Set();
    const uniqueId = (value, path, seen) => {
        if (!id(value, path)) return;
        if (seen.has(value)) fail(path, 'identificador duplicado en su colección.');
        seen.add(value);
    };
    entities.forEach((entity, index) => {
        const path = `entities[${index}]`;
        if (!object(entity, path, ['id', 'type', 'title', 'description', 'aliases', 'references'])) return;
        uniqueId(entity.id, `${path}.id`, entityIds);
        if (!ENTITY_TYPES.has(entity.type)) fail(`${path}.type`, 'tipo de entidad no admitido.');
        string(entity.title, `${path}.title`, 240);
        string(entity.description, `${path}.description`, 12000);
        const aliases = array(entity.aliases, `${path}.aliases`, EXPLORER_LIMITS.aliases);
        aliases?.forEach((alias, aliasIndex) => string(alias, `${path}.aliases[${aliasIndex}]`, 240));
        references(entity.references, `${path}.references`);
    });
    topics.forEach((topic, index) => {
        const path = `topics[${index}]`;
        if (!object(topic, path, ['id', 'title', 'summary', 'entityIds', 'rootEntityId'])) return;
        uniqueId(topic.id, `${path}.id`, topicIds);
        string(topic.title, `${path}.title`, 240);
        string(topic.summary, `${path}.summary`, 8000);
        id(topic.rootEntityId, `${path}.rootEntityId`);
        if (!entityIds.has(topic.rootEntityId)) fail(`${path}.rootEntityId`, 'no existe en entities.');
        const members = array(topic.entityIds, `${path}.entityIds`, EXPLORER_LIMITS.entities, 1);
        if (members) {
            const seen = new Set();
            members.forEach((member, memberIndex) => {
                const here = `${path}.entityIds[${memberIndex}]`;
                id(member, here);
                if (!entityIds.has(member)) fail(here, 'no existe en entities.');
                if (seen.has(member)) fail(here, 'entidad repetida en el tema.');
                seen.add(member);
            });
            if (!seen.has(topic.rootEntityId)) fail(`${path}.rootEntityId`, 'debe estar incluido en entityIds del tema.');
        }
    });
    relations.forEach((relation, index) => {
        const path = `relations[${index}]`;
        if (!object(relation, path, ['id', 'source', 'target', 'type', 'label', 'description', 'references', 'reviewStatus'])) return;
        uniqueId(relation.id, `${path}.id`, relationIds);
        for (const field of ['source', 'target']) {
            id(relation[field], `${path}.${field}`);
            if (!entityIds.has(relation[field])) fail(`${path}.${field}`, 'no existe en entities.');
        }
        if (relation.source === relation.target) fail(path, 'la relación debe unir dos entidades diferentes.');
        id(relation.type, `${path}.type`);
        string(relation.label, `${path}.label`, 240);
        string(relation.description, `${path}.description`, 12000);
        if (!['editorial', 'verificada'].includes(relation.reviewStatus)) fail(`${path}.reviewStatus`, 'estado de revisión no admitido.');
        references(relation.references, `${path}.references`);
        if (relation.reviewStatus === 'verificada' && Array.isArray(relation.references)
            && !relation.references.some(reference => reference?.articleId || reference?.url)) {
            fail(`${path}.references`, 'una relación verificada requiere al menos una referencia localizable.');
        }
    });
    if (input.migrationNotes !== undefined) {
        const notes = array(input.migrationNotes, 'migrationNotes', 100);
        notes?.forEach((note, index) => string(note, `migrationNotes[${index}]`, 4000));
    }
    if (textCharacters > EXPLORER_LIMITS.textCharacters) fail('catálogo', `supera ${EXPLORER_LIMITS.textCharacters} caracteres de texto.`);
    return { valid: errors.length === 0, errors };
}

/** Match all query words, including aliases, with diacritic-insensitive comparison. */
export function searchEntities(catalog, query, { topicId, type } = {}) {
    const entities = Array.isArray(catalog?.entities) ? catalog.entities : [];
    const topic = topicId ? catalog?.topics?.find(item => item.id === topicId) : null;
    if (topicId && !topic) return [];
    const members = topic ? new Set(topic.entityIds) : null;
    const words = normalize(query).slice(0, 1000).split(/\s+/).filter(Boolean);
    return entities.filter(entity => {
        if ((members && !members.has(entity.id)) || (type && entity.type !== type)) return false;
        const haystack = normalize([entity.title, entity.description, ...(entity.aliases || [])].join(' '));
        return words.every(word => haystack.includes(word));
    });
}

/** Undirected thematic neighborhood. Catalog edge direction is retained in returned relations.
 * Type/topic constraints apply before traversal; they never create a path through hidden entities.
 */
export function getNeighborhood(catalog, entityId, { depth = 1, topicId, type } = {}) {
    const available = searchEntities(catalog, '', { topicId, type });
    const byId = new Map(available.map(entity => [entity.id, entity]));
    if (!byId.has(entityId)) return { entities: [], relations: [] };
    const hops = Number.isFinite(depth) ? Math.min(EXPLORER_LIMITS.depth, Math.max(0, Math.floor(depth))) : 1;
    const relations = (Array.isArray(catalog?.relations) ? catalog.relations : [])
        .filter(relation => byId.has(relation.source) && byId.has(relation.target));
    const adjacency = new Map();
    for (const relation of relations) {
        if (!adjacency.has(relation.source)) adjacency.set(relation.source, []);
        if (!adjacency.has(relation.target)) adjacency.set(relation.target, []);
        adjacency.get(relation.source).push(relation.target);
        adjacency.get(relation.target).push(relation.source);
    }
    const visited = new Set([entityId]);
    let frontier = [entityId];
    for (let level = 0; level < hops && frontier.length; level++) {
        const next = [];
        for (const current of frontier) {
            for (const neighbor of adjacency.get(current) || []) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    next.push(neighbor);
                }
            }
        }
        frontier = next;
    }
    return {
        entities: available.filter(entity => visited.has(entity.id)),
        relations: relations.filter(relation => visited.has(relation.source) && visited.has(relation.target)),
    };
}

/** Escape text at the HTML boundary; catalog strings are never trusted markup. */
export function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
}

/** Collect direct and connected-edge evidence, preserving the richest duplicate reference. */
export function getEntityReferences(catalog, entityId) {
    const entity = catalog?.entities?.find(item => item.id === entityId);
    if (!entity) return [];
    const references = [...(entity.references || [])];
    for (const relation of catalog.relations || []) {
        if (relation.source === entityId || relation.target === entityId) references.push(...(relation.references || []));
    }
    const unique = new Map();
    for (const reference of references) {
        const key = `${reference.articleId || reference.legacyArticleId || reference.label}\u0000${reference.url || ''}`;
        const previous = unique.get(key);
        unique.set(key, previous ? { ...reference, ...previous, ...(previous.quote ? {} : reference.quote ? { quote: reference.quote } : {}) } : { ...reference });
    }
    return [...unique.values()];
}
