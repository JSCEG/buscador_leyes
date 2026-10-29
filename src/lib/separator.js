/**
 * Separator of the design system: hairline with the SENER diamond in the middle. One per block at most:
 * between an article's header and its text, or closing a highlighted quote. Styles: design/components-extra.css.
 * @param {{ tone?: 'gold'|'brand', plain?: boolean, className?: string }} options
 */
export function separatorHtml({ tone = 'gold', plain = false, className = '' } = {}) {
    const classes = ['bj-sep', tone === 'brand' ? 'bj-sep--brand' : '', className].filter(Boolean).join(' ');
    return `<div class="${classes}" role="separator" aria-hidden="true"><span class="bj-sep__line"></span>${plain ? '' : '<span class="bj-sep__diamond"></span><span class="bj-sep__line"></span>'}</div>`;
}
