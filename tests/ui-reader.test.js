import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { getArticleById, getArticlesByLaw, getThemesByLawName } from '../src/scripts/search-engine.js';
import { mountReaderSource } from '../src/scripts/reader-source-view.js';
import { getReaderSource } from '../src/lib/reader-source.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
    performSearch: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
    getSearchCountsByLaw: vi.fn(), getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/analisis.js', () => ({ renderAnalisisView: vi.fn() }));
vi.mock('../src/scripts/law-presentation.js', () => ({
    openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn(),
}));
vi.mock('../src/scripts/reader-source-view.js', () => ({ mountReaderSource: vi.fn() }));
vi.mock('../src/lib/reader-source.js', () => ({ getReaderSource: vi.fn() }));

afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.classList.remove('reader-modal-open');
    localStorage.removeItem('sener-reader-preferences-v1');
});

function changeSelect(selector, value) {
    const select = document.querySelector(selector);
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
}

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

it('reads a real structured instrument, shares preferences, switches source lazily and cancels obsolete opens', async () => {
    vi.useFakeTimers();
    const { ley, articulos } = JSON.parse(readFileSync('revision-acervo/incorporacion-autoconsumo-2026-09-18/FORMATO-AUTOCONSUMO-carga.json', 'utf8'));
    const articles = articulos.map(row => ({ ...row, texto: row.contenido, articulo_label: row.identificador, ley_origen: ley.titulo }));
    const tableArticle = articles[3];
    const nextArticle = articles[4];
    const byId = id => Promise.resolve(articles.find(article => article.id === id) || null);
    getArticlesByLaw.mockResolvedValue(articles);
    getThemesByLawName.mockResolvedValue([]);
    getArticleById.mockImplementation(byId);
    const sources = [];
    mountReaderSource.mockImplementation((container, article) => {
        container.textContent = `Original pendiente: ${article.articulo_label}`;
        const source = {
            articleId: article.id,
            open: vi.fn(() => { container.textContent = `Original visible: ${article.articulo_label}`; }),
            destroy: vi.fn(() => container.replaceChildren()),
        };
        sources.push(source);
        return source;
    });
    document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
    localStorage.removeItem('sener-reader-preferences-v1');
    localStorage.setItem('app-dark-mode', 'false');
    history.replaceState(null, '', `/#ley-${ley.id}`);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { initUI } = await import('../src/scripts/ui.js');
    initUI(); // This complete journey deliberately uses one UI instance/listener set.
    window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries: [{ ...ley, articulos: articles.length }], relaciones: [] } }));
    await vi.advanceTimersByTimeAsync(75);

    const law = document.getElementById('law-detail-container');
    expect(law.classList.contains('hidden')).toBe(false);
    expect(law.querySelectorAll('#law-articles-list .result-item')).toHaveLength(6);
    const increase = law.querySelector('[data-reader-size="2"]');
    increase.click(); increase.click(); increase.click();
    changeSelect('#law-detail-container [data-reader-spacing]', '2');
    changeSelect('#law-detail-container [data-reader-surface]', 'sepia');
    expect(JSON.parse(localStorage.getItem('sener-reader-preferences-v1'))).toEqual({ fontSize: 24, lineHeight: 2, surface: 'sepia' });
    expect(document.documentElement.style.fontSize).toBe('');

    const openTable = () => document.querySelector(`#law-articles-list [data-id="${tableArticle.id}"]`).click();
    openTable();
    await vi.advanceTimersByTimeAsync(25);
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    const original = document.getElementById('reader-original');
    const mode = name => document.querySelector(`[data-reader-mode="${name}"]`).click();
    expect(modal.classList.contains('hidden')).toBe(false);
    expect(document.body.classList.contains('reader-modal-open')).toBe(true);
    expect(modal.querySelector('[data-reader-size-output]').textContent).toBe('24 px');
    expect(modal.querySelector('[data-reader-spacing]').value).toBe('2');
    expect(modal.querySelector('[data-reader-surface]').value).toBe('sepia');
    // The complete, audited form keeps its tables/cells instead of flattening to prose.
    expect(content.querySelectorAll('.reader-text table')).toHaveLength(12);
    expect(content.querySelectorAll('.reader-text td, .reader-text th')).toHaveLength(205);
    expect(content.querySelector('p table')).toBeNull();
    expect(sources).toHaveLength(1);
    expect(sources[0].articleId).toBe(tableArticle.id);
    expect(sources[0].open).not.toHaveBeenCalled();
    expect(getReaderSource).not.toHaveBeenCalled();

    content.scrollTop = 315;
    mode('original');
    expect(sources[0].open).toHaveBeenCalledTimes(1);
    expect(content.classList.contains('hidden')).toBe(true);
    expect(original.classList.contains('hidden')).toBe(false);
    original.scrollTop = 72;
    mode('text');
    expect(content.classList.contains('hidden')).toBe(false);
    expect(content.scrollTop).toBe(315);
    expect(original.scrollTop).toBe(72);
    expect(sources).toHaveLength(1);
    expect(sources[0].destroy).not.toHaveBeenCalled();

    mode('split');
    expect(document.getElementById('reader-body').dataset.mode).toBe('split');
    expect(content.classList.contains('hidden') || original.classList.contains('hidden')).toBe(false);
    document.getElementById('modal-next-btn').click();
    await vi.advanceTimersByTimeAsync(25);
    expect(document.getElementById('modal-title').textContent).toBe(nextArticle.articulo_label);
    expect(location.hash).toBe(`#art-${nextArticle.id}`);
    expect(sources[0].destroy).toHaveBeenCalledTimes(1);
    expect(sources[1].articleId).toBe(nextArticle.id);
    expect(sources[1].open).toHaveBeenCalledTimes(1);
    expect(content.scrollTop).toBe(0);
    expect(document.documentElement.style.getPropertyValue('--reader-font-size')).toBe('24px');

    document.getElementById('close-modal').click();
    await vi.advanceTimersByTimeAsync(310);
    expect(modal.classList.contains('hidden')).toBe(true);
    expect(document.body.classList.contains('reader-modal-open')).toBe(false);
    expect(sources[1].destroy).toHaveBeenCalledTimes(1);

    // Browser Back to the instrument disposes the active source and releases scrolling.
    openTable();
    await vi.advanceTimersByTimeAsync(25);
    const beforeBack = sources.at(-1);
    history.replaceState(null, '', `/#ley-${ley.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await vi.advanceTimersByTimeAsync(75);
    expect(modal.classList.contains('hidden')).toBe(true);
    expect(document.body.classList.contains('reader-modal-open')).toBe(false);
    expect(beforeBack.destroy).toHaveBeenCalledTimes(1);
    expect(law.querySelector('[data-reader-size-output]').textContent).toBe('24 px');

    // A card fetch completed after close must not reopen the dialog or mount its source.
    const slowCard = deferred();
    getArticleById.mockImplementation(id => id === tableArticle.id ? slowCard.promise : byId(id));
    const mountsBeforeClose = sources.length;
    openTable();
    document.getElementById('close-modal').click();
    await vi.advanceTimersByTimeAsync(310);
    slowCard.resolve(tableArticle);
    await vi.advanceTimersByTimeAsync(25);
    expect(modal.classList.contains('hidden')).toBe(true);
    expect(document.body.classList.contains('reader-modal-open')).toBe(false);
    expect(sources).toHaveLength(mountsBeforeClose);

    // A delayed deep-link lookup is also obsolete once the browser has returned home.
    const slowRoute = deferred();
    getArticleById.mockImplementationOnce(() => slowRoute.promise).mockImplementation(byId);
    history.replaceState(null, '', `/#art-${tableArticle.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    history.replaceState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await vi.advanceTimersByTimeAsync(25);
    const mountsBeforeRouteResolve = sources.length;
    slowRoute.resolve(tableArticle);
    await vi.advanceTimersByTimeAsync(25);
    expect.soft(modal.classList.contains('hidden'), 'a stale route must not reopen an article after Back').toBe(true);
    expect.soft(document.body.classList.contains('reader-modal-open'), 'Back must keep body scrolling released').toBe(false);
    expect.soft(sources.length, 'a stale route must not mount a new original source').toBe(mountsBeforeRouteResolve);

    document.getElementById('close-modal').click();
    await vi.advanceTimersByTimeAsync(310);
    getArticleById.mockImplementation(byId);
    openTable();
    await vi.advanceTimersByTimeAsync(25);
    const slowRelatedArticles = deferred();
    getArticleById.mockImplementationOnce(() => slowRelatedArticles.promise).mockImplementation(byId);
    const explorerRoute = '#explorar?tema=planeacion-vinculante&entidad=pladese';
    history.replaceState(null, '', `/${explorerRoute}`);
    document.dispatchEvent(new CustomEvent('analisis:openArticle', { detail: { id: nextArticle.id, list: [nextArticle.id] } }));
    document.getElementById('close-modal').click();
    await vi.advanceTimersByTimeAsync(310);
    const mountsBeforeRelatedResolve = sources.length;
    slowRelatedArticles.resolve(nextArticle);
    await vi.advanceTimersByTimeAsync(25);
    expect.soft(modal.classList.contains('hidden'), 'a delayed related-article list must respect a subsequent close').toBe(true);
    expect.soft(document.body.classList.contains('reader-modal-open'), 'a cancelled related-article open must not lock scrolling').toBe(false);
    expect.soft(sources.length, 'a cancelled related-article open must not mount a source').toBe(mountsBeforeRelatedResolve);
    expect(location.hash).toBe(explorerRoute);

    // Shared links must load the instrument's neighbors, not strand the reader at 1/1.
    history.replaceState(null, '', `/#art-${tableArticle.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await vi.advanceTimersByTimeAsync(75);
    expect(getArticlesByLaw).toHaveBeenLastCalledWith(ley.titulo);
    const next = document.getElementById('modal-next-btn');
    expect(next.disabled).toBe(false);
    expect(next.getAttribute('aria-label')).toBe(`Siguiente: ${nextArticle.articulo_label}`);
    expect(document.getElementById('modal-nav-controls').nextElementSibling.classList.contains('reader-toolbar')).toBe(true);
    expect(document.getElementById('modal-nav-counter').textContent).toMatch(/de 6$/);
    next.click();
    await vi.advanceTimersByTimeAsync(25);
    expect(document.getElementById('modal-title').textContent).toBe(nextArticle.articulo_label);
    expect(sources.at(-1).articleId).toBe(nextArticle.id);
});
