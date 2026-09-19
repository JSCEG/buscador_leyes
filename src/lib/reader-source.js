/** Versioned, read-only provenance for the original-source reader.
 * No article is matched by its label or number: only its real UUID and exact text.
 */
export const READER_MANIFEST_URL = '/reader-sources/manifest.v1.json';
let pendingManifest;

const has = (value, key) => value && Object.hasOwn(value, key);
const sha256 = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const positive = value => Number.isFinite(value) && value > 0;
const safeAsset = value => typeof value === 'string'
    && /^\/reader-sources\/[a-z0-9/_\-.]+$/.test(value) && !value.includes('..');

function officialUrl(value) {
    try {
        if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return null;
        const url = new URL(value);
        return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
}

function unmapped(reason, originalUrl) {
    return { status: 'unmapped', reason, originalUrl: officialUrl(originalUrl), source: null,
        page: null, pages: [], pageIndex: 0, pdfUrl: null, highlights: [], contentVerified: false };
}

async function fetchManifest(fetcher) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetcher(READER_MANIFEST_URL, { cache: 'no-cache', signal: controller.signal });
        if (!response.ok) throw new Error('No se pudo cargar la procedencia documental.');
        const manifest = await response.json();
        if (manifest?.schemaVersion !== 1 || !manifest.sources || !manifest.articles) throw new Error('Manifiesto no compatible.');
        return manifest;
    } finally { clearTimeout(timer); }
}

/** Load only metadata. PDFs and page images remain lazy, at the view's discretion. */
export function loadReaderSources({ fetcher } = {}) {
    if (fetcher) return fetchManifest(fetcher);
    if (!pendingManifest) {
        pendingManifest = fetchManifest(globalThis.fetch).catch(error => { pendingManifest = null; throw error; });
    }
    return pendingManifest;
}

/** Pure mapping lookup. Production views should use getReaderSource to verify current text. */
export function resolveReaderSource(manifest, articleId, { pageIndex = 0, originalUrl } = {}) {
    if (manifest?.schemaVersion !== 1 || !has(manifest.articles, articleId)) return unmapped('no-traceability', originalUrl);
    const article = manifest.articles[articleId];
    if (!article || typeof article !== 'object') return unmapped('invalid-traceability', originalUrl);
    const source = has(manifest.sources, article?.sourceId) ? manifest.sources[article.sourceId] : null;
    const fallbackUrl = officialUrl(originalUrl) || officialUrl(source?.originalUrl);
    const remote = source?.transport === 'remote-pdf';
    const safePdf = remote
        ? /^[a-z0-9-]+$/.test(source.id) && source.pdfUrl === `/api/reader/${source.id}` && officialUrl(source.originalUrl)
        : safeAsset(source?.pdfUrl);
    if (!source || !sha256(source.sha256) || !sha256(article.contentSha256)
        || !safePdf || !Array.isArray(source.pages) || !source.pages.length
        || !Number.isInteger(source.pageCount) || source.pageCount !== source.pages.length
        || !Array.isArray(article.pageNumbers) || !article.pageNumbers.length
        || !Array.isArray(article.anchors) || !article.anchors.length) return unmapped('invalid-traceability', fallbackUrl);

    const pages = article.pageNumbers.map(number => source.pages.find(page => page?.number === number));
    if (new Set(article.pageNumbers).size !== pages.length || pages.some(page => !page
        || !Number.isInteger(page.number) || page.number < 1 || page.number > source.pageCount
        || !positive(page.width) || !positive(page.height) || (!remote && !safeAsset(page.imageUrl)))) {
        return unmapped('invalid-traceability', fallbackUrl);
    }
    const validAnchor = anchor => {
        if (!anchor || typeof anchor !== 'object') return false;
        const page = pages.find(item => item.number === anchor.page);
        const box = anchor.bbox;
        return page && Array.isArray(box) && box.length === 4 && box.every(Number.isFinite)
            && 0 <= box[0] && box[0] < box[2] && box[2] <= page.width
            && 0 <= box[1] && box[1] < box[3] && box[3] <= page.height;
    };
    if (!article.anchors.every(validAnchor) || pages.some(page => !article.anchors.some(anchor => anchor.page === page.number))) {
        return unmapped('invalid-traceability', fallbackUrl);
    }
    const index = Number.isFinite(pageIndex) ? Math.max(0, Math.min(pages.length - 1, Math.trunc(pageIndex))) : 0;
    const page = pages[index];
    const highlights = article.anchors.filter(anchor => anchor.page === page.number).map(anchor => {
        const [x0, y0, x1, y1] = anchor.bbox;
        return { x: x0 / page.width * 100, y: y0 / page.height * 100,
            width: (x1 - x0) / page.width * 100, height: (y1 - y0) / page.height * 100 };
    });
    return { status: 'mapped', reason: null, source, pages, pageIndex: index, page, highlights,
        pdfUrl: `${remote ? source.originalUrl : source.pdfUrl}#page=${page.number}`, originalUrl: fallbackUrl,
        articleLabel: article.label, contentSha256: article.contentSha256, contentVerified: false };
}

/** Compare the article's current exact UTF-8 text with the reviewed publication.
 * Any change, unavailable digest or absent mapping disables precise navigation.
 * `manifest` is optional for callers that already loaded it and for isolated tests.
 */
export async function getReaderSource(articleId, { articleText, pageIndex = 0, originalUrl, manifest } = {}) {
    let loaded;
    try { loaded = manifest || await loadReaderSources(); }
    catch { return unmapped('source-unavailable', originalUrl); }
    const mapping = resolveReaderSource(loaded, articleId, { pageIndex, originalUrl });
    if (mapping.status !== 'mapped') return mapping;
    if (typeof articleText !== 'string') return unmapped('missing-content', mapping.originalUrl);
    try {
        const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(articleText));
        const actual = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
        if (actual !== mapping.contentSha256) return unmapped('content-mismatch', mapping.originalUrl);
    } catch { return unmapped('verification-unavailable', mapping.originalUrl); }
    return { ...mapping, contentVerified: true };
}
