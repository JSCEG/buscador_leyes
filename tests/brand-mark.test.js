import { afterEach, describe, expect, it } from 'vitest';
import { brandMarkSvg } from '../src/lib/brand-mark.js';

const draw = options => {
  document.body.innerHTML = brandMarkSvg(options);
  return document.querySelector('svg');
};

describe('brand mark', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('draws an S under the owl brow, with one eye', () => {
    const svg = draw();
    expect(svg.getAttribute('aria-label')).toBe('Buscador Jurídico');
    expect(svg.querySelector('path.bm-brow')).not.toBeNull();
    expect(svg.querySelector('path.bm-body')).not.toBeNull();
    expect(svg.querySelectorAll('path.bm-eye')).toHaveLength(1);
    expect(svg.querySelector('.bm-head')).toBeNull();
  });
  it('keeps the parts the entrance animation plays', () => {
    const svg = draw({ shine: true });
    for (const part of ['.bm-bar', '.bm-page', '.bm-lens', '.bm-ripple', '.bm-shine']) {
      expect(svg.querySelector(part), part).not.toBeNull();
    }
    // The intro's ring opens from this circle.
    expect(svg.querySelector('.bm-lens circle:last-of-type')).not.toBeNull();
  });
  it('adds the light sweep only when asked', () => {
    expect(draw().querySelector('.bm-shine')).toBeNull();
  });
  it('takes its colours from the options', () => {
    const svg = draw({ color: '#111111', lens: '#333333' });
    expect(svg.querySelector('.bm-brow').getAttribute('fill')).toBe('#111111');
    expect(svg.querySelector('.bm-body').getAttribute('fill')).toBe('#111111');
    expect(svg.querySelector('.bm-eye').getAttribute('fill')).toBe('#333333');
  });
});
