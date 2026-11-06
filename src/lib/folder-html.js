/** A collection as an animated folder: its front filters the shelf, its sheets open documents. */
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const SHAPE = 'M0 14A8 8 0 0 1 8 6H44C52 6 53 0 60 0H116A8 8 0 0 1 124 8V104A8 8 0 0 1 116 112H8A8 8 0 0 1 0 104Z';
const MAX_SHEETS = 3;

const noun = count => (count === 1 ? 'documento' : 'documentos');

export function folderHtml({ group, label, count, sheets = [], open = false }) {
    const shown = sheets.slice(0, MAX_SHEETS);
    const pages = shown.map((sheet, index) => {
        const offset = index - (shown.length - 1) / 2;
        const depth = shown.length - 1 - index;
        return `<button type="button" class="bu-cf-hoja" data-sheet-doc="${esc(sheet.id)}" tabindex="${open ? 0 : -1}" style="--o:${offset};--d:${depth};z-index:${index + 1}" aria-label="Abrir ${esc(sheet.label)}"><span>${esc(sheet.label)}</span></button>`;
    }).join('');
    return `<div class="bu-cf" data-folder="${esc(group)}" data-category="${esc(group)}"${open ? ' data-open' : ''}>
        <div class="bu-cf-sombra"></div>
        <div class="bu-cf-fondo"><svg viewBox="0 0 124 112" preserveAspectRatio="none" aria-hidden="true"><path d="${SHAPE}"/></svg></div>
        ${pages}
        <button type="button" class="bu-cf-frente" aria-pressed="${open}"><b>${esc(label)}</b><small>${esc(count)} ${noun(count)}</small></button>
    </div>`;
}
