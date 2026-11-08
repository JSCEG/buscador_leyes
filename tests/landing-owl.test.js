import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountLandingOwl } from '../src/scripts/landing-owl.js';
import { elegirVidrioDelBuho, vidrioDelBuho } from '../src/lib/buho-vidrio.js';
import { revisar } from '../buho-bio/modelo.js';

let observers;
let stage;
let owl;
const frame = () => stage.querySelector('iframe.lp-owl-frame');
const say = (data, source = frame().contentWindow) => window.dispatchEvent(new MessageEvent('message', { data, origin: location.origin, source }));
const comeNear = () => observers[0].callback([{ isIntersecting: true }]);

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  sessionStorage.clear();
  observers = [];
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe() {}
    disconnect() {}
  });
  document.body.innerHTML = '<a id="nav-leyes" href="#acervo"></a><div id="stage"><img></div>';
  stage = document.getElementById('stage');
});
afterEach(() => {
  owl?.destroy();
  owl = null;
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete navigator.connection;
  delete document.documentElement.dataset.theme;
});

describe('the owl at the bottom of the landing', () => {
  it('weighs nothing until its section comes near', () => {
    owl = mountLandingOwl(stage);
    expect(frame()).toBeNull();
    comeNear();
    expect(frame().getAttribute('src')).toMatch(/^\/intro\/buho-bio\.html\?tema=claro&vidrio=(azul|verde)&modo=portada$/);
    expect(stage.classList.contains('is-on')).toBe(false);
  });
  it('takes the theme of the site', () => {
    document.documentElement.dataset.theme = 'dark';
    owl = mountLandingOwl(stage);
    comeNear();
    expect(frame().getAttribute('src')).toContain('tema=oscuro');
  });
  it('shows itself when it draws, and ignores other windows', () => {
    owl = mountLandingOwl(stage);
    comeNear();
    say({ type: 'buho-listo' }, window);
    expect(stage.classList.contains('is-on')).toBe(false);
    say({ type: 'buho-listo' });
    expect(stage.classList.contains('is-on')).toBe(true);
  });
  it('goes to the section the visitor picks', () => {
    const click = vi.fn();
    document.getElementById('nav-leyes').addEventListener('click', click);
    owl = mountLandingOwl(stage);
    comeNear();
    say({ type: 'buho-ir', seccion: 'acervo', ojo: [10, 10] });
    expect(click).toHaveBeenCalledTimes(1);
  });
  it('keeps the picture when the owl does not answer in time or has no WebGL', () => {
    owl = mountLandingOwl(stage);
    comeNear();
    vi.advanceTimersByTime(7100);
    expect(frame()).toBeNull();
    expect(stage.querySelector('img')).toBeTruthy();
    owl.destroy();
    owl = mountLandingOwl(stage);
    observers[observers.length - 1].callback([{ isIntersecting: true }]);
    say({ type: 'buho-error' });
    expect(frame()).toBeNull();
    expect(stage.querySelector('img')).toBeTruthy();
  });
  it('does not time out once it is drawing', () => {
    owl = mountLandingOwl(stage);
    comeNear();
    say({ type: 'buho-listo' });
    vi.advanceTimersByTime(60000);
    expect(frame()).toBeTruthy();
  });
  it('does not download when the visitor saves data, or cannot tell when it is near', () => {
    navigator.connection = { saveData: true };
    owl = mountLandingOwl(stage);
    comeNear();
    expect(frame()).toBeNull();
    owl.destroy();
    delete navigator.connection;
    vi.stubGlobal('IntersectionObserver', undefined);
    owl = mountLandingOwl(stage);
    expect(frame()).toBeNull();
  });
  it('tells the owl when it leaves the view, and when the theme changes', async () => {
    owl = mountLandingOwl(stage);
    comeNear();
    const post = vi.spyOn(frame().contentWindow, 'postMessage');
    observers[observers.length - 1].callback([{ isIntersecting: false }]);
    expect(post).toHaveBeenCalledWith({ type: 'buho-visible', visible: false }, location.origin);
    document.documentElement.dataset.theme = 'dark';
    await Promise.resolve();
    expect(post).toHaveBeenCalledWith({ type: 'buho-tema', tema: 'oscuro' }, location.origin);
  });
  describe('the main menu is its menu', () => {
    beforeEach(() => {
      document.body.insertAdjacentHTML('beforeend', `<nav class="bu-riel">
        <div data-nav="acervo"><a id="riel-acervo" class="bu-riel__it"></a></div>
        <details class="bu-riel__grupo" data-nav="aprende"><summary id="riel-aprende"></summary></details>
        <button id="riel-otro"></button></nav>
        <nav id="bottom-nav"><button data-nav="nav-leyes"></button><button data-more></button></nav>`);
    });
    const visible = si => observers[observers.length - 1].callback([{ isIntersecting: si }]);
    const marks = () => [...document.querySelectorAll('.is-senal-buho')];

    it('touching a part marks its section in the rail and the bottom bar', () => {
      owl = mountLandingOwl(stage);
      comeNear();
      visible(true);
      say({ type: 'buho-parte', seccion: 'acervo' });
      expect(marks().map(item => item.parentElement.className || item.parentElement.id)).toEqual(['bu-riel', 'bottom-nav']);
      say({ type: 'buho-parte', seccion: null });
      expect(marks()).toHaveLength(0);
    });
    it('a section that is not in the bottom bar marks «Más»', () => {
      owl = mountLandingOwl(stage);
      comeNear();
      visible(true);
      say({ type: 'buho-parte', seccion: 'aprende' });
      expect(document.querySelector('#bottom-nav [data-more]').classList.contains('is-senal-buho')).toBe(true);
      expect(document.querySelector('.bu-riel [data-nav="aprende"]').classList.contains('is-senal-buho')).toBe(true);
    });
    it('marks nothing while the owl is out of view, and again when it returns', () => {
      owl = mountLandingOwl(stage);
      comeNear();
      visible(true);
      say({ type: 'buho-parte', seccion: 'acervo' });
      visible(false);
      expect(marks()).toHaveLength(0);
      visible(true);
      expect(marks()).toHaveLength(2);
    });
    it('pointing at a section flies the owl there, not when just passing by', () => {
      owl = mountLandingOwl(stage);
      comeNear();
      visible(true);
      say({ type: 'buho-listo' });
      const post = vi.spyOn(frame().contentWindow, 'postMessage');
      const over = id => document.getElementById(id).dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));
      over('riel-acervo');
      vi.advanceTimersByTime(50);
      over('riel-aprende');
      vi.advanceTimersByTime(200);
      expect(post).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith({ type: 'buho-elegir', seccion: 'aprende' }, location.origin);
    });
    it('does not move the owl for other things, off screen, or before it draws', () => {
      owl = mountLandingOwl(stage);
      comeNear();
      visible(true);
      const post = vi.spyOn(frame().contentWindow, 'postMessage');
      const over = id => document.getElementById(id).dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));
      over('riel-acervo'); // todavía no dibuja
      say({ type: 'buho-listo' });
      over('riel-otro');
      visible(false);
      post.mockClear();
      over('riel-acervo');
      vi.advanceTimersByTime(200);
      expect(post).not.toHaveBeenCalled();
    });
    it('leaves the menu clean when it goes', () => {
      owl = mountLandingOwl(stage);
      comeNear();
      visible(true);
      say({ type: 'buho-parte', seccion: 'acervo' });
      owl.destroy();
      expect(marks()).toHaveLength(0);
    });
  });
  it('leaves nothing behind', () => {
    owl = mountLandingOwl(stage);
    comeNear();
    owl.destroy();
    expect(frame()).toBeNull();
  });
});

