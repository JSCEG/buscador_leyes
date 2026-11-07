/**
 * Spines and covers of the home shelf, drawn from each document's real data. The book is neutral paper;
 * its band, ribbon, rule and icon take the colour of its document type from --ac.
 */
import { getAcervoGroup } from './acervo-model.js';
import { shortTitle } from './short-title.js';
import { instrumentTypeLabel, isJudgment, judgmentCase } from './judgment.js';
import { collectionIcon } from './collection-icons.js';
import { ISSUER_LOGOS, issuerMark } from './issuer-logos.js';

const BIG_ACRONYM_MAX = 14;

export const GROUP_LABELS = Object.freeze({
    leyes: 'Leyes', reglamentos: 'Reglamentos', acuerdos: 'Acuerdos', dacg: 'Disposiciones',
    convocatorias: 'Convocatorias', normas: 'Normas', otros: 'Otros',
});

const SINGULAR = Object.freeze({
    leyes: 'Ley', reglamentos: 'Reglamento', acuerdos: 'Acuerdo', dacg: 'Disposición',
    convocatorias: 'Convocatoria', normas: 'Norma', otros: 'Documento',
});

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/** «18 mar 2025». Only a real calendar day gets day and month; otherwise the year, if there is one. */
function coverDate(value) {
    const text = String(value ?? '');
    const day = /^\d{4}-\d{2}-\d{2}/.exec(text)?.[0];
    const parsed = day ? new Date(`${day}T00:00:00.000Z`) : null;
    if (parsed && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day) {
        return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed).replace(/\./g, '').replace(/ de /g, ' ');
    }
    return /^\d{4}/.exec(text)?.[0] || 'Sin fecha';
}

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
        date: coverDate(law?.fecha_publicacion),
        display: siglas && siglas.length <= BIG_ACRONYM_MAX ? 'siglas' : 'name',
    };
}

const acronymSize = siglas => (siglas.length <= 4 ? 'l' : siglas.length <= 8 ? 'm' : 's');

export function spineHTML(law) {
    const data = coverData(law);
    return `<div class="sh-spine" data-category="${data.group}">
        <span class="sh-spine-cap" aria-hidden="true"></span>
        <span class="sh-spine-rule" aria-hidden="true"></span>
        <span class="sh-spine-label">${esc(data.siglas || data.groupLabel)}</span>
        <span class="sh-spine-year">${esc(data.year === 'Sin fecha' ? '' : data.year)}</span>
    </div>`;
}

function issuerHTML(law, logos) {
    const mark = issuerMark(law, logos);
    if (!mark) return '';
    return `<span class="sh-cover-issuer" title="${esc(mark.label)}">${mark.logo ? `<img src="${esc(mark.logo)}" alt="${esc(mark.label)}" loading="lazy" decoding="async">` : esc(mark.short)}</span>`;
}

export function coverHTML(law, logos = ISSUER_LOGOS) {
    const data = coverData(law);
    const heading = data.display === 'siglas'
        ? `<strong class="sh-cover-siglas" data-size="${acronymSize(data.siglas)}">${esc(data.siglas)}</strong><span class="sh-cover-accent"></span><span class="sh-cover-name">${esc(data.name)}</span>`
        : `<span class="sh-cover-accent"></span><strong class="sh-cover-long">${esc(data.name)}</strong>`;
    return `<div class="sh-cover" data-category="${data.group}">
        <span class="sh-cover-band"></span>
        <span class="sh-cover-ribbon"></span>
        <span class="sh-cover-type">${esc(data.typeLabel)}</span>
        <div class="sh-cover-heading">${heading}</div>
        <div class="sh-cover-foot"><span class="sh-cover-date">${esc(data.date)}</span>${issuerHTML(law, logos)}${collectionIcon(data.group, 18)}</div>
    </div>`;
}
