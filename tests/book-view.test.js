import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderBookView } from '../src/scripts/book-view.js';

const law = { id: 'lse', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'ley', fecha_publicacion: '2025-03-18' };
const articles = ['1', '2', '3', '4', '5', '6'].map(n => ({ id: `a${n}`, label: `Artículo ${n}`, texto: `Artículo ${n}.- Texto ${n}.`, articulo_label: `Artículo ${n}` }));
// Six content pages, one article each.
const paginator = async list => ({ pages: list.map(article => ({ html: `<p>${article.texto}</p><button class="bk-art" data-book-article="${article.id}">${article.label}</button>`, caption: 'Capítulo I', articleIds: [article.id] })), tables: {} });

describe('book view', () => {
  let host, view;
  const count = () => host.querySelector('[data-book-count]').textContent;
  const open = async (extra = {}) => { view = renderBookView(host, { law: { ...law, id: `${law.id}-${Math.random()}` }, articles, paginator, ...extra }); await view.ready; return view; };

  beforeEach(() => {
    document.body.innerHTML = '<div id="h"></div>';
    host = document.getElementById('h');
    localStorage.clear();
    vi.stubGlobal('matchMedia', q => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
    window.innerWidth = 1400;
  });
  afterEach(() => { view?.destroy(); view = null; vi.unstubAllGlobals(); vi.restoreAllMocks(); delete Element.prototype.animate; });

  it('opens on the cover and pages through', async () => {
    await open();
    expect(count()).toContain('Portada');
    expect(host.querySelector('.bk-portada').textContent).toContain('LSE');
    host.querySelector('[data-book-next]').click();
    expect(count()).toContain('Páginas 2–3');
  });
  it('goes to an article and reports it', async () => {
    await open();
    expect(view.goToArticle('a4')).toBe(true);
    expect(view.currentArticle()).toBe('a4');
    expect(view.goToArticle('nope')).toBe(false);
  });
  it('shows the legal notice on its last page', async () => {
    await open();
    host.querySelector('[data-book-range]').value = '100';
    view.goToArticle('a6');
    host.querySelector('[data-book-next]').click();
    expect(host.textContent).toContain('El texto con validez jurídica');
  });
  it('restores the same article when coming back', async () => {
    const same = { ...law, id: 'fijo' };
    view = renderBookView(host, { law: same, articles, paginator }); await view.ready;
    view.goToArticle('a5');
    view.destroy();
    view = renderBookView(host, { law: same, articles, paginator }); await view.ready;
    expect(view.currentArticle()).toBe('a5');
  });
  it('remembers marks per document', async () => {
    const same = { ...law, id: 'marcas' };
    view = renderBookView(host, { law: same, articles, paginator }); await view.ready;
    view.goToArticle('a3');
    host.querySelector('[data-book-mark]').click();
    expect(host.querySelector('[data-book-mark]').getAttribute('aria-pressed')).toBe('true');
    expect(JSON.parse(localStorage.getItem('libro-v1:marcas')).marks).toHaveLength(1);
  });
  it('works without localStorage', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    await expect(open()).resolves.toBeDefined();
    host.querySelector('[data-book-next]').click();
    expect(count()).toContain('Páginas');
  });
  it('falls back to articles if pagination fails', async () => {
    const onExit = vi.fn(), notify = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await open({ paginator: async () => { throw new Error('no'); }, onExit, notify });
    expect(onExit).toHaveBeenCalled();
    expect(notify.mock.calls[0][0]).toContain('No se pudo armar el libro');
  });
  it('announces the page with aria-live', async () => {
    await open();
    expect(host.querySelector('[data-book-count]').getAttribute('aria-live')).toBe('polite');
  });
  it('a fast second turn does not interrupt the next one', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    const animations = [];
    Element.prototype.animate = vi.fn(function animate() {
      const animation = { finish() { this.onfinish?.(); }, onfinish: null, oncancel: null };
      animations.push(animation);
      return animation;
    });
    await open();
    host.querySelector('[data-book-next]').click();
    host.querySelector('[data-book-next]').click();
    expect(count()).toContain('Páginas 4–5');
    expect(host.querySelectorAll('.bk-hoja')).toHaveLength(1);
  });
  it('turns one page below 900 px', async () => {
    window.innerWidth = 600;
    await open();
    expect(host.querySelector('.bk-libro').classList.contains('is-una')).toBe(true);
    host.querySelector('[data-book-next]').click();
    expect(count()).toBe('Página 1 de 7');
  });
  it('offers the article menu', async () => {
    const onArticleAction = vi.fn();
    await open({ onArticleAction });
    view.goToArticle('a2');
    host.querySelector('[data-book-article="a2"]').click();
    const labels = [...host.querySelectorAll('.bk-menu [data-book-action]')].map(button => button.textContent);
    expect(labels).toEqual(['Leer por artículo', 'Ver el original', 'Copiar cita formal', 'Copiar', 'Compartir', 'Fijar', 'Guardar']);
    host.querySelector('[data-book-action="cita"]').click();
    expect(onArticleAction).toHaveBeenCalledWith('cita', 'a2');
  });
  it('exits with the article in view', async () => {
    const onExit = vi.fn();
    await open({ onExit });
    view.goToArticle('a3');
    host.querySelector('[data-book-exit]').click();
    expect(onExit).toHaveBeenCalledWith('a3');
  });
});
