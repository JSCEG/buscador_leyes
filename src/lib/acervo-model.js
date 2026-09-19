/** Navigation collections; these do not replace an instrument's legal `tipo` metadata. */
export const ACERVO_GROUPS = Object.freeze([
    { id: 'leyes', label: 'Leyes', description: 'Legislación para consultar por instrumento.' },
    { id: 'reglamentos', label: 'Reglamentos', description: 'Reglamentos e instrumentos de organización institucional.' },
    { id: 'acuerdos', label: 'Acuerdos', description: 'Acuerdos, formatos y lineamientos del acervo.' },
    { id: 'dacg', label: 'DACG', description: 'Disposiciones administrativas de carácter general.' },
    { id: 'convocatorias', label: 'Convocatorias', description: 'Convocatorias y acuerdos que las modifican.' },
    { id: 'normas', label: 'Normas', description: 'Normas y referencias técnicas del acervo.' },
    { id: 'otros', label: 'Otros instrumentos', description: 'Decretos, circulares y otros documentos para consultar.' },
].map(group => Object.freeze(group)));

const GROUP_IDS = new Set(ACERVO_GROUPS.map(group => group.id));
const EXPLICIT_GROUPS = Object.freeze({
    ley: 'leyes', leyes: 'leyes', reglamento: 'reglamentos', reglamentos: 'reglamentos',
    dacg: 'dacg', 'disposiciones administrativas de caracter general': 'dacg',
    convocatoria: 'convocatorias', convocatorias: 'convocatorias',
    nom: 'normas', norma: 'normas', normas: 'normas', 'norma oficial mexicana': 'normas',
});
const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
const text = value => typeof value === 'string' ? value : '';
const normalize = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim().replace(/\s+/g, ' ');
const isSummary = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const ordinal = '(?:(?:primera|segunda|tercera|cuarta|quinta|sexta|septima|octava|novena|decima|[1-9][0-9]*[aªº.]?)\\s+)?';
const directCall = new RegExp(`^${ordinal}convocatoria\\b`);
const changedCall = new RegExp(`^${ordinal}(?:modificacion(?:es)?|reforma(?:s)?|adicion(?:es)?)\\s+(?:a|de)\\s+(?:(?:la|las)\\s+)?${ordinal}convocatoria\\b`);
const directDacg = /^(?:dacg\b|disposiciones administrativas de caracter general\b)/;

/** Read the direct object of an agreement, rather than every instrument mentioned in its title. */
function agreementObject(title) {
    const match = title.match(/\b(?:por el que|mediante el cual) se (?:emiten?|expiden?|establecen?|publican?|modifican?|reforman?|adicionan?)\s+(.+)$/);
    return match ? match[1].replace(/^(?:la|las|el|los|un|una|unos|unas)\s+/, '') : '';
}

export function getAcervoGroup(law) {
    const type = normalize(law?.tipo);
    if (Object.hasOwn(EXPLICIT_GROUPS, type)) return EXPLICIT_GROUPS[type];
    // A new, explicit document type remains discoverable in Others, without title guessing.
    if (type && !['acuerdo', 'acuerdos', 'otro', 'otros'].includes(type)) return 'otros';
    const title = normalize(law?.titulo);
    const isAgreement = ['acuerdo', 'acuerdos'].includes(type) || /^acuerdo\b/.test(title);
    if (isAgreement) {
        const object = agreementObject(title);
        if (directCall.test(object) || changedCall.test(object)) return 'convocatorias';
        if (directDacg.test(object)) return 'dacg';
        return 'acuerdos';
    }
    if (directCall.test(title)) return 'convocatorias';
    if (directDacg.test(title)) return 'dacg';
    if (/^ley\b/.test(title)) return 'leyes';
    if (/^reglamento\b/.test(title)) return 'reglamentos';
    if (/^(?:norma oficial mexicana\b|nom[-\s])/.test(title)) return 'normas';
    return 'otros';
}

function titleOrder(left, right) {
    const a = text(left.titulo).trim();
    const b = text(right.titulo).trim();
    if (!a || !b) {
        if (a) return -1;
        if (b) return 1;
    }
    return collator.compare(a, b) || collator.compare(text(left.siglas), text(right.siglas)) || collator.compare(text(left.id), text(right.id));
}

function publicationDay(law) {
    const day = text(law.fecha_publicacion);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    const timestamp = Date.parse(`${day}T00:00:00.000Z`);
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === day ? timestamp : null;
}

/** Return a fresh filtered/sorted list; retain original objects and every legal metadata field. */
export function selectAcervo(summaries, { query = '', group = 'all', sort = 'title' } = {}) {
    if (!Array.isArray(summaries) || (group !== 'all' && !GROUP_IDS.has(group))) return [];
    const terms = normalize(query).split(' ').filter(Boolean);
    const selected = summaries.filter(law => {
        if (!isSummary(law) || (group !== 'all' && getAcervoGroup(law) !== group)) return false;
        const themes = Array.isArray(law.temas_clave) ? law.temas_clave.filter(item => typeof item === 'string').join(' ') : text(law.temas_clave);
        const haystack = normalize(`${text(law.titulo)} ${text(law.siglas)} ${themes}`);
        return terms.every(term => haystack.includes(term));
    });
    if (sort === 'date-newest' || sort === 'date-oldest') {
        const direction = sort === 'date-newest' ? -1 : 1;
        return selected.sort((left, right) => {
            const a = publicationDay(left);
            const b = publicationDay(right);
            if (a === null || b === null) {
                if (a !== null) return -1;
                if (b !== null) return 1;
            }
            return (a !== null && b !== null ? (a - b) * direction : 0) || titleOrder(left, right);
        });
    }
    return selected.sort(titleOrder);
}

/** Preserve incoming item order so callers can group any selected/sorted list once. */
export function groupAcervo(summaries) {
    const groups = ACERVO_GROUPS.map(group => ({ ...group, items: [] }));
    const byId = new Map(groups.map(group => [group.id, group]));
    for (const law of Array.isArray(summaries) ? summaries : []) {
        if (isSummary(law)) byId.get(getAcervoGroup(law)).items.push(law);
    }
    return groups;
}
