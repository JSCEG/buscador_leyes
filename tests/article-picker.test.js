import { beforeEach, describe, expect, it, vi } from 'vitest';
import { articlePickerHtml, articleShortLabel, filterPicker, initArticlePicker, openPickerSheet } from '../src/lib/article-picker.js';

const numbered = ['1', '2', '11', '110', '111', '12'].map(n => ({ id: `a${n}`, articulo_label: `Artículo ${n}` }));
const visible = root => [...root.querySelectorAll('[data-pick-article]:not([hidden])')].map(button => button.textContent);

describe('article picker', () => {
  let root;
  beforeEach(() => { document.body.innerHTML = '<div id="r"></div>'; root = document.getElementById('r'); root.innerHTML = articlePickerHtml(numbered); });

  it('shortens labels', () => {
    expect(articleShortLabel('Artículo 11')).toBe('11');
    expect(articleShortLabel('Transitorio Primero')).toBe('T. Primero');
    expect(articleShortLabel('Anexo A')).toBe('Anexo A');
  });
  it('filters by prefix', () => { filterPicker(root, '11'); expect(visible(root)).toEqual(['11', '110', '111']); });
  it('accepts «artículo 11»', () => { filterPicker(root, 'artículo 11'); expect(visible(root)[0]).toBe('11'); });
  it('says when nothing matches', () => {
    filterPicker(root, '999');
    expect(visible(root)).toEqual([]);
    expect(root.querySelector('[data-picker-empty]').hidden).toBe(false);
  });
  it('lists long labels when there are no numbers', () => {
    root.innerHTML = articlePickerHtml([{ id: 'x', articulo_label: 'Disposición de carácter general' }]);
    expect(root.querySelector('.is-lista')).not.toBeNull();
    expect(visible(root)).toEqual(['Disposición de carácter general']);
  });
  it('picks on click and on Enter', () => {
    const onPick = vi.fn();
    initArticlePicker(root, onPick);
    root.querySelector('[data-pick-article="a12"]').click();
    expect(onPick).toHaveBeenLastCalledWith('a12');
    const filter = root.querySelector('[data-picker-filter]');
    filter.value = '11'; filter.dispatchEvent(new Event('input'));
    filter.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onPick).toHaveBeenLastCalledWith('a11');
  });
  it('survives an empty document', () => { expect(() => { root.innerHTML = articlePickerHtml([]); filterPicker(root, 'x'); }).not.toThrow(); });
  it('escapes data', () => {
    root.innerHTML = articlePickerHtml([{ id: '"x', articulo_label: '<b>Anexo</b>' }]);
    expect(root.querySelector('b')).toBeNull();
  });
  it('the sheet picks, closes and returns focus', () => {
    const onPick = vi.fn();
    const opener = document.createElement('button');
    document.body.append(opener); opener.focus();
    openPickerSheet(numbered, onPick, { chaptersHtml: '<button data-outline-id="a2">Título</button>' });
    expect(document.querySelector('.ap-hoja')).not.toBeNull();
    document.querySelector('.ap-hoja [data-pick-article="a1"]').click();
    expect(onPick).toHaveBeenCalledWith('a1');
    expect(document.querySelector('.ap-hoja')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
  it('the sheet closes with Escape and offers chapters', () => {
    const onPick = vi.fn();
    openPickerSheet(numbered, onPick, { chaptersHtml: '<button data-outline-id="a2">Título</button>' });
    document.querySelector('[data-picker-tab="capitulos"]').click();
    expect(document.querySelector('[data-picker-panel="capitulos"]').hidden).toBe(false);
    document.querySelector('.ap-hoja [data-outline-id="a2"]').click();
    expect(onPick).toHaveBeenCalledWith('a2');
    openPickerSheet(numbered, onPick);
    document.querySelector('.ap-hoja').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.querySelector('.ap-hoja')).toBeNull();
  });
});
