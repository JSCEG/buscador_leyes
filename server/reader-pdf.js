import sourcesById from './reader-pdf-sources.json';

// PDFs up to MAX_PDF_BYTES are read whole and verified (SHA-256) before anything is sent. Larger
// reviewed PDFs (whole DOF issues reach ~60 MB) must declare their length and pass through with
// the runtime's native streams, held to that exact length; the reader verifies their SHA-256
// before showing a page. Hashing them here is not possible: Cloudflare delivers ~4 KB chunks, and
// any JavaScript per chunk (a TransformStream) exceeded the Worker CPU limit at ~42-50 MB of the
// 58 MB DOF issue (outcome "exceededCpu" in the deployment logs, 14 Oct 2026). Nothing is stored.
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_STREAMED_PDF_BYTES = 96 * 1024 * 1024;
const IDLE_TIMEOUT = 30000;
const TOTAL_TIMEOUT = 240000;
const reviewedDofPdfs = new Set([
    'https://dof.gob.mx/abrirPDF.php?anio=2024&archivo=31102024-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=23122025-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2024&archivo=30072024-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2024&archivo=14082024-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2024&archivo=24072024-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=17072025-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2024&archivo=12032024-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=24102025-VES.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=02122025-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=14102026-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=08062026-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2024&archivo=25092024-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=30012025-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2024&archivo=23042024-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2024&archivo=10092024-MAT.pdf&repo=',
    'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=09102026-MAT.pdf&repo=',
    'https://www.snieg.mx/Documentos/Normatividad/Vigente/anexos_III_ntmppieg.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Vigente/anexos_II_ntmppieg.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Vigente/anexos_I_ntmppieg.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Vigente/guia_implem_ntmppieg.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Vigente/Esquema_Entrega_Recepcion_delaIIN.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Vigente/Medidas_conservacion_y_resguardo_delaIIN.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Vigente/criteros_estandares_tecnicos_conceptuales_cons_y_resgiin.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Formatos_reg/Formato_IIN_Geografica.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Formatos_reg/Instructivo_Formato_IIN_Geografica.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Formatos_reg/Formato_IIN_Estadistica.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Formatos_reg/Instructivo_Formato_IIN_Estadistica.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Vigente/Reglas_Determinacion_Informacion_Interes_Nacional.pdf',
    'https://www.snieg.mx/Documentos/Normatividad/Vigente/ACUERDO_Reglas_para_el_AcervoIIN.pdf',
    'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=22052025-VES.pdf&repo=',
    'https://dof.gob.mx/2026/CENACE/ProgramaInstitucional.pdf',
    'https://www.cenace.gob.mx/Docs/16_MARCOREGULATORIO/SENyMEM/%28DOF%202026-04-03%20SENER%29%20DACG%20Criterios%20para%20aplicaci%C3%B3n%20Mecanismos_Competitivos_Confiabilidad%20SEN.pdf',
    'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=30042026-MAT.pdf&repo=',
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
    'https://sidof.segob.gob.mx/notas/getNewsletter/05-10-2026/Matutina/330025',
    'https://sidof.segob.gob.mx/notas/getNewsletter/03-10-2025/Vespertina/323363',
    'https://sidof.segob.gob.mx/notas/getNewsletter/28-01-2026/Matutina/325425',
    'https://sidof.segob.gob.mx/notas/getNewsletter/20-12-2024/Vespertina/318281',
    'https://sidof.segob.gob.mx/notas/getNewsletter/12-01-2024/Vespertina/310942',
    'https://sidof.segob.gob.mx/notas/getNewsletter/18-01-2024/Matutina/311042',
    'https://sidof.segob.gob.mx/notas/getNewsletter/15-05-2026/Vespertina/327345',
    'https://sidof.segob.gob.mx/notas/getNewsletter/20-05-2024/Matutina/313401',
    'https://sidof.segob.gob.mx/notas/getNewsletter/08-05-2025/Matutina/320943',
    'https://sidof.segob.gob.mx/notas/getNewsletter/29-05-2026/Matutina/327605',
    'https://sidof.segob.gob.mx/notas/getNewsletter/26-05-2026/Matutina/327526',
    'https://sidof.segob.gob.mx/notas/getNewsletter/11-05-2026/Vespertina/327245',
    'https://sidof.segob.gob.mx/notas/getNewsletter/10-11-2025/Matutina/324043',
    'https://sidof.segob.gob.mx/notas/getNewsletter/17-10-2025/Vespertina/323603',
    'https://sidof.segob.gob.mx/notas/getNewsletter/08-04-2024/Matutina/312601',
    'https://sidof.segob.gob.mx/notas/getNewsletter/17-09-2025/Matutina/323103',
    'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=17032026-MAT.pdf&repo=',
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

const hex = buffer => [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');

const PDF_HEADERS = {
    'Content-Type': 'application/pdf', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': 'inline; filename="documento-oficial.pdf"',
};

/** Fixed, reviewed sources only. Nothing from the request becomes an upstream URL. */
export async function serveReaderPdf(request, sourceId, { fetcher = globalThis.fetch, sources = sourcesById } = {}) {
    if (request.method !== 'GET') return problem(405, 'method-not-allowed');
    if (new URL(request.url).search) return problem(400, 'unexpected-parameters');
    const source = Object.hasOwn(sources, sourceId) ? sources[sourceId] : null;
    if (!source || source.transport !== 'remote-pdf') return problem(404, 'unknown-source');
    if ((!/^https:\/\/www\.diputados\.gob\.mx\/LeyesBiblio\/(?:pdf|regley)\/[A-Za-z0-9_-]+\.pdf$/.test(source.originalUrl)
        && !reviewedDofPdfs.has(source.originalUrl))
        || !/^[a-f0-9]{64}$/.test(source.sha256)) return problem(404, 'unknown-source');
    const controller = new AbortController();
    // The upstream may stall: abort after IDLE_TIMEOUT without bytes, and after TOTAL_TIMEOUT in all.
    let idle = setTimeout(() => controller.abort(), IDLE_TIMEOUT);
    const total = setTimeout(() => controller.abort(), TOTAL_TIMEOUT);
    const touch = () => { clearTimeout(idle); idle = setTimeout(() => controller.abort(), IDLE_TIMEOUT); };
    const stop = () => { clearTimeout(idle); clearTimeout(total); };
    let streaming = false;
    try {
        const upstream = await fetcher(source.originalUrl, {
            // Workers supports manual/follow; a 3xx fails the !ok check below.
            redirect: 'manual', signal: controller.signal, headers: { Accept: 'application/pdf' },
        });
        touch();
        if (!upstream.ok || !/^application\/pdf(?:;|$)/i.test(upstream.headers.get('content-type') || '')) {
            console.warn('[reader-pdf] upstream response', { sourceId, status: upstream.status, contentType: upstream.headers.get('content-type') });
            await upstream.body?.cancel();
            return problem(502, 'source-unavailable');
        }
        const declared = Number(upstream.headers.get('content-length'));
        const declaredLength = Number.isSafeInteger(declared) && declared > 0 ? declared : 0;
        if (declaredLength > MAX_STREAMED_PDF_BYTES) {
            await upstream.body?.cancel();
            return problem(502, 'source-too-large');
        }
        if (!upstream.body) return problem(502, 'source-unavailable');
        if (declaredLength > MAX_PDF_BYTES) {
            streaming = true;
            // A native pipe reports no progress here, so only the total timeout applies to it.
            clearTimeout(idle);
            return new Response(exactLength(upstream.body, declaredLength, { stop, sourceId }), {
                headers: {
                    ...PDF_HEADERS, 'Content-Length': String(declaredLength),
                    // The expected edition; the reader checks the bytes against it before use.
                    'X-Reader-SHA256': source.sha256, 'X-Reader-Verification': 'reader',
                },
            });
        }
        // Small or undeclared: read whole (never past MAX_PDF_BYTES) and verify before answering.
        const reader = upstream.body.getReader();
        const chunks = [];
        let length = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            touch();
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
        chunks.length = 0;
        const actual = hex(await crypto.subtle.digest('SHA-256', bytes));
        if (actual !== source.sha256) return problem(409, 'source-version-changed');
        return new Response(bytes, { headers: { ...PDF_HEADERS, 'Content-Length': String(length), 'X-Reader-SHA256': actual } });
    } catch (error) {
        console.warn('[reader-pdf] upstream failure', { sourceId, name: error?.name, message: error?.message });
        return problem(controller.signal.aborted ? 504 : 502, 'source-unavailable');
    } finally { if (!streaming) stop(); }
}

/**
 * The upstream body held to its declared length. On Workers a FixedLengthStream does it natively
 * (no JavaScript per chunk) and errors on a shorter or longer body; elsewhere (the local dev
 * server, tests) a small stream does the same check.
 */
function exactLength(body, length, { stop, sourceId }) {
    if (typeof FixedLengthStream === 'function') {
        // Nothing observes the end of a native pipe here; the total timeout still bounds the fetch.
        return body.pipeThrough(new FixedLengthStream(length));
    }
    let received = 0;
    return body.pipeThrough(new TransformStream({
        transform(chunk, controller) {
            received += chunk.byteLength;
            if (received > length) { stop(); controller.error(Object.assign(new Error('source-too-large'), { code: 'source-too-large' })); return; }
            controller.enqueue(chunk);
        },
        flush(controller) {
            stop();
            if (received !== length) {
                console.warn('[reader-pdf] streamed source ended early', { sourceId, received, length });
                controller.error(Object.assign(new Error('source-unavailable'), { code: 'source-unavailable' }));
            }
        },
    }));
}
