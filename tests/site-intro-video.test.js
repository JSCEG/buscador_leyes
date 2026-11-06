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
    playIntro();
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
    playIntro();
    expect(video().getAttribute('src')).toBe('/video/intro-portrait.mp4');
  });
  it('opens the page from the eye when the film ends', async () => {
    const done = playIntro();
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
    playIntro();
    await vi.advanceTimersByTimeAsync(1000);
    expect(video()).toBeFalsy();
    expect(layer().classList.contains('is-playing')).toBe(true);
    expect(layer().classList.contains('is-video')).toBe(false);
  });
  it('falls back when autoplay is refused', async () => {
    play.mockImplementation(() => Promise.reject(new Error('NotAllowedError')));
    playIntro();
    await flush();
    await vi.advanceTimersByTimeAsync(20);
    expect(video()).toBeFalsy();
    expect(layer().classList.contains('is-playing')).toBe(true);
  });
  it('falls back when the file fails', async () => {
    playIntro();
    video().dispatchEvent(new Event('error'));
    await flush();
    await vi.advanceTimersByTimeAsync(20);
    expect(video()).toBeFalsy();
    expect(layer().classList.contains('is-playing')).toBe(true);
  });
  it('does not download the film when the visitor saves data', async () => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
    playIntro();
    await vi.advanceTimersByTimeAsync(20);
    expect(video()).toBeFalsy();
    expect(play).not.toHaveBeenCalled();
    expect(layer().classList.contains('is-playing')).toBe(true);
  });
  it('never hangs on a stalled film', async () => {
    const done = playIntro();
    video().dispatchEvent(new Event('playing'));
    await flush();
    await vi.advanceTimersByTimeAsync(7000);
    await done;
    expect(layer()).toBeNull();
  });
  it('can be skipped while the film plays', async () => {
    const done = playIntro();
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
