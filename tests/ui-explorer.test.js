import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { renderAnalisisView } from '../src/scripts/analisis.js';
import { getArticleById, getArticlesByLaw } from '../src/scripts/search-engine.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
    performSearch: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
    getSearchCountsByLaw: vi.fn(), getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/analisis.js', () => ({ renderAnalisisView: vi.fn() }));
vi.mock('../src/scripts/law-presentation.js', () => ({
    openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn(),
}));

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it('restores explorer routes and article return context without adding history while handling popstate', async () => {
    vi.useFakeTimers();
    document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
    const initialRoute = '#explorar?tema=planeacion-vinculante&entidad=pladese';
    history.replaceState(null, '', `/${initialRoute}`);
    const push = vi.spyOn(history, 'pushState');
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const article = { id: 'article-uuid', texto: 'Texto de la disposición.', articulo_label: 'Artículo 8', ley_origen: 'Ley de prueba' };
    getArticleById.mockResolvedValue(article);
    getArticlesByLaw.mockResolvedValue([article]);
    renderAnalisisView.mockImplementation(async (container) => {
        container.innerHTML = '<h2 id="explorer-entity-title" tabindex="-1">Entidad</h2><button id="explorer-open-article" data-open-article="article-uuid">Leer fundamento</button>';
        container.querySelector('button').onclick = () => document.dispatchEvent(new CustomEvent('analisis:openArticle', {
            detail: { id: article.id, list: [article.id] },
        }));
    });
    const { initUI } = await import('../src/scripts/ui.js');
    localStorage.setItem('app-dark-mode', 'false');
    initUI();
    await vi.advanceTimersByTimeAsync(75);

    // One click must change the theme once; duplicate listeners used to undo it.
    document.getElementById('darkmode-toggle').click();
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
    document.getElementById('mobile-darkmode-toggle').click();
    expect(document.documentElement.classList.contains('dark-mode')).toBe(false);
    expect(localStorage.getItem('app-dark-mode')).toBe('false');

    const container = document.getElementById('analisis-container');
    expect(container.classList.contains('hidden')).toBe(false);
    expect(renderAnalisisView).toHaveBeenLastCalledWith(container, { topicId: 'planeacion-vinculante', entityId: 'pladese' });
    expect(push).not.toHaveBeenCalled();

    document.dispatchEvent(new CustomEvent('analisis:stateChange', {
        detail: { topicId: 'planeacion-vinculante', entityId: 'pladeshi' },
    }));
    const selectedRoute = '#explorar?tema=planeacion-vinculante&entidad=pladeshi';
    expect(location.hash).toBe(selectedRoute);
    expect(push).toHaveBeenCalledTimes(1);

    const trigger = document.getElementById('explorer-open-article');
    trigger.focus();
    trigger.click();
    await vi.advanceTimersByTimeAsync(25);
    expect(location.hash).toBe('#art-article-uuid');
    expect(document.getElementById('detail-modal').classList.contains('hidden')).toBe(false);
    document.getElementById('close-modal').focus();
    document.getElementById('close-modal').click();
    await vi.advanceTimersByTimeAsync(310);
    expect(location.hash).toBe(selectedRoute);
    expect(document.getElementById('detail-modal').classList.contains('hidden')).toBe(true);
    expect(document.activeElement).toBe(trigger);
    expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });

    // Browser Back restores the explorer and closes the modal without another push.
    trigger.click();
    await vi.advanceTimersByTimeAsync(25);
    history.replaceState(null, '', `/${selectedRoute}`);
    push.mockClear();
    window.dispatchEvent(new PopStateEvent('popstate'));
    await vi.advanceTimersByTimeAsync(75);
    expect(renderAnalisisView).toHaveBeenLastCalledWith(container, { topicId: 'planeacion-vinculante', entityId: 'pladeshi' });
    expect(document.getElementById('detail-modal').classList.contains('hidden')).toBe(true);
    expect(trigger.isConnected).toBe(false);
    expect(document.activeElement).toBe(document.getElementById('explorer-open-article'));
    expect(push).not.toHaveBeenCalled();

    // Forward to an article also rehydrates without generating a new entry.
    history.replaceState(null, '', '/#art-article-uuid');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await vi.advanceTimersByTimeAsync(25);
    expect(document.getElementById('detail-modal').classList.contains('hidden')).toBe(false);
    expect(push).not.toHaveBeenCalled();
    document.getElementById('close-modal').click();
    await vi.advanceTimersByTimeAsync(310);
    expect(location.hash).toBe(selectedRoute);
    push.mockClear();

    history.replaceState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await vi.advanceTimersByTimeAsync(75);
    expect(push).not.toHaveBeenCalled();
    expect(document.getElementById('detail-modal').classList.contains('hidden')).toBe(true);
    document.getElementById('nav-analisis').click();
    await vi.advanceTimersByTimeAsync(75);
    expect(location.hash).toBe('#explorar');
    expect(renderAnalisisView).toHaveBeenLastCalledWith(container, {});

    getArticleById.mockResolvedValue(null);
    const routeBeforeMissingArticle = location.hash;
    document.getElementById('explorer-open-article').click();
    await vi.advanceTimersByTimeAsync(25);
    expect(document.getElementById('app-toast').textContent).toContain('No se encontró este artículo en el acervo.');
    expect(location.hash).toBe(routeBeforeMissingArticle);
    expect(document.getElementById('detail-modal').classList.contains('hidden')).toBe(true);
});
