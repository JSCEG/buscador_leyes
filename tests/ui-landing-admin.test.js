import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));
vi.mock('../src/scripts/auth.js', async original => ({ ...await original(), isAdmin: () => true }));

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('leaves the landing when an admin opens the content manager, and comes back with the logo', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', cb => setTimeout(() => cb(Date.now()), 0));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  vi.stubGlobal('matchMedia', q => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
  history.replaceState(null, '', '/');
  document.documentElement.classList.add('landing-on');

  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  await vi.advanceTimersByTimeAsync(150);

  document.getElementById('nav-admin').click();
  await vi.advanceTimersByTimeAsync(150);
  expect(document.documentElement.classList.contains('landing-on')).toBe(false);
  expect(document.querySelectorAll('#landing-view .lp-sec')).toHaveLength(0);

  document.getElementById('brand-home').click();
  await vi.advanceTimersByTimeAsync(150);
  expect(document.documentElement.classList.contains('landing-on')).toBe(true);
  expect(document.querySelectorAll('#landing-view .lp-sec')).toHaveLength(6);
});
