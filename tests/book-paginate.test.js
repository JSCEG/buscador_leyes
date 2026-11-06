import { describe, expect, it, vi } from 'vitest';
import { articleBlocks, pageOfArticle, paginate, paginateInSlices } from '../src/lib/book-paginate.js';

const fits = limit => html => html.join('').replace(/<[^>]+>/g, '').length <= limit;
const OPT = { fits: fits(1200), maxTableCols: 5 };
const LONG = 'La Comisión regulará los permisos de generación eléctrica y vigilará su cumplimiento en todo el territorio nacional. '.repeat(40);
const SAMPLE = [
  { id: 'a1', label: 'Artículo 1', texto: `Artículo 1.- ${LONG}` },
  { id: 'a2', label: 'Artículo 2', texto: 'I. Primera fracción.\n\nII. Segunda fracción.\n\nTexto simple.' },
  { id: 'a3', label: 'Artículo 3', texto: LONG },
];
const normalized = text => text.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, '').trim();
const textOf = pages => normalized(pages.map(page => page.html).join(' '));
const source = articles => normalized(articles.map(article => (String(article.texto).startsWith(article.label) ? article.texto : `${article.label} ${article.texto}`)).join(' '));
const table = (rows, cols = 2) => `<table><thead><tr>${Array.from({ length: cols }, (_, i) => `<th>Col ${i}</th>`).join('')}</tr></thead><tbody>${Array.from({ length: rows }, (_, r) => `<tr>${Array.from({ length: cols }, (_, c) => `<td>F${r}C${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

describe('book pagination', () => {
  it.each([300, 1200, 4000])('keeps every character at %i per page', limit => {
    const { pages } = paginate(SAMPLE, { fits: fits(limit), maxTableCols: 5 });
    expect(textOf(pages)).toBe(source(SAMPLE));
    expect(pages.length).toBeGreaterThan(0);
  });
  it('fills pages without going over when it can', () => {
    const { pages } = paginate(SAMPLE, { fits: fits(600), maxTableCols: 5 });
    for (const page of pages) expect(page.html.replace(/<[^>]+>/g, '').length).toBeLessThanOrEqual(600);
  });
  it('repeats the header when a table splits, and loses no cell', () => {
    const { pages } = paginate([{ id: 't', label: 'Anexo', texto: table(449) }], { fits: fits(800), maxTableCols: 5 });
    const pieces = pages.filter(page => page.html.includes('<table'));
    expect(pieces.length).toBeGreaterThan(1);
    for (const page of pieces) expect(page.html).toContain('Col 0');
    const box = document.createElement('div'); box.innerHTML = pages.map(page => page.html).join('');
    const cells = [...box.querySelectorAll('tbody td')].map(cell => cell.textContent);
    expect(cells).toHaveLength(449 * 2);
    expect(new Set(cells).size).toBe(449 * 2);
  });
  it('sends wide tables to a card, keeping the whole table', () => {
    const { pages, tables } = paginate([{ id: 't', label: 'Anexo', texto: table(3, 17) }], OPT);
    expect(pages[0].html).toContain('bk-tb-card');
    expect(pages[0].html).not.toContain('<table');
    const box = document.createElement('div'); box.innerHTML = tables['t:0'].html;
    expect(box.querySelectorAll('td')).toHaveLength(3 * 17);
  });
  it('sends rowspan and oversize rows to a card', () => {
    const spanned = paginate([{ id: 't', label: 'A', texto: '<table><tr><td rowspan="2">x</td><td>y</td></tr><tr><td>z</td></tr></table>' }], OPT);
    expect(spanned.pages[0].html).toContain('bk-tb-card');
    const big = paginate([{ id: 'b', label: 'B', texto: `<table><tr><td>${'palabra '.repeat(400)}</td><td>y</td></tr></table>` }], { fits: fits(300), maxTableCols: 5 });
    expect(big.pages.at(-1).html).toContain('bk-tb-card');
  });
  it('keeps images in order', () => {
    const { pages } = paginate([{ id: 'i', label: 'A', texto: '<p>uno</p><img src="/a.png" alt="A"><p>dos</p><img src="/b.png">' }], OPT);
    const html = pages.map(page => page.html).join('');
    expect(html.indexOf('/a.png')).toBeLessThan(html.indexOf('/b.png'));
    expect(html.indexOf('uno')).toBeLessThan(html.indexOf('/a.png'));
  });
  it('handles empty, missing title and acronym', () => {
    expect(paginate([{ id: 'a', label: '', texto: '' }], OPT).pages).toBeDefined();
    expect(() => paginate([{ id: 'b', texto: null }], OPT)).not.toThrow();
    expect(paginate([], OPT).pages).toEqual([]);
  });
  it('never loops on a word longer than the page', () => {
    const { pages } = paginate([{ id: 'w', label: 'A', texto: 'x'.repeat(5000) }], { fits: fits(100), maxTableCols: 5 });
    expect(pages.map(page => page.html).join('')).toContain('x'.repeat(5000));
  });
  it('finds the page of an article', () => {
    const { pages } = paginate(SAMPLE, { fits: fits(600), maxTableCols: 5 });
    expect(pageOfArticle(pages, 'a1')).toBe(0);
    expect(pageOfArticle(pages, 'a3')).toBeGreaterThan(0);
    expect(pageOfArticle(pages, 'nope')).toBe(-1);
  });
  it('heads each new chapter once and captions its pages', () => {
    const { pages } = paginate([
      { id: 'a', label: 'Artículo 1', titulo: 'Título Primero', capitulo: 'Capítulo I', texto: 'uno' },
      { id: 'b', label: 'Artículo 2', titulo: 'Título Primero', capitulo: 'Capítulo I', texto: 'dos' },
    ], OPT);
    expect(pages[0].html.match(/Capítulo I/g)).toHaveLength(1);
    expect(pages[0].caption).toBe('Capítulo I');
  });
  it('escapes data', () => {
    const { pages } = paginate([{ id: '"x', label: '<b>L</b>', texto: 'a <i>b</i>' }], OPT);
    const box = document.createElement('div'); box.innerHTML = pages[0].html;
    expect(box.querySelector('b')).toBeNull();
  });
  it('reads blocks of plain and rich text', () => {
    expect(articleBlocks('uno\n\ndos').map(block => block.text)).toEqual(['uno', 'dos']);
    const rich = articleBlocks(`<p>antes</p>${table(1)}<img src="/x.png">`);
    expect(rich.map(block => block.type)).toEqual(['text', 'table', 'figure']);
  });
  it('joins lines the PDF cut, keeping fractions apart', () => {
    const blocks = articleBlocks('La Comisión\nregulará los permisos:\n\nI. Primera\nparte;\nII. Segunda.');
    expect(blocks.map(block => block.text)).toEqual(['La Comisión regulará los permisos:', 'I. Primera parte;', 'II. Segunda.']);
  });
  it('slices give the same result and yield', async () => {
    const yieldFn = vi.fn(() => Promise.resolve());
    const whole = paginate(SAMPLE, { fits: fits(600), maxTableCols: 5 });
    const sliced = await paginateInSlices(SAMPLE, { fits: fits(600), maxTableCols: 5 }, { budgetMs: -1, yieldFn });
    expect(sliced.pages).toEqual(whole.pages);
    expect(yieldFn).toHaveBeenCalled();
  });
});
