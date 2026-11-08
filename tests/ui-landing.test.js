import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { searchArticles, searchCountsByLawId } from '../src/scripts/search-engine.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));

const summaries = [
  { id: '8e404121-3502-4f47-937d-a43762c52da8', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'ley', fecha_publicacion: '2025-03-18', articulos: 207, temas_clave: [], url_original: null },
];

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('arrives at the landing: no shelf, no owl, no tour, and its search and data work', async () => {
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
  localStorage.clear();

  // index.html already painted the landing: starting the app must not take it away, not even for a moment
  const removed = vi.spyOn(document.documentElement.classList, 'remove');
  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  await vi.advanceTimersByTimeAsync(150);

  const landing = () => document.documentElement.classList.contains('landing-on');
  expect(landing()).toBe(true);
  expect(removed).not.toHaveBeenCalledWith('landing-on');
  expect(window.scrollTo).not.toHaveBeenCalled();
  removed.mockRestore();
  expect(document.body.classList.contains('home-active')).toBe(false);
  expect(document.querySelector('#home-view .sh-tome')).toBeNull();
  expect(document.getElementById('site-intro')).toBeNull();
  expect(document.querySelectorAll('#landing-view .lp-sec')).toHaveLength(6);
  expect(location.hash).toBe('');

  window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries, relaciones: [] } }));
  await vi.advanceTimersByTimeAsync(2000);
  expect(document.querySelector('#landing-view [data-landing-bars] a')).not.toBeNull();
  expect(document.querySelector('#landing-view [data-landing-figures]').textContent).toContain('207');
  expect(landing()).toBe(true);
  // the landing is the welcome: the tour never covers it, and a late catalog does not pull the visitor away
  expect(document.getElementById('welcome-tour')).toBeNull();

  // the logo stays on the landing and does not open the owl
  document.getElementById('brand-home').click();
  await vi.advanceTimersByTimeAsync(150);
  expect(landing()).toBe(true);
  expect(document.getElementById('site-intro')).toBeNull();

  const form = document.getElementById('landing-search');
  form.querySelector('input').value = 'interconexión';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.advanceTimersByTimeAsync(150);
  expect(landing()).toBe(false);
  expect(document.getElementById('search-input').value).toBe('interconexión');
  expect(document.querySelectorAll('#landing-view .lp-sec')).toHaveLength(0);
});
