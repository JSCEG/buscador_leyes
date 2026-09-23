import { describe, expect, it } from 'vitest';
import { contextSnippet, highlightTerms, markedFragment, plainText, queryStems } from '../src/lib/search-snippet.js';

describe('search snippets', () => {
    it('builds accent-insensitive stems without stopwords', () => {
        expect(queryStems('Interconexión de la RED')).toEqual(['interconexi', 'red']);
    });

    it('centres the excerpt on the first match and marks whole words', () => {
        const text = `${'Texto previo sin relación. '.repeat(20)}Las solicitudes de interconexiones al Sistema Eléctrico Nacional se presentan ante el CENACE. ${'Cierre. '.repeat(30)}`;
        const html = contextSnippet(text, 'interconexión', 120);
        expect(html.startsWith('… ')).toBe(true);
        expect(html).toContain('<mark>interconexiones</mark>');
        expect(html.endsWith(' …')).toBe(true);
    });

    it('escapes the source before adding marks', () => {
        expect(highlightTerms('<b>Red</b> & <i>red</i>', 'red')).toBe('&lt;b&gt;<mark>Red</mark>&lt;/b&gt; &amp; &lt;i&gt;<mark>red</mark>&lt;/i&gt;');
        expect(markedFragment('a [[[&lt;script&gt;]]] b')).toBe('a <mark>&lt;script&gt;</mark> b');
    });

    it('shows only the text of articles stored as HTML tables', () => {
        expect(plainText('oficial --> <div>Tabla</div><td colspan="2">Sistema &quot;SEN&quot; &amp; red</td>')).toBe('oficial Tabla Sistema "SEN" & red');
        expect(contextSnippet('<td>La interconexión &lt;b&gt;</td>', 'interconexión')).toBe('La <mark>interconexión</mark> &lt;b&gt;');
    });
});
