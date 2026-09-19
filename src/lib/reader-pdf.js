const MAX_BYTES = 8 * 1024 * 1024;
let byteCache;

function failure(code) { return Object.assign(new Error(code), { code }); }

async function verifiedBytes(source) {
    if (!/^\/api\/reader\/[a-z0-9-]+$/.test(source.pdfUrl) || !/^[a-f0-9]{64}$/.test(source.sha256)) {
        throw failure('invalid-traceability');
    }
    const key = `${source.pdfUrl}:${source.sha256}`;
    if (byteCache?.key === key && Date.now() - byteCache.at < 120000) return byteCache.promise;
    const entry = { key, at: Date.now() };
    entry.promise = (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 25000);
        try {
            const response = await fetch(source.pdfUrl, { cache: 'no-store', signal: controller.signal });
            if (response.status === 409) throw failure('source-version-changed');
            if (!response.ok || !/^application\/pdf(?:;|$)/i.test(response.headers.get('content-type') || '')) throw failure('source-unavailable');
            if (Number(response.headers.get('content-length')) > MAX_BYTES || !response.body) throw failure('source-unavailable');
            const reader = response.body.getReader();
            const chunks = [];
            let length = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                length += value.byteLength;
                if (length > MAX_BYTES) { await reader.cancel(); throw failure('source-unavailable'); }
                chunks.push(value);
            }
            const bytes = new Uint8Array(length);
            let offset = 0;
            for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
            const digest = await crypto.subtle.digest('SHA-256', bytes);
            const actual = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
            if (actual !== source.sha256) throw failure('source-version-changed');
            return bytes;
        } finally { clearTimeout(timer); }
    })().catch(error => { if (byteCache === entry) byteCache = null; throw error; });
    byteCache = entry;
    return entry.promise;
}

/** A PDF document belongs to one reader. Only one recent byte buffer is reused in memory. */
export function createRemotePdf(source) {
    let documentPromise;
    let loadingTask;
    let renderTask;
    let destroyed = false;
    let sequence = 0;
    const cancelled = () => failure('cancelled');
    const getDocument = () => {
        if (!documentPromise) documentPromise = (async () => {
            const bytes = await verifiedBytes(source);
            if (destroyed) throw cancelled();
            if (!globalThis.pdfjsLib?.getDocument) throw failure('source-unavailable');
            loadingTask = globalThis.pdfjsLib.getDocument({ data: bytes.slice(), isEvalSupported: false });
            const pdf = await loadingTask.promise;
            if (destroyed) throw cancelled();
            if (pdf.numPages !== source.pageCount) throw failure('source-version-changed');
            return pdf;
        })();
        return documentPromise;
    };
    return {
        cancelRender() { sequence++; renderTask?.cancel(); renderTask = null; },
        async render(canvas, mappedPage) {
            const token = ++sequence;
            renderTask?.cancel();
            const pdf = await getDocument();
            if (destroyed || token !== sequence) throw cancelled();
            const page = await pdf.getPage(mappedPage.number);
            if (destroyed || token !== sequence) throw cancelled();
            const actual = page.getViewport({ scale: 1 });
            if (Math.abs(actual.width - mappedPage.width) > 0.1 || Math.abs(actual.height - mappedPage.height) > 0.1) {
                throw failure('source-version-changed');
            }
            const viewport = page.getViewport({ scale: Math.min(2, 1800 / Math.max(actual.width, actual.height)) });
            canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
            const task = page.render({ canvasContext: canvas.getContext('2d'), viewport });
            renderTask = task;
            try { await task.promise; }
            finally { if (renderTask === task) renderTask = null; }
            if (destroyed || token !== sequence) throw cancelled();
        },
        destroy() {
            destroyed = true; sequence++;
            renderTask?.cancel(); renderTask = null;
            loadingTask?.destroy()?.catch(() => {});
        },
    };
}
