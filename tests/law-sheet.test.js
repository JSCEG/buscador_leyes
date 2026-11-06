import { afterEach, describe, expect, it, vi } from 'vitest';
import { openLawSheet } from '../src/scripts/law-sheet.js';

const law = { id: 'a', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'ley', fecha_publicacion: '2025-03-18', fecha_ultima_reforma: null, temas_clave: ['Tema 1', 'Tema 2'], url_original: 'https://dof.gob.mx/x', articulos: 120 };
const open = (data = law, extra = {}) => {
  document.body.innerHTML = '<button id="o">o</button><div id="h"></div>';
  document.getElementById('o').focus();
  return openLawSheet(data, { host: document.getElementById('h'), getOriginRect: () => ({ top: 0, left: 0, right: 10, bottom: 10, width: 10, height: 10 }), reducedMotion: true, onRead: vi.fn(), onShare: vi.fn(), onRequestClose: vi.fn(), ...extra });
};
afterEach(() => { document.body.innerHTML = ''; });

describe('law sheet', () => {
  it('shows name, official title, data and actions', () => {
    const { element } = open();
    expect(element.getAttribute('role')).toBe('dialog');
    expect(element.querySelector('h2').textContent).toContain('Ley del Sector Eléctrico');
    expect(element.textContent).toContain('120');
    expect(element.textContent).toContain('Tema 2');
    expect(element.querySelector('[data-sheet-source]').href).toBe('https://dof.gob.mx/x');
    expect(element.querySelector('[data-sheet-source]').rel).toContain('noopener');
  });
  it('hides missing data', () => {
    const { element } = open({ id: 'b', titulo: 'Acuerdo X', temas_clave: null, url_original: 'javascript:alert(1)', articulos: 0 });
    expect(element.querySelector('[data-sheet-source]')).toBeNull();
    expect(element.querySelector('[data-sheet-topics]')).toBeNull();
    expect(element.querySelector('[data-sheet-reform]')).toBeNull();
    expect(element.querySelector('[data-sheet-count]')).toBeNull();
  });
  it('ignores non-text topics and caps at 8', () => {
    const { element } = open({ ...law, temas_clave: [1, null, ...Array.from({ length: 10 }, (_, i) => `T${i}`)] });
    expect(element.querySelectorAll('[data-sheet-topics] li')).toHaveLength(8);
    element.querySelector('[data-sheet-more]').click();
    expect(element.querySelectorAll('[data-sheet-topics] li')).toHaveLength(10);
  });
  it('shows the path, an accent and icons on its actions', () => {
    const onRequestClose = vi.fn();
    const { element } = open(law, { onRequestClose });
    expect(element.querySelector('.sh-sheet-crumbs').textContent).toContain('Leyes');
    expect(element.querySelector('.sh-sheet-accent')).not.toBeNull();
    for (const action of ['read', 'share', 'source']) expect(element.querySelector(`[data-sheet-${action}] svg`)).not.toBeNull();
    element.querySelector('[data-sheet-home]').click();
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });
  it('sets long names at a calmer size so the details stay close', () => {
    const short = open();
    expect(short.element.querySelector('h2').hasAttribute('data-long')).toBe(false);
    const long = open({ ...law, siglas: 'X', titulo: `Ley ${'muy larga '.repeat(12)}` });
    expect(long.element.querySelector('h2').hasAttribute('data-long')).toBe(true);
  });
  it('escapes HTML from data', () => {
    const { element } = open({ ...law, titulo: '<img src=x onerror=alert(1)>', temas_clave: ['<b>x</b>'] });
    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('[data-sheet-topics] b')).toBeNull();
  });
  it('wires actions and closing', () => {
    const onRead = vi.fn(), onShare = vi.fn(), onRequestClose = vi.fn();
    const { element } = open(law, { onRead, onShare, onRequestClose });
    element.querySelector('[data-sheet-read]').click(); expect(onRead).toHaveBeenCalledWith(law);
    element.querySelector('[data-sheet-share]').click(); expect(onShare).toHaveBeenCalledWith(law);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    element.querySelector('[data-sheet-close]').click();
    expect(onRequestClose).toHaveBeenCalledTimes(2);
  });
  it('moves focus in, traps it, and returns it on close', async () => {
    const sheet = open();
    expect(sheet.element.contains(document.activeElement)).toBe(true);
    const buttons = [...sheet.element.querySelectorAll('button, a[href]')];
    buttons.at(-1).focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    sheet.element.dispatchEvent(tab);
    expect(document.activeElement).toBe(buttons[0]);
    await sheet.close(); await sheet.close();
    expect(document.querySelector('.sh-sheet')).toBeNull();
    expect(document.activeElement.id).toBe('o');
  });
});
