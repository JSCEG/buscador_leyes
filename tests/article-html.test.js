import { describe, it, expect } from 'vitest';
import { articleHtml, sanitizeArticleHtml, markScrollableTables, articlePreviewHtml } from '../src/lib/article-html.js';

const OFFICIAL = `<p>Se dan a conocer los reactivos resultantes:</p>
<table><thead><tr><th>ID</th><th>REACTIVO</th><th colspan="2">CLASIFICACIÓN</th></tr></thead>
<tbody><tr><td rowspan="2">1</td><td>Razón social</td><td>Datos generales</td><td>Obligatorio</td></tr>
<tr><td>RFC</td><td>Datos generales</td><td>Obligatorio</td></tr></tbody></table>`;

const render = html => { const root = document.createElement('div'); root.innerHTML = html; return root; };

describe('article HTML tables', () => {
    it('keeps every table element, span and cell text', () => {
        const root = render(sanitizeArticleHtml(OFFICIAL));
        for (const tag of ['table', 'thead', 'tbody', 'tr', 'th', 'td']) expect(root.querySelector(tag)).not.toBeNull();
        expect(root.querySelector('th[colspan="2"]').textContent).toBe('CLASIFICACIÓN');
        expect(root.querySelector('td[rowspan="2"]').textContent).toBe('1');
        expect(root.querySelectorAll('td')).toHaveLength(7);
        // Same words, same order: presentation never changes the official text.
        expect(root.textContent.replace(/\s+/g, ' ')).toBe(render(OFFICIAL).textContent.replace(/\s+/g, ' '));
    });

    it('puts each table in a labelled scroll region with presentation hints', () => {
        const root = render(sanitizeArticleHtml(OFFICIAL + OFFICIAL));
        const boxes = root.querySelectorAll('.lr-table');
        expect(boxes).toHaveLength(2);
        expect(boxes[0].getAttribute('role')).toBe('region');
        expect(boxes[0].getAttribute('tabindex')).toBe('0');
        expect(boxes[1].getAttribute('aria-label')).toBe('Tabla 2');
        const table = boxes[0].querySelector('table');
        expect(table.classList.contains('lr-cols-4')).toBe(true);
        expect(table.querySelector('th').getAttribute('scope')).toBe('col');
        expect(table.querySelector('th[colspan]').getAttribute('scope')).toBe('colgroup');
        expect(table.querySelector('td[rowspan]').classList.contains('lr-num')).toBe(true);
        expect([...table.querySelectorAll('td')].filter(td => td.classList.contains('lr-num'))).toHaveLength(1);
    });

    it('previews an article with a table as a short table, not as run-on cell text', () => {
        const rows = Array.from({ length: 12 }, (_, i) => `<tr><td>${i + 1}</td><td>Reactivo ${i + 1}</td></tr>`).join('');
        const { html, truncated } = articlePreviewHtml(`<p>Se dan a conocer los reactivos:</p><table><thead><tr><th>ID</th><th>REACTIVO</th></tr></thead><tbody>${rows}</tbody></table><p>Después.</p>`, { rows: 3 });
        const root = render(html);
        expect(root.querySelector('p').textContent).toBe('Se dan a conocer los reactivos:');
        expect(root.querySelector('.lr-table th').textContent).toBe('ID');
        expect(root.querySelectorAll('tbody tr')).toHaveLength(3);
        expect(root.textContent).not.toContain('Después.');
        expect(truncated).toBe(true);
        expect(articlePreviewHtml('<table><tr><td>a</td></tr></table>').truncated).toBe(false);
    });

    it('marks blank layout cells so they do not widen the table', () => {
        const root = render(sanitizeArticleHtml('<table><tr><td>Calle</td><td> </td><td><img src="/a.png" alt=""></td></tr></table>'));
        const cells = root.querySelectorAll('td');
        expect(cells[0].classList.contains('lr-empty')).toBe(false);
        expect(cells[1].classList.contains('lr-empty')).toBe(true);
        expect(cells[2].classList.contains('lr-empty')).toBe(false);
    });

    it('reuses an existing overflow box instead of nesting a second one', () => {
        const root = render(sanitizeArticleHtml(`<div class="overflow-x-auto"><table><tr><td>a</td></tr></table></div>`));
        expect(root.querySelectorAll('.lr-table')).toHaveLength(1);
        expect(root.querySelector('.lr-table').classList.contains('overflow-x-auto')).toBe(true);
    });

    it('still removes scripts, handlers and inline styles', () => {
        const html = sanitizeArticleHtml(`<table onclick="x()" style="width:9px"><tr><td>a<script>bad()</script></td></tr></table>`);
        expect(html).not.toMatch(/onclick|style=|script/);
    });

    it('does not turn pipe-separated paragraphs into a table', () => {
        globalThis.marked = { parse: value => `<p>${value}</p>` };
        try {
            const root = render(articleHtml('ID | REACTIVO | SECCIÓN | 1 | Razón social'));
            expect(root.querySelector('table')).toBeNull();
            expect(root.textContent).toContain('ID | REACTIVO');
        } finally { delete globalThis.marked; }
    });

    it('adds one hidden scroll hint per table in a rendered reader', () => {
        const root = render(sanitizeArticleHtml(OFFICIAL));
        markScrollableTables(root);
        markScrollableTables(root);
        expect(root.querySelectorAll('.lr-table-hint')).toHaveLength(1);
        expect(root.querySelector('.lr-table-hint').getAttribute('aria-hidden')).toBe('true');
    });
});
