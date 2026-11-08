import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('leaves the landing when a link was touched before the app started', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', cb => setTimeout(() => cb(Date.now()), 0));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  vi.stubGlobal('matchMedia', q => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
  // index.html marked the landing, and then the visitor touched «Ver los documentos» while the JavaScript loaded
  document.documentElement.classList.add('landing-on');
  history.replaceState(null, '', '/#acervo');

  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  await vi.advanceTimersByTimeAsync(150);

  expect(document.documentElement.classList.contains('landing-on')).toBe(false);
  expect(document.querySelectorAll('#landing-view .lp-sec')).toHaveLength(0);
  expect(location.hash).toBe('#acervo');
});
