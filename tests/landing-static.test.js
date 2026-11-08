import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

const html = readFileSync('index.html', 'utf8');
const BOOKS = [
  'bdfc48ed-5ff9-4746-9251-6e1fdc989c58', // RLSH
  '8e404121-3502-4f47-937d-a43762c52da8', // LSE
  'c30cb5dd-e944-52fd-8818-518a56b57fae', // PLADESE
];

/** Runs the boot script of <head> for an address; says whether it marks the landing. */
function marks(pathname, hash = '') {
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(text => text.includes('landing-on'));
  const added = [];
  const fakeDocument = { documentElement: { classList: { add: name => added.push(name) } }, addEventListener() {} };
  new Function('location', 'document', 'window', code)({ pathname, hash }, fakeDocument, {});
  return added.includes('landing-on');
}

describe('landing boot', () => {
  it('marks only the bare home address', () => {
    expect(marks('/')).toBe(true);
    expect(marks('/index.html')).toBe(true);
    expect(marks('/', '#acervo')).toBe(false);
    expect(marks('/', '#art-1')).toBe(false);
    expect(marks('/ley/ley-del-sector-electrico')).toBe(false);
    expect(marks('/instalar')).toBe(false);
    expect(marks('/otra')).toBe(false);
  });
  it('marks the home address when an auth email comes back to it, whose dialog opens over the landing', () => {
    expect(marks('/', '#access_token=abc&type=recovery')).toBe(true);
    expect(marks('/', '#error=access_denied&error_description=x')).toBe(true);
    expect(marks('/ley/x', '#access_token=abc')).toBe(false);
  });
  it('hides the search page while an address waits for its view', () => {
    const waits = (pathname, hash) => {
      const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(text => text.includes('landing-on'));
      const added = [];
      new Function('location', 'document', 'window', code)({ pathname, hash }, { documentElement: { classList: { add: name => added.push(name) } }, addEventListener() {} }, {});
      return added.includes('route-wait');
    };
    expect(waits('/', '#cronologia')).toBe(true);
    expect(waits('/', '#art-1')).toBe(true);
    expect(waits('/', '#buscar')).toBe(false);
    expect(waits('/', '')).toBe(false);
    expect(waits('/', '#access_token=abc')).toBe(false);
    expect(html).toMatch(/html\.route-wait #hero-section/);
  });
  it('keeps the search typed before the app starts', () => {
    const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(text => text.includes('landing-on'));
    let submit = null;
    const fakeDocument = { documentElement: { classList: { add() {} } }, addEventListener: (type, fn) => { if (type === 'submit') submit = fn; } };
    const fakeWindow = {};
    new Function('location', 'document', 'window', code)({ pathname: '/', hash: '' }, fakeDocument, fakeWindow);
    let prevented = false;
    submit({ target: { id: 'landing-search', elements: { q: { value: '  interconexión ' } } }, preventDefault: () => { prevented = true; } });
    expect(prevented).toBe(true);
    expect(fakeWindow.__landingQuery).toBe('interconexión');
  });
  it('never loads the live owl on arrival', () => {
    expect(html).not.toContain('/intro/buho.html');
    expect(readFileSync('src/main.js', 'utf8')).not.toMatch(/playIntro|shouldShowIntro/);
  });
});

describe('landing first screen', () => {
  let view;
  beforeAll(() => {
    view = new DOMParser().parseFromString(html, 'text/html').getElementById('landing-view');
  });

  it('is the page\'s main landmark while it is on screen', () => {
    expect(view.getAttribute('role')).toBe('main');
  });
  it('sits before the search area, so it paints first', () => {
    expect(html.indexOf('id="landing-view"')).toBeLessThan(html.indexOf('id="main-container"'));
  });
  it('has the approved words', () => {
    const title = view.querySelector('h1').textContent.replace(/\s+/g, ' ').trim();
    expect(title).toBe('Las reglas de la energía en México, a la mano.');
    expect(view.querySelector('h1 span').textContent).toBe('a la mano.');
    expect(view.textContent).toContain('Escribe una palabra y ve en qué ley, reglamento o acuerdo aparece. Gratis y sin registrarte.');
    expect(view.querySelector('#landing-search input').placeholder).toBe('Busca una ley, un artículo o un tema');
    expect(view.querySelector('#landing-search button[type="submit"]').textContent.trim()).toBe('Buscar');
    expect(view.querySelector('a[href="#acervo"]').textContent).toContain('Ver los documentos');
    expect(view.textContent).toContain('Qué hay en el acervo');
    expect(view.textContent).toContain('Tu mesa de consulta');
    expect(view.textContent).toContain('Junta artículos de varias leyes y léelos lado a lado.');
    expect(view.querySelector('[data-landing-desk]').textContent.trim()).toBe('Abrir mi mesa');
  });
  it('links three real covers to their sheets', () => {
    const links = [...view.querySelectorAll('[data-landing-books] a')];
    expect(links.map(link => link.getAttribute('href'))).toEqual(BOOKS.map(id => `#ficha-${id}`));
    links.forEach(link => {
      expect(link.querySelector('.sh-cover')).not.toBeNull();
      expect(link.getAttribute('aria-label')).toBeTruthy();
    });
  });
  it('offers the four themes', () => {
    const choices = [...view.querySelectorAll('[data-theme-choice]')].map(option => option.dataset.themeChoice);
    expect(choices).toEqual(['light', 'dark', 'sepia', 'contraste']);
  });
  it('has the places the view fills', () => {
    ['[data-landing-bars]', '[data-landing-figures]', '[data-landing-gallery]', '[data-landing-foot]', '[data-landing-card]'].forEach(selector => {
      expect(view.querySelector(selector), selector).not.toBeNull();
    });
  });
});
