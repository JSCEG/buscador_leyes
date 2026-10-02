/** Helpers shared by the CNE tabs (permits, resolutions, panorama). */
export const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
export const fold = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const number = n => Number(n || 0).toLocaleString('es-MX');
export const plural = (n, one, many) => `${number(n)} ${Number(n) === 1 ? one : many}`;

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
/** "08/09/2026" → "8 sep 2026". */
export const dateLabel = value => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || '').trim());
    return m ? `${Number(m[1])} ${MONTHS[Number(m[2]) - 1]} ${m[3]}` : '';
};

export const skeleton = n => `<div class="pm-list">${'<div class="pm-card pm-skel"><i></i><i></i><i></i></div>'.repeat(n)}</div>`;

export const failure = (what, url) => `
    <div class="pm-error">
        <p><strong>No pudimos consultar ${what}.</strong> El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>
        <a class="pm-btn" href="${url}" target="_blank" rel="noopener">Abrir el sitio de la CNE</a>
    </div>`;

const TITLES = { LSE: 'ley del sector electrico', LSH: 'ley del sector hidrocarburos', LCNE: 'ley de la comision nacional de energia' };

/** Acervo instrument by acronym (LSE, RLSH…), falling back to the start of its title. */
export function lawBySiglas(summaries, siglas) {
    return summaries.find(law => fold(law.siglas) === fold(siglas))
        || (TITLES[siglas] && summaries.find(law => fold(law.titulo).startsWith(TITLES[siglas])))
        || null;
}

/** Acervo instrument by the name a resolution cites ("Reglamento de la Ley del Sector Hidrocarburos"). */
export function lawByCitedName(summaries, name) {
    // "Ley del Sector Hidrocarburos" and "Ley del Sector de Hidrocarburos" are the same instrument.
    const key = text => fold(text).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(word => word && !/^(de|del|la|las|los|el|y)$/.test(word)).join(' ');
    const wanted = key(name);
    if (!wanted) return null;
    return summaries.find(law => key(law.titulo) === wanted) || null;
}

export const PDF_ICON = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>';
