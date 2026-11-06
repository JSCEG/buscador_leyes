import { describe, it, expect } from 'vitest';
import { articleHtml, enhanceTables, isHeaderRow, paragraphClass, sanitizeArticleHtml, markScrollableTables, articlePreviewHtml } from '../src/lib/article-html.js';

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
        expect(root.querySelector('.lr-table-hint button').textContent).toBe('Ver en grande');
    });
});

describe('Excel table format', () => {
    const textOf = el => el.textContent.replace(/\s+/g, ' ').trim();
    const html = source => { const box = document.createElement('div'); box.innerHTML = source; return box; };
    const table = (first, second = ['x', '12', '13']) => html(`<table><tr>${first.map(cell => `<td>${cell}</td>`).join('')}</tr><tr>${second.map(cell => `<td>${cell}</td>`).join('')}</tr></table>`).querySelector('table');
    const TABLE_WITH_TOTAL = '<table><tr><td>Tecnología</td><td>2024</td><td>2025</td></tr><tr><td>Solar</td><td>5,393</td><td></td></tr><tr><td>Eólica</td><td>7,000</td><td>+3.5%</td></tr><tr><td>Total</td><td>12,393</td><td>-1.2%</td></tr></table>';

    it('never changes official text', () => {
        const box = html(TABLE_WITH_TOTAL); const before = textOf(box);
        enhanceTables(box);
        expect(textOf(box)).toBe(before);
        expect(box.querySelectorAll('td')).toHaveLength(12);
    });
    it('marks a total row only when it has figures', () => {
        const box = html(TABLE_WITH_TOTAL); enhanceTables(box);
        expect(box.querySelectorAll('tr.lr-total')).toHaveLength(1);
        const noFigures = html('<table><tr><td>Total de requisitos</td><td>Ver anexo</td></tr><tr><td>Otro</td><td>Dato</td></tr></table>'); enhanceTables(noFigures);
        expect(noFigures.querySelector('tr.lr-total')).toBeNull();
    });
    it('recognizes years as a header, not figures', () => { expect(isHeaderRow(table(['(MW)', '2010', '2011']))).toBe(true); });
    it('does not treat a data row as a header', () => { expect(isHeaderRow(table(['Carbo', '5,393'], ['Gas', '7,000']))).toBe(false); });
    it('moves a recognized header to thead, keeping every cell', () => {
        const box = html(TABLE_WITH_TOTAL); enhanceTables(box);
        expect(box.querySelector('table').classList.contains('tb-header')).toBe(true);
        expect(box.querySelectorAll('thead td')).toHaveLength(3);
    });
    it('marks missing data only in tables with figures', () => {
        const box = html(TABLE_WITH_TOTAL); enhanceTables(box);
        expect(box.querySelectorAll('td.lr-nd')).toHaveLength(1);
        const form = html('<table><tr><td>Nombre</td><td></td></tr><tr><td>RFC</td><td></td></tr></table>'); enhanceTables(form);
        expect(form.querySelector('td.lr-nd')).toBeNull();
        expect(form.querySelectorAll('td.lr-empty')).toHaveLength(2);
    });
    it('signs variations', () => {
        const box = html(TABLE_WITH_TOTAL); enhanceTables(box);
        expect(box.querySelector('td.lr-pos').textContent).toBe('+3.5%');
        expect(box.querySelector('td.lr-neg').textContent).toBe('-1.2%');
    });
    it('freezes the first column from five columns', () => {
        const box = html('<table><tr><td>a</td><td>b</td><td>c</td><td>d</td><td>e</td></tr></table>'); enhanceTables(box);
        expect(box.querySelector('table').classList.contains('lr-fija')).toBe(true);
    });
    it('classifies titles and sources', () => {
        expect(paragraphClass('Tabla 2.1. Capacidad instalada')).toBe('lr-tit');
        expect(paragraphClass('Fuente: Elaboración SENER')).toBe('lr-fue');
        expect(paragraphClass('La Tabla 2 muestra')).toBe('');
    });
    it('uses those classes on paragraphs', () => {
        expect(sanitizeArticleHtml('<p>Tabla 2. Capacidad</p>')).toContain('class="lr-tit"');
        expect(articleHtml('Fuente: SENER')).toContain('class="lr-fue"');
    });
});

describe('wrapped lines in plain articles', () => {
    const text = plain => render(articleHtml(plain)).querySelector('p').innerHTML;

    it('joins a line the source wrapped in the middle of a sentence', () => {
        expect(text('limitaciones o dificultades\nque impidan el acceso')).toBe('limitaciones o dificultades que impidan el acceso');
        expect(text('Productos Asociados del mercado de energía eléctrica\nMayorista a que se refiere')).toBe('Productos Asociados del mercado de energía eléctrica Mayorista a que se refiere');
    });
    it('keeps breaks that carry meaning', () => {
        for (const plain of [
            'se entiende por:\nI.  Accesibilidad',
            'Principio de acceso;\nII. Bases',
            'las siguientes obligaciones de servicio\na) Atender',
            'las siguientes obligaciones de servicio\n1) Atender',
            'las siguientes obligaciones de servicio\n• Atender',
            'quedan establecidas en este decreto del sector\nPRIMERO.- Se aprueba',
            'quedan establecidas en este decreto del sector\nArtículo 2 Las autoridades',
            'CAPÍTULO I\nDisposiciones generales',
            'Del objeto\nEl presente documento',
        ]) expect(text(plain), plain).toContain('<br>');
    });
    it('changes nothing but the line break', () => {
        const plain = 'dificultades\nque impidan;\nII. Bases';
        expect(text(plain).replace(/<br>/g, ' ')).toBe(plain.replace(/\n/g, ' '));
    });
});
