// @vitest-environment node
import { createHash, webcrypto } from 'node:crypto';
import { afterEach, it, expect, vi } from 'vitest';
import { serveReaderPdf, MAX_PDF_BYTES } from '../server/reader-pdf.js';

const bytes = new TextEncoder().encode('%PDF-1.7\nreviewed source');
const source = { transport: 'remote-pdf', originalUrl: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LCNE.pdf',
    sha256: createHash('sha256').update(bytes).digest('hex') };
const request = (path = 'lcne', method = 'GET') => new Request(`https://app.test/api/reader/${path}`, { method });
const upstream = (body = bytes, headers = {}) => new Response(body, { headers: { 'Content-Type': 'application/pdf', ...headers } });
afterEach(() => vi.unstubAllGlobals());

it('returns only the reviewed bytes, disables storage, and does not forward request headers', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const fetcher = vi.fn().mockResolvedValue(upstream());
    const response = await serveReaderPdf(request(), 'lcne', { sources: { lcne: source }, fetcher });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(fetcher.mock.calls[0]).toEqual([source.originalUrl, expect.objectContaining({ redirect: 'error', headers: { Accept: 'application/pdf' } })]);
});

it('rejects unknown sources, query overrides, unsupported methods and unapproved hosts without a fetch', async () => {
    const fetcher = vi.fn();
    for (const id of ['unknown', '__proto__', 'https://outside.test/a.pdf']) {
        expect((await serveReaderPdf(request(), id, { fetcher, sources: { lcne: source } })).status).toBe(404);
    }
    expect((await serveReaderPdf(request('lcne?url=https://outside.test'), 'lcne', { fetcher })).status).toBe(400);
    expect((await serveReaderPdf(request('lcne', 'POST'), 'lcne', { fetcher })).status).toBe(405);
    expect((await serveReaderPdf(request(), 'lcne', { fetcher, sources: { lcne: { ...source, originalUrl: 'https://outside.test/file.pdf' } } })).status).toBe(404);
    expect(fetcher).not.toHaveBeenCalled();
});

it('rejects changed editions, non-PDF responses, redirects and oversized streams', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const options = fetcher => ({ sources: { lcne: source }, fetcher });
    const changed = await serveReaderPdf(request(), 'lcne', options(async () => upstream('%PDF-1.7 changed')));
    expect(changed.status).toBe(409);
    expect(await changed.json()).toEqual({ code: 'source-version-changed' });
    expect((await serveReaderPdf(request(), 'lcne', options(async () => upstream('<html>', { 'Content-Type': 'text/html' })))).status).toBe(502);
    expect((await serveReaderPdf(request(), 'lcne', options(async () => { throw new Error('redirect'); }))).status).toBe(502);
    expect((await serveReaderPdf(request(), 'lcne', options(async () => upstream(bytes, { 'Content-Length': String(MAX_PDF_BYTES + 1) })))).status).toBe(502);
    const large = await serveReaderPdf(request(), 'lcne', options(async () => upstream(new Uint8Array(MAX_PDF_BYTES + 1))));
    expect(await large.json()).toEqual({ code: 'source-too-large' });
});
