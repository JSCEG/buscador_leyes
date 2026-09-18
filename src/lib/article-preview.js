// Las vistas previas se recortan después de extraer el texto, nunca sobre HTML.
export function getTextPreview(content, limit = 300) {
    const template = document.createElement('template');
    template.innerHTML = String(content || '');
    template.content.querySelectorAll('script, style, template').forEach(el => el.remove());
    template.content.querySelectorAll('img').forEach(el => el.replaceWith(el.alt || ''));
    template.content.querySelectorAll('br, div, p, li, tr, td, th, h1, h2, h3, h4, h5, h6, section, table, blockquote')
        .forEach(el => { el.prepend(' '); el.append(' '); });
    const text = template.content.textContent
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/!?\[([^\]]*)\]\([^\n)]*\)/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\s+/g, ' ').trim();
    return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

const STOP_WORDS_ES = new Set([
    'de', 'la', 'el', 'los', 'las', 'en', 'a', 'con', 'por', 'para', 'del', 'al',
    'se', 'su', 'sus', 'que', 'no', 'un', 'una', 'o', 'y', 'e', 'ni', 'u', 'lo',
    'le', 'les', 'me', 'te', 'nos', 'mi', 'si', 'es', 'son', 'fue', 'ser', 'ha',
    'han', 'hay', 'más', 'ya', 'pero', 'como', 'este', 'esta', 'ese', 'esa',
    'ante', 'bajo', 'cada', 'cual', 'donde', 'entre', 'hacia', 'hasta',
    'muy', 'poco', 'sin', 'sobre', 'solo', 'tan', 'todo', 'tras', 'otros'
]);

function getHighlightPattern(query) {
    const phrases = [];
    const cleanQuery = query.replace(/"([^"]+)"/g, (_, phrase) => {
        if (phrase.trim()) phrases.push(phrase.trim());
        return ' ';
    });
    const terms = cleanQuery.trim().split(/\s+/).filter(Boolean);
    const multiple = terms.length + phrases.length > 1;
    const words = terms.filter(word => multiple
        ? word.length > 3 && !STOP_WORDS_ES.has(word.toLowerCase())
        : word.length > 1);
    const matches = [...phrases, ...words].sort((a, b) => b.length - a.length);
    if (!matches.length) return null;
    return new RegExp(`(${matches.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function highlightWithPattern(text, pattern) {
    if (!pattern) return escapeHtml(text);
    return text.split(pattern).map((part, i) => i % 2
        ? `<mark class="hl">${escapeHtml(part)}</mark>` : escapeHtml(part)).join('');
}

export function highlightText(text, query = '') {
    return highlightWithPattern(String(text || ''), getHighlightPattern(query));
}

// En el artículo completo se conservan tablas y enlaces; sólo se marca texto visible.
export function highlightHtml(html, query = '') {
    const pattern = getHighlightPattern(query);
    if (!pattern) return html;
    const template = document.createElement('template');
    template.innerHTML = html;
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
        if (node.parentElement?.closest('script, style, mark')) continue;
        const replacement = document.createElement('template');
        replacement.innerHTML = highlightWithPattern(node.textContent, pattern);
        node.replaceWith(replacement.content);
    }
    return template.innerHTML;
}
