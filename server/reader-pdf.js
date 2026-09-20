import manifest from '../public/reader-sources/manifest.v1.json';

export const MAX_PDF_BYTES = 8 * 1024 * 1024;
const reviewedDofPdfs = new Set(['https://dof.gob.mx/2026/CENACE/ProgramaInstitucional.pdf']);

function problem(status, code) {
    return new Response(JSON.stringify({ code }), {
        status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}

/** Fixed, reviewed sources only. Nothing from the request becomes an upstream URL. */
export async function serveReaderPdf(request, sourceId, { fetcher = globalThis.fetch, sources = manifest.sources } = {}) {
    if (request.method !== 'GET') return problem(405, 'method-not-allowed');
    if (new URL(request.url).search) return problem(400, 'unexpected-parameters');
    const source = Object.hasOwn(sources, sourceId) ? sources[sourceId] : null;
    if (!source || source.transport !== 'remote-pdf') return problem(404, 'unknown-source');
    if ((!/^https:\/\/www\.diputados\.gob\.mx\/LeyesBiblio\/pdf\/[A-Za-z0-9_-]+\.pdf$/.test(source.originalUrl)
        && !reviewedDofPdfs.has(source.originalUrl))
        || !/^[a-f0-9]{64}$/.test(source.sha256)) return problem(404, 'unknown-source');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
        const upstream = await fetcher(source.originalUrl, {
            // Workers supports manual/follow; a 3xx fails the !ok check below.
            redirect: 'manual', signal: controller.signal, headers: { Accept: 'application/pdf' },
        });
        if (!upstream.ok || !/^application\/pdf(?:;|$)/i.test(upstream.headers.get('content-type') || '')) {
            console.warn('[reader-pdf] upstream response', { sourceId, status: upstream.status, contentType: upstream.headers.get('content-type') });
            await upstream.body?.cancel();
            return problem(502, 'source-unavailable');
        }
        if (Number(upstream.headers.get('content-length')) > MAX_PDF_BYTES) {
            await upstream.body?.cancel();
            return problem(502, 'source-too-large');
        }
        if (!upstream.body) return problem(502, 'source-unavailable');
        const reader = upstream.body.getReader();
        const chunks = [];
        let length = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            length += value.byteLength;
            if (length > MAX_PDF_BYTES) {
                await reader.cancel();
                return problem(502, 'source-too-large');
            }
            chunks.push(value);
        }
        const bytes = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        const actual = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
        if (actual !== source.sha256) return problem(409, 'source-version-changed');
        return new Response(bytes, { headers: {
            'Content-Type': 'application/pdf', 'Content-Length': String(length),
            'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
            'Content-Disposition': 'inline; filename="documento-oficial.pdf"',
            'X-Reader-SHA256': actual,
        } });
    } catch (error) {
        console.warn('[reader-pdf] upstream failure', { sourceId, name: error?.name, message: error?.message });
        return problem(controller.signal.aborted ? 504 : 502, 'source-unavailable');
    } finally { clearTimeout(timer); }
}
