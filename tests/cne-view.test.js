import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authorityTag, renderCneView } from '../src/scripts/cne-view.js';
import { resetTechIndexForTests } from '../src/lib/permit-type.js';
import { buscarPermisos, ligasDePermiso } from '../src/lib/permisos-mapa.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/lib/permisos-mapa.js', async original => ({ ...(await original()), buscarPermisos: vi.fn(), ligasDePermiso: vi.fn(async () => ({ encontrado: false, resoluciones: [] })) }));

const row = { tabla: 'electricidad', numero: 'E/1/GEN/2020', razonSocial: 'Titular', estatus: 'Vigente', ligaPermiso: 'https://drive.cne.gob.mx/x' };
const tick = () => new Promise(resolve => setTimeout(resolve, 5));

describe('permits section', () => {
  let host, view;
  const tabsOf = aut => [...host.querySelectorAll(`.pm-tab-grupo[data-aut="${aut}"] .pm-tab`)].map(tab => tab.textContent.replace('Nuevo', '').trim());
  beforeEach(() => {
    document.body.innerHTML = '<div id="h"></div>';
    host = document.getElementById('h');
    resetTechIndexForTests();
    buscarPermisos.mockResolvedValue({ rows: [{ ...row }], total: 1 });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sin red'); }));
  });
  afterEach(() => { view?.destroy(); view = null; vi.unstubAllGlobals(); });

  it('groups tabs by authority', () => {
    view = renderCneView(host, () => [], {});
    expect(tabsOf('cne')).toEqual(['Permisos', 'Resoluciones', 'Panorama', 'Trámites', 'Mapa']);
    expect(tabsOf('sener')).toEqual(['Títulos y permisos']);
  });
  it('labels each view with its authority', () => {
    expect(authorityTag('cne')).toContain('Comisión Nacional de Energía');
    expect(authorityTag('sener')).toContain('Secretaría de Energía');
    view = renderCneView(host, () => [], {});
    expect(host.querySelector('[data-authority]').textContent).toContain('CNE');
    expect(host.querySelector('.pm-view').classList.contains('en-sener')).toBe(false);
  });
  it('shows only the tabs of the authority on screen', () => {
    const shown = aut => !host.querySelector(`.pm-tab-grupo[data-aut="${aut}"]`).hidden;
    view = renderCneView(host, () => [], {});
    expect(shown('cne')).toBe(true);
    expect(shown('sener')).toBe(false);
    view.go({ tab: 'sener' });
    expect(shown('cne')).toBe(false);
    expect(host.querySelector('.pm-view').classList.contains('en-sener')).toBe(true);
    // One tab is no choice: the SENER page has no tab row.
    expect(host.querySelector('.pm-tabs').hidden).toBe(true);
    view.go({ tab: 'mapa' });
    expect(shown('cne')).toBe(true);
    expect(host.querySelector('.pm-tabs').hidden).toBe(false);
  });
  it('switches authority from the page, for phones without the side menu', () => {
    view = renderCneView(host, () => [], {});
    const links = [...host.querySelectorAll('.pm-aut-switch a')];
    expect(links.map(link => [link.textContent, link.getAttribute('href')])).toEqual([['CNE', '#permisos'], ['SENER', '#sener']]);
    expect(links[0].getAttribute('aria-current')).toBe('page');
    view.go({ tab: 'sener' });
    expect(links[1].getAttribute('aria-current')).toBe('page');
    expect(links[0].hasAttribute('aria-current')).toBe(false);
  });
  it('makes the map stand out: its own tab look and an invitation on the permits page', () => {
    view = renderCneView(host, () => [], {});
    const tab = host.querySelector('#pm-tab-mapa');
    expect(tab.classList.contains('is-destacado')).toBe(true);
    expect(tab.querySelector('svg')).not.toBeNull();
    const promo = host.querySelector('.pm-mapa-promo');
    expect(promo.getAttribute('href')).toBe('#mapa-permisos');
    expect(promo.hidden).toBe(false);
    view.go({ tab: 'resoluciones' });
    expect(promo.hidden).toBe(true);
    view.go({ tab: 'sener' });
    expect(promo.hidden).toBe(true);
  });
  it('cards still render, with a type tile, if the technology index fails', async () => {
    view = renderCneView(host, () => [], {});
    for (let i = 0; i < 6; i++) await tick();
    const card = host.querySelector('.pm-card');
    expect(card).not.toBeNull();
    expect(card.querySelector('.bu-ico svg')).not.toBeNull();
    expect(card.querySelector('.pm-tipo').textContent).toContain('Generación');
  });
  it('each card says how many resolutions the permit has, from the Azure links', async () => {
    ligasDePermiso.mockResolvedValueOnce({ encontrado: true, ligaPermiso: 'https://d/p', ligaResolucion: null, resoluciones: [{ numero: 'RES/1', liga: 'https://d/1' }, { numero: 'RES/2', liga: 'https://d/2' }] });
    view = renderCneView(host, () => [], {});
    for (let i = 0; i < 6; i++) await tick();
    expect(host.querySelector('.pm-card .pm-res-count')?.textContent).toBe('2 resoluciones');
  });
});
