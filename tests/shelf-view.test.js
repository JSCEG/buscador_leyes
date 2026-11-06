import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildShelf, renderShelfView } from '../src/scripts/shelf-view.js';

const docs = n => Array.from({ length: n }, (_, i) => ({ id: `d${i}`, titulo: `Acuerdo ${String(i).padStart(3, '0')}`, siglas: `A${i}`, tipo: 'acuerdo', fecha_publicacion: '2026-01-01' }));
const mixed = [
  { id: 'r', titulo: 'Reglamento B', siglas: 'RB', tipo: 'reglamento' },
  { id: 'l2', titulo: 'Ley Z', siglas: 'LZ', tipo: 'ley' },
  { id: 'l1', titulo: 'Ley A', siglas: 'LA', tipo: 'ley' },
];
const frame = () => new Promise(resolve => setTimeout(resolve, 5));

describe('shelf view', () => {
  let host, view;
  beforeEach(() => {
    document.body.innerHTML = '<div id="h"></div>';
    host = document.getElementById('h');
    vi.stubGlobal('requestAnimationFrame', cb => setTimeout(() => cb(performance.now()), 0));
    vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    vi.stubGlobal('matchMedia', q => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
  });
  afterEach(() => { view?.destroy(); view = null; vi.unstubAllGlobals(); delete window.__introDone; });

  it('orders by collection, then title', () => {
    expect(buildShelf(mixed).items.map(l => l.id)).toEqual(['l1', 'l2', 'r']);
    expect(buildShelf(mixed).segments).toHaveLength(2);
  });
  it('states what the site is and offers search', () => {
    view = renderShelfView(host, { summaries: mixed, status: 'ready' });
    expect(host.querySelector('h1').textContent).toBe('Leyes y reglas de energía de México, en un solo lugar');
    expect(host.querySelector('.sh-search input').placeholder).toBe('Busca una ley, un artículo o un tema');
  });
  it('opens on the first law, with accessible structure', async () => {
    view = renderShelfView(host, { summaries: mixed, status: 'ready' }); await frame();
    expect(host.querySelector('.sh-caption-title').textContent).toContain('Ley A');
    expect(host.querySelector('.sh-stage').getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('[aria-roledescription="carrusel"]')).not.toBeNull();
    expect(host.querySelector('[aria-live="polite"]')).not.toBeNull();
  });
  it('renders only the visible tomes', async () => {
    view = renderShelfView(host, { summaries: docs(124), status: 'ready' }); await frame();
    const count = host.querySelectorAll('.sh-tome').length;
    expect(count).toBeGreaterThan(5); expect(count).toBeLessThanOrEqual(30);
  });
  it('gives each tome a back so it looks solid from both sides', async () => {
    view = renderShelfView(host, { summaries: mixed, status: 'ready' }); await frame();
    const back = host.querySelector('.sh-tome .sh-face--back');
    expect(back.getAttribute('style')).toContain('--sh-bg:');
  });
  it('leaves room for the bottom navigation the page reserves', async () => {
    document.body.style.paddingBottom = '68px';
    view = renderShelfView(host, { summaries: mixed, status: 'ready' });
    expect(host.querySelector('.sh-view').style.getPropertyValue('--sh-bottom')).toBe('68px');
    document.body.style.paddingBottom = '';
  });
  it('searches on Enter and ignores blanks', () => {
    const onSearch = vi.fn();
    view = renderShelfView(host, { summaries: mixed, status: 'ready', onSearch });
    const field = host.querySelector('.sh-search input');
    field.value = '   '; field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onSearch).not.toHaveBeenCalled();
    field.value = 'interconexión'; field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onSearch).toHaveBeenCalledWith('interconexión');
  });
  it('shows loading, then the catalog, with search available', async () => {
    view = renderShelfView(host, { status: 'loading' });
    expect(host.querySelector('.sh-status[data-state="loading"]')).not.toBeNull();
    expect(host.querySelector('.sh-search input').disabled).toBe(false);
    view.setCatalog(mixed); await frame();
    expect(host.querySelector('.sh-status')).toBeNull();
    expect(host.querySelector('.sh-caption-title').textContent).toContain('Ley A');
  });
  it('offers the full list on failure or empty catalog', () => {
    const onBrowse = vi.fn();
    view = renderShelfView(host, { status: 'loading', onBrowse });
    view.setFailed();
    expect(host.querySelector('.sh-status[data-state="error"]')).not.toBeNull();
    host.querySelector('.sh-status [data-sh-browse]').click();
    expect(onBrowse).toHaveBeenCalled();
    view.destroy();
    view = renderShelfView(host, { summaries: [], status: 'ready', onBrowse });
    expect(host.querySelector('.sh-status[data-state="error"]')).not.toBeNull();
  });
  it('wires the bottom line', () => {
    const onLegal = vi.fn(), onFeedback = vi.fn(), onBrowse = vi.fn();
    view = renderShelfView(host, { summaries: mixed, status: 'ready', onLegal, onFeedback, onBrowse });
    host.querySelector('[data-legal="privacidad"]').click(); expect(onLegal).toHaveBeenCalledWith('privacidad');
    host.querySelector('[data-feedback]').click(); expect(onFeedback).toHaveBeenCalled();
    host.querySelector('[data-sh-browse]').click(); expect(onBrowse).toHaveBeenCalled();
    expect(host.textContent).toContain('Diario Oficial de la Federación');
  });
  it('does not fail if destroyed while the intro is pending', async () => {
    let release; window.__introDone = new Promise(r => { release = r; });
    view = renderShelfView(host, { summaries: mixed, status: 'ready' });
    view.destroy(); view = null; release(); await frame();
    expect(host.querySelector('.sh-tome')).toBeNull();
  });
  it('stops asking for frames once at rest', async () => {
    const raf = vi.fn(cb => setTimeout(() => cb(performance.now()), 0));
    vi.stubGlobal('requestAnimationFrame', raf);
    view = renderShelfView(host, { summaries: mixed, status: 'ready' });
    for (let i = 0; i < 5; i++) await frame();
    const calls = raf.mock.calls.length;
    for (let i = 0; i < 5; i++) await frame();
    expect(raf.mock.calls.length).toBe(calls);
    host.querySelector('[data-sh-next]').click();
    await frame();
    expect(raf.mock.calls.length).toBeGreaterThan(calls);
  });
  it('stops its loop on destroy', async () => {
    const raf = vi.fn(cb => setTimeout(() => cb(performance.now()), 0));
    vi.stubGlobal('requestAnimationFrame', raf);
    view = renderShelfView(host, { summaries: mixed, status: 'ready' }); await frame();
    view.destroy(); view = null; await frame();
    const calls = raf.mock.calls.length; await frame();
    expect(raf.mock.calls.length).toBe(calls);
  });
});
