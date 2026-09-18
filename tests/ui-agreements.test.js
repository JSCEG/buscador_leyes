import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { getArticlesByLaw, getThemesByLawName } from '../src/scripts/search-engine.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
    performSearch: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
    getSearchCountsByLaw: vi.fn(), getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({
    openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn(),
}));

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it('renders the real agreement, pagination, index and filtered cards without nested source HTML', async () => {
    vi.useFakeTimers();
    const { ley, articulos } = JSON.parse(readFileSync('revision-acervo/incorporacion-convocatorias-2026-09-17/CONV-ESTRATEGICOS-M2-carga.json', 'utf8'));
    const articles = articulos.map(row => ({ ...row, texto: row.contenido, articulo_label: row.identificador, ley_origen: ley.titulo }));
    getArticlesByLaw.mockResolvedValue(articles);
    getThemesByLawName.mockResolvedValue([]);
    document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
    history.replaceState(null, '', `/#ley-${ley.id}`);
    const { initUI } = await import('../src/scripts/ui.js');
    initUI();
    window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries: [{ ...ley, articulos: 28 }], relaciones: [] } }));
    await vi.advanceTimersByTimeAsync(75);

    const list = document.getElementById('law-articles-list');
    expect(list.querySelectorAll(':scope > .result-item')).toHaveLength(20);
    expect(list.querySelector('.result-item .result-item')).toBeNull();
    document.getElementById('btn-load-more-law').click();
    expect(list.querySelectorAll(':scope > .result-item')).toHaveLength(28);
    expect(list.querySelector('p div, p table')).toBeNull();
    expect(document.querySelectorAll('.toc-art-btn .toc-art-btn')).toHaveLength(0);

    const input = document.getElementById('law-search-input');
    input.value = 'generación';
    input.dispatchEvent(new Event('input'));
    expect(list.querySelectorAll(':scope > .result-item').length).toBeGreaterThan(1);
    expect(list.querySelector('.result-item .result-item')).toBeNull();
    expect(list.querySelector('mark').textContent.toLowerCase()).toBe('generación');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(list.querySelectorAll(':scope > .result-item')).toHaveLength(28);
});
