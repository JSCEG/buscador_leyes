import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { figuresLine } from '../src/lib/landing-model.js';
import { renderLandingView } from '../src/scripts/landing-view.js';

const LSE = '8e404121-3502-4f47-937d-a43762c52da8';
const RLSH = 'bdfc48ed-5ff9-4746-9251-6e1fdc989c58';
const PLADESE = 'c30cb5dd-e944-52fd-8818-518a56b57fae';
const doc = (id, tipo, extra = {}) => ({ id, titulo: `Documento ${id}`, siglas: id.slice(0, 3).toUpperCase(), tipo, articulos: 10, fecha_publicacion: '2025-03-18', temas_clave: [], ...extra });
const summaries = [doc(LSE, 'ley'), doc(RLSH, 'reglamento'), doc(PLADESE, 'acuerdo'), doc('otra', 'ley')];

let host;
let view;
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
const mount = options => { view = renderLandingView(host, { onSearch: vi.fn(), fetchPolos: () => Promise.resolve([]), ...options }); return view; };

beforeEach(() => {
  const page = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html');
  document.body.innerHTML = '';
  host = document.adoptNode(page.getElementById('landing-view'));
  document.body.append(host);
  localStorage.clear();
  delete window.__landingQuery;
});
afterEach(() => { view?.destroy(); view = null; vi.unstubAllGlobals(); });

describe('catalog on the first screen', () => {
  it('fills the bars with links to each collection, and the figures', () => {
    mount({});
    view.setCatalog(summaries);
    const bars = [...host.querySelectorAll('[data-landing-bars] a')];
    expect(bars.map(bar => bar.getAttribute('href'))).toEqual(['#acervo?grupo=leyes', '#acervo?grupo=reglamentos', '#acervo?grupo=acuerdos']);
    expect(bars[0].textContent).toContain('Leyes');
    expect(bars[0].textContent).toContain('2');
    expect(host.querySelector('[data-landing-card]').dataset.state).toBe('ready');
    expect(host.querySelector('[data-landing-figures]').textContent.replace(/\s+/g, ' ').trim()).toBe(figuresLine({ documentos: 4, articulos: 40 }));
  });
  it('shows the last visit figures while it loads, and no number without them', () => {
    mount({});
    expect(host.querySelector('[data-landing-figures]').textContent.trim()).toBe('');
    view.destroy();
    localStorage.setItem('intro-cifras', JSON.stringify({ leyes: 126, articulos: 5879 }));
    mount({});
    expect(host.querySelector('[data-landing-figures]').textContent.replace(/\s+/g, ' ').trim()).toBe('5,879 artículos en 126 documentos');
  });
  it('hides card and figures when the catalog fails, and search still works', () => {
    const onSearch = vi.fn();
    mount({ onSearch });
    view.setFailed();
    expect(host.querySelector('[data-landing-card]').dataset.state).toBe('failed');
    expect(host.querySelector('[data-landing-figures]').textContent).toBe('');
    host.querySelector('#landing-search input').value = 'tarifa';
    host.querySelector('#landing-search').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(onSearch).toHaveBeenCalledWith('tarifa');
  });
  it('sends a cover that left the catalog to the Acervo', () => {
    mount({});
    view.setCatalog([doc(LSE, 'ley'), doc(RLSH, 'reglamento')]);
    const hrefs = [...host.querySelectorAll('[data-landing-books] a')].map(link => link.getAttribute('href'));
    expect(hrefs).toEqual([`#ficha-${RLSH}`, `#ficha-${LSE}`, '#acervo']);
  });
});

