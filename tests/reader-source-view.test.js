import { beforeEach, describe, expect, it, vi } from 'vitest';

const getReaderSource = vi.hoisted(() => vi.fn());
const remote = vi.hoisted(() => ({ render: vi.fn(), cancelRender: vi.fn(), destroy: vi.fn() }));
vi.mock('../src/lib/reader-source.js', () => ({ getReaderSource }));
vi.mock('../src/lib/reader-pdf.js', () => ({ LARGE_PDF_BYTES: 15 * 1024 * 1024, createRemotePdf: (_source, options) => { remote.options = options; return remote; } }));
import { mountReaderSource } from '../src/scripts/reader-source-view.js';

const article = { id: '104581e9-3698-5eb4-b585-89ffe7589535', texto: 'Artículo 2. Texto de cotejo.', url_original: 'https://dof.gob.mx/documento' };
const pages = [{ number: 1, width: 816, height: 1056, imageUrl: '/reader-sources/lcne/page-1.png' }, { number: 2, width: 816, height: 1056, imageUrl: '/reader-sources/lcne/page-2.png' }];
const mapped = (index = 0) => ({ status: 'mapped', contentVerified: true, pageIndex: index, page: pages[index], pages, source: { title: 'Ley de la Comisión Nacional de Energía' }, originalUrl: article.url_original, pdfUrl: `/reader-sources/lcne/original.pdf#page=${index + 1}`, highlights: [{ x: 10, y: 20, width: 80, height: 15 }] });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Reader source view', () => {
    let container;
    beforeEach(() => {
        getReaderSource.mockReset();
        remote.render.mockReset().mockResolvedValue(undefined);
        remote.cancelRender.mockClear(); remote.destroy.mockClear();
        document.body.innerHTML = '<div id="reader-original"></div>';
        container = document.getElementById('reader-original');
        getReaderSource.mockImplementation(async (_id, options) => mapped(options.pageIndex));
    });

    it('does not fetch or request page images until the original is opened', async () => {
        const view = mountReaderSource(container, article);
        expect(getReaderSource).not.toHaveBeenCalled();
        expect(container.querySelector('img')).toBeNull();
        await view.open();
        expect(getReaderSource).toHaveBeenCalledWith(article.id, { articleText: article.texto, originalUrl: article.url_original, pageIndex: 0 });
        expect(container.querySelector('img').getAttribute('src')).toBe(pages[0].imageUrl);
    });

    it('renders verified remote pages as canvas and keeps highlighting hidden until rendering completes', async () => {
        let finish;
        remote.render.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
        getReaderSource.mockResolvedValue({ ...mapped(), source: { transport: 'remote-pdf' } });
        const view = mountReaderSource(container, article);
        const pending = view.open(); await tick();
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('canvas')).not.toBeNull();
        expect(container.querySelector('.rs-page').style.visibility).toBe('hidden');
        finish(); await pending;
        expect(container.querySelector('.rs-page').style.visibility).toBe('');
        expect(container.querySelector('.rs-status').textContent).toContain('cargada');
        view.destroy();
        expect(remote.destroy).toHaveBeenCalledTimes(1);
    });

    it('explains an official edition change without leaving false highlights visible', async () => {
        remote.render.mockRejectedValue(Object.assign(new Error(), { code: 'source-version-changed' }));
        getReaderSource.mockResolvedValue({ ...mapped(), source: { transport: 'remote-pdf' } });
        await mountReaderSource(container, article).open();
        expect(container.textContent).toContain('otra versión del PDF');
        expect(container.querySelector('.rs-highlight')).toBeNull();
        expect(container.querySelector('a').href).toBe(article.url_original);
    });

    it('recreates a failed remote reader when the user retries', async () => {
        remote.render.mockRejectedValueOnce(new Error('temporary network failure'));
        getReaderSource.mockResolvedValue({ ...mapped(), source: { transport: 'remote-pdf' } });
        await mountReaderSource(container, article).open();
        expect(remote.destroy).toHaveBeenCalledTimes(1);
        [...container.querySelectorAll('button')].find(button => button.textContent === 'Reintentar').click();
        await tick();
        expect(remote.render).toHaveBeenCalledTimes(2);
        expect(container.querySelector('canvas')).not.toBeNull();
        expect(container.querySelector('.rs-status').textContent).toContain('cargada');
    });

    it('renders percentage highlights and links to the actual PDF page', async () => {
        await mountReaderSource(container, article).open();
        const highlight = container.querySelector('.rs-highlight');
        expect(highlight.style.left).toBe('10%');
        expect(highlight.style.top).toBe('20%');
        expect(highlight.style.width).toBe('80%');
        expect(highlight.getAttribute('aria-hidden')).toBe('true');
        expect(container.querySelector('.rs-source-link').getAttribute('href')).toBe('/reader-sources/lcne/original.pdf#page=1');
        expect(container.querySelector('iframe')).toBeNull();
    });

    it('navigates the linked pages and preserves page, zoom and scroll when reopened', async () => {
        const view = mountReaderSource(container, article);
        await view.open();
        expect(container.querySelector('.rs-page-scope').textContent).toBe('Páginas de esta disposición');
        expect(container.querySelector('select').selectedOptions[0].textContent).toBe('1 de 2 · Página 1 del PDF');
        container.querySelector('[aria-label="Página siguiente"]').click();
        await tick();
        expect(container.querySelector('img').getAttribute('src')).toBe(pages[1].imageUrl);
        expect(getReaderSource).toHaveBeenLastCalledWith(article.id, expect.objectContaining({ pageIndex: 1 }));
        container.querySelector('[aria-label="Ampliar página original"]').click();
        expect(container.querySelector('.rs-page').style.width).toBe('125%');
        const viewport = container.querySelector('.rs-viewport'); viewport.scrollTop = 90;
        await view.open();
        expect(getReaderSource).toHaveBeenCalledTimes(2);
        expect(container.querySelector('.rs-viewport')).toBe(viewport);
        expect(viewport.scrollTop).toBe(90);
        expect(container.querySelector('.rs-page').style.width).toBe('125%');
    });

    it('shows a single-page indication without navigation that cannot be used', async () => {
        getReaderSource.mockResolvedValue({ ...mapped(), pages: [pages[0]] });
        await mountReaderSource(container, { ...article, tipo_articulo: 'ordinario' }).open();
        expect(container.querySelector('.rs-page-scope').textContent).toBe('Páginas de este artículo');
        expect(container.querySelector('.rs-single-page').textContent).toBe('Página única · 1 del PDF');
        expect(container.querySelector('select')).toBeNull();
        expect(container.querySelector('[aria-label="Página siguiente"]')).toBeNull();
        expect(container.querySelector('[aria-label="Ampliar página original"]')).not.toBeNull();
    });

    it('names the pages of a ruling apartado as such, keeping the same page navigation', async () => {
        await mountReaderSource(container, { ...article, tipo_articulo: 'apartado', articulo_label: 'VII. EFECTOS' }).open();
        expect(container.querySelector('.rs-page-scope').textContent).toBe('Páginas de este apartado');
        expect(container.querySelector('[aria-label="Página siguiente"]')).not.toBeNull();
    });

    it('does not render a stale asynchronous result after switching articles', async () => {
        let resolveFirst;
        getReaderSource.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; })).mockResolvedValueOnce({ status: 'unmapped', originalUrl: 'https://dof.gob.mx/nuevo' });
        const first = mountReaderSource(container, article);
        const pending = first.open();
        const second = mountReaderSource(container, { ...article, id: 'another' });
        await second.open();
        resolveFirst(mapped()); await pending;
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('a').href).toBe('https://dof.gob.mx/nuevo');
        first.destroy();
        expect(container.querySelector('a')).not.toBeNull();
    });

    it('does not replace the newer page when page requests finish out of order', async () => {
        const view = mountReaderSource(container, article); await view.open();
        const pending = [];
        getReaderSource.mockImplementation((_id, options) => new Promise(resolve => pending.push({ options, resolve })));
        const select = container.querySelector('select');
        select.value = '1'; select.dispatchEvent(new Event('change'));
        select.value = '0'; select.dispatchEvent(new Event('change'));
        pending[1].resolve(mapped(0)); await tick();
        pending[0].resolve(mapped(1)); await tick();
        expect(container.querySelector('img').getAttribute('src')).toBe(pages[0].imageUrl);
    });

    it('falls back to the official source when text fingerprint no longer matches', async () => {
        getReaderSource.mockResolvedValue({ status: 'unmapped', reason: 'content-mismatch', originalUrl: article.url_original });
        await mountReaderSource(container, article).open();
        expect(container.textContent).toMatch(/cambió desde la última vez/);
        expect(container.querySelector('a').href).toBe(article.url_original);
        expect(container.querySelector('img')).toBeNull();
    });

    it('retains a useful fallback and offers retry after a manifest error', async () => {
        getReaderSource.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(mapped());
        await mountReaderSource(container, article).open();
        expect(container.textContent).toMatch(/No se pudo cargar/);
        expect(container.querySelector('a').href).toBe(article.url_original);
        container.querySelector('button').click(); await tick();
        expect(container.querySelector('img')).not.toBeNull();
    });

    it('offers a retry when the source resolver reports its manifest is unavailable', async () => {
        getReaderSource.mockResolvedValueOnce({ status: 'unmapped', reason: 'source-unavailable', originalUrl: article.url_original }).mockResolvedValueOnce(mapped());
        await mountReaderSource(container, article).open();
        expect(container.querySelector('button').textContent).toBe('Reintentar');
        container.querySelector('button').click(); await tick();
        expect(container.querySelector('img')).not.toBeNull();
    });

    it('does not show a mapped page without confirmation that its text was verified', async () => {
        getReaderSource.mockResolvedValue({ ...mapped(), contentVerified: false });
        await mountReaderSource(container, article).open();
        expect(container.querySelector('img')).toBeNull();
        expect(container.textContent).toMatch(/No pudimos confirmar/);
        expect(container.querySelector('a').href).toBe(article.url_original);
    });

    it('retains keyboard focus on a usable control after page navigation', async () => {
        await mountReaderSource(container, article).open();
        const next = container.querySelector('[aria-label="Página siguiente"]');
        next.focus(); next.click(); await tick();
        expect(document.activeElement).toBe(container.querySelector('select'));
        expect(document.activeElement.value).toBe('1');
    });

    it('keeps the PDF link when the source image fails', async () => {
        await mountReaderSource(container, article).open();
        container.querySelector('img').dispatchEvent(new Event('error'));
        expect(container.textContent).toMatch(/imagen de esta página no pudo cargarse/);
        expect(container.querySelector('a').getAttribute('href')).toContain('original.pdf#page=1');
        expect(container.querySelector('.rs-image-error button')).not.toBeNull();
    });

    it('does not render unsafe fallback links and discards invalid highlight coordinates', async () => {
        getReaderSource.mockResolvedValueOnce({ status: 'unmapped', originalUrl: 'javascript:alert(1)' });
        const view = mountReaderSource(container, { ...article, url_original: 'javascript:alert(1)' });
        await view.open(); expect(container.querySelector('a')).toBeNull();
        view.destroy();
        getReaderSource.mockResolvedValueOnce({ ...mapped(), highlights: [{ x: -1, y: 3, width: 2, height: 3 }, { x: 1, y: 1, width: 8000, height: 1 }] });
        await mountReaderSource(container, article).open();
        expect(container.querySelector('.rs-highlight')).toBeNull();
    });

    it('shows the official PDF loading at once, with real progress and the long-PDF notice', async () => {
        let finish;
        remote.render.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
        getReaderSource.mockResolvedValue({ ...mapped(), source: { transport: 'remote-pdf' } });
        const view = mountReaderSource(container, article);
        const pending = view.open(); await tick();
        const loading = container.querySelector('.rs-loading');
        expect(loading.textContent).toContain('Cargando PDF oficial…');
        expect(container.querySelector('.rs-status').textContent).toBe('Cargando PDF oficial…');
        expect(loading.querySelector('.rs-loading-note').hidden).toBe(true);
        // Before the size is known there is no percentage.
        expect(loading.querySelector('[role="progressbar"]').hidden).toBe(true);
        remote.options.onProgress({ phase: 'downloading', loaded: 10 * 1048576, total: 57757775 });
        expect(loading.querySelector('.rs-loading-note').hidden).toBe(false);
        expect(loading.querySelector('.rs-loading-note').textContent).toBe('Este PDF es extenso y puede tardar en cargar. Por favor, espera.');
        const bar = loading.querySelector('[role="progressbar"]');
        expect(bar.hidden).toBe(false);
        expect(bar.getAttribute('aria-valuenow')).toBe('18');
        expect(loading.querySelector('.rs-progress-text').textContent).toBe('10.0 de 55.1 MB · 18 %');
        expect(container.querySelector('.rs-status').textContent).toContain('Este PDF es extenso');
        remote.options.onProgress({ phase: 'verifying', loaded: 57757775, total: 57757775 });
        expect(loading.querySelector('.rs-loading-title').textContent).toContain('Verificando');
        finish(); await pending;
        expect(container.querySelector('.rs-loading')).toBeNull();
        expect(container.querySelector('.rs-status').textContent).toContain('cargada');
        view.destroy();
    });

    it('reports bytes without a percentage when the size is unknown', async () => {
        remote.render.mockImplementationOnce(() => new Promise(() => {}));
        getReaderSource.mockResolvedValue({ ...mapped(), source: { transport: 'remote-pdf' } });
        const view = mountReaderSource(container, article);
        view.open(); await tick();
        remote.options.onProgress({ phase: 'downloading', loaded: 3 * 1048576, total: null });
        expect(container.querySelector('[role="progressbar"]').hidden).toBe(true);
        expect(container.querySelector('.rs-progress-text').textContent).toBe('3.0 MB descargados');
        view.destroy();
    });

    it('offers Reintentar and Abrir PDF oficial when the PDF fails, and explains a timeout', async () => {
        remote.render.mockRejectedValueOnce(Object.assign(new Error(), { code: 'source-timeout' }));
        getReaderSource.mockResolvedValue({ ...mapped(), source: { transport: 'remote-pdf' } });
        await mountReaderSource(container, article).open();
        expect(container.querySelector('.rs-loading')).toBeNull();
        expect(container.textContent).toContain('tardó demasiado');
        expect([...container.querySelectorAll('button')].map(button => button.textContent)).toContain('Reintentar');
        const link = [...container.querySelectorAll('a')].find(a => a.textContent.startsWith('Abrir PDF oficial'));
        expect(link.href).toBe(article.url_original);
    });

    it('lets the reader switch to the text while the PDF loads', async () => {
        remote.render.mockImplementationOnce(() => new Promise(() => {}));
        getReaderSource.mockResolvedValue({ ...mapped(), source: { transport: 'remote-pdf' } });
        const view = mountReaderSource(container, article);
        view.open(); await tick();
        const asked = vi.fn();
        container.addEventListener('reader-source:show-text', asked);
        container.querySelector('.rs-read-text').click();
        expect(asked).toHaveBeenCalledTimes(1);
        view.destroy();
    });

    it('ignores progress from a reader that belongs to a previous article', async () => {
        remote.render.mockImplementation(() => new Promise(() => {}));
        getReaderSource.mockResolvedValue({ ...mapped(), source: { transport: 'remote-pdf' } });
        const first = mountReaderSource(container, article);
        first.open(); await tick();
        const stale = remote.options.onProgress;
        const second = mountReaderSource(container, { ...article, id: 'otro' });
        second.open(); await tick();
        stale({ phase: 'downloading', loaded: 5 * 1048576, total: 10 * 1048576 });
        expect(container.querySelector('.rs-progress-text').hidden).toBe(true);
        second.destroy();
    });
});
