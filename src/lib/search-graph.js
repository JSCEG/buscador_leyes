/**
 * Network of a search: the term in the middle, one hub per collection (the "sets"), and the
 * instruments with matches around their hub. Instruments are also linked to each other when
 * one's title names another (a regulation of a law, an agreement that cites a law's title).
 */
import { ACERVO_GROUPS, getAcervoGroup } from './acervo-model.js';

const plain = value => String(value || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
export const GRAPH_MAX_LAWS = 60;

/** Law titles worth matching: long enough not to hit by accident ("Ley de …"). */
function citedLaws(law, laws) {
    const title = plain(law.titulo);
    return laws.filter(other => {
        if (other === law) return false;
        const name = plain(other.titulo);
        if (name.length < 18 || !/^(ley|reglamento)\b/.test(name)) return false;
        return title.includes(name) && title !== name;
    });
}

export function buildSearchGraph({ query, lawCounts = [], summaries = [] }) {
    const byId = new Map(summaries.map(law => [String(law.id), law]));
    const rows = lawCounts
        .map(row => ({ law: byId.get(String(row.ley_id)), count: Number(row.count) || 0 }))
        .filter(row => row.law && row.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, GRAPH_MAX_LAWS);
    const max = Math.max(1, ...rows.map(row => row.count));

    const nodes = [{ id: 'term', kind: 'term', label: query }];
    const links = [];
    const groups = new Map();
    for (const { law, count } of rows) {
        const group = getAcervoGroup(law);
        if (!groups.has(group)) groups.set(group, 0);
        groups.set(group, groups.get(group) + count);
        nodes.push({
            id: `law:${law.id}`, kind: 'law', lawId: String(law.id), group, count,
            label: law.siglas || law.titulo, title: law.titulo, weight: count / max,
        });
        links.push({ source: `group:${group}`, target: `law:${law.id}`, kind: 'member' });
    }
    for (const group of ACERVO_GROUPS) {
        if (!groups.has(group.id)) continue;
        nodes.push({ id: `group:${group.id}`, kind: 'group', group: group.id, label: group.label, count: groups.get(group.id) });
        links.push({ source: 'term', target: `group:${group.id}`, kind: 'set' });
    }
    const shown = rows.map(row => row.law);
    const seen = new Set();
    for (const law of shown) {
        for (const other of citedLaws(law, shown)) {
            const key = [law.id, other.id].sort().join('|');
            if (seen.has(key)) continue;
            seen.add(key);
            links.push({ source: `law:${law.id}`, target: `law:${other.id}`, kind: 'cites' });
        }
    }
    return { nodes, links, total: rows.reduce((sum, row) => sum + row.count, 0), hidden: Math.max(0, lawCounts.length - rows.length) };
}
