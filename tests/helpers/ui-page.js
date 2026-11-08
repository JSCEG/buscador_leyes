import { readFileSync } from 'node:fs';
import { vi } from 'vitest';

export const summaries = [{ id: 'ley-a', titulo: 'Ley A', siglas: 'LA', tipo: 'ley', fecha_publicacion: '2025-03-18', articulos: 3, temas_clave: [], url_original: null }];

/** The real page at an address, with fake timers, as index.html leaves it before the app starts. */
export function openPage(address, { landing = false } = {}) {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', cb => setTimeout(() => cb(Date.now()), 0));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  vi.stubGlobal('matchMedia', q => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
  history.replaceState(null, '', address);
  document.documentElement.classList.toggle('landing-on', landing);
  localStorage.clear();
}

export function closePage() {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
}

export const catalogArrives = () => window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries, relaciones: [] } }));
export const onLanding = () => document.documentElement.classList.contains('landing-on');
export const waitingRoute = () => document.documentElement.classList.contains('route-wait');
export const gallerySections = () => document.querySelectorAll('#landing-view .lp-sec').length;
