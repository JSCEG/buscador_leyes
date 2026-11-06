/**
 * Spines and covers of the home shelf, drawn from each document's real data. They are physical
 * objects: their colours belong to the collection and do not change with the theme.
 */
import { getAcervoGroup } from './acervo-model.js';
import { shortTitle } from './short-title.js';
import { instrumentTypeLabel, isJudgment, judgmentCase } from './judgment.js';
import { collectionIcon } from './collection-icons.js';

const BIG_ACRONYM_MAX = 14;

/** Book colours. All carry ivory text at 4.5:1 or more; the look comes from depth, not from pale tones. */
export const BOOK_COLORS = Object.freeze([
    '#7A0E2B', // guinda
    '#8A6414', // dorado
    '#0F5C6E', // azul petróleo
    '#2E7D62', // verde
    '#5B4B8A', // índigo
    '#7A66B0', // lila
    '#0E7C72', // turquesa
    '#A8590A', // ámbar
    '#A63A2B', // terracota
    '#3B4F6B', // azul pizarra
]);

/** Same document, same colour: on the shelf, in its sheet and on every visit. */
export function bookColor(law) {
    const key = String(law?.siglas || law?.id || law?.titulo || '');
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return BOOK_COLORS[hash % BOOK_COLORS.length];
}

export const GROUP_LABELS = Object.freeze({
    leyes: 'Leyes', reglamentos: 'Reglamentos', acuerdos: 'Acuerdos', dacg: 'Disposiciones',
    convocatorias: 'Convocatorias', normas: 'Normas', otros: 'Otros',
});

const SINGULAR = Object.freeze({
    leyes: 'Ley', reglamentos: 'Reglamento', acuerdos: 'Acuerdo', dacg: 'Disposición',
    convocatorias: 'Convocatoria', normas: 'Norma', otros: 'Documento',
});

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export function coverData(law) {
    const group = getAcervoGroup(law);
    const groupLabel = GROUP_LABELS[group];
    const title = typeof law?.titulo === 'string' ? law.titulo : '';
    const siglas = typeof law?.siglas === 'string' ? law.siglas.trim() : '';
    const judgment = isJudgment(law);
    const name = (judgment && judgmentCase(law)?.label) || shortTitle(title) || title || siglas || groupLabel;
    const published = /^\d{4}/.exec(String(law?.fecha_publicacion ?? ''));
    return {
        group,
        groupLabel,
        typeLabel: judgment ? instrumentTypeLabel(law) : SINGULAR[group],
        name,
        title,
        siglas,
        year: published ? published[0] : 'Sin fecha',
        display: siglas && siglas.length <= BIG_ACRONYM_MAX ? 'siglas' : 'name',
    };
}

const acronymSize = siglas => (siglas.length <= 4 ? 'l' : siglas.length <= 8 ? 'm' : 's');

const paint = law => `--sh-bg:${bookColor(law)}`;

/** Style for the plain back of a tome: same colour as its spine. */
export const tomeBackStyle = paint;

export function spineHTML(law) {
    const data = coverData(law);
    return `<div class="sh-spine" data-category="${data.group}" style="${paint(law)}">
        <span class="sh-spine-label">${esc(data.siglas || data.groupLabel)}</span>
        <span class="sh-spine-year">${esc(data.year === 'Sin fecha' ? '' : data.year)}</span>
    </div>`;
}

export function coverHTML(law) {
    const data = coverData(law);
    const heading = data.display === 'siglas'
        ? `<strong class="sh-cover-siglas" data-size="${acronymSize(data.siglas)}">${esc(data.siglas)}</strong><span class="sh-cover-accent"></span><span class="sh-cover-name">${esc(data.name)}</span>`
        : `<span class="sh-cover-accent"></span><strong class="sh-cover-long">${esc(data.name)}</strong>`;
    return `<div class="sh-cover" data-category="${data.group}" style="${paint(law)}">
        <span class="sh-cover-curve"></span>
        <span class="sh-cover-ribbon"></span>
        <span class="sh-cover-type">${esc(data.typeLabel)}</span>
        <div class="sh-cover-heading">${heading}</div>
        <div class="sh-cover-foot"><span>${esc(data.year)}</span>${collectionIcon(data.group, 18)}</div>
    </div>`;
}