describe('search', () => {
  const submit = text => {
    host.querySelector('#landing-search input').value = text;
    host.querySelector('#landing-search').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  };
  it('searches what was typed, trimmed, and ignores an empty box', () => {
    const onSearch = vi.fn();
    mount({ onSearch });
    submit('  interconexión ');
    expect(onSearch).toHaveBeenCalledWith('interconexión');
    submit('   ');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
  it('runs once what was typed before the app started, when it is told to and not while it mounts', () => {
    const onSearch = vi.fn();
    window.__landingQuery = 'artículo 12';
    mount({ onSearch });
    expect(onSearch).not.toHaveBeenCalled();
    view.runPendingSearch();
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('artículo 12');
    expect(window.__landingQuery).toBeUndefined();
    view.runPendingSearch();
    view.destroy();
    mount({ onSearch });
    view.runPendingSearch();
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
  it('searches from the examples of the gallery', () => {
    const onSearch = vi.fn();
    mount({ onSearch });
    host.querySelector('[data-query="interconexión"]').click();
    expect(onSearch).toHaveBeenCalledWith('interconexión');
  });
});

describe('gallery while the catalog is not there', () => {
  const notes = () => [...host.querySelectorAll('[data-landing-note]')].map(note => note.textContent);
  it('says it is loading, instead of showing an empty space', () => {
    mount({});
    expect(notes()).toEqual(['Cargando documentos…', 'Cargando documentos…']);
  });
  it('says so when the catalog fails, and the links stay', () => {
    mount({});
    view.setFailed();
    expect(notes()).toEqual(['No pudimos traer la lista por ahora.', 'No pudimos traer la lista por ahora.']);
    expect(host.querySelector('[data-sec="acervo"] .lp-link')).not.toBeNull();
    expect(host.querySelector('.lp-shelf')).not.toBeNull();
  });
  it('removes the note when the catalog arrives', () => {
    mount({});
    view.setCatalog(summaries);
    expect(notes()).toEqual([]);
    expect(host.querySelector('[data-landing-covers] a')).not.toBeNull();
    expect(host.querySelector('[data-landing-line] a')).not.toBeNull();
  });
});

describe('links of the landing', () => {
  it('lets the browser open a section in a new tab', () => {
    const target = document.createElement('a');
    target.id = 'nav-leyes';
    const opened = vi.fn(event => event.preventDefault());
    target.addEventListener('click', opened);
    document.body.append(target);
    mount({});
    const link = host.querySelector('[data-sec="acervo"] [data-landing-go]');
    const modified = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    link.dispatchEvent(modified);
    expect(modified.defaultPrevented).toBe(false);
    expect(opened).not.toHaveBeenCalled();
    const plain = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBe(true);
    expect(opened).toHaveBeenCalledTimes(1);
  });
});

describe('gallery', () => {
  it('has six sections and the owl, with its picture lazy and the 3D only when the section comes near', () => {
    mount({});
    expect([...host.querySelectorAll('.lp-sec h3')].map(title => title.textContent)).toEqual(['Buscar', 'Acervo', 'Cronología', 'Permisos', 'Polos', 'Aprende']);
    const owl = host.querySelector('.lp-owl');
    expect(owl.textContent).toContain('¿Primera vez? El búho te enseña el sitio.');
    expect(owl.querySelector('[data-abrir-buho]').textContent.trim()).toBe('Abrir la guía');
    const pictures = [...owl.querySelectorAll('img')];
    expect(pictures).toHaveLength(1);
    expect(pictures[0].getAttribute('src')).toMatch(/^\/img\/buho-bio-(azul|verde)\.webp$/);
    expect(pictures[0].getAttribute('loading')).toBe('lazy');
    expect(host.querySelector('iframe')).toBeNull();
  });
  it('uses the approved words', () => {
    mount({});
    const text = host.querySelector('[data-landing-gallery]').textContent;
    ['Lo que encuentras aquí', 'Escribe una palabra y ve cada artículo donde aparece.',
      'Todos los documentos, por tipo y dependencia. Por artículo o como libro.', 'Qué se publicó y cuándo, en una sola línea.',
      'Quién tiene permiso de energía y dónde, en el mapa.', 'Los polos de desarrollo: dónde están y cómo van.',
      'Cómo funciona una central, en figuras que giras y desarmas.'].forEach(words => expect(text).toContain(words));
  });
  it('does not rebuild twice nor keep old listeners when it comes back', () => {
    const onSearch = vi.fn();
    mount({ onSearch });
    view.destroy();
    mount({ onSearch });
    expect(host.querySelectorAll('.lp-sec')).toHaveLength(6);
    host.querySelector('#landing-search input').value = 'tarifa';
    host.querySelector('#landing-search').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
  it('escapes what the catalog says', () => {
    mount({});
    view.setCatalog([doc('x', 'ley', { titulo: '<img src=x onerror=1> & otro', siglas: '' }), doc('y', 'acuerdo', { titulo: 'Sin fecha', siglas: 'SF', fecha_publicacion: null })]);
    const gallery = host.querySelector('[data-landing-gallery]');
    expect(gallery.querySelector('img[src="x"]')).toBeNull();
    expect(gallery.textContent).toContain('<img src=x onerror=1> & otro');
  });
  it('walks each section link through the rail', () => {
    document.body.insertAdjacentHTML('beforeend', '<a id="nav-cronologia" href="#cronologia"></a>');
    const rail = vi.fn();
    document.getElementById('nav-cronologia').addEventListener('click', rail);
    mount({});
    host.querySelector('[data-landing-go="nav-cronologia"]').click();
    expect(rail).toHaveBeenCalledTimes(1);
  });
  it('answers the links of its footer', () => {
    const onLegal = vi.fn();
    const onFeedback = vi.fn();
    mount({ onLegal, onFeedback });
    const link = host.querySelector('[data-legal="privacidad"]');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(onLegal).toHaveBeenCalledWith('privacidad');
    expect(click.defaultPrevented).toBe(true);
    host.querySelector('[data-feedback]').click();
    expect(onFeedback).toHaveBeenCalledTimes(1);
  });
  it('opens the desk', () => {
    const onOpenDesk = vi.fn();
    mount({ onOpenDesk });
    host.querySelector('[data-landing-desk]').click();
    expect(onOpenDesk).toHaveBeenCalledTimes(1);
  });
});

describe('polos', () => {
  let watched;
  beforeEach(() => {
    watched = [];
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback) { this.callback = callback; watched.push(this); }
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });
  const enter = element => watched.forEach(observer => observer.callback([{ isIntersecting: true, target: element }], observer));

  it('asks for the file only when the section comes near, and counts what is in force', async () => {
    const fetchPolos = vi.fn(() => Promise.resolve([{ id: 'a', figura: 'PODEBI', estado: 'Veracruz', lat: 18.1, lng: -94.4 }, { id: 'b', figura: 'PODEBI', estado: 'Puebla', lat: 19, lng: -98.2 }, { id: 'c', estatus: 'abrogada', estado: 'Sonora', lat: 29, lng: -110 }]));
    mount({ fetchPolos });
    expect(fetchPolos).not.toHaveBeenCalled();
    const section = host.querySelector('.lp-sec[data-sec="polos"]');
    enter(section);
    await flush();
    enter(section);
    await flush();
    expect(fetchPolos).toHaveBeenCalledTimes(1);
    expect(section.querySelector('[data-polos-count]').textContent).toBe('2 polos en 2 estados');
    expect(section.querySelectorAll('.lp-map-dot')).toHaveLength(2);
  });
  it('stays quiet when the file fails', async () => {
    mount({ fetchPolos: () => Promise.reject(new Error('404')) });
    const section = host.querySelector('.lp-sec[data-sec="polos"]');
    enter(section);
    await flush();
    expect(section.querySelector('[data-polos-count]').textContent).toBe('');
  });
  it('shows every section at once without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const fetchPolos = vi.fn();
    mount({ fetchPolos });
    expect(host.querySelectorAll('.lp-sec.is-in')).toHaveLength(6);
    expect(fetchPolos).not.toHaveBeenCalled();
  });
});
