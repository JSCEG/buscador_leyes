/**
 * Article text as safe HTML for secondary readers (the desk). Reviewed HTML keeps its structure,
 * Markdown tables go through `marked` when it is loaded, plain text becomes paragraphs.
 */
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const DROP = 'script,style,iframe,object,embed,link,meta,form,input,button,textarea,select';

function sanitize(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll(DROP).forEach(node => node.remove());
    for (const node of template.content.querySelectorAll('*')) {
        for (const attr of [...node.attributes]) {
            const name = attr.name.toLowerCase();
            const unsafeUrl = ['href', 'src', 'xlink:href', 'action', 'formaction'].includes(name)
                && /^\s*(javascript|data|vbscript):/i.test(attr.value);
            if (name.startsWith('on') || name === 'style' || unsafeUrl) node.removeAttribute(attr.name);
        }
        if (node.tagName === 'A') { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer'); }
    }
    return template.innerHTML;
}

export function articleHtml(text) {
    const value = String(text || '');
    if (/<(?:div|p|table|section|ul|ol|h[1-6])\b/i.test(value)) return sanitize(value);
    const marked = globalThis.marked;
    if (marked?.parse && /\|.+\||\*\*|###/.test(value)) return sanitize(marked.parse(value));
    return value.replace(/\r\n/g, '\n').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
        .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
}
