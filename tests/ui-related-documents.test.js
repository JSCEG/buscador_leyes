import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { getArticleById, getArticlesByLaw, getThemesByLawName } from '../src/scripts/search-engine.js';
import { relatedDocumentLabel } from '../src/lib/related-document.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
    performSearch: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
    getSearchCountsByLaw: vi.fn(), getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/analisis.js', () => ({ renderAnalisisView: vi.fn() }));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));
vi.mock('../src/scripts/reader-source-view.js', () => ({
    mountReaderSource: vi.fn(() => ({ open: vi.fn(), destroy: vi.fn() })),
}));

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.body.classList.remove('reader-modal-open'); });

it('keeps all 48 LCNE fragments and distinguishes reviewed complements through filtering and reader navigation', async () => {
    vi.useFakeTimers();
    const { ley, articulos } = JSON.parse(readFileSync('revision-acervo/incorporacion-7-2026-09-17/LCNE-carga.json', 'utf8'));
    const articles = articulos.map(row => ({ ...row, texto: row.contenido, articulo_label: row.identificador, ley_origen: ley.titulo }));
    expect(articles).toHaveLength(48);
    // A judgment mentioned by an article or an annex is not a complement.
    expect(relatedDocumentLabel({ tipo_articulo: 'ordinario', articulo_label: 'Sentencia de la SCJN', texto: 'sentencia' })).toBeNull();
    expect(relatedDocumentLabel({ tipo_articulo: 'anexo', articulo_label: 'Anexo 1' })).toBeNull();
    getArticlesByLaw.mockResolvedValue(articles);
    getThemesByLawName.mockResolvedValue([]);
    getArticleById.mockImplementation(id => Promise.resolve(articles.find(a => a.id === id)));
    document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
    history.replaceState(null, '', `/#ley-${ley.id}`);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { initUI } = await import('../src/scripts/ui.js');
    initUI();
    window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries: [{ ...ley, articulos: 48 }], relaciones: [] } }));
    await vi.advanceTimersByTimeAsync(75);
    document.getElementById('btn-load-more-law').click();
    const list = document.getElementById('law-articles-list');
    expect(list.querySelectorAll(':scope > .result-item')).toHaveLength(44);
    expect(list.querySelectorAll('.related-documents .result-item')).toHaveLength(4);
    expect(new Set([...list.querySelectorAll('.result-item')].map(el => el.dataset.id))).toEqual(new Set(articles.map(a => a.id)));
    expect(document.querySelectorAll('.related-documents-index .toc-art-btn')).toHaveLength(8); // Grid + list.

    const input = document.getElementById('law-search-input');
    const filter = value => { input.value = value; input.dispatchEvent(new Event('input')); };
    filter('Sentencia de la SCJN');
    const judgment = articles.find(a => a.articulo_label.startsWith('Sentencia de la SCJN'));
    list.querySelector(`.result-item[data-id="${judgment.id}"]`).click();
    await vi.advanceTimersByTimeAsync(25);
    const notice = document.getElementById('reader-related-notice');
    expect(notice.hidden).toBe(false);
    expect(notice.querySelector('.related-document-badge').textContent).toBe('Sentencia de la SCJN');
    document.querySelector('[data-reader-mode="original"]').click();
    expect(notice.hidden).toBe(false);
    expect(document.getElementById('modal-content').classList.contains('hidden')).toBe(true);
    document.getElementById('close-modal').click();
    await vi.advanceTimersByTimeAsync(310);
    filter('');
    const ordinary = articles.find(a => a.articulo_label === 'Artículo 1');
    list.querySelector(`.result-item[data-id="${ordinary.id}"]`).click();
    await vi.advanceTimersByTimeAsync(25);
    expect(notice.hidden).toBe(true);
    expect(notice.querySelector('.related-document-badge').textContent).toBe('');
});
