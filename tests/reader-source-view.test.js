import { beforeEach, describe, expect, it, vi } from 'vitest';

const getReaderSource = vi.hoisted(() => vi.fn());
vi.mock('../src/lib/reader-source.js', () => ({ getReaderSource }));
import { mountReaderSource } from '../src/scripts/reader-source-view.js';

const article = { id: '104581e9-3698-5eb4-b585-89ffe7589535', texto: 'Artículo 2. Texto de cotejo.', url_original: 'https://www.dof.gob.mx/documento' };
const pages = [{ number: 1, width: 816, height: 1056, imageUrl: '/reader-sources/lcne/page-1.png' }, { number: 2, width: 816, height: 1056, imageUrl: '/reader-sources/lcne/page-2.png' }];
const mapped = (index = 0) => ({ status: 'mapped', contentVerified: true, pageIndex: index, page: pages[index], pages, source: { title: 'Ley de la Comisión Nacional de Energía' }, originalUrl: article.url_original, pdfUrl: `/reader-sources/lcne/original.pdf#page=${index + 1}`, highlights: [{ x: 10, y: 20, width: 80, height: 15 }] });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Reader source view', () => {
    let container;
    beforeEach(() => {
        getReaderSource.mockReset();
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
        expect(container.querySelector('.rs-page-scope').textContent).toBe('Páginas de este fragmento');
        expect(container.querySelector('select').selectedOptions[0].textContent).toBe('1 de 2 · Página 1 del PDF');
        container.querySelector('[aria-label="Página vinculada siguiente"]').click();
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
        expect(container.querySelector('[aria-label="Página vinculada siguiente"]')).toBeNull();
        expect(container.querySelector('[aria-label="Ampliar página original"]')).not.toBeNull();
    });

    it('does not render a stale asynchronous result after switching articles', async () => {
        let resolveFirst;
        getReaderSource.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; })).mockResolvedValueOnce({ status: 'unmapped', originalUrl: 'https://www.dof.gob.mx/nuevo' });
        const first = mountReaderSource(container, article);
        const pending = first.open();
        const second = mountReaderSource(container, { ...article, id: 'another' });
        await second.open();
        resolveFirst(mapped()); await pending;
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('a').href).toBe('https://www.dof.gob.mx/nuevo');
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
        expect(container.textContent).toMatch(/cambió desde el último cotejo/);
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
        expect(container.querySelector('button').textContent).toBe('Volver a intentar');
        container.querySelector('button').click(); await tick();
        expect(container.querySelector('img')).not.toBeNull();
    });

    it('does not show a mapped page without confirmation that its text was verified', async () => {
        getReaderSource.mockResolvedValue({ ...mapped(), contentVerified: false });
        await mountReaderSource(container, article).open();
        expect(container.querySelector('img')).toBeNull();
        expect(container.textContent).toMatch(/No se pudo comprobar/);
        expect(container.querySelector('a').href).toBe(article.url_original);
    });

    it('retains keyboard focus on a usable control after page navigation', async () => {
        await mountReaderSource(container, article).open();
        const next = container.querySelector('[aria-label="Página vinculada siguiente"]');
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
});
