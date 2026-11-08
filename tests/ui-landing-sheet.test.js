import { afterEach, expect, it, vi } from 'vitest';
import { catalogArrives, closePage, onLanding, openPage } from './helpers/ui-page.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));

afterEach(closePage);

const route = hash => {
  history.pushState(null, '', hash ? `/${hash}` : '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
};

it('a sheet opened after the landing closes on the shelf, even if an earlier sheet was left open', async () => {
  openPage('/#estante');
  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  catalogArrives();
  await vi.advanceTimersByTimeAsync(800);

  // a sheet opened by hand on the shelf, and left open by going home with the logo
  document.querySelector('#home-view [data-law-id], #home-view .sh-tome').click();
  await vi.advanceTimersByTimeAsync(800);
  expect(location.hash).toBe('#ficha-ley-a');
  document.getElementById('brand-home').click();
  await vi.advanceTimersByTimeAsync(150);
  expect(onLanding()).toBe(true);

  // a cover of the landing
  route('#ficha-ley-a');
  await vi.advanceTimersByTimeAsync(800);
  expect(document.querySelector('.sh-sheet')).not.toBeNull();
  const back = vi.spyOn(history, 'back');
  document.querySelector('.sh-sheet [data-sheet-close], .sh-sheet [aria-label="Cerrar"]').click();
  await vi.advanceTimersByTimeAsync(800);
  expect(back).not.toHaveBeenCalled();
  expect(location.hash).toBe('#estante');
});
