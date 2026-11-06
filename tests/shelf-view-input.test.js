import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderShelfView } from '../src/scripts/shelf-view.js';

const mixed = [
  { id: 'r', titulo: 'Reglamento B', siglas: 'RB', tipo: 'reglamento' },
  { id: 'l2', titulo: 'Ley Z', siglas: 'LZ', tipo: 'ley' },
  { id: 'l1', titulo: 'Ley A', siglas: 'LA', tipo: 'ley' },
];
const frame = () => new Promise(resolve => setTimeout(resolve, 5));

describe('shelf input', () => {
  let host, view, onSheetChange, next, prev, region, field;
  const title = () => host.querySelector('.sh-caption-title').textContent;
  const tome = id => host.querySelector(`.sh-tome[data-law-id="${id}"]`);
  const stage = () => host.querySelector('.sh-stage');
  const pointer = (type, clientX) => host.querySelector('.sh-shelf').dispatchEvent(new MouseEvent(type, { clientX, clientY: 10, bubbles: true }));
  const stageWheel = init => host.querySelector('.sh-shelf').dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init }));
  const setScrollable = yes => Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: yes ? 99999 : 0 });
  const arrow = target => target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

  beforeEach(async () => {
    document.body.innerHTML = '<div id="h"></div>';
    host = document.getElementById('h');
    vi.stubGlobal('requestAnimationFrame', cb => setTimeout(() => cb(performance.now()), 0));
    vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    vi.stubGlobal('matchMedia', q => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
    onSheetChange = vi.fn();
    view = renderShelfView(host, { summaries: mixed, status: 'ready', onSheetChange });
    await frame();
    next = host.querySelector('[data-sh-next]');
    prev = host.querySelector('[data-sh-prev]');
    region = host.querySelector('[aria-roledescription="carrusel"]');
    field = host.querySelector('.sh-search input');
  });
  afterEach(() => { view?.destroy(); view = null; vi.unstubAllGlobals(); delete document.documentElement.scrollHeight; });

  it('steps and wraps with the arrows', async () => {
    next.click(); await frame(); expect(title()).toContain('Ley Z');
    prev.click(); await frame(); prev.click(); await frame();
    expect(title()).toContain('Ley A');
  });
  it('uses arrow keys inside the carousel, not in the search field', async () => {
    arrow(region); await frame();
    expect(title()).toContain('Ley Z');
    arrow(field); await frame();
    expect(title()).toContain('Ley Z');
  });
  it('brings a clicked spine to the centre and opens its sheet when it arrives', async () => {
    tome('l2').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.querySelector('.sh-sheet')).toBeNull();
    await frame();
    expect(title()).toContain('Ley Z'); expect(document.querySelector('.sh-sheet')).not.toBeNull();
  });
  it('opens the sheet from the active cover and reports it', async () => {
    tome('l1').dispatchEvent(new MouseEvent('click', { bubbles: true })); await frame();
    expect(document.querySelector('.sh-sheet')).not.toBeNull();
    expect(onSheetChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'l1' }));
  });
  it('opens the sheet from the keyboard button', async () => {
    host.querySelector('[data-sh-open]').click(); await frame();
    expect(document.querySelector('.sh-sheet')).not.toBeNull();
  });
  it('closing through the sheet reports null', async () => {
    host.querySelector('[data-sh-open]').click(); await frame();
    document.querySelector('[data-sheet-close]').click(); await frame();
    expect(document.querySelector('.sh-sheet')).toBeNull();
    expect(onSheetChange).toHaveBeenLastCalledWith(null);
  });
  it('a drag is not a click', async () => {
    pointer('pointerdown', 300); pointer('pointermove', 200); pointer('pointerup', 200);
    tome('l1')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); await frame();
    expect(document.querySelector('.sh-sheet')).toBeNull();
  });
  it('a drag moves the shelf and snaps to a document', async () => {
    pointer('pointerdown', 300); pointer('pointermove', 300 - 66); pointer('pointerup', 300 - 66); await frame();
    expect(title()).toContain('Ley Z');
  });
  it('a press without movement still lets the click through', async () => {
    pointer('pointerdown', 300); pointer('pointerup', 301);
    tome('l1').dispatchEvent(new MouseEvent('click', { bubbles: true })); await frame();
    expect(document.querySelector('.sh-sheet')).not.toBeNull();
  });
  it('wheel moves the shelf only when the page does not scroll', async () => {
    setScrollable(true);
    stageWheel({ deltaY: 200 }); await frame(); expect(title()).toContain('Ley A');
    setScrollable(false);
    stageWheel({ deltaY: 200 }); await frame(); expect(title()).not.toContain('Ley A');
  });
  it('ignores shelf input while the sheet is open', async () => {
    view.openSheet('l1', { silent: true }); await frame();
    next.click(); arrow(region);
    stageWheel({ deltaY: 200 });
    pointer('pointerdown', 300); pointer('pointermove', 100); pointer('pointerup', 100); await frame();
    expect(title()).toContain('Ley A');
  });
  it('silent changes do not report and unknown ids are refused', async () => {
    expect(view.openSheet('nope', { silent: true })).toBe(false);
    expect(view.openSheet('l2', { silent: true })).toBe(true); await frame();
    expect(title()).toContain('Ley Z');
    await view.closeSheet({ silent: true });
    expect(document.querySelector('.sh-sheet')).toBeNull();
    expect(onSheetChange).not.toHaveBeenCalled();
  });
  it('focusLaw centres a document', async () => {
    view.focusLaw('r'); await frame();
    expect(title()).toContain('Reglamento B');
  });
  it('keeps the active document across a resize', async () => {
    next.click(); await frame();
    window.dispatchEvent(new Event('resize')); await frame();
    expect(title()).toContain('Ley Z');
    expect(host.querySelectorAll('.sh-tome').length).toBeGreaterThan(0);
  });
  it('hides arrows with a single document', async () => {
    view.destroy(); view = renderShelfView(host, { summaries: [mixed[0]], status: 'ready' }); await frame();
    expect(host.querySelector('[data-sh-next]').hidden).toBe(true);
  });
  it('never stacks caption lines during a long jump', async () => {
    view.destroy();
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    const animate = vi.fn(() => ({ cancel() {}, onfinish: null, oncancel: null }));
    Element.prototype.animate = animate;
    const docs = Array.from({ length: 60 }, (_, i) => ({ id: `d${i}`, titulo: `Acuerdo ${String(i).padStart(3, '0')}`, siglas: `A${i}`, tipo: 'acuerdo' }));
    view = renderShelfView(host, { summaries: docs, status: 'ready' }); await frame();
    view.focusLaw('d25');
    let most = 0;
    for (let i = 0; i < 30; i++) {
      await frame();
      most = Math.max(most, host.querySelectorAll('.sh-caption-title .is-leaving').length);
    }
    delete Element.prototype.animate;
    expect(most).toBeLessThanOrEqual(1);
  });
  it('removes its listeners on destroy', async () => {
    view.destroy();
    expect(() => window.dispatchEvent(new Event('resize'))).not.toThrow();
    view = null;
  });
});
