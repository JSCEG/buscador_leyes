// @vitest-environment node
import { createHash, webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { serveReaderPdf, MAX_PDF_BYTES, MAX_STREAMED_PDF_BYTES } from '../server/reader-pdf.js';

// Large reviewed PDFs (whole DOF issues) pass through the proxy at their exact length; the reader verifies them.
const DOF = 'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=08062026-MAT.pdf&repo=';
const large = new Uint8Array(MAX_PDF_BYTES + 3 * 65536);
large.set(new TextEncoder().encode('%PDF-1.7 reviewed issue'));
const sha256 = createHash('sha256').update(large).digest('hex');
const source = { transport: 'remote-pdf', originalUrl: DOF, sha256 };
const request = () => new Request('https://app.test/api/reader/big');
/** An upstream body delivered in 64 KiB chunks, like a real network response. */
const chunked = bytes => new ReadableStream({
    start(controller) {
        for (let offset = 0; offset < bytes.length; offset += 65536) controller.enqueue(bytes.subarray(offset, offset + 65536));
        controller.close();
    },
});
const upstream = (bytes, headers = {}) => new Response(chunked(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(bytes.length), ...headers } });
const serve = fetcher => serveReaderPdf(request(), 'big', { sources: { big: source }, fetcher });

async function drain(response) {
    const reader = response.body.getReader();
    let received = 0;
    try {
        while (true) { const { done, value } = await reader.read(); if (done) return { received, complete: true }; received += value.byteLength; }
    } catch (error) { return { received, complete: false, error }; }
}

