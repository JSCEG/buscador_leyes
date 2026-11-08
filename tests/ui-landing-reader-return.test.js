import { afterEach, expect, it, vi } from 'vitest';
import { getArticleById, getArticlesByLaw } from '../src/scripts/search-engine.js';
import { catalogArrives, closePage, gallerySections, onLanding, openPage, waitingRoute } from './helpers/ui-page.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));

afterEach(closePage);

it('arriving at an article waits without the search page, and closing it lands on the landing', async () => {
  const article = { id: 'a1', ley_origen: 'Ley A', ley_id: 'ley-a', numero: '1', titulo: 'Artículo 1', contenido: '<p>Texto</p>', tipo: 'ley' };
  getArticleById.mockResolvedValue(article);
  getArticlesByLaw.mockResolvedValue([article]);
  openPage('/#art-a1');

  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  await vi.advanceTimersByTimeAsync(100);
  expect(waitingRoute()).toBe(true);

  catalogArrives();
  await vi.advanceTimersByTimeAsync(800);
  expect(waitingRoute()).toBe(false);
  expect(document.getElementById('detail-modal').classList.contains('hidden')).toBe(false);

  document.getElementById('close-modal').click();
  await vi.advanceTimersByTimeAsync(400);
  expect(location.hash).toBe('');
  expect(onLanding()).toBe(true);
  expect(gallerySections()).toBe(6);
});