describe('the colour it loads in', () => {
  it('is blue or green, and they take turns between visits', () => {
    const first = vidrioDelBuho();
    expect(['azul', 'verde']).toContain(first);
    sessionStorage.clear();
    const second = vidrioDelBuho();
    expect(['azul', 'verde']).toContain(second);
    expect(second).not.toBe(first);
    sessionStorage.clear();
    expect(vidrioDelBuho()).toBe(first);
  });
  it('stays the same during a visit, so the landing and the guide match', () => {
    const first = vidrioDelBuho();
    expect(vidrioDelBuho()).toBe(first);
    expect(vidrioDelBuho()).toBe(first);
  });
  it('respects the colour the visitor chose', () => {
    elegirVidrioDelBuho('ambar');
    sessionStorage.clear();
    expect(vidrioDelBuho()).toBe('ambar');
    elegirVidrioDelBuho('morado');
    expect(vidrioDelBuho()).toBe('ambar');
  });
  it('works without storage', () => {
    const roto = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
    expect(['azul', 'verde']).toContain(vidrioDelBuho({ local: roto, sesion: roto }));
  });
});

describe('the numbers of the biomechanical owl', () => {
  it('fit: no part goes through the books and the open wings stay in frame', () => {
    expect(revisar()).toEqual([]);
  });
});
