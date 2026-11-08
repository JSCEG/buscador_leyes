import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eyeCenter, playIntro } from '../src/scripts/site-intro.js';

const layer = () => document.getElementById('site-intro');
const video = () => layer()?.querySelector('video.si-video');
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

describe('intro video', () => {
  let play;
  beforeEach(() => {
    vi.useFakeTimers();
    play = vi.fn(() => Promise.resolve());
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.stubGlobal('requestAnimationFrame', callback => setTimeout(() => callback(performance.now() + 2000), 0));
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete navigator.connection;
    document.body.innerHTML = '';
    document.documentElement.classList.remove('intro-on');
  });

  it('plays muted and inline, hidden until it really starts', async () => {
    playIntro({ kind: 'video' });
    const element = video();
    expect(element.muted).toBe(true);
    expect(element.hasAttribute('playsinline')).toBe(true);
    expect(element.getAttribute('src')).toMatch(/^\/video\/intro-(landscape|portrait)\.mp4$/);
    expect(play).toHaveBeenCalled();
    expect(layer().classList.contains('is-video')).toBe(false);
    element.dispatchEvent(new Event('playing'));
    await flush();
    expect(layer().classList.contains('is-video')).toBe(true);
    expect(layer().classList.contains('is-playing')).toBe(false);
  });
  it('picks the vertical film on a tall screen', () => {
    vi.stubGlobal('innerWidth', 390);
    vi.stubGlobal('innerHeight', 844);
    playIntro({ kind: 'video' });
    expect(video().getAttribute('src')).toBe('/video/intro-portrait.mp4');
  });
  it('opens the page from the eye when the film ends', async () => {
    const done = playIntro({ kind: 'video' });
    const element = video();
    element.dispatchEvent(new Event('playing'));
    await flush();
    element.dispatchEvent(new Event('ended'));
    await flush();
    expect(layer().style.getPropertyValue('--ix')).toMatch(/px$/);
    await vi.advanceTimersByTimeAsync(50);
    await done;
    expect(layer()).toBeNull();
  });
  it('falls back to the CSS intro if the film is not ready in time', async () => {
    playIntro({ kind: 'video' });
    await vi.advanceTimersByTimeAsync(1000);
    expect(video()).toBeFalsy();
    expect(layer().classList.contains('is-playing')).toBe(true);
    expect(layer().classList.contains('is-video')).toBe(false);
  });
  it('falls back when autoplay is refused', async () => {
    play.mockImplementation(() => Promise.reject(new Error('NotAllowedError')));
    playIntro({ kind: 'video' });
    await flush();
    await vi.advanceTimersByTimeAsync(20);
    expect(video()).toBeFalsy();
    expect(layer().classList.contains('is-playing')).toBe(true);
  });
  it('falls back when the file fails', async () => {
    playIntro({ kind: 'video' });
    video().dispatchEvent(new Event('error'));
    await flush();
    await vi.advanceTimersByTimeAsync(20);
    expect(video()).toBeFalsy();
    expect(layer().classList.contains('is-playing')).toBe(true);
  });
  it('does not download the film when the visitor saves data', async () => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
    playIntro({ kind: 'video' });
    await vi.advanceTimersByTimeAsync(20);
    expect(video()).toBeFalsy();
    expect(play).not.toHaveBeenCalled();
    expect(layer().classList.contains('is-playing')).toBe(true);
  });
  it('never hangs on a stalled film', async () => {
    const done = playIntro({ kind: 'video' });
    video().dispatchEvent(new Event('playing'));
    await flush();
    await vi.advanceTimersByTimeAsync(12000);
    await done;
    expect(layer()).toBeNull();
  });
  it('can be skipped while the film plays', async () => {
    const done = playIntro({ kind: 'video' });
    video().dispatchEvent(new Event('playing'));
    await flush();
    layer().querySelector('.si-skip').click();
    await vi.advanceTimersByTimeAsync(50);
    await done;
    expect(layer()).toBeNull();
  });
  it('finds the eye inside a letterboxed film', () => {
    const film = { width: 1920, height: 1080, eye: [0.5, 0.25] };
    expect(eyeCenter({ left: 0, top: 0, width: 1920, height: 1080 }, film)).toEqual({ x: 960, y: 270 });
    expect(eyeCenter({ left: 0, top: 0, width: 960, height: 1000 }, film)).toEqual({ x: 480, y: 365 });
  });
  it('leaves films out of the service worker, which cannot answer range requests', () => {
    expect(readFileSync('public/sw.js', 'utf8')).toContain("url.pathname.startsWith('/video/')");
  });
});

