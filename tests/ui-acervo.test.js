import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { getArticlesByLaw, getThemesByLawName, performSearch } from '../src/scripts/search-engine.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/search-engine.js', () => ({
  performSearch: vi.fn(), getArticleById: vi.fn(), getArticlesByLaw: vi.fn(),
  getSearchCountsByLaw: vi.fn(), getThemesByLawName: vi.fn(), updateArticle: vi.fn(),
}));
vi.mock('../src/scripts/law-presentation.js', () => ({
  openLawPresentationDeck: vi.fn(),
  renderLawPresentationEmbed: vi.fn(),
}));

const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.defineProperty(window, 'scrollY', originalScrollY);
});

it('loads the acervo once ready and preserves its independent route, filters and return position', async () => {
  vi.useFakeTimers();
  let viewportY = 0;
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => viewportY });
  const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(options => { viewportY = options.top; });
  getArticlesByLaw.mockImplementation(async titulo => [{
    id: 'article-1', articulo_label: 'Artículo 1', tipo_articulo: 'ordinario',
    texto: 'Contenido de consulta.', ley_origen: titulo,
  }]);
  getThemesByLawName.mockResolvedValue([]);
  const html = readFileSync('index.html', 'utf8');
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
  history.replaceState(null, '', '/');
  const errors = [];
  const onError = event => errors.push(event.error);
  window.addEventListener('error', onError);
  const { initUI } = await import('../src/scripts/ui.js');
  // A single app instance exercises transitions without accumulating global listeners.
  initUI();

  const results = document.getElementById('results-container');
  const globalSearch = document.getElementById('global-search-wrapper');
  const cards = () => [...results.querySelectorAll('.ac-card')];
  const cardIds = () => cards().map(card => card.dataset.lawId);
  const acervoSearch = () => results.querySelector('.ac-search-form input');
  const sortSelect = () => results.querySelector('select[aria-label="Ordenar instrumentos"]');
  const routeParams = () => new URLSearchParams(location.hash.split('?')[1]);
  const settle = () => vi.advanceTimersByTimeAsync(150);
  const enterQuery = value => {
    acervoSearch().value = value;
    acervoSearch().dispatchEvent(new Event('input', { bubbles: true }));
  };

  // Opening before Supabase finishes must replace the loading state when data arrives.
  document.getElementById('nav-leyes').click();
  expect(results.querySelector('[aria-label="Cargando acervo"]')).not.toBeNull();
  expect(location.hash).toBe('#acervo');

  const summaries = [
    { id: 'ley-electrica', titulo: 'Ley del Sector Eléctrico', tipo: 'ley', fecha_publicacion: '2025-03-18' },
    { id: 'ley-hidrocarburos', titulo: 'Ley del Sector Hidrocarburos', tipo: 'ley', fecha_publicacion: '2026-01-10' },
    { id: 'reglamento', titulo: 'Reglamento del sector', tipo: 'reglamento' },
    { id: 'convocatoria', titulo: 'Acuerdo por el que se emite la Convocatoria de generación', tipo: 'acuerdo', fecha_publicacion: '2025-10-17' },
    { id: 'dacg', titulo: 'DACG de almacenamiento', tipo: 'dacg' },
    { id: 'acuerdo', titulo: 'Acuerdo de autoconsumo', tipo: 'acuerdo' },
    { id: 'norma', titulo: 'NOM de referencia técnica', tipo: 'nom' },
    { id: 'sin-tipo', titulo: 'Instrumento sin clasificación', tipo: null },
    { id: 'circular', titulo: 'Circular de prueba', tipo: 'circular' },
  ].map(law => ({ ...law, articulos: 1, temas_clave: [], siglas: null }));
  window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries, relaciones: [] } }));
  await settle();

  expect(results.querySelector('.animate-spin')).toBeNull();
  expect(cards()).toHaveLength(summaries.length);
  expect(new Set(cardIds())).toEqual(new Set(summaries.map(law => law.id)));
  expect(results.querySelector('.ac-total').textContent).toBe('9 instrumentos');
  expect(results.querySelector('.ac-card[data-law-id="convocatoria"]').dataset.category).toBe('convocatorias');
  expect(results.querySelector('.ac-card[data-law-id="convocatoria"] .ac-card-category').textContent).toBe('acuerdo');
  expect([...results.querySelectorAll('.ac-row[data-group="otros"] .ac-card')].map(card => card.dataset.lawId))
    .toEqual(expect.arrayContaining(['sin-tipo', 'circular']));
  expect(globalSearch.classList.contains('hidden')).toBe(true);

  // The new library search must not trigger full-text search or reveal its filters.
  const historyLength = history.length;
  enterQuery('circular');
  await settle();
  expect(cardIds()).toEqual(['circular']);
  expect(routeParams().get('q')).toBe('circular');
  expect(history.length).toBe(historyLength);
  expect(document.getElementById('search-input').value).toBe('');
  expect(document.getElementById('search-filters')).toBeNull();
  expect(performSearch).not.toHaveBeenCalled();
  results.querySelector('.ac-clear').click();
  await settle();

  // Both navigation menus reach the same library after leaving the view.
  document.getElementById('nav-inicio').click();
  await settle();
  expect(globalSearch.classList.contains('hidden')).toBe(false);
  document.getElementById('mobile-nav-leyes').click();
  await settle();
  expect(results.classList.contains('hidden')).toBe(false);
  expect(results.classList.contains('opacity-0')).toBe(false);
  expect(cards()).toHaveLength(summaries.length);
  expect(globalSearch.classList.contains('hidden')).toBe(true);
  expect(document.getElementById('acervo-visual-dashboard').closest('#admin-ingest-container')).toBeNull();

  // Drill into a collection, change its ordering, then return from a real law view.
  const lawsRow = results.querySelector('.ac-row[data-group="leyes"]');
  lawsRow.scrollLeft = 145;
  lawsRow.dispatchEvent(new Event('scroll'));
  results.querySelector('button[aria-label="Ver todos: Leyes"]').click();
  enterQuery('sector');
  sortSelect().value = 'date-newest';
  sortSelect().dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
  expect(cardIds()).toEqual(['ley-hidrocarburos', 'ley-electrica']);
  const filteredHash = location.hash;
  expect(routeParams().get('grupo')).toBe('leyes');
  expect(routeParams().get('orden')).toBe('date-newest');
  viewportY = 640;
  cards()[0].click();
  await settle();
  expect(getArticlesByLaw).toHaveBeenLastCalledWith('Ley del Sector Hidrocarburos');
  expect(getThemesByLawName).toHaveBeenLastCalledWith('Ley del Sector Hidrocarburos');
  expect(location.hash).toBe('#ley-ley-hidrocarburos');
  expect(document.getElementById('law-detail-container').classList.contains('hidden')).toBe(false);
  expect(results.classList.contains('hidden')).toBe(true);
  viewportY = 0;
  document.getElementById('crumb-categoria').click();
  await settle();
  expect(location.hash).toBe(filteredHash);
  expect(acervoSearch().value).toBe('sector');
  expect(sortSelect().value).toBe('date-newest');
  expect(results.querySelector('.ac-filter[data-group="leyes"]').getAttribute('aria-pressed')).toBe('true');
  expect(cardIds()).toEqual(['ley-hidrocarburos', 'ley-electrica']);
  expect(document.activeElement.dataset.lawId).toBe('ley-hidrocarburos');
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 640, behavior: 'instant' });
  expect(viewportY).toBe(640);

  results.querySelector('.ac-clear').click();
  results.querySelector('.ac-filter[data-group="all"]').click();
  await settle();
  expect(results.querySelector('.ac-row[data-group="leyes"]').scrollLeft).toBe(145);

  // A browser-restored hash is decoded without pushing another history entry.
  const restoredHash = '#acervo?q=generaci%C3%B3n&grupo=convocatorias&orden=date-oldest';
  history.replaceState(null, '', `/${restoredHash}`);
  const restoredLength = history.length;
  window.dispatchEvent(new PopStateEvent('popstate'));
  await settle();
  expect(location.hash).toBe(restoredHash);
  expect(history.length).toBe(restoredLength);
  expect(acervoSearch().value).toBe('generación');
  expect(sortSelect().value).toBe('date-oldest');
  expect(results.querySelector('.ac-filter[data-group="convocatorias"]').getAttribute('aria-pressed')).toBe('true');
  expect(cardIds()).toEqual(['convocatoria']);
  expect(performSearch).not.toHaveBeenCalled();

  history.replaceState(null, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
  await settle();
  expect(document.getElementById('hero-section').classList.contains('hidden')).toBe(false);
  expect(results.classList.contains('hidden')).toBe(true);
  expect(globalSearch.classList.contains('hidden')).toBe(false);

  // Leaving global search before its debounce expires must cancel the scheduled request.
  const globalInput = document.getElementById('search-input');
  performSearch.mockResolvedValue({ data: [], total: 0 });
  globalInput.value = 'circular pendiente';
  globalInput.dispatchEvent(new Event('input', { bubbles: true }));
  document.getElementById('nav-leyes').click();
  const libraryHash = location.hash;
  await vi.advanceTimersByTimeAsync(300);
  expect(performSearch).not.toHaveBeenCalled();
  expect(results.querySelector('.ac-library')).not.toBeNull();
  expect(cardIds()).toEqual(['convocatoria']);
  expect(location.hash).toBe(libraryHash);
  expect(document.getElementById('search-filters')).toBeNull();

  // An already dispatched response must not overwrite the library after navigation.
  document.getElementById('nav-inicio').click();
  await settle();
  let resolveGlobalSearch;
  performSearch.mockReturnValueOnce(new Promise(resolve => { resolveGlobalSearch = resolve; }));
  globalInput.value = 'generación pendiente';
  globalInput.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.advanceTimersByTimeAsync(260);
  expect(performSearch).toHaveBeenCalledTimes(1);
  expect(performSearch.mock.calls[0][0]).toBe('generación pendiente');
  document.getElementById('nav-leyes').click();
  await settle();
  const visibleLibrary = results.querySelector('.ac-library');
  expect(visibleLibrary).not.toBeNull();
  resolveGlobalSearch({ data: [], total: 0 });
  await settle();
  expect(results.querySelector('.ac-library')).toBe(visibleLibrary);
  expect(cardIds()).toEqual(['convocatoria']);
  expect(location.hash).toBe(libraryHash);
  expect(globalSearch.classList.contains('hidden')).toBe(true);
  expect(document.getElementById('search-filters')).toBeNull();

  // URLs must preserve the complete query supported by the library input (500 characters).
  const longQuery = 'x'.repeat(500);
  enterQuery(longQuery);
  const longQueryHash = location.hash;
  expect(routeParams().get('q')).toBe(longQuery);
  document.getElementById('nav-inicio').click();
  await settle();
  history.replaceState(null, '', `/${longQueryHash}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
  await settle();
  expect(acervoSearch().value).toBe(longQuery);
  expect(routeParams().get('q')).toBe(longQuery);
  expect(results.querySelector('.ac-empty')).not.toBeNull();
  expect(performSearch).toHaveBeenCalledTimes(1);
  expect(errors).toEqual([]);
  window.removeEventListener('error', onError);
});
