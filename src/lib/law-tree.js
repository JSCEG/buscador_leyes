/**
 * LawTree of the design system: the instrument as a tree of títulos › capítulos › artículos, collapsible,
 * with the count of each branch. Articles keep their reading order; a law without títulos or capítulos
 * shows a single branch.
 */
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const clean = value => (value && value !== 'null' && value !== 'undefined' ? String(value).trim() : '');
const CHEVRON = '<svg class="bj-icon law-tree-chevron" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

/** Groups articles by título and capítulo, in reading order. */
export function lawTreeGroups(articles = []) {
    const titles = [];
    const byTitle = new Map();
    for (const article of articles) {
        const titleKey = clean(article.titulo_nombre);
        if (!byTitle.has(titleKey)) { const node = { label: titleKey, chapters: [], byChapter: new Map(), count: 0 }; byTitle.set(titleKey, node); titles.push(node); }
        const title = byTitle.get(titleKey);
        const chapterKey = clean(article.capitulo_nombre);
        if (!title.byChapter.has(chapterKey)) { const chapter = { label: chapterKey, items: [] }; title.byChapter.set(chapterKey, chapter); title.chapters.push(chapter); }
        title.byChapter.get(chapterKey).items.push(article);
        title.count += 1;
    }
    return titles.map(({ label, chapters, count }) => ({ label, count, chapters: chapters.map(({ label: chapterLabel, items }) => ({ label: chapterLabel, items })) }));
}

/** «TÍTULO PRIMERO De las disposiciones» → numeral and name, for the mono numeral column. */
function splitHeading(text) {
    const match = text.match(/^((?:T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N|LIBRO)\s+[^\s.·—-]+)[\s.·—-]*(.*)$/i);
    return match ? { num: match[1], name: match[2] } : { num: '', name: text };
}

export function renderLawTree(container, { sigla = '', title = '', articles = [], noun = 'artículos', onOpenArticle = () => {} } = {}) {
    if (!container) return;
    const groups = lawTreeGroups(articles);
    if (!articles.length) { container.innerHTML = ''; return; }
    const articleRow = article => `<li><button type="button" class="law-tree-leaf" data-tree-article="${esc(article.id)}"><span class="law-tree-leaf-num">${esc(article.articulo_label || '—')}</span></button></li>`;
    const branch = (label, count, inner, open, level) => {
        const { num, name } = splitHeading(label || (level === 1 ? 'Contenido' : 'Sin capítulo'));
        return `<details class="law-tree-node law-tree-level-${level}"${open ? ' open' : ''}>
            <summary>${CHEVRON}${num ? `<span class="law-tree-num">${esc(num)}</span>` : ''}<span class="law-tree-name">${esc(name)}</span><span class="law-tree-count">${count}</span></summary>
            <div class="law-tree-children">${inner}</div>
        </details>`;
    };
    const body = groups.map((group, index) => {
        const onlyChapter = group.chapters.length === 1 && !group.chapters[0].label;
        const inner = onlyChapter
            ? `<ul class="law-tree-leaves">${group.chapters[0].items.map(articleRow).join('')}</ul>`
            : group.chapters.map(chapter => branch(chapter.label, chapter.items.length, `<ul class="law-tree-leaves">${chapter.items.map(articleRow).join('')}</ul>`, false, 2)).join('');
        return branch(group.label, group.count, inner, index === 0, 1);
    }).join('');
    container.innerHTML = `<div class="law-tree" role="tree" aria-label="Estructura de ${esc(title || 'la ley')}">
        <div class="law-tree-head">${sigla ? `<span class="law-tree-sigla">${esc(sigla)}</span>` : ''}<span class="law-tree-title">${esc(title)}</span><span class="law-tree-total">${articles.length} ${esc(noun)}</span></div>
        ${body}
    </div>`;
    container.onclick = event => {
        const leaf = event.target.closest('[data-tree-article]');
        if (leaf) onOpenArticle(leaf.dataset.treeArticle);
    };
}
