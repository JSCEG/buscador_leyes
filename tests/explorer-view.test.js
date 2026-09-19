import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import seed from '../src/data/explorer-catalog.json';

const services = vi.hoisted(() => ({ load: vi.fn(), allowed: vi.fn(), editor: vi.fn(), authCallbacks: [] }));
vi.mock('../src/lib/explorer-store.js', () => ({ loadExplorerCatalog: services.load, canPublishExplorer: services.allowed }));
vi.mock('../src/scripts/explorer-editor.js', () => ({ openExplorerEditor: services.editor }));
vi.mock('../src/scripts/auth.js', () => ({ onAuthChange: callback => { services.authCallbacks.push(callback); } }));
import { renderAnalisisView } from '../src/scripts/explorer-view.js';

let container;
const clone = value => JSON.parse(JSON.stringify(value));
beforeEach(() => {
  vi.clearAllMocks(); services.authCallbacks.length = 0;
  services.load.mockResolvedValue({ catalog: clone(seed), source: 'bundled' });
  services.allowed.mockResolvedValue(false);
  container = document.createElement('div'); document.body.replaceChildren(container);
});
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('explorador parametrizable en la vista pública', () => {
  it('renders a new collection and entity from data without adding a renderer branch', async () => {
    const catalog = clone(seed);
    catalog.entities.push({ id: 'concepto-prueba', type: 'concepto', title: 'Tema adicional de prueba', description: 'Contenido de prueba, no publicado.', aliases: ['Ejemplo'], references: [] });
    catalog.topics.push({ id: 'coleccion-prueba', title: 'Colección adicional', summary: 'Prueba del contrato', entityIds: ['concepto-prueba'], rootEntityId: 'concepto-prueba' });
    services.load.mockResolvedValue({ catalog });
    await renderAnalisisView(container, { topicId: 'coleccion-prueba', entityId: 'concepto-prueba' });
    expect(container.querySelector('h2').textContent).toBe('Tema adicional de prueba');
    expect(container.querySelector('#explorer-topic').value).toBe('coleccion-prueba');
    expect(container.textContent).toContain('No hay relaciones registradas');
    expect(container.querySelector('main')).toBeNull();
  });

  it('searches an alias, changes entity and emits the established navigation and article contracts', async () => {
    const navigate = vi.fn(), openArticle = vi.fn();
    document.addEventListener('analisis:stateChange', navigate);
    document.addEventListener('analisis:openArticle', openArticle);
    await renderAnalisisView(container);
    const search = container.querySelector('#explorer-search');
    search.value = 'pladese'; search.dispatchEvent(new Event('input'));
    const results = container.querySelectorAll('[data-explorer-results] button');
    expect(results).toHaveLength(1); results[0].click();
    expect(container.querySelector('h2').textContent).toContain('Sector Eléctrico');
    expect(navigate.mock.calls[0][0].detail).toEqual({ topicId: 'planeacion-vinculante', entityId: 'pladese' });
    container.querySelector('[data-open-article]').click();
    expect(openArticle.mock.calls[0][0].detail.id).toMatch(/^[0-9a-f-]{36}$/);
    document.removeEventListener('analisis:stateChange', navigate);
    document.removeEventListener('analisis:openArticle', openArticle);
  });

  it('keeps unlinked evidence visible and does not create broken article buttons', async () => {
    await renderAnalisisView(container, { topicId: 'consejos-comites', entityId: 'comite-cientifico' });
    expect(container.textContent).toContain('Referencia por vincular al acervo');
    const articleIds = [...container.querySelectorAll('[data-open-article]')].map(button => button.dataset.openArticle);
    expect(articleIds.every(id => /^[0-9a-f-]{36}$/.test(id))).toBe(true);
  });

  it('escapes imported markup and ignores unsafe source URLs at the rendering boundary', async () => {
    const catalog = clone(seed);
    const entity = catalog.entities.find(item => item.id === 'tema-planeacion-vinculante');
    entity.title = '<img src=x onerror=alert(1)>';
    entity.description = '<script>bad()</script>';
    entity.references = [{ label: '<b>malicious</b>', url: 'javascript:alert(1)' }];
    services.load.mockResolvedValue({ catalog });
    await renderAnalisisView(container);
    expect(container.querySelector('h2').textContent).toBe(entity.title);
    expect(container.querySelector('script, img, a[href^="javascript:"]')).toBeNull();
  });

  it('does not replace the search field when a late permissions response arrives', async () => {
    let resolvePermission;
    services.allowed.mockReturnValue(new Promise(resolve => { resolvePermission = resolve; }));
    await renderAnalisisView(container);
    const search = container.querySelector('#explorer-search');
    search.focus(); search.value = 'pla'; search.dispatchEvent(new Event('input'));
    resolvePermission(false); await Promise.resolve(); await Promise.resolve();
    expect(container.querySelector('#explorer-search')).toBe(search);
    expect(document.activeElement).toBe(search);
    expect(search.value).toBe('pla');
  });

  it('previews a local revision explicitly and returns to the published catalog', async () => {
    services.editor.mockImplementation(({ catalog, onPreview }) => {
      const draft = clone(catalog); draft.entities[0].title = 'Cambio en borrador'; onPreview(draft);
    });
    await renderAnalisisView(container);
    container.querySelector('[data-edit-catalog]').click(); await Promise.resolve();
    expect(container.querySelector('h2').textContent).toBe('Cambio en borrador');
    expect(container.textContent).toContain('Vista previa de un borrador local');
    container.querySelector('[data-return-published]').click();
    expect(container.querySelector('h2').textContent).toBe(seed.entities[0].title);
    expect(container.querySelector('[data-return-published]')).toBeNull();
  });
});
