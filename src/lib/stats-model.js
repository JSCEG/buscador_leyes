import { ACERVO_GROUPS, getAcervoGroup } from './acervo-model.js';

/** Editorial tags that describe curation state, not subject matter. */
const EDITORIAL_TOPICS = new Set(['modificacion', 'texto original', 'leyes y reformas por completar']);

const text = value => typeof value === 'string' ? value : '';
const normalize = value => text(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es').trim().replace(/\s+/g, ' ');
const isDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && Number.isFinite(Date.parse(`${value.slice(0, 10)}T00:00:00Z`));
const fragments = law => Math.max(0, Number(law?.articulos) || 0);

export function publicationDay(law) {
    return isDay(law?.fecha_publicacion) ? law.fecha_publicacion.slice(0, 10) : null;
}

export function quarterKey(day) {
    return `${day.slice(0, 4)}-T${Math.floor((Number(day.slice(5, 7)) - 1) / 3) + 1}`;
}

function quarterRange(first, last) {
    const keys = [];
    let [year, q] = [Number(first.slice(0, 4)), Number(first.slice(-1))];
    const [endYear, endQ] = [Number(last.slice(0, 4)), Number(last.slice(-1))];
    while (year < endYear || (year === endYear && q <= endQ)) {
        keys.push(`${year}-T${q}`);
        if (++q > 4) { q = 1; year++; }
    }
    return keys;
}

/** Aggregate the catalogue once; every figure on the statistics page reads from this object. */
export function computeStats(summaries, { today = new Date() } = {}) {
    const laws = (Array.isArray(summaries) ? summaries : []).filter(law => law && typeof law === 'object');
    const groups = ACERVO_GROUPS.map(group => ({ ...group, count: 0, fragments: 0 }));
    const byGroup = new Map(groups.map(group => [group.id, group]));
    const rows = laws.map(law => {
        const group = getAcervoGroup(law);
        const entry = byGroup.get(group);
        entry.count++;
        entry.fragments += fragments(law);
        return { law, group, day: publicationDay(law), fragments: fragments(law) };
    });

    const days = rows.map(row => row.day).filter(Boolean).sort();
    const cutoff = new Date(today.getTime() - 365 * 864e5).toISOString().slice(0, 10);
    const quarters = days.length ? quarterRange(quarterKey(days[0]), quarterKey(days.at(-1))).map(key => ({ key, total: 0, byGroup: {} })) : [];
    const quarterIndex = new Map(quarters.map(quarter => [quarter.key, quarter]));
    for (const row of rows) {
        if (!row.day) continue;
        const quarter = quarterIndex.get(quarterKey(row.day));
        quarter.total++;
        quarter.byGroup[row.group] = (quarter.byGroup[row.group] || 0) + 1;
    }

    const topics = new Map();
    for (const { law } of rows) {
        const seen = new Set();
        for (const topic of Array.isArray(law.temas_clave) ? law.temas_clave : []) {
            const key = normalize(topic);
            if (!key || EDITORIAL_TOPICS.has(key) || seen.has(key)) continue;
            seen.add(key);
            const entry = topics.get(key) || { label: text(topic).trim(), count: 0 };
            entry.count++;
            topics.set(key, entry);
        }
    }

    const totalFragments = rows.reduce((sum, row) => sum + row.fragments, 0);
    return {
        total: rows.length,
        totalFragments,
        averageFragments: rows.length ? Math.round(totalFragments / rows.length) : 0,
        recent: rows.filter(row => row.day && row.day >= cutoff).length,
        latestDay: days.at(-1) || null,
        firstDay: days[0] || null,
        groups: groups.filter(group => group.count > 0),
        quarters,
        top: [...rows].sort((a, b) => b.fragments - a.fragments).slice(0, 10),
        topics: [...topics.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es')).slice(0, 12),
        rows,
    };
}
