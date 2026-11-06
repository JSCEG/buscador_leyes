import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { getArticlesByLaw, getThemesByLawName, searchArticles, searchCountsByLawId } from '../src/scripts/search-engine.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  searchArticles: vi.fn(), searchCountsByLawId: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({
  openLawPresentationDeck: vi.fn(),
  renderLawPresentationEmbed: vi.fn(),
}));

const summaries = [
  { id: 'ley-a', titulo: 'Ley A del Sector', siglas: 'LA', tipo: 'ley', fecha_publicacion: '2025-03-18', articulos: 3, temas_clave: [], url_original: 'https://dof.gob.mx/a' },
  { id: 'ley-b', titulo: 'Ley B del Sector', siglas: 'LB', tipo: 'ley', fecha_publicacion: '2025-03-18', articulos: 3, temas_clave: [], url_original: null },
];

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('uses the shelf as home, with its sheet route and without disturbing other routes', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', cb => setTimeout(() => cb(Date.now()), 0));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  vi.stubGlobal('matchMedia', q => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  getArticlesByLaw.mockResolvedValue([{ id: 'art-1', articulo_label: 'Artículo 1', tipo_articulo: 'ordinario', texto: 'Contenido.', ley_origen: 'Ley A del Sector' }]);
  getThemesByLawName.mockResolvedValue([]);
  searchArticles.mockResolvedValue({ data: [], total: 0 });
  searchCountsByLawId.mockResolvedValue({});
  const html = readFileSync('index.html', 'utf8');
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
  const settle = () => vi.advanceTimersByTimeAsync(150);
  const isHome = () => document.body.classList.contains('home-active');
  const ready = () => window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries, relaciones: [] } }));

  // 1. A direct link to a sheet, before the catalog: the sheet opens when the data arrives.
  history.replaceState(null, '', '/#ficha-ley-a');
  const { initUI } = await import('../src/scripts/ui.js');
  initUI();
  await settle();
  expect(isHome()).toBe(true);
  expect(document.querySelector('#home-view .sh-status[data-state="loading"]')).not.toBeNull();
  expect(document.querySelector('.sh-sheet')).toBeNull();
  ready();
  await settle();
  expect(document.querySelector('.sh-sheet')).not.toBeNull();

  // 2. Back closes the sheet and the shelf stays.
  history.replaceState(null, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
  await settle();
  expect(document.querySelector('.sh-sheet')).toBeNull();
  expect(document.querySelector('#home-view .sh-tome')).not.toBeNull();
  expect(location.hash).toBe('');

  // 3. Going to the full list releases the home screen and brings the footer back.
  document.getElementById('nav-leyes').click();
  await settle();
  expect(isHome()).toBe(false);
  expect(document.getElementById('home-view').classList.contains('hidden')).toBe(true);
  expect(document.querySelector('#home-view .sh-tome')).toBeNull();
  expect(location.hash.startsWith('#acervo')).toBe(true);

  // 4. Data arriving late does not pull the reader back to the shelf.
  ready();
  await settle();
  expect(isHome()).toBe(false);
  expect(location.hash.startsWith('#acervo')).toBe(true);

  // 5. The logo returns to the shelf.
  document.getElementById('brand-home').click();
  await settle();
  expect(isHome()).toBe(true);
  expect(location.hash).toBe('');

  // 6. Opening a sheet adds history, and reading then going back reopens it.
  document.querySelector('#home-view [data-sh-open]').click();
  await settle();
  expect(location.hash).toBe('#ficha-ley-a');
  let deliverArticles = () => {};
  getArticlesByLaw.mockImplementationOnce(() => new Promise(resolve => {
    deliverArticles = () => resolve([{ id: 'art-1', articulo_label: 'Artículo 1', tipo_articulo: 'ordinario', texto: 'Contenido.', ley_origen: 'Ley A del Sector' }]);
  }));
  document.querySelector('.sh-sheet [data-sheet-read]').click();
  await settle();
  // The shelf and its sheet stay on screen while the law loads, so the page is never blank.
  expect(isHome()).toBe(true);
  expect(document.querySelector('.sh-sheet')).not.toBeNull();
  deliverArticles();
  await settle();
  expect(location.hash).toBe('#ley-ley-a');
  expect(isHome()).toBe(false);
  history.replaceState(null, '', '/#ficha-ley-a');
  window.dispatchEvent(new PopStateEvent('popstate'));
  await settle();
  expect(isHome()).toBe(true);
  expect(document.querySelector('.sh-sheet')).not.toBeNull();

  // 7. An unknown document shows the shelf without a sheet.
  history.replaceState(null, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
  await settle();
  history.replaceState(null, '', '/#ficha-no-existe');
  window.dispatchEvent(new PopStateEvent('popstate'));
  await settle();
  expect(isHome()).toBe(true);
  expect(document.querySelector('.sh-sheet')).toBeNull();
  history.replaceState(null, '', '/#ficha-%E0%A4%A');
  window.dispatchEvent(new PopStateEvent('popstate'));
  await settle();
  expect(isHome()).toBe(true);
  expect(document.querySelector('.sh-sheet')).toBeNull();
  history.replaceState(null, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
  await settle();

  // 8. Searching from the shelf uses the usual search.
  const field = document.querySelector('#home-view .sh-search input');
  field.value = 'interconexión';
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await settle();
  expect(isHome()).toBe(false);
  expect(document.getElementById('search-input').value).toBe('interconexión');

  // 9. A failed catalog keeps the page usable.
  document.getElementById('brand-home').click();
  await settle();
  window.dispatchEvent(new CustomEvent('search-failed'));
  await settle();
  expect(document.querySelector('#home-view .sh-status[data-state="error"]')).not.toBeNull();
  expect(document.querySelector('#home-view .sh-search input').disabled).toBe(false);
});
