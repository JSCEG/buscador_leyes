/**
 * Spines and covers of the home shelf, drawn from each document's real data. They are physical
 * objects: their colours belong to the collection and do not change with the theme.
 */
import { getAcervoGroup } from './acervo-model.js';
import { shortTitle } from './short-title.js';
import { instrumentTypeLabel, isJudgment, judgmentCase } from './judgment.js';
import { collectionIcon } from './collection-icons.js';
import { collectionSpot } from './acervo-art.js';

const FOIL = '#F0E0B4';
const INK = '#1C1915';
const BIG_ACRONYM_MAX = 14;

export const COVER_COLORS = Object.freeze({
    leyes: { bg: '#9B2247', ink: FOIL },
    acuerdos: { bg: '#611232', ink: FOIL },
    reglamentos: { bg: '#1E5B4F', ink: FOIL },
    dacg: { bg: '#13322B', ink: FOIL },
    convocatorias: { bg: '#A57F2C', ink: INK },
    normas: { bg: '#D4C19C', ink: INK },
    otros: { bg: '#6C5B58', ink: FOIL },
});

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

const acronymSize = siglas => (siglas.length <= 6 ? 'l' : siglas.length <= 10 ? 'm' : 's');

const paint = group => `--sh-bg:${COVER_COLORS[group].bg};--sh-ink:${COVER_COLORS[group].ink}`;

/** Style for the plain back of a tome: same collection colour as its spine. */
export const tomeBackStyle = law => paint(coverData(law).group);

export function spineHTML(law) {
    const data = coverData(law);
    return `<div class="sh-spine" data-category="${data.group}" style="${paint(data.group)}">
        <span class="sh-spine-band"></span>
        <span class="sh-spine-icon">${collectionIcon(data.group, 16)}</span>
        <span class="sh-spine-plate"><span class="sh-spine-label">${esc(data.siglas || data.groupLabel)}</span></span>
        <span class="sh-spine-year">${esc(data.year === 'Sin fecha' ? '' : data.year)}</span>
        <span class="sh-spine-band"></span>
    </div>`;
}

export function coverHTML(law) {
    const data = coverData(law);
    const heading = data.display === 'siglas'
        ? `<strong class="sh-cover-siglas" data-size="${acronymSize(data.siglas)}">${esc(data.siglas)}</strong><span class="sh-cover-name">${esc(data.name)}</span>`
        : `<strong class="sh-cover-long">${esc(data.name)}</strong>`;
    return `<div class="sh-cover" data-category="${data.group}" style="${paint(data.group)}">
        <span class="sh-cover-frame"></span>
        <span class="sh-cover-type">${esc(data.typeLabel)}</span>
        <div class="sh-cover-heading">${heading}</div>
        <span class="sh-cover-rule"></span>
        <span class="sh-cover-art">${collectionSpot(data.group, 56)}</span>
        <span class="sh-cover-year">${esc(data.year)}</span>
    </div>`;
}
