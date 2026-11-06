/** A link that opens a document as a book, on the article being read. */
const readingParams = articleId => `libro=1${articleId ? `&art=${encodeURIComponent(articleId)}` : ''}`;

/** @param {string} url the instrument's share address, readable (/ley/x) or with a hash (#ley-x) */
export function bookLink(url, articleId = null) {
    const [base, hash] = String(url).split('#');
    return hash ? `${base}#${hash}?${readingParams(articleId)}` : `${base}?${readingParams(articleId)}`;
}

/** App hash of a readable address plus the reading asked for in its query. */
export function withReading(hash, search = '') {
    const params = new URLSearchParams(search);
    if (!params.has('libro') || !String(hash).startsWith('#ley-')) return hash;
    return `${hash}?${readingParams(params.get('art'))}`;
}

/** @returns {{ lawId: string, book: { articleId: string|null }|null }} */
export function bookRoute(hash) {
    const [path, query = ''] = String(hash).split('?');
    const params = new URLSearchParams(query);
    return {
        lawId: decodeURIComponent(path.replace(/^#ley-/, '')),
        book: params.has('libro') ? { articleId: params.get('art') } : null,
    };
}

export function bookShareTargets({ title, url }) {
    const text = `Lee «${title}» como libro`;
    const link = encodeURIComponent(url);
    return [
        { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${text}: ${url}`)}` },
        { id: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${link}&text=${encodeURIComponent(text)}` },
        { id: 'x', label: 'X', href: `https://x.com/intent/post?url=${link}&text=${encodeURIComponent(text)}` },
        { id: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${link}` },
        { id: 'correo', label: 'Correo', href: `mailto:?subject=${encodeURIComponent(text)}&body=${link}` },
    ];
}
