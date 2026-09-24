/**
 * A readable name for long official titles. "Acuerdo de la Comisión Nacional de Energía por el
 * que se emite la metodología para…" becomes "Metodología para…". The official title is never
 * replaced; views show both. Returns null when the title is already short or has no pattern.
 */

// Verbs that only introduce the object: drop them and the article that follows.
const INTRODUCE = ['emiten?', 'expiden?', 'establecen?', 'publican?', 'dan? a conocer', 'informan?(?: sobre)?', 'determinan?', 'actualizan?', 'otorgan?', 'crean?', 'reconocen?'];
// Verbs that are the point of the instrument: keep them as a heading ("Modifica …").
const ACTIONS = [['modifican?', 'Modifica'], ['reforman?', 'Reforma'], ['adicionan?', 'Adiciona'], ['derogan?', 'Deroga'], ['eliminan?', 'Elimina'], ['abrogan?', 'Abroga'], ['aprueban?', 'Aprueba']];
const VERB = `(?:${[...INTRODUCE, ...ACTIONS.map(([verb]) => verb)].join('|')})\\b`;

// "Acuerdo … por el que (la Comisión …)? (se)? <verbo>" / "Aviso … mediante el cual se <verbo>"
const LEAD = new RegExp(`^(?:acuerdo|decreto|aviso|resoluci[oó]n|disposiciones)\\b[\\s\\S]*?\\b(?:por (?:el|la|los|las) (?:que|cual(?:es)?)|mediante (?:el|la) cual)\\s+(?:(?:el|la|los|las) [^,]{2,140}?\\s+)?(?:se\\s+)?(?=${VERB})`, 'i');
const INTRODUCE_RE = new RegExp(`^(?:${INTRODUCE.join('|')})\\s+(?:(?:el|la|los|las|un|una)\\s+)?`, 'i');
// A run of action verbs: "reforman, adicionan y derogan" -> "Reforma".
const ACTION_RE = new RegExp(`^(${ACTIONS.map(([verb]) => verb).join('|')})(?:,?\\s+(?:y\\s+)?(?:${ACTIONS.map(([verb]) => verb).join('|')}))*\\s+`, 'i');

const capitalize = text => text.charAt(0).toLocaleUpperCase('es') + text.slice(1);

export function shortTitle(title) {
    const full = String(title || '').replace(/\s+/g, ' ').trim();
    if (full.length < 70) return null;
    const lead = full.match(LEAD);
    if (!lead) return null;
    let rest = full.slice(lead[0].length).trim();
    const action = rest.match(ACTION_RE);
    if (action) {
        const heading = ACTIONS.find(([verb]) => new RegExp(`^${verb}$`, 'i').test(action[1]))[1];
        rest = `${heading} ${rest.slice(action[0].length)}`;
    } else {
        rest = rest.replace(INTRODUCE_RE, '');
    }
    rest = rest.replace(/[.;]\s*$/, '');
    // Addressed notices ("a todos los participantes…") read worse without their subject.
    if (/^(?:a|al|de|del|en)\s/i.test(rest)) return null;
    rest = capitalize(rest);
    return rest.length >= 12 && rest.length < full.length - 15 ? rest : null;
}
