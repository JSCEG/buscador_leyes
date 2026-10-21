/**
 * Judicial rulings (`tipo: 'sentencia'`) read from their own metadata and title, never from an ID:
 * court, case file, the noun for their fragments ("apartados") and where they state their effects.
 * A ruling's publication date is not the date it takes effect; callers must not present it as such.
 */
const plain = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

export const isJudgment = law => ['sentencia', 'sentencias'].includes(plain(law?.tipo));

const COURTS = [
    [/suprema corte de justicia de la nacion/, 'SCJN'],
    [/tribunal electoral del poder judicial de la federacion/, 'TEPJF'],
    [/tribunal federal de justicia administrativa/, 'TFJA'],
    [/tribunal de disciplina judicial/, 'TDJ'],
];

/** Short name of the issuing court, from the title or the acronym prefix; null when unknown. */
export function judgmentCourt(law) {
    const title = plain(law?.titulo);
    for (const [pattern, short] of COURTS) if (pattern.test(title)) return short;
    const prefix = String(law?.siglas || '').match(/^([A-Z]{3,6})-/);
    return prefix && COURTS.some(([, short]) => short === prefix[1]) ? prefix[1] : null;
}

const CASE = /\b(controversia constitucional|acci[oó]n de inconstitucionalidad|amparo directo en revisi[oó]n|amparo en revisi[oó]n|amparo directo|amparo indirecto|contradicci[oó]n de (?:criterios|tesis)|declaratoria general de inconstitucionalidad|recurso de (?:reclamaci[oó]n|revisi[oó]n|queja)|juicio (?:de amparo|electoral|contencioso administrativo|para la protecci[oó]n de los derechos pol[ií]tico-electorales(?: de la ciudadan[ií]a)?))\s+(?:n[uú]m(?:ero|\.)?\s*)?(\d+\/\d{4})/i;

/** Case file as written in the title: { kind, number, label }, or null. */
export function judgmentCase(law) {
    const match = String(law?.titulo || '').match(CASE);
    if (!match) return null;
    const kind = match[1].toLowerCase().replace(/^./, ch => ch.toUpperCase());
    return { kind, number: match[2], label: `${kind} ${match[2]}` };
}

/** Visible type label: "Sentencia · SCJN" for rulings; other instruments keep their own `tipo`. */
export function instrumentTypeLabel(law) {
    if (!isJudgment(law)) return law?.tipo || '';
    const court = judgmentCourt(law);
    return court ? `Sentencia · ${court}` : 'Sentencia';
}

/** Noun for an instrument's fragments; rulings are divided into apartados, not artículos. */
export function fragmentNoun(law) {
    return isJudgment(law)
        ? { one: 'apartado', many: 'apartados', One: 'Apartado', Many: 'Apartados' }
        : { one: 'artículo', many: 'artículos', One: 'Artículo', Many: 'Artículos' };
}

export const countFragments = (count, law) => `${count} ${count === 1 ? fragmentNoun(law).one : fragmentNoun(law).many}`;

const label = article => plain(article?.articulo_label ?? article?.identificador);

/** The ruling's own sections on effects and on its decision points, to point readers to them. */
export function judgmentEffectsSections(articles = []) {
    return {
        effects: articles.find(article => /^(?:[ivxlc]+\.?\s+)?efectos\b/.test(label(article))) || null,
        resolutions: articles.find(article => /^(?:punto[s]? )?resolutivo/.test(label(article))) || null,
    };
}
