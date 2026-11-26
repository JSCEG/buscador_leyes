import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';
import { sanitizeArticleHtml } from '../src/lib/article-html.js';

const folder = 'revision-acervo/incorporacion-nom-023-asea-2026-11-26/';
const data = JSON.parse(readFileSync(`${folder}carga.json`, 'utf8'))[0];
const map = JSON.parse(readFileSync(`${folder}map.json`, 'utf8'));
const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const sourceRegistry = JSON.parse(readFileSync('server/reader-pdf-sources.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());

it('binds every numeral, transitory and appendix to the verified official online edition', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(data.ley).toMatchObject({ siglas: 'NOM-023-ASEA-2026', tipo: 'nom', vigente: null });
    expect(data.articulos).toHaveLength(887);
    expect(Object.keys(map.articles)).toHaveLength(887);
    expect(manifest.sources[map.source.id]).toEqual(map.source);
    expect(sourceRegistry[map.source.id].originalUrl).toBe(map.source.originalUrl);
    expect(map.source).toMatchObject({ transport: 'remote-pdf', pageCount: 552,
        sha256: '7a9687317718bf15311a476c77e8522016e30b1778bfa6499f1172823a818186' });
    for (const article of data.articulos) {
        const entry = map.articles[article.id];
        expect(manifest.articles[article.id]).toEqual(entry);
        const resolved = await getReaderSource(article.id, { articleText: article.contenido, manifest });
        expect(resolved.status, article.identificador).toBe('mapped');
        expect(resolved.contentVerified).toBe(true);
        expect(Math.min(...entry.pageNumbers)).toBeGreaterThanOrEqual(35);
        expect(Math.max(...entry.pageNumbers)).toBeLessThanOrEqual(252);
        for (let pageIndex = 0; pageIndex < entry.pageNumbers.length; pageIndex++) {
            expect(resolveReaderSource(manifest, article.id, { pageIndex }).highlights.length).toBeGreaterThan(0);
        }
    }
    const item = data.articulos.find(a => a.identificador === 'Numeral 9.4');
    expect((await getReaderSource(item.id, { articleText: `${item.contenido} alterado`, manifest })).reason)
        .toBe('content-mismatch');
});

it('preserves merged headers and the official signs through the actual reader sanitizer', () => {
    const article = data.articulos.find(a => a.identificador === 'Numeral 6.3.19.4.3');
    const el = document.createElement('div');
    el.innerHTML = sanitizeArticleHtml(article.contenido);
    expect(el.querySelectorAll('table')).toHaveLength(2);
    for (const table of el.querySelectorAll('table')) {
        expect(table.tHead.rows).toHaveLength(3);
        expect(table.querySelector('thead th[rowspan="3"]')).not.toBeNull();
        expect(table.querySelector('thead th[colspan="4"]')).not.toBeNull();
    }
    const appendix = data.articulos.find(a => a.identificador.startsWith('Apéndice B'));
    el.innerHTML = sanitizeArticleHtml(appendix.contenido);
    expect(el.querySelectorAll('table')).toHaveLength(13);
    expect(el.querySelectorAll('table thead')).toHaveLength(13);
    // Once señales ilustradas; otras dos fichas son letreros de texto en el original.
    expect(el.querySelectorAll('img')).toHaveLength(11);
    expect(el.querySelector('img').src).toMatch(/^https:\/\/sidofqa\.segob\.gob\.mx\//);
});

it('keeps the displaced five incisos inside the acceptance cell and fixes only PDF-verified corruption', () => {
    const item = data.articulos.find(a => a.identificador === 'Numeral 9.4');
    const el = document.createElement('div');
    el.innerHTML = item.contenido;
    const plain = node => node.textContent.replace(/\s+/g, ' ');
    const cell = [...el.querySelectorAll('td')].find(c => plain(c).includes('8.8.1.2.5. Cumple'));
    expect(plain(cell)).toContain('Si el tanque de almacenamiento puede seguir operando;');
    expect(plain(cell)).toContain('Si debe ponerse Fuera de Servicio y ser reemplazado por equipo nuevo.');
    expect(plain(el).match(/Si el tanque de almacenamiento puede seguir operando;/g)).toHaveLength(1);
    expect(el.textContent).not.toMatch(/[�鳥鮠Ქ]/);
    expect(el.textContent).toContain('potenciales de ignición cercanas al área de fuga');
    expect(data.articulos.filter(a => a.tipo_articulo === 'transitorio')).toHaveLength(8);
    expect(data.articulos.filter(a => a.tipo_articulo === 'anexo')).toHaveLength(4);
});
