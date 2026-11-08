import { afterEach, expect, it, vi } from 'vitest';
import { catalogArrives, closePage, gallerySections, onLanding, openPage } from './helpers/ui-page.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(), getArticlesByIds: vi.fn().mockResolvedValue([]),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));

afterEach(closePage);

it('a shared desk opens over the landing, not over the old search page', async () => {
  openPage('/#mesa-a1,a2');
  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  catalogArrives();
  await vi.advanceTimersByTimeAsync(800);
  expect(location.hash).toBe('');
  expect(onLanding()).toBe(true);
  expect(gallerySections()).toBe(6);
});
