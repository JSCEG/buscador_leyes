/** The book's index: the document's own structure, and its articles where it has none. */
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export const OUTLINE_HEAD = '<h4 class="bk-ind-tit">Índice</h4>';

const sectionNumber = chapter => chapter.match(/^(\d+(?:\.\d+)*)\s*·/)?.[1] ?? '';

/** Articles of a numbered section can resume after its subsections: 7.2, 7.2.1, 7.2 again. */
function resumesSection(chapter, previous) {
    const number = sectionNumber(chapter);
    const before = sectionNumber(previous);
    return Boolean(number && before) && (before === number || before.startsWith(`${number}.`));
}

/** @returns {{ level: 1|2|3, text: string, articleId: string }[]} in reading order */
export function bookOutline(articles) {
    const entries = [];
    let lastBadge = '';
    let lastTitle = '';
    let lastChapter = '';
    let previousChapter = '';
    for (const article of articles) {
        const badge = article.badge || '';
        const title = article.titulo || '';
        const chapter = article.capitulo || '';
        if (badge && badge !== lastBadge) entries.push({ level: 1, text: badge, articleId: article.id });
        if (title && title !== lastTitle) entries.push({ level: 1, text: title, articleId: article.id });
        if (title !== lastTitle) previousChapter = '';
        const isNew = chapter !== lastChapter || title !== lastTitle;
        if (chapter && isNew && chapter !== title && !resumesSection(chapter, previousChapter)) entries.push({ level: 2, text: chapter, articleId: article.id });
        if (chapter) previousChapter = chapter;
        if (!title && !chapter && article.label) entries.push({ level: 3, text: article.label, articleId: article.id });
        lastBadge = badge;
        lastTitle = title;
        lastChapter = chapter;
    }
    return entries;
}

export const outlineRowHtml = (entry, pageNumber) => `<button type="button" class="bk-ind-it is-n${entry.level}" data-book-goto="${esc(entry.articleId)}"><span>${esc(entry.text)}</span><b>${esc(pageNumber)}</b></button>`;

/** Entries per page. `fits` receives the entries of a candidate page; a page always takes at least one. */
export function paginateOutline(entries, fits) {
    const pages = [];
    let current = [];
    for (const entry of entries) {
        if (current.length && !fits([...current, entry])) {
            pages.push(current);
            current = [];
        }
        current.push(entry);
    }
    if (current.length) pages.push(current);
    return pages;
}
