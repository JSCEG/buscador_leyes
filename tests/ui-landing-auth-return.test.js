import { afterEach, expect, it, vi } from 'vitest';
import { catalogArrives, closePage, gallerySections, onLanding, openPage, waitingRoute } from './helpers/ui-page.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));

afterEach(closePage);

it('coming back from an auth email keeps the landing behind its dialog', async () => {
  // index.html marks the landing for this address too; the client clears the token from it afterwards
  openPage('/#access_token=abc&type=recovery', { landing: true });
  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  await vi.advanceTimersByTimeAsync(150);
  expect(onLanding()).toBe(true);
  expect(waitingRoute()).toBe(false);
  expect(gallerySections()).toBe(6);

  history.replaceState(null, '', '/');
  catalogArrives();
  await vi.advanceTimersByTimeAsync(800);
  expect(onLanding()).toBe(true);
  expect(document.getElementById('welcome-tour')).toBeNull();
});
