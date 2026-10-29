/**
 * Word-by-word difference of two article texts (CompareView): what only the left text says is marked
 * <del>, what only the right text says is marked <ins>. Plain text in, escaped HTML out.
 */
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/** Longest texts compared; beyond this the table would be too large for the browser. */
export const WORD_DIFF_LIMIT = 2500;

/** Words and the spaces after them, so the marked text keeps its line breaks. */
const tokens = text => String(text ?? '').match(/\S+\s*/g) || [];
// Words compare without case, punctuation or accents: «Ley,» and «ley» are the same word.
const key = token => token.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '');

/** `{ left, right, changed }` as HTML, or null when either text is longer than WORD_DIFF_LIMIT words. */
export function wordDiff(leftText, rightText) {
    const a = tokens(leftText);
    const b = tokens(rightText);
    if (a.length > WORD_DIFF_LIMIT || b.length > WORD_DIFF_LIMIT) return null;
    const ka = a.map(key);
    const kb = b.map(key);
    // Longest common subsequence, filled from the end so the walk below goes forward.
    const width = b.length + 1;
    const table = new Uint16Array((a.length + 1) * width);
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            table[i * width + j] = ka[i] === kb[j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
        }
    }
    const left = [];
    const right = [];
    let changed = 0;
    let i = 0;
    let j = 0;
    while (i < a.length || j < b.length) {
        if (i < a.length && j < b.length && ka[i] === kb[j]) { left.push(esc(a[i++])); right.push(esc(b[j++])); }
        else if (j < b.length && (i === a.length || table[i * width + j + 1] >= table[(i + 1) * width + j])) { right.push(`<ins>${esc(b[j++])}</ins>`); changed++; }
        else { left.push(`<del>${esc(a[i++])}</del>`); changed++; }
    }
    // Adjacent marks merge into one run.
    const merge = parts => parts.join('').replace(/<\/del><del>/g, '').replace(/<\/ins><ins>/g, '');
    return { left: merge(left), right: merge(right), changed };
}
