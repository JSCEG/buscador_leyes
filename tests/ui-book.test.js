import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { getArticlesByLaw, getThemesByLawName } from '../src/scripts/search-engine.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/analisis.js', () => ({ renderAnalisisView: vi.fn() }));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

const articlesOf = id => [1, 2, 3].map(n => ({ id: `${id}-${n}`, ley_id: id, articulo_label: `Artículo ${n}`, texto: `Artículo ${n}.- Texto de ${id}.`, tipo_articulo: 'ordinario' }));
const summaries = ['a', 'b'].map(id => ({ id, titulo: `Ley ${id}`, siglas: `L${id}`, tipo: 'ley', articulos: 3 }));

it('a law opened from another law can be read as a book, and the first book is gone', async () => {
  vi.useFakeTimers();
  getArticlesByLaw.mockImplementation(async law => articlesOf(String(law?.id ?? law).includes('b') ? 'b' : 'a'));
  getThemesByLawName.mockResolvedValue([]);
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
  history.replaceState(null, '', '/#ley-a');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries, relaciones: [] } }));
  await vi.advanceTimersByTimeAsync(100);

  const asBook = () => document.querySelector('[data-read-mode="libro"]').click();
  asBook();
  await vi.advanceTimersByTimeAsync(100);
  expect(document.querySelector('#law-book .bk')).not.toBeNull();

  history.replaceState(null, '', '/#ley-b');
  window.dispatchEvent(new PopStateEvent('popstate'));
  await vi.advanceTimersByTimeAsync(100);
  expect(document.querySelector('#law-book .bk')).toBeNull();

  asBook();
  await vi.advanceTimersByTimeAsync(100);
  expect(document.querySelector('#law-book .bk')).not.toBeNull();
});

it('asks for an account with the dialog to save a note', () => {
  const source = readFileSync('src/scripts/ui.js', 'utf8');
  expect(source).toContain("requireAccount('escribir notas', { reason: 'guardar' })");
  expect(source).not.toContain("showToast('Inicia sesión para guardar notas");
});
