import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { getArticleById, getArticlesByLaw, getThemesByLawName } from '../src/scripts/search-engine.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
    searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
    getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/analisis.js', () => ({ renderAnalisisView: vi.fn() }));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));
vi.mock('../src/scripts/reader-source-view.js', () => ({ mountReaderSource: vi.fn() }));
vi.mock('../src/lib/reader-source.js', () => ({ getReaderSource: vi.fn() }));

afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.classList.remove('reader-modal-open');
});

it('closing an article returns the address to the document behind it', async () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const article = { id: 'art-1', ley_id: 'ley-a', ley_origen: 'Ley A', articulo_label: 'Artículo 1', tipo_articulo: 'ordinario', texto: 'Contenido.' };
    getArticlesByLaw.mockResolvedValue([article, { ...article, id: 'art-2', articulo_label: 'Artículo 2' }]);
    getArticleById.mockImplementation(async id => ({ ...article, id }));
    getThemesByLawName.mockResolvedValue([]);
    document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
    const settle = () => vi.advanceTimersByTimeAsync(400);

    history.replaceState(null, '', '/#ley-ley-a');
    const { initUI } = await import('../src/scripts/ui.js');
    initUI();
    window.dispatchEvent(new CustomEvent('search-ready', {
        detail: { summaries: [{ id: 'ley-a', titulo: 'Ley A', siglas: 'LA', tipo: 'ley', fecha_publicacion: '2025-03-18', articulos: 2, temas_clave: [], url_original: null }], relaciones: [] },
    }));
    await settle();

    const open = async () => {
        document.querySelector('#law-articles-list .result-item').click();
        await settle();
        expect(location.hash).toBe('#art-art-1');
    };
    const close = async () => {
        document.getElementById('close-modal').click();
        await settle();
    };

    await open();
    await close();
    expect(location.hash).toBe('#ley-ley-a');

    // Back to the article with the browser, then closed again: still the same document.
    history.replaceState(null, '', '/#art-art-1');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle();
    await close();
    expect(location.hash).toBe('#ley-ley-a');
});