describe('streamed official PDFs', () => {
    beforeEach(() => vi.stubGlobal('crypto', webcrypto));
    afterEach(() => vi.unstubAllGlobals());

    it('streams a reviewed PDF larger than the buffered limit with its declared length', async () => {
        const response = await serve(async () => upstream(large));
        expect(response.status).toBe(200);
        expect(response.headers.get('content-length')).toBe(String(large.length));
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(response.headers.get('x-reader-sha256')).toBe(sha256);
        expect(response.headers.get('x-reader-verification')).toBe('reader');
        const bytes = new Uint8Array(await response.arrayBuffer());
        expect(bytes.length).toBe(large.length);
        expect(createHash('sha256').update(bytes).digest('hex')).toBe(sha256);
    });

    it('on Workers, holds the stream to its length with the native FixedLengthStream (no JavaScript per chunk)', async () => {
        const made = [];
        class FixedLengthStream extends TransformStream { constructor(length) { super(); made.push(length); } }
        vi.stubGlobal('FixedLengthStream', FixedLengthStream);
        const response = await serve(async () => upstream(large));
        expect(made).toEqual([large.length]);
        expect((await response.arrayBuffer()).byteLength).toBe(large.length);
    });

    it('fails a stream shorter or longer than declared', async () => {
        const short = await drain(await serve(async () => upstream(large.subarray(0, large.length - 10), { 'Content-Length': String(large.length) })));
        expect(short.complete).toBe(false);
        expect(short.error.code).toBe('source-unavailable');
        const long = await drain(await serve(async () => upstream(large, { 'Content-Length': String(large.length - 10) })));
        expect(long.complete).toBe(false);
        expect(long.error.code).toBe('source-too-large');
    });

    it('keeps the hard limit and the source allowlist', async () => {
        const huge = vi.fn(async () => new Response(chunked(new Uint8Array(16)), { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(MAX_STREAMED_PDF_BYTES + 1) } }));
        const tooLarge = await serve(huge);
        expect(tooLarge.status).toBe(502);
        expect(await tooLarge.json()).toEqual({ code: 'source-too-large' });
        const fetcher = vi.fn();
        const other = await serveReaderPdf(request(), 'big', { sources: { big: { ...source, originalUrl: 'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=09062026-MAT.pdf&repo=' } }, fetcher });
        expect(other.status).toBe(404);
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('still verifies small PDFs before answering', async () => {
        const small = new TextEncoder().encode('%PDF-1.7 small');
        const smallSource = { ...source, sha256: createHash('sha256').update(small).digest('hex') };
        const ok = await serveReaderPdf(request(), 'big', { sources: { big: smallSource }, fetcher: async () => upstream(small) });
        expect(new Uint8Array(await ok.arrayBuffer())).toEqual(small);
        const changed = await serveReaderPdf(request(), 'big', { sources: { big: smallSource }, fetcher: async () => upstream(new TextEncoder().encode('%PDF-1.7 other')) });
        expect(changed.status).toBe(409);
    });
});

describe('loading large PDFs in the reader', () => {
    let createRemotePdf;
    const mappedPage = { number: 2, width: 612, height: 792 };
    const canvas = () => ({ getContext: () => ({}) });
    const clientSource = { pdfUrl: '/api/reader/big', pageCount: 380, sha256 };
    function library() {
        const pdf = { numPages: 380, getPage: vi.fn(async () => ({ getViewport: ({ scale }) => ({ width: 612 * scale, height: 792 * scale }), render: () => ({ promise: Promise.resolve(), cancel() {} }) })) };
        const destroy = vi.fn(async () => {});
        const getDocument = vi.fn(() => ({ promise: Promise.resolve(pdf), destroy }));
        vi.stubGlobal('pdfjsLib', { getDocument });
        return { getDocument, destroy };
    }

    beforeEach(async () => {
        vi.resetModules();
        ({ createRemotePdf } = await import('../src/lib/reader-pdf.js'));
        vi.stubGlobal('crypto', webcrypto);
        vi.stubGlobal('fetch', vi.fn(async () => upstream(large)));
    });
    afterEach(() => vi.unstubAllGlobals());

    it('reports real progress, then verification, then the open document', async () => {
        library();
        const states = [];
        const reader = createRemotePdf(clientSource, { onProgress: state => states.push(state.phase === 'downloading' ? `${state.phase}:${state.total}` : state.phase) });
        await reader.render(canvas(), mappedPage);
        expect(states[0]).toBe('connecting');
        expect(states).toContain(`downloading:${large.length}`);
        expect(states.slice(-3)).toEqual(['verifying', 'opening', 'ready']);
        reader.destroy();
    });

    it('shares one large document across articles of the same PDF, without downloading it again', async () => {
        const lib = library();
        const first = createRemotePdf(clientSource);
        await first.render(canvas(), mappedPage);
        first.destroy();
        const second = createRemotePdf(clientSource);
        await second.render(canvas(), { ...mappedPage, number: 3 });
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(lib.getDocument).toHaveBeenCalledTimes(1);
        // The buffer goes to pdf.js as is: no extra copy of a large PDF.
        expect(lib.getDocument.mock.calls[0][0].data.length).toBe(large.length);
        expect(lib.destroy).not.toHaveBeenCalled();
        second.destroy();
    });

    it('lets readers that join a running download see its progress', async () => {
        library();
        const one = vi.fn();
        const two = vi.fn();
        const a = createRemotePdf(clientSource, { onProgress: one });
        const b = createRemotePdf(clientSource, { onProgress: two });
        await Promise.all([a.render(canvas(), mappedPage), b.render(canvas(), mappedPage)]);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(two.mock.calls.map(([state]) => state.phase)).toContain('ready');
        a.destroy(); b.destroy();
    });

    it('refuses a changed large edition before pdf.js sees it', async () => {
        const lib = library();
        const changed = large.slice();
        changed[changed.length - 1] = 1;
        fetch.mockImplementation(async () => upstream(changed));
        const reader = createRemotePdf(clientSource);
        await expect(reader.render(canvas(), mappedPage)).rejects.toMatchObject({ code: 'source-version-changed' });
        expect(lib.getDocument).not.toHaveBeenCalled();
        reader.destroy();
    });

    it('rejects a stream that breaks before the declared length', async () => {
        library();
        fetch.mockImplementation(async () => new Response(new ReadableStream({
            start(controller) { controller.enqueue(large.subarray(0, 65536)); controller.error(new Error('stream reset')); },
        }), { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(large.length) } }));
        const reader = createRemotePdf(clientSource);
        await expect(reader.render(canvas(), mappedPage)).rejects.toMatchObject({ code: 'source-unavailable' });
        reader.destroy();
    });
});
