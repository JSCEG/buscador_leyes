import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/law-presentation.js', () => ({
  openLawPresentationDeck: vi.fn(),
  renderLawPresentationEmbed: vi.fn(),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('loads the acervo after an early click and renders convocatorias and unfamiliar types', async () => {
  vi.useFakeTimers();
  const html = readFileSync('index.html', 'utf8');
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
  history.replaceState(null, '', '/');
  const errors = [];
  const onError = event => errors.push(event.error);
  window.addEventListener('error', onError);
  const { initUI } = await import('../src/scripts/ui.js');
  initUI();

  const results = document.getElementById('results-container');
  document.getElementById('nav-leyes').click();
  expect(results.querySelector('.animate-spin')).not.toBeNull();

  const summaries = [
    { id: '1', titulo: 'Ley del Sector Eléctrico', tipo: 'ley' },
    { id: '2', titulo: 'Convocatoria de generación', tipo: 'otros' },
    { id: '3', titulo: 'Instrumento sin clasificación', tipo: null },
    { id: '4', titulo: 'Circular de prueba', tipo: 'circular' },
  ].map(law => ({ ...law, articulos: 1, temas_clave: [] }));
  window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries, relaciones: [] } }));
  await vi.advanceTimersByTimeAsync(75);

  expect(results.querySelector('.animate-spin')).toBeNull();
  expect(results.querySelectorAll('.law-row-item')).toHaveLength(4);
  expect(results.textContent).toContain('4 Instrumentos');
  expect([...results.querySelectorAll('.law-row-item')]
    .find(row => row.dataset.title === 'Convocatoria de generación')
    .cells[2].textContent.trim()).toBe('otros');

  // La navegación funciona también después de volver a Inicio y desde el menú móvil.
  document.getElementById('nav-inicio').click();
  document.getElementById('mobile-nav-leyes').click();
  await vi.advanceTimersByTimeAsync(75);
  expect(results.classList.contains('hidden')).toBe(false);
  expect(results.classList.contains('opacity-0')).toBe(false);
  expect(results.querySelectorAll('.law-row-item')).toHaveLength(4);
  expect(document.getElementById('global-search-wrapper').classList.contains('opacity-0')).toBe(false);
  expect(document.getElementById('acervo-visual-dashboard').closest('#admin-ingest-container')).toBeNull();
  expect(errors).toEqual([]);
  window.removeEventListener('error', onError);
});
