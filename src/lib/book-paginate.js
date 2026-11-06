/**
 * Splits a document into book pages without ever changing its text. Each block is placed on the
 * current page if `fits` says it fits: the browser measures with the real letter, tests simulate it.
 * A long paragraph splits by words. A narrow table splits by rows repeating its header; a wide one,
 * one with rowspan or a caption, or one with a row bigger than a page goes on a card that opens the whole table.
 */
import { articleHtml, paragraphClass } from './article-html.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const WRAPPERS = new Set(['DIV', 'SECTION', 'ARTICLE', 'UL', 'OL', 'FIGURE', 'CENTER', 'MAIN', 'ASIDE']);
const ROMAN_OR_LETTER = /^([IVXLCDM]+\.|[a-z]\)|\d+\.)\s/;
const BLANK_PLAIN = /\s+/g;
// PDFs cut lines mid-sentence: lines join unless the next one opens a fraction, an item or a short heading.
const NEW_PARAGRAPH = /\n(?=(?:[IVXLC]+\.|[a-zñ]\)|\d+\.)(?:\s|\n)|[A-ZÁÉÍÓÚÑ][^\n]{0,60}:\n)/;

function columnCount(table) {
    let widest = 0;
    for (const row of table.rows) {
        let count = 0;
        for (const cell of row.cells) count += Math.max(1, Number(cell.getAttribute('colspan')) || 1);
        widest = Math.max(widest, count);
    }
    return widest;
}

function tableBlock(table) {
    const inferred = table.tHead?.hasAttribute('data-inferred');
    const body = [...table.rows].filter(row => inferred || row.parentElement?.tagName !== 'THEAD').map(row => row.outerHTML);
    return {
        type: 'table',
        html: table.outerHTML,
        className: table.className,
        cols: columnCount(table),
        rows: table.rows.length,
        head: table.tHead && !inferred ? table.tHead.outerHTML : '',
        body,
        hasRowspan: Boolean(table.querySelector('[rowspan]:not([rowspan="1"])')),
        hasCaption: Boolean(table.caption),
    };
}

/** The article's blocks in order: paragraphs, figures and tables. */
export function articleBlocks(texto) {
    const box = document.createElement('div');
    box.innerHTML = articleHtml(texto);
    const blocks = [];
    const addText = value => {
        for (const line of String(value).split(NEW_PARAGRAPH)) {
            const text = line.replace(BLANK_PLAIN, ' ').trim();
            if (text) blocks.push({ type: 'text', text });
        }
    };
    const walk = node => {
        for (const child of node.childNodes) {
            if (child.nodeType === 3) { addText(child.textContent); continue; }
            if (child.nodeType !== 1) continue;
            if (child.tagName === 'TABLE') blocks.push(tableBlock(child));
            else if (child.tagName === 'IMG') blocks.push({ type: 'figure', src: child.getAttribute('src'), alt: child.getAttribute('alt') || '' });
            else if (child.querySelector('table, img') || WRAPPERS.has(child.tagName)) walk(child);
            else if (child.tagName === 'P' && child.querySelector('br')) addText(child.innerHTML.split(/<br\s*\/?>/i).map(part => { const line = document.createElement('div'); line.innerHTML = part; return line.textContent.trim(); }).join('\n'));
            else if (child.tagName !== 'BR') addText(child.textContent);
        }
    };
    walk(box);
    return blocks;
}

