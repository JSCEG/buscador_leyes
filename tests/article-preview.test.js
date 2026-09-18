import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { getTextPreview, highlightText, highlightHtml } from '../src/lib/article-preview.js';

const publication = JSON.parse(readFileSync('revision-acervo/incorporacion-convocatorias-2026-09-17/CONV-ESTRATEGICOS-M2-carga.json', 'utf8'));

it('keeps the 28 real agreement excerpts as independent cards at every preview length', () => {
    for (const limit of [100, 140, 300, 800]) {
        for (const query of ['', 'generación', 'div']) {
            const list = document.createElement('div');
            list.innerHTML = publication.articulos.map(article =>
                `<article><p>${highlightText(getTextPreview(article.contenido, limit), query)}</p></article>`
            ).join('');
            expect(list.children).toHaveLength(28);
            expect(list.querySelectorAll('article article, p div, p table, a, img')).toHaveLength(0);
            expect([...list.querySelectorAll('p')].every(p => p.textContent.length <= limit + 1)).toBe(true);
        }
    }
});

it('extracts readable text before truncation and preserves literal comparisons and entities', () => {
    const content = '<!-- ### Oculto -->### Datos\n\n<div>Capacidad <b>&lt; 5 MW</b></div><table><tr><td>A</td><td>B &amp; C</td></tr></table>\n[Fuente](https://example.com)';
    expect(getTextPreview(content)).toBe('Datos Capacidad < 5 MW A B & C Fuente');
    expect(getTextPreview('<div>Texto corto</div>')).toBe('Texto corto');
    expect(getTextPreview(null)).toBe('');
    const preview = document.createElement('p');
    preview.innerHTML = highlightText(getTextPreview('<div>&lt;img src=x&gt; &amp; generación</div>'), 'generación');
    expect(preview.querySelector('img')).toBeNull();
    expect(preview.textContent).toBe('<img src=x> & generación');
    expect(preview.querySelector('mark').textContent).toBe('generación');
});

it('highlights phrases and punctuation without changing HTML attributes, tables or links', () => {
    const html = '<div class="generación"><table><tr><td>Generación y almacenamiento</td><td>C++ &lt; 5</td></tr></table><a href="https://example.com/generación">Fuente generación</a></div>';
    const full = document.createElement('div');
    full.innerHTML = highlightHtml(html, '"generación y almacenamiento" C++');
    expect(full.querySelectorAll('table tr td')).toHaveLength(2);
    expect(full.firstElementChild.className).toBe('generación');
    expect(full.querySelector('a').getAttribute('href')).toBe('https://example.com/generación');
    expect([...full.querySelectorAll('mark')].map(el => el.textContent)).toEqual(['Generación y almacenamiento']);
    full.innerHTML = highlightHtml(html, 'C++');
    expect(full.querySelector('mark').textContent).toBe('C++');
    expect(highlightText('A < 5 & B', 'de la')).toBe('A &lt; 5 &amp; B');
});
