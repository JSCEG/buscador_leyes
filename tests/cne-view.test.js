import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authorityTag, renderCneView } from '../src/scripts/cne-view.js';
import { resetTechIndexForTests } from '../src/lib/permit-type.js';
import { searchPermits } from '../src/lib/cne-api.js';

vi.mock('../src/lib/cne-api.js', async original => ({ ...(await original()), searchPermits: vi.fn(), fetchResolutions: vi.fn(async () => []) }));

const row = { PermisoId: 1, Numero: 'E/1/GEN/2020', Persona: 'Titular', Estado: 'Operando', ResolucionesAsociadas: 2 };
const tick = () => new Promise(resolve => setTimeout(resolve, 5));

describe('permits section', () => {
  let host, view;
  const tabsOf = aut => [...host.querySelectorAll(`.pm-tab-grupo[data-aut="${aut}"] .pm-tab`)].map(tab => tab.textContent.replace('Nuevo', '').trim());
  beforeEach(() => {
    document.body.innerHTML = '<div id="h"></div>';
    host = document.getElementById('h');
    resetTechIndexForTests();
    searchPermits.mockResolvedValue({ rows: [row], total: 1 });
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
  it('cards still render, with a type tile, if the technology index fails', async () => {
    view = renderCneView(host, () => [], {});
    for (let i = 0; i < 6; i++) await tick();
    const card = host.querySelector('.pm-card');
    expect(card).not.toBeNull();
    expect(card.querySelector('.bu-ico svg')).not.toBeNull();
    expect(card.querySelector('.pm-tipo').textContent).toContain('Generación');
  });
});
