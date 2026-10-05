/**
 * Reto Jurídico: the daily quiz is generated from the acervo itself — official definitions, passages
 * of articles, issuing authorities and publication dates — so every new instrument becomes material
 * without writing questions by hand. A seed from the date gives everyone the same reto that day.
 * Pure functions: the view fetches the data and this module only chooses and shapes it.
 */
import { issuerId, ISSUERS } from './issuer.js';
import { shortTitle } from './short-title.js';
import { getAcervoGroup } from './acervo-model.js';

export const RETO_START = '2026-10-04';
export const RETO_LENGTH = 5;

const fold = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const DAY = 864e5;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
/** "2025-03-18" → "18 mar 2025". */
export const friendlyDate = iso => { const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number); return y ? `${d} ${MONTHS[m - 1]} ${y}` : ''; };

/** Local calendar day, "YYYY-MM-DD". */
export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Reto number: 1 on the launch day. */
export function retoNumber(day) {
    return Math.round((Date.parse(`${day}T12:00:00`) - Date.parse(`${RETO_START}T12:00:00`)) / DAY) + 1;
}

/** Deterministic generator from a text seed (xmur3 + mulberry32). */
export function seededRandom(seed) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = (() => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; })();
    return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export const pick = (rng, list) => list[Math.floor(rng() * list.length)];
export function shuffle(rng, list) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
}
const sample = (rng, list, n) => shuffle(rng, list).slice(0, n);

/** Options with the answer in a random place: { options, answer }. */
function withAnswer(rng, correct, wrong) {
    const options = shuffle(rng, [correct, ...wrong]);
    return { options, answer: options.indexOf(correct) };
}

const nameOf = law => shortTitle(law.titulo) || law.titulo || law.siglas || 'Instrumento';
const dated = law => /^\d{4}-\d{2}-\d{2}/.test(String(law.fecha_publicacion || ''));

/** Name to show in an option: without the "[DOF dd/mm/aaaa]" tag and at most ~120 characters. */
export function optionName(law) {
    const name = nameOf(law).replace(/\s*\[DOF[^\]]*\]\s*$/i, '').trim();
    return name.length > 120 ? `${name.slice(0, 120).replace(/\s+\S*$/, '')}…` : name;
}