describe('intro emblem', () => {
  const emblem = () => layer()?.querySelector('img.si-buho');
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', callback => setTimeout(() => callback(performance.now() + 2000), 0));
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
    delete document.documentElement.dataset.theme;
    document.documentElement.classList.remove('intro-on');
  });

  it('shows the light owl over the map and opens the site from its eye', async () => {
    document.documentElement.dataset.theme = 'light';
    const done = playIntro({ kind: 'emblem' });
    expect(emblem().getAttribute('src')).toBe('/img/intro-buho-claro.webp');
    expect(layer().querySelector('.si-map')).toBeTruthy();
    emblem().dispatchEvent(new Event('load'));
    await flush();
    await vi.advanceTimersByTimeAsync(20);
    expect(layer().classList.contains('is-buho')).toBe(true);
    expect(layer().classList.contains('is-claro')).toBe(true);
    await vi.advanceTimersByTimeAsync(2900);
    expect(layer()).toBeTruthy();
    await vi.advanceTimersByTimeAsync(200);
    await done;
    expect(layer()).toBeNull();
  });
  it('uses the dark owl on the dark themes', () => {
    document.documentElement.dataset.theme = 'contraste';
    playIntro({ kind: 'emblem' });
    expect(emblem().getAttribute('src')).toBe('/img/intro-buho-oscuro.webp');
  });
  it('falls back to the CSS intro if the picture is late', async () => {
    playIntro({ kind: 'emblem' });
    await vi.advanceTimersByTimeAsync(1600);
    expect(emblem()).toBeFalsy();
    expect(layer().classList.contains('is-playing')).toBe(true);
  });
});

describe('intro live owl', () => {
  const frame = () => layer()?.querySelector('iframe.si-buho3d');
  const say = data => window.dispatchEvent(new MessageEvent('message', { data, origin: location.origin, source: frame().contentWindow }));
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', callback => setTimeout(() => callback(performance.now() + 2000), 0));
    document.body.innerHTML = '<a id="nav-leyes" href="#acervo"></a>';
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete navigator.connection;
    document.body.innerHTML = '';
    delete document.documentElement.dataset.theme;
    document.documentElement.classList.remove('intro-on');
  });

  it('loads the owl over the map in the theme of the site, and shows it once it draws', async () => {
    document.documentElement.dataset.theme = 'dark';
    playIntro();
    expect(frame().getAttribute('src')).toBe('/intro/buho.html?tema=oscuro');
    expect(layer().classList.contains('is-buho3d')).toBe(true);
    expect(layer().classList.contains('is-buho3d-on')).toBe(false);
    say({ type: 'buho-listo' });
    await flush();
    expect(layer().classList.contains('is-buho3d-on')).toBe(true);
    // it waits for the visitor: no timer closes it
    await vi.advanceTimersByTimeAsync(30000);
    expect(layer()).toBeTruthy();
  });
  it('goes to the section the visitor picks, opening from the eye', async () => {
    const click = vi.fn();
    document.getElementById('nav-leyes').addEventListener('click', click);
    const done = playIntro();
    say({ type: 'buho-listo' });
    await flush();
    say({ type: 'buho-ir', seccion: 'acervo', ojo: [300, 200] });
    expect(layer().style.getPropertyValue('--ix')).toBe('300px');
    await vi.advanceTimersByTimeAsync(1000);
    await done;
    await flush();
    expect(layer()).toBeNull();
    expect(click).toHaveBeenCalledTimes(1);
  });
  it('ignores messages from other windows', async () => {
    playIntro();
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'buho-listo' }, origin: location.origin, source: window }));
    await flush();
    expect(layer().classList.contains('is-buho3d-on')).toBe(false);
  });
  it('falls back to the emblem if the owl does not answer in time', async () => {
    playIntro();
    await vi.advanceTimersByTimeAsync(4600);
    expect(frame()).toBeFalsy();
    expect(layer().querySelector('img.si-buho')).toBeTruthy();
  });
  it('falls back to the emblem without WebGL', async () => {
    playIntro();
    say({ type: 'buho-error' });
    await flush();
    expect(frame()).toBeFalsy();
    expect(layer().querySelector('img.si-buho')).toBeTruthy();
  });
  it('does not load the owl when the visitor saves data', async () => {
    navigator.connection = { saveData: true };
    playIntro();
    await flush();
    expect(frame()).toBeFalsy();
    expect(layer().querySelector('img.si-buho')).toBeTruthy();
  });
});
