import manifest from '../public/reader-sources/manifest.v1.json';

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
const reviewedDofPdfs = new Set([
    'https://dof.gob.mx/2026/CENACE/ProgramaInstitucional.pdf',
    'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=07092026-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=15042025-VES.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=22122025-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=17102025-VES.pdf&repo=',
    'https://sidof.segob.gob.mx/notas/getNewsletter/17-04-2025/Matutina/320604',
    'https://sidof.segob.gob.mx/notas/getNewsletter/16-04-2026/Matutina/326685',
    'https://sidof.segob.gob.mx/notas/getNewsletter/23-01-2024/Matutina/311101',
    'https://sidof.segob.gob.mx/notas/getNewsletter/23-10-2025/Matutina/323704',
    'https://sidof.segob.gob.mx/notas/getNewsletter/27-04-2026/Matutina/326905',
    'https://sidof.segob.gob.mx/notas/getNewsletter/07-10-2025/Matutina/323403',
    'https://sidof.segob.gob.mx/notas/getNewsletter/06-08-2025/Matutina/322403',
    'https://sidof.segob.gob.mx/notas/getNewsletter/08-05-2026/Matutina/327165',
    'https://sidof.segob.gob.mx/notas/getNewsletter/02-09-2026/Matutina/329425',
    'https://sidof.segob.gob.mx/notas/getNewsletter/08-09-2026/Matutina/329525',
    'https://sidof.segob.gob.mx/notas/getNewsletter/26-06-2026/Matutina/328125',
    'https://sidof.segob.gob.mx/notas/getNewsletter/18-06-2026/Matutina/327985',
    'https://sidof.segob.gob.mx/notas/getNewsletter/10-09-2026/Matutina/329565',
    'https://sidof.segob.gob.mx/notas/getNewsletter/11-09-2026/Matutina/329588',
    'https://sidof.segob.gob.mx/notas/getNewsletter/18-09-2026/Matutina/329705',
    'https://sidof.segob.gob.mx/notas/getNewsletter/30-09-2026/Matutina/329925',
    'https://sidof.segob.gob.mx/notas/getNewsletter/02-10-2026/Matutina/329985',
    'https://sidof.segob.gob.mx/notas/getNewsletter/15-05-2026/Vespertina/327345',
    'https://sidof.segob.gob.mx/notas/getNewsletter/20-05-2024/Matutina/313401',
    'https://sidof.segob.gob.mx/notas/getNewsletter/08-05-2025/Matutina/320943',
    'https://sidof.segob.gob.mx/notas/getNewsletter/29-05-2026/Matutina/327605',
    'https://sidof.segob.gob.mx/notas/getNewsletter/26-05-2026/Matutina/327526',
    'https://sidof.segob.gob.mx/notas/getNewsletter/11-05-2026/Vespertina/327245',
    'https://sidof.segob.gob.mx/notas/getNewsletter/10-11-2025/Matutina/324043',
    'https://sidof.segob.gob.mx/notas/getNewsletter/19-08-2026/Matutina/329166',
    'https://sidof.segob.gob.mx/notas/getNewsletter/17-08-2026/Matutina/329125',
    'https://sidof.segob.gob.mx/notas/getNewsletter/10-07-2026/Matutina/328425',
    'https://sidof.segob.gob.mx/notas/getNewsletter/18-03-2025/Vespertina/320062',
    'https://sidof.segob.gob.mx/notas/getNewsletter/31-08-2026/Matutina/329365',
    'https://sidof.segob.gob.mx/notas/getNewsletter/14-08-2026/Matutina/329086',
]);

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
    if ((!/^https:\/\/www\.diputados\.gob\.mx\/LeyesBiblio\/(?:pdf|regley)\/[A-Za-z0-9_-]+\.pdf$/.test(source.originalUrl)
        && !reviewedDofPdfs.has(source.originalUrl))
        || !/^[a-f0-9]{64}$/.test(source.sha256)) return problem(404, 'unknown-source');
    const controller = new AbortController();
    // Large official issue PDFs can take longer to stream through the Worker
    // than the smaller individual-law PDFs. Keep the upstream request alive
    // long enough for the reviewed 20 MiB maximum.
    const timer = setTimeout(() => controller.abort(), 60000);
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
