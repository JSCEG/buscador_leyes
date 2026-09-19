// @vitest-environment node
import { createHash, webcrypto } from 'node:crypto';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
let createRemotePdf;
const bytes = new TextEncoder().encode('%PDF-1.7 reviewed');
const source = { pdfUrl: '/api/reader/lcne', pageCount: 20, sha256: createHash('sha256').update(bytes).digest('hex') };
const mappedPage = { number: 2, width: 612, height: 792 };
const canvas = () => ({ getContext: () => ({}) });

beforeEach(async () => {
    vi.resetModules();
    ({ createRemotePdf } = await import('../src/lib/reader-pdf.js'));
    vi.stubGlobal('crypto', webcrypto);
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(bytes, { headers: { 'Content-Type': 'application/pdf' } })));
});
afterEach(() => vi.unstubAllGlobals());

function library({ pageCount = 20, width = 612, rendering = Promise.resolve() } = {}) {
    const render = vi.fn(() => ({ promise: rendering, cancel: vi.fn() }));
    const pdf = { numPages: pageCount, getPage: vi.fn(async () => ({
        getViewport: ({ scale }) => ({ width: width * scale, height: 792 * scale }), render,
    })) };
    const destroy = vi.fn(async () => {});
    const getDocument = vi.fn(() => ({ promise: Promise.resolve(pdf), destroy }));
    vi.stubGlobal('pdfjsLib', { getDocument });
    return { render, pdf, destroy, getDocument };
}

it('verifies bytes once, shares only temporary bytes across readers and releases each document', async () => {
    const lib = library();
    const reader = createRemotePdf(source);
    await reader.render(canvas(), mappedPage);
    await reader.render(canvas(), { ...mappedPage, number: 3 });
    reader.destroy();
    const second = createRemotePdf(source);
    await second.render(canvas(), mappedPage);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].cache).toBe('no-store');
    expect(lib.getDocument).toHaveBeenCalledTimes(2);
    expect(lib.getDocument.mock.calls[0][0].isEvalSupported).toBe(false);
    expect(lib.destroy).toHaveBeenCalledTimes(1);
    second.destroy();
});

it('never renders a changed PDF, incorrect page count or different page geometry', async () => {
    let lib = library({ pageCount: 19 });
    let reader = createRemotePdf(source);
    await expect(reader.render(canvas(), mappedPage)).rejects.toMatchObject({ code: 'source-version-changed' });
    reader.destroy();
    lib = library({ width: 700 });
    reader = createRemotePdf(source);
    await expect(reader.render(canvas(), mappedPage)).rejects.toMatchObject({ code: 'source-version-changed' });
    expect(lib.render).not.toHaveBeenCalled();
    reader.destroy();
    fetch.mockImplementation(async () => new Response('%PDF changed', { headers: { 'Content-Type': 'application/pdf' } }));
    reader = createRemotePdf({ ...source, pdfUrl: '/api/reader/other' });
    await expect(reader.render(canvas(), mappedPage)).rejects.toMatchObject({ code: 'source-version-changed' });
    reader.destroy();
});

it('does not create a PDF after the reader is closed during download and allows retries after failure', async () => {
    const lib = library();
    let complete;
    fetch.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    const reader = createRemotePdf(source);
    const pending = reader.render(canvas(), mappedPage);
    reader.destroy();
    complete(new Response(null, { status: 409 }));
    await expect(pending).rejects.toMatchObject({ code: 'source-version-changed' });
    expect(lib.getDocument).not.toHaveBeenCalled();
    const retry = createRemotePdf(source);
    await retry.render(canvas(), mappedPage);
    expect(fetch).toHaveBeenCalledTimes(2);
    retry.destroy();
});
