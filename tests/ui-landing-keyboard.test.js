import { afterEach, expect, it, vi } from 'vitest';
import { searchArticles, searchCountsByLawId } from '../src/scripts/search-engine.js';
import { closePage, openPage } from './helpers/ui-page.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({ openLawPresentationDeck: vi.fn(), renderLawPresentationEmbed: vi.fn() }));

afterEach(closePage);

const press = (target, key) => target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

it('can be used from the keyboard: the / shortcut, the theme radios, and focus after searching', async () => {
  searchArticles.mockResolvedValue({ data: [], total: 0 });
  searchCountsByLawId.mockResolvedValue([]);
  openPage('/', { landing: true });
  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  await vi.advanceTimersByTimeAsync(150);
  const root = document.documentElement;
  const box = document.querySelector('#landing-search input');

  // «/» goes to the box on screen, without leaving the landing
  press(document.body, '/');
  await vi.advanceTimersByTimeAsync(50);
  expect(document.activeElement).toBe(box);
  expect(root.classList.contains('landing-on')).toBe(true);
  expect(location.hash).toBe('');
  box.blur();

  // the theme group is one stop for Tab, and the arrows move through it
  const options = [...document.querySelectorAll('.lp-themes [data-theme-choice]')];
  const checked = () => options.find(option => option.getAttribute('aria-checked') === 'true');
  expect(options.filter(option => option.tabIndex === 0)).toEqual([checked()]);
  const light = options[0];
  light.click();
  light.focus();
  press(light, 'ArrowRight');
  expect(root.dataset.theme).toBe('dark');
  expect(document.activeElement).toBe(options[1]);
  expect(options[1].tabIndex).toBe(0);
  expect(light.tabIndex).toBe(-1);
  press(options[1], 'ArrowLeft');
  press(light, 'ArrowLeft'); // wraps around
  expect(root.dataset.theme).toBe('contraste');
  expect(document.activeElement).toBe(options[3]);
  options[0].click();

  // searching does not drop the focus on the body, nor open the phone's keyboard on the box
  const form = document.getElementById('landing-search');
  box.value = 'interconexión';
  box.focus();
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.advanceTimersByTimeAsync(800);
  expect(root.classList.contains('landing-on')).toBe(false);
  expect(document.activeElement).toBe(document.getElementById('global-search-wrapper'));
});
