import { describe, it, expect } from 'vitest';
import { wordDiff, WORD_DIFF_LIMIT } from '../src/lib/word-diff.js';

describe('CompareView word diff', () => {
    it('marks what only each side says, ignoring case, accents and punctuation', () => {
        const { left, right, changed } = wordDiff('La presente Ley es reglamentaria del artículo 27.', 'La presente ley es reglamentaria de los artículos 25 y 27');
        expect(left).toBe('La presente Ley es reglamentaria <del>del artículo </del>27.');
        expect(right).toBe('La presente ley es reglamentaria <ins>de los artículos 25 y </ins>27');
        expect(changed).toBe(7);
    });

    it('reports no change for the same text and escapes HTML', () => {
        const same = wordDiff('Artículo <1> & más', 'Artículo <1> & más');
        expect(same).toEqual({ left: 'Artículo &lt;1&gt; &amp; más', right: 'Artículo &lt;1&gt; &amp; más', changed: 0 });
    });

    it('gives up on texts longer than the limit', () => {
        const long = 'palabra '.repeat(WORD_DIFF_LIMIT + 1);
        expect(wordDiff(long, 'otra')).toBeNull();
    });
});
