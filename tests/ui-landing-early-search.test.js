import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { searchArticles, searchCountsByLawId } from '../src/scripts/search-engine.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));

const summaries = [{ id: 'ley-a', titulo: 'Ley A', siglas: 'LA', tipo: 'ley', fecha_publicacion: '2025-03-18', articulos: 3, temas_clave: [], url_original: null }];

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('keeps a search made before the catalog arrived, and the logo still goes home', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', cb => setTimeout(() => cb(Date.now()), 0));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  vi.stubGlobal('matchMedia', q => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  searchArticles.mockResolvedValue({ data: [], total: 0 });
  searchCountsByLawId.mockResolvedValue([]);
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
  history.replaceState(null, '', '/');
  document.documentElement.classList.add('landing-on');
  // the visitor pressed Enter while the JavaScript was still on its way
  window.__landingQuery = 'interconexión';

  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  await vi.advanceTimersByTimeAsync(800);

  const results = document.getElementById('results-container');
  const hero = document.getElementById('hero-section');
  expect(location.hash).toBe('#buscar');
  expect(document.documentElement.classList.contains('landing-on')).toBe(false);
  expect(document.getElementById('search-input').value).toBe('interconexión');
  expect(searchArticles).toHaveBeenCalledTimes(1);
  expect(results.classList.contains('hidden')).toBe(false);

  window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries, relaciones: [] } }));
  await vi.advanceTimersByTimeAsync(800);

  // the catalog arriving late does not take the results away
  expect(results.classList.contains('hidden')).toBe(false);
  expect(hero.classList.contains('hidden')).toBe(true);
  expect(location.hash).toBe('#buscar');
  expect(document.getElementById('search-input').value).toBe('interconexión');
  // whoever arrived at the landing has the guide there: the tour does not jump over their results
  expect(document.getElementById('welcome-tour')).toBeNull();

  // and no half-closed landing is left behind: the logo really goes home
  document.getElementById('brand-home').click();
  await vi.advanceTimersByTimeAsync(150);
  expect(location.hash).toBe('');
  expect(document.documentElement.classList.contains('landing-on')).toBe(true);
  expect(document.querySelectorAll('#landing-view .lp-sec')).toHaveLength(6);
  expect(results.classList.contains('hidden')).toBe(true);
  expect(window.__landingQuery).toBeUndefined();

  // the footer of the landing opens its pages
  document.querySelector('#landing-view [data-legal="privacidad"]').click();
  await vi.advanceTimersByTimeAsync(150);
  expect(document.body.textContent).toContain('Puedes consultar el buscador sin crear una cuenta.');
});
