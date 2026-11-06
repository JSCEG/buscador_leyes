import { afterEach, describe, expect, it, vi } from 'vitest';
import { wingsSvg } from '../src/lib/brand-wings.js';
import { playIntro } from '../src/scripts/site-intro.js';

describe('intro wings', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    document.documentElement.classList.remove('intro-on');
  });

  it('draws two matching wings, decorative only', () => {
    document.body.innerHTML = wingsSvg({ className: 'si-wings' });
    const svg = document.querySelector('svg.si-wings');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    const wings = [...svg.querySelectorAll('.si-wing')];
    expect(wings).toHaveLength(2);
    const feathers = wings.map(wing => wing.querySelectorAll('.si-feather').length);
    expect(feathers[0]).toBeGreaterThanOrEqual(8);
    expect(feathers[1]).toBe(feathers[0]);
  });
  it('unfolds feather by feather, starting with the long blade', () => {
    document.body.innerHTML = wingsSvg();
    const feathers = [...document.querySelector('.si-wing').querySelectorAll('.si-feather')];
    expect(feathers[0].classList.contains('si-blade')).toBe(true);
    expect(feathers.map(feather => Number(feather.style.getPropertyValue('--i')))).toEqual(feathers.map((_, index) => index));
  });
  it('mirrors the second wing around the mark', () => {
    document.body.innerHTML = wingsSvg();
    expect(document.querySelectorAll('.si-wing')[1].parentElement.getAttribute('transform')).toBe('matrix(-1 0 0 1 900 0)');
  });
  it('plays them behind the sheets in the intro', () => {
    vi.useFakeTimers();
    playIntro();
    const emblem = document.querySelector('#site-intro .si-emblem');
    expect(emblem.firstElementChild.classList.contains('si-wings')).toBe(true);
    expect(emblem.querySelector('.si-mark')).not.toBeNull();
    // The iris still opens from the mark's eye.
    expect(emblem.querySelector('.bm-lens circle:last-of-type')).not.toBeNull();
  });
});
