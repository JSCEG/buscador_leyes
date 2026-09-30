import { describe, expect, it } from 'vitest';
import { buildSearchGraph, GRAPH_MAX_LAWS } from '../src/lib/search-graph.js';
import { parseArticlePageHash, articlePageHash } from '../src/scripts/article-page-view.js';

const summaries = [
    { id: 'lse', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'ley' },
    { id: 'rlse', titulo: 'Reglamento de la Ley del Sector Eléctrico', siglas: 'RLSE', tipo: 'reglamento' },
    { id: 'lbio', titulo: 'Ley de Biocombustibles', siglas: 'LBio', tipo: 'ley' },
];

describe('search graph', () => {
    it('puts the term in the middle, a hub per collection and instruments around it', () => {
        const graph = buildSearchGraph({ query: 'red', summaries, lawCounts: [{ ley_id: 'lse', count: 10 }, { ley_id: 'rlse', count: 4 }, { ley_id: 'lbio', count: 1 }] });
        const kinds = graph.nodes.reduce((acc, n) => ({ ...acc, [n.kind]: (acc[n.kind] || 0) + 1 }), {});
        expect(kinds).toEqual({ term: 1, law: 3, group: 2 });
        expect(graph.nodes.find(n => n.id === 'group:leyes').count).toBe(11);
        expect(graph.nodes.find(n => n.id === 'law:lse').weight).toBe(1);
        expect(graph.links.filter(l => l.kind === 'set')).toHaveLength(2);
        expect(graph.total).toBe(15);
    });

    it('links a regulation to the law its title names', () => {
        const graph = buildSearchGraph({ query: 'red', summaries, lawCounts: [{ ley_id: 'lse', count: 2 }, { ley_id: 'rlse', count: 2 }] });
        expect(graph.links.filter(l => l.kind === 'cites')).toEqual([{ source: 'law:rlse', target: 'law:lse', kind: 'cites' }]);
    });

    it('keeps the instruments with most matches and says how many were left out', () => {
        const many = Array.from({ length: GRAPH_MAX_LAWS + 5 }, (_, i) => ({ id: `l${i}`, titulo: `Acuerdo ${i}`, tipo: 'acuerdo' }));
        const graph = buildSearchGraph({ query: 'x', summaries: many, lawCounts: many.map((l, i) => ({ ley_id: l.id, count: i + 1 })) });
        expect(graph.nodes.filter(n => n.kind === 'law')).toHaveLength(GRAPH_MAX_LAWS);
        expect(graph.hidden).toBe(5);
        expect(graph.nodes.some(n => n.id === 'law:l0')).toBe(false);
    });
});

describe('article page hash', () => {
    it('round-trips ids', () => {
        expect(parseArticlePageHash(articlePageHash('a b/1'))).toBe('a b/1');
        expect(parseArticlePageHash('#art-1')).toBeNull();
    });
});
