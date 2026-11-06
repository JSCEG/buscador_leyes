import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderBookView } from '../src/scripts/book-view.js';

const articles = [
  { id: 'a', label: 'Artículo 1', titulo: 'TÍTULO I', capitulo: 'Capítulo I', texto: 'Uno' },
  { id: 'b', label: 'Artículo 2', titulo: 'TÍTULO I', capitulo: 'Capítulo II', texto: 'Dos' },
  { id: 'c', label: 'Artículo 3', titulo: 'TÍTULO II', capitulo: '', texto: 'Tres' },
];
const paged = async list => ({ pages: list.map(article => ({ html: `<p>${article.texto}</p>`, caption: article.label, articleIds: [article.id] })), tables: {} });
const lawOf = () => ({ id: `s-${Math.random()}`, titulo: 'Ley', siglas: 'L', tipo: 'ley' });

describe('book navigation and loading', () => {
  let view;
  const open = async (extra = {}) => {
    document.body.innerHTML = '<div id="h"></div>';
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    const host = document.getElementById('h');
    view = renderBookView(host, { law: lawOf(), articles, paginator: paged, ...extra });
    await view.ready;
    return host;
  };
  afterEach(() => view?.destroy());

  it('has an index page after the cover whose entries open their page', async () => {
    const host = await open();
    view.goToIndex();
    const entries = [...host.querySelectorAll('[data-book-goto]')];
    expect(entries.map(entry => entry.querySelector('span').textContent)).toEqual(['TÍTULO I', 'Capítulo I', 'Capítulo II', 'TÍTULO II']);
    entries.at(-1).click();
    expect(view.currentArticle()).toBe('c');
    expect(host.querySelector('.bk-tx').textContent).toContain('Tres');
  });
  it('prints the page each entry leads to', async () => {
    const host = await open();
    view.goToIndex();
    const last = [...host.querySelectorAll('[data-book-goto]')].at(-1);
    expect(last.querySelector('b').textContent).toBe('4');
  });
  it('goes back to the index from any page and from the bar', async () => {
    const host = await open();
    view.goToArticle('c');
    host.querySelector('[data-book-toindex]').click();
    expect(host.querySelector('[data-book-goto]')).not.toBeNull();
    view.goToArticle('c');
    host.querySelector('[data-book-index]').click();
    expect(host.querySelector('[data-book-goto]')).not.toBeNull();
  });
  it('shows a loader with progress while the pages are built', async () => {
    let finish;
    let report;
    const slow = (list, options, { onProgress }) => new Promise(resolve => { report = onProgress; finish = () => paged(list).then(resolve); });
    document.body.innerHTML = '<div id="h"></div>';
    const host = document.getElementById('h');
    view = renderBookView(host, { law: lawOf(), articles, paginator: slow });
    await vi.waitFor(() => expect(report).toBeTruthy());
    const loader = host.querySelector('[data-book-loading]');
    expect(loader.hidden).toBe(false);
    report(0.4);
    expect(loader.textContent).toContain('40%');
    finish();
    await view.ready;
    expect(loader.hidden).toBe(true);
  });
  it('shares the current reading from a menu', async () => {
    const getShareUrl = vi.fn(id => `https://x.mx/ley/l?libro=1&art=${id}`);
    const host = await open({ getShareUrl });
    view.goToArticle('b');
    host.querySelector('[data-book-share]').click();
    expect(getShareUrl).toHaveBeenCalledWith('b');
    const whatsapp = host.querySelector('.bk-menu a[data-share="whatsapp"]');
    expect(decodeURIComponent(whatsapp.href)).toContain('art=b');
    expect(whatsapp.target).toBe('_blank');
  });
  it('can open on the article of a shared link', async () => {
    await open({ initialArticle: 'c' });
    expect(view.currentArticle()).toBe('c');
  });
});
