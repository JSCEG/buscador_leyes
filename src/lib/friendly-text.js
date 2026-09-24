/**
 * Plain-language wording for notes stored in the acervo. The database keeps its
 * original labels ("Nota editorial · …"); readers see a friendlier "Guía · …".
 * Classifiers accept both, so the data can be updated at any time.
 */

/** Label prefix of reading guides, old or new wording, after accents are removed. */
export const GUIDE_LABEL = /^(?:nota editorial|guia)\b/i;

const SENTENCES = [
    [/Esta nota es información editorial del buscador y no forma parte del texto oficial\./g, 'Esta guía la agregamos para ayudarte a ubicar el documento; no es parte del texto oficial.'],
    [/Esta nota es información editorial del buscador y no forma parte de la publicación oficial\./g, 'Esta guía la agregamos para ayudarte a ubicar el documento; no es parte de la publicación oficial.'],
    [/Esta nota pertenece al buscador, no al texto oficial\./g, 'Esta guía la agregamos nosotros; no es parte del texto oficial.'],
    [/([Ii])nformación editorial/g, '$1nformación de apoyo'],
];

const CATALOG_PHRASES = [
    [/Las conexiones temáticas son editoriales y cada ficha conserva sus referencias\./g, 'Cada ficha incluye los artículos en que se apoya.'],
    [/Instrumento incluido en el recorrido editorial de /g, 'Instrumento que forma parte de la '],
    [/Agrupación editorial de los participantes/g, 'Reúne a los participantes'],
    [/Agrupación editorial de /g, 'Reúne '],
    [/Concepto editorial (sobre|para) /g, 'Tema $1 '],
    [/ su relación editorial con /g, ' su relación con '],
    [/ (?:del|en el) recorrido editorial anterior/g, ' en este recorrido'],
    [/recorrido editorial /g, 'recorrido '],
];

/** Same idea for the analysis catalogue: descriptions shown to readers, never ids or references. */
export function friendlyCatalog(catalog) {
    if (!catalog || typeof catalog !== 'object') return catalog;
    const soften = value => {
        if (typeof value !== 'string' || !/editorial/i.test(value)) return value;
        return CATALOG_PHRASES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
    };
    return {
        ...catalog,
        topics: (catalog.topics || []).map(topic => ({ ...topic, summary: soften(topic.summary) })),
        entities: (catalog.entities || []).map(entity => ({ ...entity, description: soften(entity.description) })),
        relations: (catalog.relations || []).map(relation => ({ ...relation, description: soften(relation.description) })),
    };
}

export function friendlyLabel(label) {
    return typeof label === 'string' ? label.replace(/^Nota editorial\b/i, 'Guía') : label;
}

export function friendlyText(text) {
    if (typeof text !== 'string' || !/editorial/i.test(text)) return text;
    let out = text.replace(/(^|>|#{1,6}\s*)Nota editorial\b/gi, (match, lead) => `${lead}Guía`);
    for (const [pattern, replacement] of SENTENCES) out = out.replace(pattern, replacement);
    return out;
}
