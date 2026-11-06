/**
 * Jump to any article of a document: a grid of numbers with a filter, or a list of labels when the
 * document does not number its parts. Lives in the document's side panel and, on small screens, in a sheet.
 */
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const normalize = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const NUMBER_LABEL = /^art[ií]culo\s+(.+)$/i;
const TRANSITORY_LABEL = /^transitorio\s+(.+)$/i;
const SHORT_MAX = 8;

export function articleShortLabel(label) {
    const text = String(label ?? '').trim();
    const number = NUMBER_LABEL.exec(text);
    if (number) return number[1];
    const transitory = TRANSITORY_LABEL.exec(text);
    return transitory ? `T. ${transitory[1]}` : text;
}

const isCompact = article => NUMBER_LABEL.test(String(article.articulo_label ?? '')) || TRANSITORY_LABEL.test(String(article.articulo_label ?? ''));

export function articlePickerHtml(articles, { indexLabel = article => article.articulo_label } = {}) {
    const usesNumbers = articles.length > 0 && articles.filter(isCompact).length >= articles.length / 2;
    const items = articles.map(article => {
        const short = usesNumbers ? articleShortLabel(indexLabel(article)) : article.articulo_label || indexLabel(article);
        const wide = short.length > SHORT_MAX || short.startsWith('T. ');
        return `<button type="button" class="ap-n${wide ? ' is-ancho' : ''}" data-pick-article="${esc(article.id)}" data-pick-label="${esc(short)}" title="${esc(article.articulo_label || indexLabel(article))}">${esc(short)}</button>`;
    }).join('');
    return `<input type="search" class="ap-f" data-picker-filter aria-label="Ir al artículo" placeholder="Ir al artículo…" autocomplete="off">
        <div class="ap-g${usesNumbers ? '' : ' is-lista'}">${items}</div>
        <p class="ap-vacio" data-picker-empty hidden>Sin coincidencias.</p>`;
}

/** Keeps the buttons whose label starts with what was typed; «artículo 11» reads as «11». */
export function filterPicker(root, query) {
    const wanted = normalize(query).replace(/^art[ií]culo\s*/, '').replace(/^art\.?\s*/, '');
    let shown = 0;
    root.querySelectorAll('[data-pick-article]').forEach(button => {
        const label = normalize(button.dataset.pickLabel);
        const match = !wanted || label.startsWith(wanted) || (button.closest('.is-lista') && label.includes(wanted));
        button.hidden = !match;
        if (match) shown += 1;
    });
    const empty = root.querySelector('[data-picker-empty]');
    if (empty) empty.hidden = shown > 0;
}

/** Wires a rendered picker. Enter on the filter takes the first match. */
export function initArticlePicker(root, onPick) {
    root.addEventListener('click', event => {
        const button = event.target.closest('[data-pick-article]');
        if (button) onPick(button.dataset.pickArticle);
    });
    root.querySelector('[data-picker-filter]')?.addEventListener('input', event => filterPicker(root, event.target.value));
    root.querySelector('[data-picker-filter]')?.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        const first = root.querySelector('[data-pick-article]:not([hidden])');
        if (first) onPick(first.dataset.pickArticle);
    });
}

/** The same picker in a sheet, with the chapters as a second tab when there are any. Returns its close function. */
export function openPickerSheet(articles, onPick, { indexLabel, chaptersHtml = '' } = {}) {
    const returnFocus = document.activeElement;
    const scrim = document.createElement('div');
    scrim.className = 'ap-telon';
    const sheet = document.createElement('div');
    sheet.className = 'ap-hoja bu-cristal-fuerte';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Ir a un artículo');
    sheet.innerHTML = `<div class="ap-hoja-c"><b>Índice</b><button type="button" class="bu-btn bu-btn-fantasma bu-btn-sm" data-picker-close>Cerrar</button></div>
        ${chaptersHtml ? '<div class="bu-seg ap-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-picker-tab="articulos">Artículos</button><button type="button" role="tab" aria-selected="false" data-picker-tab="capitulos">Capítulos</button></div>' : ''}
        <div class="ap-hoja-b">
            <div data-picker-panel="articulos">${articlePickerHtml(articles, indexLabel ? { indexLabel } : {})}</div>
            ${chaptersHtml ? `<div class="ap-capitulos" data-picker-panel="capitulos" hidden>${chaptersHtml}</div>` : ''}
        </div>`;
    document.body.append(scrim, sheet);
    const close = () => {
        scrim.remove();
        sheet.remove();
        returnFocus?.focus?.({ preventScroll: true });
    };
    const pick = id => { close(); onPick(id); };
    initArticlePicker(sheet.querySelector('[data-picker-panel="articulos"]'), pick);
    scrim.addEventListener('click', close);
    sheet.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } });
    sheet.addEventListener('click', event => {
        if (event.target.closest('[data-picker-close]')) { close(); return; }
        const tab = event.target.closest('[data-picker-tab]');
        if (tab) {
            sheet.querySelectorAll('[data-picker-tab]').forEach(other => other.setAttribute('aria-selected', String(other === tab)));
            sheet.querySelectorAll('[data-picker-panel]').forEach(panel => { panel.hidden = panel.dataset.pickerPanel !== tab.dataset.pickerTab; });
            return;
        }
        const chapter = event.target.closest('[data-outline-id]');
        if (chapter) pick(chapter.dataset.outlineId);
    });
    sheet.querySelector('[data-picker-filter]')?.focus({ preventScroll: true });
    return close;
}
