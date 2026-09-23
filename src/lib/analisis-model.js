import { getAcervoGroup } from './acervo-model.js';

/** Pure helpers that connect the editorial explorer catalogue with the live acervo. */

// Curation tags on laws describe editorial state, not subject matter.
const EDITORIAL_TAGS = new Set(['modificacion', 'texto original', 'leyes y reformas por completar']);
const text = value => typeof value === 'string' ? value : '';
export const normalize = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
const lawTopics = law => (Array.isArray(law?.temas_clave) ? law.temas_clave : []).map(normalize).filter(Boolean);
const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
const byTitle = (a, b) => collator.compare(text(a.titulo), text(b.titulo));
const GROUP_ORDER = ['leyes', 'reglamentos', 'otros', 'acuerdos', 'dacg', 'convocatorias', 'normas'];
const byGroupThenTitle = (a, b) => GROUP_ORDER.indexOf(getAcervoGroup(a)) - GROUP_ORDER.indexOf(getAcervoGroup(b)) || byTitle(a, b);

/** Thematic links only say "this belongs to the collection"; they carry no legal relation. */
export const isThematicLink = relation => relation?.type === 'asociacion-tematica';

export function topicOverview(catalog, topicId) {
    const topic = catalog.topics.find(item => item.id === topicId);
    if (!topic) return null;
    const byId = new Map(catalog.entities.map(entity => [entity.id, entity]));
    const members = topic.entityIds.map(id => byId.get(id)).filter(Boolean);
    const root = byId.get(topic.rootEntityId) || null;
    const groups = { instrumento: [], autoridad: [], concepto: [] };
    for (const entity of members) if (entity !== root && groups[entity.type]) groups[entity.type].push(entity);
    const inTopic = new Set(topic.entityIds);
    const typedRelations = catalog.relations.filter(relation => !isThematicLink(relation) && inTopic.has(relation.source) && inTopic.has(relation.target));
    return { topic, root, groups, members: members.length - (root ? 1 : 0), typedRelations };
}

/** Laws in the acervo that are the entity itself (instruments) or that constitute/organise it (authorities). */
export function matchAcervo(entity, summaries) {
    if (!entity || !Array.isArray(summaries)) return [];
    const name = normalize(entity.title);
    if (!name) return [];
    const keys = new Set([entity.id, ...(entity.aliases || [])].map(normalize).filter(Boolean));
    if (entity.type === 'instrumento') {
        return summaries.filter(law => keys.has(normalize(law.siglas)) || normalize(law.titulo).startsWith(name)).sort(byGroupThenTitle);
    }
    if (entity.type === 'autoridad') {
        const organic = [`ley de la ${name}`, `ley del ${name}`, `reglamento interior de la ${name}`, `reglamento interior del ${name}`, `manual de organizacion general de la ${name}`, `manual de organizacion general del ${name}`];
        return summaries.filter(law => organic.some(prefix => normalize(law.titulo).includes(prefix))).sort(byGroupThenTitle);
    }
    return summaries.filter(law => lawTopics(law).includes(name)).sort(byGroupThenTitle);
}

/** Laws tagged with the collection's own name, e.g. "Planeación vinculante". */
export function topicAcervo(topic, summaries) {
    if (!topic || !Array.isArray(summaries)) return [];
    const name = normalize(topic.title);
    return summaries.filter(law => lawTopics(law).includes(name)).sort(byGroupThenTitle);
}

/** Subject index built from `temas_clave`; updates itself as instruments are loaded. */
export function acervoThemes(summaries) {
    const themes = new Map();
    for (const law of Array.isArray(summaries) ? summaries : []) {
        const seen = new Set();
        for (const raw of Array.isArray(law?.temas_clave) ? law.temas_clave : []) {
            const key = normalize(raw);
            if (!key || EDITORIAL_TAGS.has(key) || seen.has(key)) continue;
            seen.add(key);
            if (!themes.has(key)) themes.set(key, { key, label: text(raw).trim(), laws: [] });
            themes.get(key).laws.push(law);
        }
    }
    return [...themes.values()]
        .map(theme => ({ ...theme, count: theme.laws.length, laws: theme.laws.sort(byGroupThenTitle) }))
        .sort((a, b) => b.count - a.count || collator.compare(a.label, b.label));
}

const TYPE_ORDER = ['instrumento', 'autoridad', 'concepto'];
/** "LSE · Artículo 12" and legacy "LCPE-Art-002" both cite the law by its acronym. */
export const citedAcronym = label => text(label).split(' · ')[0].replace(/-Art-[\w-]*$/i, '').trim();

/**
 * Graph of a collection built from real catalogue data: membership, the laws each entity cites
 * as fundamento, and the acervo document that *is* an instrument or organises an authority.
 * Law nodes follow the barycentre of the entities citing them, which keeps crossings low.
 */
export function topicGraph(catalog, topicId, summaries = []) {
    const overview = topicOverview(catalog, topicId);
    if (!overview) return null;
    const lawsBySigla = new Map((summaries || []).filter(law => law?.siglas).map(law => [normalize(law.siglas), law]));
    const entities = TYPE_ORDER.flatMap(type => overview.groups[type]);
    const laws = new Map();
    const edges = [];
    const lawNode = (key, label, law) => {
        if (!laws.has(key)) laws.set(key, { id: `law:${key}`, kind: 'law', label, title: law?.titulo || label, lawId: law?.id || null, group: law ? getAcervoGroup(law) : null, links: [] });
        return laws.get(key);
    };
    entities.forEach((entity, index) => {
        if (overview.root) edges.push({ from: 'root', to: entity.id, kind: 'member', weight: 1 });
        const cited = new Map();
        for (const reference of entity.references || []) {
            const acronym = citedAcronym(reference.label);
            if (!acronym) continue;
            const key = normalize(acronym);
            const entry = cited.get(key) || { acronym, articles: [] };
            entry.articles.push(reference.label);
            cited.set(key, entry);
        }
        const documents = entity.type === 'concepto' ? [] : matchAcervo(entity, summaries).slice(0, 2);
        for (const law of documents) {
            const key = normalize(law.siglas || law.id);
            const node = lawNode(key, law.siglas || law.titulo, law);
            node.links.push(index);
            edges.push({ from: entity.id, to: node.id, kind: 'documento', weight: 1, articles: cited.get(key)?.articles || [] });
            cited.delete(key);
        }
        for (const [key, entry] of cited) {
            const node = lawNode(key, entry.acronym, lawsBySigla.get(key));
            node.links.push(index);
            edges.push({ from: entity.id, to: node.id, kind: 'fundamento', weight: entry.articles.length, articles: entry.articles });
        }
    });
    const lawNodes = [...laws.values()]
        .map(node => ({ ...node, order: node.links.reduce((sum, i) => sum + i, 0) / node.links.length }))
        .sort((a, b) => a.order - b.order || collator.compare(a.label, b.label));
    return {
        topic: overview.topic,
        root: overview.root,
        entities: entities.map(entity => ({ id: entity.id, kind: 'entity', type: entity.type, label: entity.title })),
        laws: lawNodes,
        edges,
    };
}
