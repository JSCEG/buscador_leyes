/**
 * Official PDFs for the original-source reader, always read from the reviewed source through
 * /api/reader and verified here by SHA-256 before pdf.js sees them. Nothing is stored beyond memory.
 *
 * Large PDFs (whole DOF issues reach ~60 MB) are read into one buffer of the declared size, with
 * real progress for every reader waiting on them, and their pdf.js document is shared by the
 * readers of that PDF for a while, so moving between articles of the same issue does not download
 * it again. Small PDFs keep their bytes in memory briefly and give each reader its own document.
 */
const MAX_BYTES = 96 * 1024 * 1024;
const SMALL_PDF_BYTES = 20 * 1024 * 1024;
/** From this size the reader warns that the PDF is long and may take a while. */
export const LARGE_PDF_BYTES = 15 * 1024 * 1024;
const IDLE_TIMEOUT = 30000;
const TOTAL_TIMEOUT = 240000;
const KEEP = 120000;

let byteCache;
let sharedDocument;

function failure(code) { return Object.assign(new Error(code), { code }); }
const keyOf = source => `${source.pdfUrl}:${source.sha256}`;

/** One download of one PDF; every reader waiting on it gets the same progress. */
function download(source) {
    if (!/^\/api\/reader\/[a-z0-9-]+$/.test(source.pdfUrl) || !/^[a-f0-9]{64}$/.test(source.sha256)) {
        throw failure('invalid-traceability');
    }
    const key = keyOf(source);
    if (byteCache?.key === key && (byteCache.pending || Date.now() - byteCache.at < KEEP)) return byteCache;
    const listeners = new Set();
    const entry = {
        key, at: Date.now(), pending: true, state: { phase: 'connecting', loaded: 0, total: null },
        subscribe(listener) {
            if (typeof listener !== 'function') return () => {};
            listeners.add(listener);
            listener(entry.state);
            return () => listeners.delete(listener);
        },
    };
    const emit = state => { entry.state = state; listeners.forEach(listener => { try { listener(state); } catch { /* a reader's UI */ } }); };
    entry.promise = (async () => {
        const controller = new AbortController();
        let idle = setTimeout(() => controller.abort(), IDLE_TIMEOUT);
        const total = setTimeout(() => controller.abort(), TOTAL_TIMEOUT);
        const touch = () => { clearTimeout(idle); idle = setTimeout(() => controller.abort(), IDLE_TIMEOUT); };
        try {
            let response;
            try { response = await fetch(source.pdfUrl, { cache: 'no-store', signal: controller.signal }); }
            catch { throw failure(controller.signal.aborted ? 'source-timeout' : 'source-unavailable'); }
            if (response.status === 409) throw failure('source-version-changed');
            if (response.status === 504) throw failure('source-timeout');
            if (!response.ok || !/^application\/pdf(?:;|$)/i.test(response.headers.get('content-type') || '')) throw failure('source-unavailable');
            const declared = Number(response.headers.get('content-length'));
            const length = Number.isSafeInteger(declared) && declared > 0 ? declared : null;
            if (length > MAX_BYTES || !response.body) throw failure('source-unavailable');
            emit({ phase: 'downloading', loaded: 0, total: length });
            const reader = response.body.getReader();
            // With a declared length the bytes go straight into one buffer: no second copy.
            const buffer = length ? new Uint8Array(length) : null;
            const chunks = [];
            let loaded = 0;
            let lastEmit = 0;
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    touch();
                    if (loaded + value.byteLength > (length || MAX_BYTES)) { await reader.cancel(); throw failure('source-unavailable'); }
                    if (buffer) buffer.set(value, loaded); else chunks.push(value);
                    loaded += value.byteLength;
                    const now = Date.now();
                    if (now - lastEmit > 150) { lastEmit = now; emit({ phase: 'downloading', loaded, total: length }); }
                }
            } catch (error) {
                if (error?.code) throw error;
                throw failure(controller.signal.aborted ? 'source-timeout' : 'source-unavailable');
            }
            if (length && loaded !== length) throw failure('source-unavailable');
            let bytes = buffer;
            if (!bytes) {
                bytes = new Uint8Array(loaded);
                let offset = 0;
                for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
                chunks.length = 0;
            }
            emit({ phase: 'verifying', loaded, total: length });
            const digest = await crypto.subtle.digest('SHA-256', bytes);
            const actual = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
            if (actual !== source.sha256) throw failure('source-version-changed');
            emit({ phase: 'opening', loaded, total: length });
            return bytes;
        } finally { clearTimeout(idle); clearTimeout(total); }
    })();
    entry.promise.then(bytes => {
        entry.pending = false; entry.at = Date.now();
        // Large bytes are handed to pdf.js once (shared document), not kept here.
        if (bytes.byteLength > SMALL_PDF_BYTES && byteCache === entry) byteCache = null;
    }, () => { entry.pending = false; if (byteCache === entry) byteCache = null; });
    byteCache = entry;
    return entry;
}

function releaseShared(doc) {
    if (!doc || doc.users > 0) return;
    clearTimeout(doc.timer);
    doc.timer = setTimeout(() => {
        if (doc.users > 0) return;
        if (sharedDocument === doc) sharedDocument = null;
        doc.task?.destroy()?.catch(() => {});
    }, KEEP);
}

/** A reader of one PDF. `onProgress` receives { phase, loaded, total } while it loads. */
export function createRemotePdf(source, { onProgress } = {}) {
    let documentPromise;
    let loadingTask;
    let shared = null;
    let renderTask;
    let destroyed = false;
    let sequence = 0;
    let unsubscribe = () => {};
    const cancelled = () => failure('cancelled');
    const report = state => { if (!destroyed) onProgress?.(state); };
    const useShared = doc => {
        shared = doc; doc.users++; clearTimeout(doc.timer);
        return doc.promise;
    };
    const getDocument = () => {
        if (!documentPromise) documentPromise = (async () => {
            const key = keyOf(source);
            let pdf;
            if (sharedDocument?.key === key) pdf = await useShared(sharedDocument);
            else {
                const entry = download(source);
                unsubscribe = entry.subscribe(report);
                const bytes = await entry.promise;
                unsubscribe();
                if (destroyed) throw cancelled();
                if (!globalThis.pdfjsLib?.getDocument) throw failure('source-unavailable');
                if (bytes.byteLength > SMALL_PDF_BYTES) {
                    if (sharedDocument?.key !== key) {
                        const previous = sharedDocument;
                        const task = globalThis.pdfjsLib.getDocument({ data: bytes, isEvalSupported: false });
                        sharedDocument = { key, task, users: 0, timer: null, promise: task.promise };
                        sharedDocument.promise.catch(() => { if (sharedDocument?.task === task) sharedDocument = null; task.destroy()?.catch(() => {}); });
                        if (previous && previous.users === 0) { clearTimeout(previous.timer); previous.task?.destroy()?.catch(() => {}); }
                    }
                    pdf = await useShared(sharedDocument);
                } else {
                    loadingTask = globalThis.pdfjsLib.getDocument({ data: bytes.slice(), isEvalSupported: false });
                    pdf = await loadingTask.promise;
                }
            }
            if (destroyed) throw cancelled();
            if (pdf.numPages !== source.pageCount) throw failure('source-version-changed');
            report({ phase: 'ready' });
            return pdf;
        })().catch(error => { unsubscribe(); throw error; });
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
            unsubscribe();
            renderTask?.cancel(); renderTask = null;
            loadingTask?.destroy()?.catch(() => {});
            if (shared) { shared.users--; releaseShared(shared); shared = null; }
        },
    };
}
