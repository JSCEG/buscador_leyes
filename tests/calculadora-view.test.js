import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderCalculadoraView } from '../src/scripts/calculadora-view.js';
import { calcRoute } from '../src/lib/calc/ruta.js';
import { idArticulo } from '../src/lib/calc/textos.js';

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
  it('offers the cards of each tab', () => {
    const { host } = montar('#calculadora=gas-lp');
    const ids = s => [...host.querySelectorAll(`[data-ce="${s}"]`)].map(d => d.dataset.id);
    expect(ids('cuenta')).toEqual(['tanque', 'quemador', 'costo-lp', 'emisiones-lp']);
    expect(ids('entender')).toEqual(['convencion-054', 'litros-agua', 'vapor']);
  });
  it('has no «Otras cuentas» in Otras', () => {
    const { host } = montar('#calculadora=otras');
    expect(host.querySelectorAll('[data-ce="cuenta"]')).toHaveLength(0);
    expect(host.textContent).not.toContain('Otras cuentas');
  });
  it('calculates a small calculation in place', () => {
    const { host } = montar('#calculadora=gas-lp');
    const d = host.querySelector('[data-ce="cuenta"][data-id="tanque"]');
    d.open = true;
    d.dispatchEvent(new Event('toggle'));
    expect(d.querySelector('[data-ce="cuenta-resultado"]').textContent).toContain('255');
    const campo = d.querySelector('input');
    campo.focus();
    campo.value = '500';
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.activeElement).toBe(campo);
    expect(d.querySelector('[data-ce="cuenta-resultado"]').textContent).toContain('425');
  });
  it('suggests the DC/AC ratio without assuming it', () => {
    const { host } = montar();
    const d = host.querySelector('[data-ce="cuenta"][data-id="solar"]');
    d.open = true;
    d.dispatchEvent(new Event('toggle'));
    expect(d.textContent).toContain('1.3');
    expect(d.textContent).toContain('sin dato mexicano');
  });
  it('puts the law and a calculation inside a card', () => {
    const { host } = montar();
    const d = host.querySelector('[data-ce="entender"][data-id="precio-potencia"]');
    d.open = true;
    d.dispatchEvent(new Event('toggle'));
    expect(d.querySelector(`a[href="#art-${idArticulo('LSE-Art-112')}"]`)).not.toBeNull();
    expect(d.querySelector('[data-ce="cuenta-resultado"]').textContent).toContain('366.48');
  });
  it('answers «¿En qué periodo estoy?»', () => {
    const { host } = montar();
    const d = host.querySelector('[data-ce="entender"][data-id="hora-pico"]');
    d.open = true;
    d.dispatchEvent(new Event('toggle'));
    expect(d.querySelector('input[type="checkbox"]')).not.toBeNull();
    expect(d.textContent).toContain('DIST');
    const fijar = (sel, v) => { const el = d.querySelector(sel); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    fijar('input[type="date"]', '2026-07-15');
    fijar('input[type="time"]', '20:00');
    expect(d.querySelector('[data-ce="cuenta-resultado"]').textContent).toMatch(/punta/i);
    fijar('input[type="time"]', '19:00');
    expect(d.querySelector('[data-ce="cuenta-resultado"]').textContent).toMatch(/intermedio/i);
  });
  it('writes each note of the formula table once, as a sentence', () => {
    for (const hash of ['#calculadora=gas-lp', '#calculadora=otras&mg=energia&v=1&u=tep', '#calculadora=petroliferos&v=1&u=t&p=diesel']) {
      const { host } = montar(hash);
      for (const td of host.querySelectorAll('.ce-rotulo')) {
        expect(td.textContent, hash).not.toMatch(/\.\s[a-záéíóúñ]/);
        expect(td.textContent, hash).not.toMatch(/las tablas de precios\.\s*las tablas de precios|balances de energía\.\s*balances de energía/);
      }
      document.body.innerHTML = '';
    }
  });
  const abrir = (host, sel) => { const d = host.querySelector(sel); d.open = true; d.dispatchEvent(new Event('toggle')); return d; };
  it('shows dilatation lines that add up', () => {
    const { host } = montar('#calculadora=petroliferos');
    const texto = abrir(host, '[data-ce="cuenta"][data-id="dilatacion"]').querySelector('[data-ce="cuenta-resultado"]').textContent.replaceAll(' ', ' ');
    expect(texto).toContain('19 623 L');
    expect(texto).toContain('−377 L');
  });
  it('names the source of a small calculation', () => {
    const { host } = montar();
    const d = abrir(host, '[data-ce="cuenta"][data-id="central"]');
    expect(d.querySelector('[data-ce="cuenta-resultado"]').textContent).toContain('Plan de Desarrollo del Sector Eléctrico');
  });
  it('says which cubic metres each gas tab means', () => {
    const opcion = (hash, v) => [...montar(hash).$('unidad').options].find(o => o.value === v).textContent;
    expect(opcion('#calculadora=gas-lp', 'm3')).toContain('líquido');
    expect(opcion('#calculadora=gas-natural', 'm3')).toContain('condición');
  });
  it('labels each cell of the DIST and DIT table for phones', () => {
    const { host } = montar();
    const d = abrir(host, '[data-ce="entender"][data-id="hora-pico"]');
    for (const td of d.querySelectorAll('.ce-puntas tbody td')) expect(td.dataset.etq).toBeTruthy();
  });
  it('keeps the keyboard focus on the base selector', () => {
    const { host } = montar('#calculadora=petroliferos&v=1&u=l&p=gasolina');
    const boton = host.querySelector('[data-ce="base"] [data-valor="fisica"]');
    boton.focus();
    boton.click();
    expect(document.activeElement.dataset.foco).toBe('base-fisica');
    expect(document.activeElement.getAttribute('aria-checked')).toBe('true');
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
