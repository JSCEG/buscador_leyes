import { afterEach, expect, it, vi } from 'vitest';
import { closePage, onLanding, openPage, waitingRoute } from './helpers/ui-page.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));

afterEach(closePage);

it('an address that needs the catalog waits, and neither a failure nor leaving keeps the page hidden', async () => {
  openPage('/#ley-ley-a');
  window.__landingQuery = 'interconexión'; // typed before touching the link: the last thing touched wins
  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  await vi.advanceTimersByTimeAsync(100);
  expect(waitingRoute()).toBe(true);
  expect(window.__landingQuery).toBeUndefined();

  window.dispatchEvent(new CustomEvent('search-failed'));
  await vi.advanceTimersByTimeAsync(50);
  expect(waitingRoute()).toBe(false);

  document.documentElement.classList.add('route-wait');
  document.getElementById('nav-inicio').click();
  await vi.advanceTimersByTimeAsync(100);
  expect(waitingRoute()).toBe(false);
  expect(document.getElementById('hero-section').classList.contains('hidden')).toBe(false);

  // the kept search does not fire later, from the logo
  document.getElementById('brand-home').click();
  await vi.advanceTimersByTimeAsync(150);
  expect(onLanding()).toBe(true);
  expect(location.hash).toBe('');
  expect(document.getElementById('search-input').value).toBe('');
});
