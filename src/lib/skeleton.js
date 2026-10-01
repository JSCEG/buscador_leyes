/**
 * Placeholder layouts shown while a view loads: the shape of what is coming instead of a spinner.
 * Kinds: 'results' (search result cards), 'acervo' (collection grid), 'article' (one text), 'list'.
 */
import '../styles/skeleton.css';

const line = (w, cls = '') => `<span class="sk-line ${cls}" style="width:${w}"></span>`;
const card = (i) => `<div class="sk-card" style="--d:${i * 90}ms">
    ${line('38%', 'sk-xs')}${line(`${70 - (i % 3) * 12}%`, 'sk-lg')}${line('96%')}${line(`${82 - (i % 2) * 20}%`)}
    <div class="sk-row">${line('70px', 'sk-pill')}${line('70px', 'sk-pill')}</div>
</div>`;

const LAYOUTS = {
    results: () => `<div class="sk-head">${line('22%', 'sk-xs')}${line('48%', 'sk-xl')}</div>${[0, 1, 2, 3].map(card).join('')}`,
    list: () => [0, 1, 2].map(card).join(''),
    acervo: () => `<div class="sk-hero"></div>${line('26%', 'sk-xl')}
        <div class="sk-grid">${[0, 1, 2, 3, 4, 5].map(i => `<div class="sk-tile" style="--d:${i * 70}ms"><span class="sk-icon"></span><div>${line('60%', 'sk-lg')}${line('88%')}</div></div>`).join('')}</div>`,
    article: () => `<div class="sk-card sk-article">${line('30%', 'sk-xs')}${line('64%', 'sk-xl')}
        ${['100%', '97%', '99%', '72%', '', '100%', '95%', '88%', '60%'].map(w => w ? line(w) : '<span class="sk-gap"></span>').join('')}</div>`,
};

export function skeleton(kind = 'list', label = 'Cargando') {
    return `<div class="sk-wrap sk-${kind}" role="status" aria-live="polite" aria-label="${label}"><span class="sr-only">${label}…</span>${(LAYOUTS[kind] || LAYOUTS.list)()}</div>`;
}
