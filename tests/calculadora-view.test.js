import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderCalculadoraView } from '../src/scripts/calculadora-view.js';
import { calcRoute } from '../src/lib/calc/ruta.js';

const montar = (hash = '#calculadora') => {
  const host = document.createElement('div');
  document.body.append(host);
  const onRoute = vi.fn();
  const view = renderCalculadoraView(host, { ruta: calcRoute(hash), onRoute });
  return { host, onRoute, view, $: s => host.querySelector(`[data-ce="${s}"]`), $$: s => [...host.querySelectorAll(`[data-ce="${s}"]`)] };
};
const escribir = (el, texto) => { el.focus(); el.value = texto; el.dispatchEvent(new Event('input', { bubbles: true })); };
const cambiar = (el, valor) => { el.value = valor; el.dispatchEvent(new Event('change', { bubbles: true })); };

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });

describe('calculator view', () => {
  it('shows the title, the shortcuts and the tabs', () => {
    const { host, $$ } = montar();
    expect(host.querySelector('h1').textContent).toBe('Calculadora de energía');
    expect(host.querySelectorAll('.ce-atajos .bu-chip')).toHaveLength(3);
    expect(host.querySelector('[role="tablist"]')).not.toBeNull();
    expect($$('tab').map(t => t.textContent.trim())).toEqual(['Electricidad', 'Gasolinas y diésel', 'Gas natural', 'Gas LP', 'Otras']);
    expect($$('tab')[0].getAttribute('aria-selected')).toBe('true');
  });
  it('moves between tabs with the arrows and adds history', () => {
    const { $$, onRoute } = montar();
    $$('tab')[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(onRoute).toHaveBeenCalledWith('#calculadora=petroliferos');
    expect($$('tab')[1].getAttribute('aria-selected')).toBe('true');
  });
  it('paints the approved mockup', () => {
    const { $ } = montar('#calculadora=petroliferos&v=100&u=mbd&p=gasolina');
    expect($('principal').textContent).toContain('15.9 millones de litros al día');
    expect($('frente').textContent).toContain('561 terajoules');
    expect($('comparacion').textContent).toContain('Para darte idea');
    expect($('origen').textContent).toContain('Valor publicado por SENER, 2026');
  });
  it('recalculates while typing, keeps the address and the focus', () => {
    const { $, onRoute } = montar('#calculadora=gas-lp');
    const campo = $('valor');
    escribir(campo, '40');
    expect(document.activeElement).toBe(campo);
    expect($('valor')).toBe(campo);
    expect($('principal').textContent).toMatch(/litros/);
    expect(onRoute).not.toHaveBeenCalled();
  });
  it('says when the text is not a number and how it read an ambiguous one', () => {
    const { $ } = montar();
    escribir($('valor'), 'abc');
    expect($('aviso-valor').textContent).toBe('Escribe un número, como 1 234.5');
    expect($('principal')).toBeNull();
    escribir($('valor'), '1,234');
    expect($('aviso-valor').textContent.replaceAll(' ', ' ')).toContain('1 234');
    expect($('principal')).not.toBeNull();
  });
  it('does not break with half-typed numbers', () => {
    const { $, host } = montar();
    for (const t of ['1,', '.', '-', '1 234,5', '  ']) {
      escribir($('valor'), t);
      expect(host.textContent).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
  it('leaves only mass and energy units for coke', () => {
    const { $ } = montar('#calculadora=petroliferos&v=10&u=l&p=gasolina');
    cambiar($('producto'), 'coque');
    const u = [...$('unidad').options].map(o => o.value);
    expect(u).not.toContain('l');
    expect(u).toContain('t');
    expect($('unidad').value).toBe('t');
    expect($('principal')).not.toBeNull();
  });
  it('ignores link values that do not belong together', () => {
    const { $, host } = montar('#calculadora=gas-lp&u=mw&p=gasolina&c=zzz');
    expect($('unidad').value).toBe('cil20');
    expect(host.textContent).not.toMatch(/NaN|undefined/);
  });
  it('shows the official unit next to one that is not', () => {
    expect(montar('#calculadora=gas-natural&v=1&u=mmbtu').$('oficial').textContent.replaceAll(' ', ' ')).toContain('1 055.056 MJ');
    expect(montar('#calculadora=gas-natural&v=1&u=gj').$('oficial')).toBeNull();
    expect(montar('#calculadora=gas-lp&v=1&u=cil20').$('oficial')).toBeNull();
  });
  it('asks for hours only with power', () => {
    const { $ } = montar('#calculadora=electricidad&v=1&u=mw');
    expect($('horas')).not.toBeNull();
    cambiar($('unidad'), 'mwh');
    expect($('horas')).toBeNull();
  });
  it('offers Ajustar and the base where the tab has them', () => {
    expect(montar().$('ajustar')).toBeNull();
    expect(montar('#calculadora=gas-natural').$('base')).toBeNull();
    const { $, host } = montar('#calculadora=petroliferos&v=1&u=l&p=gasolina');
    expect($('ajustar')).not.toBeNull();
    const antes = host.querySelector('[data-ce="formula"]').textContent;
    host.querySelector('[data-ce="base"] [data-valor="fisica"]').click();
    expect(host.querySelector('[data-ce="formula"]').textContent).not.toBe(antes);
  });
  it('copies the input, the result, the source and the link', async () => {
    const writeText = vi.fn().mockResolvedValue();
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { $ } = montar('#calculadora=petroliferos&v=100&u=mbd&p=gasolina');
    $('copiar').click();
    await Promise.resolve();
    const t = writeText.mock.calls[0][0];
    expect(t).toContain('15.9 millones de litros al día');
    expect(t).toContain('Lista de combustibles');
    expect(t).toContain('#calculadora=petroliferos&v=100&u=mbd&p=gasolina');
    expect(t).not.toContain(' ');
  });
  it('shows the text to copy by hand when the browser says no', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) } });
    const { $ } = montar();
    $('compartir').click();
    await new Promise(r => setTimeout(r));
    expect($('manual').value).toContain('#calculadora');
  });
  it('never paints what the person typed as HTML', () => {
    const { $, host } = montar();
    escribir($('valor'), '<img src=x onerror=alert(1)>');
    expect(host.querySelector('img')).toBeNull();
  });
  it('shows a new route and cleans up', () => {
    const { view, host, $, $$ } = montar();
    view.show(calcRoute('#calculadora=otras'));
    expect($$('tab')[4].getAttribute('aria-selected')).toBe('true');
    expect($('principal').textContent).toContain('100');
    expect(host.querySelectorAll('.ce-view')).toHaveLength(1);
    view.destroy();
    expect(host.children).toHaveLength(0);
  });
});
