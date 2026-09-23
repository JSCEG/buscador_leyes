/** Result excerpts: always escape first, then add <mark>. Never trust markup from the data. */

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const fold = char => char.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
/** Some articles were stored with table markup; excerpts show their text only. */
export function plainText(value) {
    return String(value ?? '')
        .replace(/<!--[\s\S]*?-->|-->|<!--/g, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&(#?\w+);/g, (entity, name) => ENTITIES[name.toLowerCase()] ?? (/^#\d+$/.test(name) ? String.fromCodePoint(Number(name.slice(1))) : entity))
        .replace(/\s+/g, ' ')
        .trim();
}
const STOPWORDS =new Set(['del', 'las', 'los', 'por', 'para', 'con', 'una', 'que', 'sus', 'como', 'entre', 'sobre', 'ante', 'este', 'esta']);

/** Accent- and case-insensitive stems: "interconexión" also finds "interconexiones". */
export function queryStems(query) {
    return [...new Set(String(query || '')
        .split(/[^\p{L}\p{N}]+/u)
        .map(word => [...word].map(fold).join(''))
        .filter(word => word.length >= 3 && !STOPWORDS.has(word))
        .map(word => (word.length > 6 ? word.slice(0, word.length - 2) : word)))];
}

/** Folded copy of the text plus a map back to original indices. */
function foldWithMap(text) {
    let folded = '';
    const map = [];
    [...text].forEach((char, index) => {
        const f = fold(char);
        for (let i = 0; i < f.length; i++) { folded += f[i]; map.push(index); }
    });
    return { folded, map, chars: [...text] };
}

/** Ranges (in original characters) of every word that contains a stem. */
function matchRanges(chars, folded, map, stems) {
    const ranges = [];
    const isWord = char => /[\p{L}\p{N}]/u.test(char || '');
    for (const stem of stems) {
        let from = folded.indexOf(stem);
        while (from !== -1) {
            let start = map[from], end = map[from + stem.length - 1] + 1;
            while (start > 0 && isWord(chars[start - 1])) start--;
            while (end < chars.length && isWord(chars[end])) end++;
            ranges.push([start, end]);
            from = folded.indexOf(stem, from + stem.length);
        }
    }
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const range of ranges) {
        const last = merged.at(-1);
        if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
        else merged.push([...range]);
    }
    return merged;
}

function markChars(chars, ranges, start, end) {
    let html = '', cursor = start;
    for (const [a, b] of ranges) {
        if (b <= start || a >= end) continue;
        const s = Math.max(a, start), e = Math.min(b, end);
        html += escapeHtml(chars.slice(cursor, s).join('')) + '<mark>' + escapeHtml(chars.slice(s, e).join('')) + '</mark>';
        cursor = e;
    }
    return html + escapeHtml(chars.slice(cursor, end).join(''));
}

/** Highlight query terms in a short label (e.g. "Artículo 12"). */
export function highlightTerms(text, query) {
    const source = String(text ?? '');
    const stems = queryStems(query);
    if (!stems.length) return escapeHtml(source);
    const { folded, map, chars } = foldWithMap(source);
    return markChars(chars, matchRanges(chars, folded, map, stems), 0, chars.length);
}

/** Window of about `size` characters around the first match, escaped and highlighted. */
export function contextSnippet(text, query, size = 260) {
    const clean = plainText(text);
    const { folded, map, chars } = foldWithMap(clean);
    const ranges = matchRanges(chars, folded, map, queryStems(query));
    if (chars.length <= size) return markChars(chars, ranges, 0, chars.length);
    const first = ranges[0]?.[0] ?? 0;
    let start = Math.max(0, first - Math.round(size * 0.35));
    let end = Math.min(chars.length, start + size);
    start = Math.max(0, end - size);
    // Snap to word boundaries so the excerpt never starts or ends mid-word.
    while (start > 0 && chars[start - 1] !== ' ') start++;
    while (end < chars.length && chars[end] !== ' ') end--;
    return `${start > 0 ? '… ' : ''}${markChars(chars, ranges, start, end)}${end < chars.length ? ' …' : ''}`;
}

/** Server fragment from ts_headline: matches arrive wrapped in [[[ ]]]. */
export function markedFragment(fragment) {
    return escapeHtml(plainText(fragment)).replace(/\[\[\[/g, '<mark>').replace(/\]\]\]/g, '</mark>');
}
