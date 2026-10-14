/**
 * Article text as safe HTML for the readers (article modal, article page, desk). Reviewed HTML
 * keeps its structure, Markdown tables go through `marked` when it is loaded, plain text becomes
 * paragraphs. Tables keep every official cell, header and span (table, thead, tbody, tr, th, td,
 * colspan, rowspan); the readers only add presentation around them: a scroll box so a wide table
 * scrolls sideways instead of overflowing a phone, header scopes, and classes for numeric cells.
 * Text content is never changed.
 */
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const DROP = 'script,style,iframe,object,embed,link,meta,form,input,button,textarea,select';
// Short figures (IDs, quantities, percentages, money) are centred and use tabular digits.
const NUMERIC = /^[(]?[-+]?[$]?\s?\d[\d\s.,]*\s?(%|°|º)?[)]?$/;

function clean(root) {
    root.querySelectorAll(DROP).forEach(node => node.remove());
    for (const node of root.querySelectorAll('*')) {
        for (const attr of [...node.attributes]) {
            const name = attr.name.toLowerCase();
            const unsafeUrl = ['href', 'src', 'xlink:href', 'action', 'formaction'].includes(name)
                && /^\s*(javascript|data|vbscript):/i.test(attr.value);
            if (name.startsWith('on') || name === 'style' || unsafeUrl) node.removeAttribute(attr.name);
        }
        if (node.tagName === 'A') { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer'); }
    }
}

/** Widest row of a table, counting colspans. */
function columnCount(table) {
    let widest = 0;
    for (const row of table.rows) {
        let count = 0;
        for (const cell of row.cells) count += Math.max(1, Number(cell.getAttribute('colspan')) || 1);
        widest = Math.max(widest, count);
    }
    return widest;
}

/** Wraps each table in a labelled scroll region and adds presentation-only hints. */
export function enhanceTables(root) {
    const tables = [...root.querySelectorAll('table')];
    tables.forEach((table, index) => {
        const columns = columnCount(table);
        table.classList.add('lr-tb', `lr-cols-${Math.min(8, Math.max(1, columns))}`);
        for (const th of table.querySelectorAll('thead th')) if (!th.hasAttribute('scope')) th.setAttribute('scope', th.getAttribute('colspan') > 1 ? 'colgroup' : 'col');
        for (const td of table.querySelectorAll('td')) {
            const text = td.textContent.replace(/\s+/g, ' ').trim();
            if (text && text.length <= 14 && NUMERIC.test(text)) td.classList.add('lr-num');
            // Blank layout cells (spacers in official forms) must not widen the table.
            else if (!text && !td.querySelector('img, svg, table')) td.classList.add('lr-empty');
        }
        let box = table.parentElement;
        const ownBox = box && box !== root && box.tagName === 'DIV' && box.children.length === 1 && box.classList.contains('overflow-x-auto');
        if (!ownBox && !box?.classList.contains('lr-table')) {
            box = table.ownerDocument.createElement('div');
            table.replaceWith(box);
            box.append(table);
        }
        if (box.classList.contains('lr-table')) return;
        box.classList.add('lr-table');
        box.setAttribute('role', 'region');
        box.setAttribute('tabindex', '0');
        const caption = table.querySelector('caption')?.textContent.trim();
        box.setAttribute('aria-label', caption || (tables.length > 1 ? `Tabla ${index + 1}` : 'Tabla'));
    });
}

/**
 * In a rendered reader, shows "Desliza…" above each table that is wider than its box (phones,
 * the split Text and PDF view, large letter sizes). Call after the HTML is in the page.
 */
export function markScrollableTables(root) {
    if (!root?.querySelectorAll) return;
    const boxes = [...root.querySelectorAll('.lr-table')];
    if (!boxes.length) return;
    const sync = box => {
        const hint = box.previousElementSibling?.classList.contains('lr-table-hint') ? box.previousElementSibling : null;
        hint?.classList.toggle('is-on', box.scrollWidth > box.clientWidth + 2);
    };
    for (const box of boxes) {
        if (!box.previousElementSibling?.classList.contains('lr-table-hint')) {
            const hint = box.ownerDocument.createElement('p');
            hint.className = 'lr-table-hint';
            hint.setAttribute('aria-hidden', 'true');
            hint.textContent = 'Desliza la tabla hacia los lados para ver todas las columnas →';
            box.before(hint);
        }
        sync(box);
    }
    if (typeof ResizeObserver === 'function') {
        const observer = new ResizeObserver(entries => entries.forEach(entry => sync(entry.target)));
        boxes.forEach(box => observer.observe(box));
    }
}

/** Safe copy of reviewed HTML, with the readers' table presentation. */
export function sanitizeArticleHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    clean(template.content);
    enhanceTables(template.content);
    return template.innerHTML;
}

export function articleHtml(text) {
    const value = String(text || '');
    if (/<(?:div|p|table|section|ul|ol|h[1-6])\b/i.test(value)) return sanitizeArticleHtml(value);
    const marked = globalThis.marked;
    if (marked?.parse && /\|.+\||\*\*|###/.test(value)) return sanitizeArticleHtml(marked.parse(value));
    return value.replace(/\r\n/g, '\n').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
        .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
}