/** Amendments and notes of one instrument share a family, so they are never options together. */
export function familyKey(law) {
    return fold(optionName(law))
        .replace(/^(nota aclaratoria (al|a la)\s+)?((primera|segunda|tercera|cuarta|quinta|sexta)\s+)?(modificacion|reforma)(es)?\s+(a|al|de)\s+(la|el|los|las)?\s*/, '')
        .replace(/^acuerdo por el que se (emite|emiten|modifica|modifican|reforma|reforman)\s+(la|el|los|las)?\s*/, '')
        .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

// What each authority does, in plain words, to explain the answers.
const ISSUER_WHY = {
    congreso: 'Las leyes las aprueban los diputados y senadores del Congreso de la Unión.',
    ejecutivo: 'Los reglamentos, decretos y planes nacionales los expide el Presidente de la República.',
    sener: 'La Secretaría de Energía (SENER) fija la política energética del país y emite reglas para aplicarla.',
    cne: 'La Comisión Nacional de Energía (CNE) regula el sector: otorga permisos y emite reglas técnicas.',
    cre: 'La Comisión Reguladora de Energía (CRE) regulaba el sector hasta 2025; hoy esa tarea es de la Comisión Nacional de Energía.',
    cenace: 'El CENACE opera la red eléctrica nacional y el mercado eléctrico.',
    cenagas: 'El CENAGAS opera la red nacional de gasoductos de gas natural.',
    asea: 'La ASEA vigila la seguridad industrial y el cuidado del medio ambiente en petróleo y gas.',
    cfe: 'La CFE es la empresa del Estado que genera, transmite y distribuye electricidad.',
    pemex: 'PEMEX es la empresa del Estado del petróleo y el gas.',
    conuee: 'La CONUEE promueve que se use la energía de forma eficiente.',
};
const issuerWhy = law => ISSUER_WHY[issuerId(law)] || '';

/** "La publicó la Secretaría de Energía el 18 mar 2025." */
function publishedBy(law) {
    const issuer = ISSUERS.find(item => item.id === issuerId(law));
    const who = issuer && issuer.id !== 'otra' ? issuer.label.replace(/\s*\(.*\)\s*/, '') : '';
    const when = dated(law) ? friendlyDate(law.fecha_publicacion) : '';
    if (who && when) return `La publicó: ${who}, el ${when}.`;
    if (when) return `Se publicó el ${when}.`;
    return who ? `La publicó: ${who}.` : '';
}

/** Where the passage sits: "Es el Artículo 12." or "Está en la parte «D. Disposiciones finales»." */
function placeOf(identificador) {
    const place = String(identificador || '').replace(/\s+/g, ' ').trim();
    if (!place) return '';
    return /^(artículo|articulo|numeral|lineamiento|regla|disposición|disposicion)/i.test(place) ? `Es el ${place}.` : `Está en la parte «${place}».`;
}

/** Up to n instruments of distinct families, none of the excluded family. */
function distinctLaws(rng, pool, n, exclude) {
    const seen = new Set([exclude]);
    const out = [];
    for (const law of shuffle(rng, pool)) {
        const key = familyKey(law);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(law);
        if (out.length === n) break;
    }
    return out;
}

/** 1. Official definition → which term. Distractors come from the same instrument when possible. */
export function termQuestion(rng, glossary, { exclude = new Set() } = {}) {
    // Acronyms (LGPGIR, SEMARNAT…) are guessed from their initials, so they are left out.
    const usable = glossary.filter(entry => entry.term.length <= 60 && entry.definition.length >= 40 && entry.definition.length <= 360
        && !/^[A-ZÁÉÍÓÚÑ0-9-]{2,}$/.test(entry.term) && !exclude.has(entry.term)
        && !fold(entry.definition).includes(fold(entry.term)));
    if (usable.length < 4) return null;
    const entry = pick(rng, usable);
    const sameSource = usable.filter(other => other.source === entry.source && other.term !== entry.term);
    const pool = sameSource.length >= 3 ? sameSource : usable.filter(other => other.term !== entry.term);
    const { options, answer } = withAnswer(rng, entry.term, sample(rng, pool, 3).map(other => other.term));
    return {
        kind: 'term', label: '¿Qué significa?', prompt: '¿A qué palabra corresponde esta definición?', body: entry.definition, options, answer,
        answerText: entry.term,
        details: [`Así la define: ${entry.sourceName || entry.source}.`],
        why: 'Las leyes traen una lista de definiciones al inicio para que todos entiendan igual sus palabras clave.',
        explain: `«${entry.term}» se define así en: ${entry.sourceName || entry.source}.`, link: entry.lawId ? { lawId: entry.lawId, articleId: entry.articleId } : null,
    };
}

/** Hides the instrument's own name and acronym inside a passage. */
export function maskPassage(text, law) {
    let out = String(text || '');
    const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const name of [law.titulo, shortTitle(law.titulo), law.siglas].filter(value => value && value.length >= 3)) {
        out = out.replace(new RegExp(escape(name), 'gi'), '[…]');
    }
    // Acronyms of the title (e.g. SISTRANGAS) would give the answer away too.
    for (const acronym of new Set(String(law.titulo || '').match(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g) || [])) {
        out = out.replace(new RegExp(`\\b${escape(acronym)}\\b`, 'g'), '[…]');
    }
    return out;
}

// Provisions worth reading; signature blocks, indexes, recitals and forms are left out.
const READABLE = /^(artículo|articulo|numeral|lineamiento|disposición|disposicion|regla|base|criterio|apartado|capítulo|capitulo|sección|seccion|[a-z]\.|\d+\.)/i;
const SKIP = /(índice|indice|preámbulo|preambulo|transitorio|firma|publicaci|considerando|anexo|formato|tabla|apéndice|apendice|resolutivo)/i;