function* build(articles, { fits, maxTableCols }) {
    const pages = [];
    const tables = {};
    let current = [];
    let ids = new Set();
    let caption = '';
    let lastTitle = null;
    let lastChapter = null;

    const closePage = () => {
        if (!current.length) return;
        pages.push({ html: current.join(''), caption, articleIds: [...ids] });
        current = [];
        ids = new Set();
    };
    const place = html => {
        if (!fits([...current, html])) return false;
        current.push(html);
        return true;
    };
    /** On an empty page a block goes in even if it does not fit, so nothing loops. */
    const force = html => {
        if (place(html)) return;
        closePage();
        if (!place(html)) current.push(html);
    };

    function placeParagraph(article, text, lead = '') {
        const name = paragraphClass(text) || (ROMAN_OR_LETTER.test(text) ? 'bk-fr' : '');
        const open = `<p${name ? ` class="${name}"` : ''} data-article="${esc(article.id)}">`;
        const whole = `${open}${lead}${esc(text)}</p>`;
        ids.add(article.id);
        if (place(whole)) return;
        const words = text.split(' ');
        let index = 0;
        let prefix = lead;
        while (index < words.length) {
            let low = index;
            let high = words.length;
            while (low < high) {
                const middle = Math.ceil((low + high) / 2);
                if (fits([...current, `${open}${prefix}${esc(words.slice(index, middle).join(' '))}</p>`])) low = middle;
                else high = middle - 1;
            }
            if (low === index) {
                if (current.length) { closePage(); ids.add(article.id); continue; }
                low = index + 1; // A single word longer than the page goes alone.
            }
            current.push(`${open}${prefix}${esc(words.slice(index, low).join(' '))}</p>`);
            ids.add(article.id);
            index = low;
            prefix = '';
            if (index < words.length) { closePage(); ids.add(article.id); }
        }
    }

    const tableCard = (article, block, id) => `<button type="button" class="bk-tb-card" data-book-table="${esc(id)}" data-article="${esc(article.id)}"><b>Tabla</b><small>${block.cols} columnas · ${block.rows} filas</small><span class="bk-tb-mini" aria-hidden="true"><i></i><i></i><i></i><i></i></span><em>Ver tabla completa →</em></button>`;
    const tablePiece = (article, block, rows) => `<div class="lr-table is-pagina" data-article="${esc(article.id)}"><table class="${esc(block.className)}">${block.head}<tbody>${rows.join('')}</tbody></table></div>`;

    function placeTable(article, block, id) {
        tables[id] = { html: block.html, title: article.label || 'Tabla' };
        ids.add(article.id);
        const oversize = () => block.body.some(row => !fits([tablePiece(article, block, [row])]));
        if (block.cols > maxTableCols || block.hasRowspan || block.hasCaption || !block.body.length || oversize()) { force(tableCard(article, block, id)); return; }
        let pile = [];
        for (const row of block.body) {
            if (fits([...current, tablePiece(article, block, [...pile, row])])) { pile.push(row); continue; }
            if (pile.length) current.push(tablePiece(article, block, pile));
            pile = [row];
            closePage();
            ids.add(article.id);
        }
        if (pile.length) current.push(tablePiece(article, block, pile));
    }

    for (const [articleIndex, article] of articles.entries()) {
        const done = articleIndex / articles.length;
        const title = article.titulo || '';
        const chapter = article.capitulo || '';
        if (title !== lastTitle || chapter !== lastChapter) {
            if (title !== lastTitle) closePage();
            const heading = `${title && title !== lastTitle ? `<h6 class="bk-tit">${esc(title)}</h6>` : ''}${chapter && chapter !== lastChapter ? `<h6 class="bk-cap">${esc(chapter)}</h6>` : ''}`;
            lastTitle = title;
            lastChapter = chapter;
            caption = chapter || title || caption;
            if (heading) force(`<div class="bk-cabeza">${heading}</div>`);
        }
        if (!caption) caption = article.label || '';
        if (article.badge) force(`<p class="bk-badge">${esc(article.badge)}</p>`);
        const label = String(article.label ?? '').trim();
        const blocks = articleBlocks(article.texto);
        const first = blocks[0];
        // The official text usually starts with its own label: the label becomes the link and nothing is added.
        const opensWithLabel = label && first?.type === 'text' && first.text.startsWith(label);
        if (label && !opensWithLabel) force(`<h5 data-article="${esc(article.id)}"><button type="button" class="bk-art" data-book-article="${esc(article.id)}">${esc(label)}</button></h5>`);
        ids.add(article.id);
        for (const [index, block] of blocks.entries()) {
            if (block.type === 'text') {
                if (index === 0 && opensWithLabel) {
                    const rest = block.text.slice(label.length);
                    const link = `<button type="button" class="bk-art" data-book-article="${esc(article.id)}">${esc(label)}</button>`;
                    if (!place(`<p data-article="${esc(article.id)}">${link}${esc(rest)}</p>`)) {
                        const space = rest.startsWith(' ') ? ' ' : '';
                        const words = rest.trim().split(' ').filter(Boolean);
                        const firstWord = words.shift() ?? '';
                        placeParagraph(article, words.join(' ') ? `${firstWord} ${words.join(' ')}`.trimStart() : firstWord, `${link}${space}`);
                    }
                } else placeParagraph(article, block.text);
            } else if (block.type === 'figure') {
                force(`<figure class="bk-fig" data-article="${esc(article.id)}"><button type="button" data-book-figure="${esc(block.src)}" aria-label="Ampliar figura"><img src="${esc(block.src)}" alt="${esc(block.alt || 'Figura de la publicación oficial')}" loading="lazy"></button></figure>`);
            } else placeTable(article, block, `${article.id}:${index}`);
            yield done;
        }
        if (!blocks.length) yield done;
    }
    closePage();
    return { pages, tables };
}

export function paginate(articles, options) {
    const run = build(articles, options);
    let step = run.next();
    while (!step.done) step = run.next();
    return step.value;
}

/** The same work in slices, so a long document does not freeze the screen. */
export async function paginateInSlices(articles, options, { budgetMs = 16, yieldFn = () => new Promise(resolve => setTimeout(resolve)), onProgress = () => {} } = {}) {
    const run = build(articles, options);
    let started = performance.now();
    let step = run.next();
    while (!step.done) {
        if (performance.now() - started >= budgetMs) {
            onProgress(step.value);
            await yieldFn();
            started = performance.now();
        }
        step = run.next();
    }
    return step.value;
}

export function pageOfArticle(pages, id) {
    return pages.findIndex(page => page.articleIds?.includes(id));
}