/** A readable passage: a whole provision of reasonable length, cut at a sentence end. */
export function choosePassage(rng, rows) {
    const clean = text => String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const candidates = rows
        .filter(row => !SKIP.test(String(row.identificador || '')))
        .map(row => ({ ...row, text: clean(row.contenido) }))
        .filter(row => row.text.length >= 180 && !/^\(?derogad/i.test(row.text) && !/r[uú]brica/i.test(row.text)
            && !/^#|nota editorial/i.test(row.text));
    const preferred = candidates.filter(row => READABLE.test(String(row.identificador || '')));
    const usable = preferred.length ? preferred : candidates;
    if (!usable.length) return null;
    const row = pick(rng, usable);
    let text = row.text;
    if (text.length > 460) {
        const cut = text.slice(0, 460);
        const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
        text = `${end > 200 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '')} …`;
    }
    return { id: row.id, identificador: row.identificador, text };
}

/** 2. Passage → which instrument. Distractors from the same collection when possible. */
export function passageQuestion(rng, law, passage, laws) {
    if (!law || !passage) return null;
    // A passage that repeats the instrument's own name gives the answer away.
    const body = maskPassage(passage.text, law);
    const words = text => new Set(fold(text).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).map(word => word.replace(/(es|s)$/, '')).filter(word => word.length > 4));
    const nameWords = [...words(optionName(law))];
    const bodyWords = words(body.slice(0, 320));
    if (nameWords.length >= 3 && nameWords.filter(word => bodyWords.has(word)).length / nameWords.length >= 0.6) return null;
    const group = getAcervoGroup(law);
    const family = familyKey(law);
    const others = laws.filter(other => other.id !== law.id && familyKey(other) !== family);
    const same = distinctLaws(rng, others.filter(other => getAcervoGroup(other) === group), 3, family);
    const wrong = same.length === 3 ? same : distinctLaws(rng, others, 3, family);
    if (wrong.length < 3) return null;
    const { options, answer } = withAnswer(rng, optionName(law), wrong.map(optionName));
    return {
        kind: 'passage', label: '¿De qué ley es?', prompt: 'Este texto es parte de una ley o regla. ¿De cuál?', body, options, answer,
        answerText: nameOf(law),
        details: [placeOf(passage.identificador), publishedBy(law)].filter(Boolean),
        why: issuerWhy(law),
        explain: `Viene de: ${nameOf(law)}${passage.identificador ? ` (${passage.identificador.replace(/\s+/g, ' ').trim()})` : ''}.`, link: { lawId: law.id, articleId: passage.id },
    };
}

/** 3. Instrument → issuing authority. Titles that name their issuer are left out (too easy). */
export function issuerQuestion(rng, laws, { exclude = new Set() } = {}) {
    const present = new Set(laws.map(issuerId));
    const candidates = laws.filter(law => {
        if (exclude.has(law.id)) return false;
        const id = issuerId(law);
        if (id === 'otra') return false;
        const issuer = ISSUERS.find(item => item.id === id);
        const title = fold(law.titulo);
        return !title.includes(fold(issuer.label.replace(/\s*\(.*\)\s*/, ''))) && !new RegExp(`\\b${fold(issuer.short)}\\b`).test(title);
    });
    if (!candidates.length) return null;
    const law = pick(rng, candidates);
    const correct = ISSUERS.find(item => item.id === issuerId(law));
    const wrong = ISSUERS.filter(item => item.id !== correct.id && item.id !== 'otra' && item.id !== 'cre');
    const preferred = wrong.filter(item => present.has(item.id));
    const pool = preferred.length >= 3 ? preferred : wrong;
    const { options, answer } = withAnswer(rng, correct.label, sample(rng, pool, 3).map(item => item.label));
    return {
        kind: 'issuer', label: '¿Quién la publicó?', prompt: '¿Quién publicó esta ley o regla?', body: law.titulo, options, answer,
        answerText: correct.label,
        details: [dated(law) ? `Se publicó el ${friendlyDate(law.fecha_publicacion)}.` : ''].filter(Boolean),
        why: issuerWhy(law),
        explain: `La publicó: ${correct.label}.`, link: { lawId: law.id },
    };
}

/** 4. Four instruments → order of publication (oldest first). Dates at least 45 days apart. */
export function orderQuestion(rng, laws) {
    const pool = shuffle(rng, laws.filter(dated));
    const chosen = [];
    for (const law of pool) {
        const time = Date.parse(law.fecha_publicacion.slice(0, 10));
        if (chosen.every(other => Math.abs(Date.parse(other.fecha_publicacion.slice(0, 10)) - time) >= 45 * DAY)
            && chosen.every(other => familyKey(other) !== familyKey(law))) chosen.push(law);
        if (chosen.length === 4) break;
    }
    if (chosen.length < 4) return null;
    const sorted = [...chosen].sort((a, b) => a.fecha_publicacion.localeCompare(b.fecha_publicacion));
    const shown = shuffle(rng, chosen);
    return {
        kind: 'order', label: '¿Cuál salió primero?', prompt: 'Ordénalas de la más antigua a la más nueva', body: 'Tócalas una por una, empezando por la que se publicó primero.',
        options: shown.map(optionName), dates: shown.map(law => friendlyDate(law.fecha_publicacion)),
        answerOrder: sorted.map(law => shown.indexOf(law)),
        steps: sorted.map(law => ({ name: optionName(law), date: friendlyDate(law.fecha_publicacion) })),
        why: 'Ver las fechas ayuda a entender cómo se fue armando, paso a paso, la regulación de la energía.',
        explain: `Orden correcto: ${sorted.map(law => `${optionName(law)} (${friendlyDate(law.fecha_publicacion)})`).join(' → ')}.`, link: null,
    };
}

/** Laws for the two passage questions: one published recently (the news of the reto) and any other. */
export function planPassages(rng, laws, day) {
    const now = Date.parse(`${day}T12:00:00`);
    // Reform decrees and notices mostly restate their own title; they make poor passages.
    laws = laws.filter(law => !/^(decreto|aviso)$/i.test(String(law.tipo || '')) && !/^(decreto|nota aclaratoria|aviso)\b/i.test(String(law.titulo || '')));
    const withDate = laws.filter(dated).filter(law => Date.parse(law.fecha_publicacion.slice(0, 10)) <= now);
    const recentWindow = withDate.filter(law => now - Date.parse(law.fecha_publicacion.slice(0, 10)) <= 90 * DAY);
    const recent = recentWindow.length ? recentWindow : [...withDate].sort((a, b) => b.fecha_publicacion.localeCompare(a.fecha_publicacion)).slice(0, 10);
    const fresh = recent.length ? pick(rng, recent) : null;
    const rest = laws.filter(law => law !== fresh);
    return [fresh, rest.length ? pick(rng, rest) : null].filter(Boolean);
}

/**
 * The reto: up to five questions of the four kinds, in a seeded order.
 * @param {{ laws: object[], glossary: object[], passages: Array<{ law, rows }>, seed: string }} data
 */
export function buildReto({ laws, glossary, passages, seed }) {
    const rng = seededRandom(`reto:${seed}`);
    const [fresh, other] = passages.map(({ law, rows }) => passageQuestion(rng, law, choosePassage(rng, rows), laws));
    const asked = new Set();
    const term = () => {
        const q = termQuestion(rng, glossary, { exclude: asked });
        if (q) asked.add(q.options[q.answer]);
        return q;
    };
    const questions = [
        fresh && { ...fresh, isNew: true },
        term(),
        // Not about an instrument the passages already used today.
        issuerQuestion(rng, laws, { exclude: new Set(passages.map(({ law }) => law?.id)) }),
        orderQuestion(rng, laws),
        other || term(),
    ].filter(Boolean);
    // Always five when there is material: definitions fill any gap.
    for (let tries = 0; questions.length < RETO_LENGTH && tries < 5; tries++) {
        const extra = term();
        if (extra) questions.push(extra);
    }
    // Keep the timeline question in the middle and shuffle the rest around it.
    const order = questions.find(q => q.kind === 'order');
    const rest = shuffle(rng, questions.filter(q => q !== order));
    if (order) rest.splice(Math.min(2, rest.length), 0, order);
    return rest.slice(0, RETO_LENGTH);
}

/** Whether an answer is right: an option index, or for the timeline an array of indexes. */
export function isCorrect(question, response) {
    if (question.kind === 'order') return Array.isArray(response) && response.join() === question.answerOrder.join();
    return response === question.answer;
}

/** Emoji line for sharing, e.g. "🟩🟥🟩🟩🟩". */
export const resultLine = marks => marks.map(ok => (ok ? '🟩' : '🟥')).join('');

/** Consecutive days played up to `day` (results keyed by "YYYY-MM-DD"). */
export function streakFrom(playedDays, day) {
    const set = new Set(playedDays);
    let count = 0;
    let cursor = Date.parse(`${day}T12:00:00`);
    while (set.has(dayKey(new Date(cursor)))) { count++; cursor -= DAY; }
    return count;
}
