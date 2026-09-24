import { relatedDocumentLabel } from './related-document.js';
import { officialUrl } from './official-url.js';
import { getAcervoGroup } from './acervo-model.js';

const text = value => typeof value === 'string' ? value : '';
const normalize = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const verbs = { modifica: 'Modifica', reforma: 'Reforma', adiciona: 'Adiciona', abroga: 'Abroga', sustituye: 'Sustituye' };
const types = { ley: 'Ley', reglamento: 'Reglamento', acuerdo: 'Acuerdo', dacg: 'DACG', convocatoria: 'Convocatoria', decreto: 'Decreto', norma: 'Norma', nom: 'Norma' };

export function timelineDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text(value))) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value ? value : null;
}

export function timelineSource(value) {
    return officialUrl(value) || null;
}

/** Only explicit editorial links identify other records; ordinary legal citations do not. */
function editorialReferences(articles) {
    const refs = [];
    for (const article of articles) {
        if (article.tipo_articulo !== 'complementario' || !/^(?:nota editorial|guia)\b/.test(normalize(article.articulo_label))) continue;
        for (const match of text(article.texto).matchAll(/<a\b[^>]*\bhref=["']\/?#ley-([\w-]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
            const label = normalize(match[2].replace(/<[^>]*>/g, '').trim());
            const modification = label.match(/^modificacion\s+(\d+)\b/);
            refs.push({
                id: match[1],
                role: /^texto original\b/.test(label) ? 'Texto original' : modification ? `Modificación ${modification[1]}` : 'Documento relacionado',
            });
        }
    }
    return refs;
}

/** Dates must identify this complement's publication/notification, never a cited law's date. */
function complementDate(article) {
    const label = normalize(article.articulo_label);
    const errata = label.match(/^fe de erratas\s+dof\s+(\d{2})-(\d{2})-(\d{4})\b/);
    if (errata) return { date: timelineDate(`${errata[3]}-${errata[2]}-${errata[1]}`), dateLabel: 'Publicación en el DOF' };
    const heading = normalize(text(article.texto).slice(0, 1000));
    const published = heading.match(/(?:^|\n)\s*publicad[ao]s? en el diario oficial de la federacion el (\d{1,2}) de ([a-z]+) de (\d{4})\s*(?:\n|$)/);
    const notified = heading.match(/(?:^|\n)\s*notificados al congreso de la union para efectos legales el (\d{1,2}) de ([a-z]+) de (\d{4})\s*(?:\n|$)/);
    const match = published || notified;
    if (!match) return { date: null, dateLabel: 'Sin fecha' };
    return {
        date: timelineDate(`${match[3]}-${String(months.indexOf(match[2]) + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`),
        dateLabel: published ? 'Publicación en el DOF' : 'Notificación al Congreso',
    };
}

/** A chronology of records, not a consolidated legal text or a determination of validity. */
export function buildInstrumentTimeline({ law, summaries = [], articles = [], relations = [] }) {
    const catalog = new Map(summaries.filter(row => row?.id).map(row => [row.id, row]));
    catalog.set(law.id, law);
    const selected = new Set([law.id]);
    const roles = new Map();
    const missing = new Set();
    for (const ref of editorialReferences(articles)) {
        if (!catalog.has(ref.id)) { missing.add(ref.id); continue; }
        selected.add(ref.id);
        roles.set(ref.id, ref.role);
    }
    // Walk only recorded relationships. Cycles and repeated edges cannot duplicate events.
    const edges = relations.filter(row => row?.ley_afectada_id && row?.ley_nueva_id && row.ley_afectada_id !== row.ley_nueva_id);
    for (const id of selected) {
        for (const edge of edges) {
            const neighbor = edge.ley_afectada_id === id ? edge.ley_nueva_id : edge.ley_nueva_id === id ? edge.ley_afectada_id : null;
            if (!neighbor) continue;
            if (catalog.has(neighbor)) selected.add(neighbor);
            else missing.add(neighbor);
        }
    }
    const entries = [...selected].map(id => {
        const record = catalog.get(id);
        const outgoing = edges.filter(edge => edge.ley_nueva_id === id && selected.has(edge.ley_afectada_id));
        const relationsText = [...new Set(outgoing.map(edge => `${verbs[edge.tipo] || 'Relacionado con'}: ${catalog.get(edge.ley_afectada_id).siglas || catalog.get(edge.ley_afectada_id).titulo}`))];
        return {
            key: `law:${id}`, id, kind: 'instrument', title: record.titulo || 'Instrumento sin título',
            acronym: record.siglas || '', type: types[normalize(record.tipo)] || (getAcervoGroup(record) === 'convocatorias' ? 'Convocatoria' : 'Instrumento'),
            role: roles.get(id) || 'Publicación',
            date: timelineDate(record.fecha_publicacion), dateLabel: 'Publicación',
            current: id === law.id, source: timelineSource(record.url_original),
            sourceLabel: 'Fuente oficial',
            context: relationsText.join(' · ') || (roles.has(id) ? 'Enlazado desde la guía de este documento.' : ''),
        };
    });
    for (const article of articles) {
        const type = relatedDocumentLabel(article);
        if (!article.id || !type || entries.some(entry => entry.key === `article:${article.id}`)) continue;
        const dated = complementDate(article);
        entries.push({
            key: `article:${article.id}`, id: article.id, kind: 'complement',
            title: article.articulo_label || type, acronym: '', type, role: 'Documento relacionado',
            ...dated, current: false,
            // The instrument URL may be a compiled edition; never pretend it is this event's standalone publication.
            source: timelineSource(article.url_original || law.url_original), sourceLabel: 'Fuente del instrumento',
            context: 'Viene dentro del mismo documento; puedes leerlo aquí.',
        });
    }
    entries.sort((a, b) => {
        if (a.date !== b.date) return a.date === null ? 1 : b.date === null ? -1 : a.date.localeCompare(b.date);
        if (a.role === 'Texto original' && b.role !== 'Texto original') return -1;
        if (b.role === 'Texto original' && a.role !== 'Texto original') return 1;
        return a.title.localeCompare(b.title, 'es', { numeric: true }) || a.key.localeCompare(b.key);
    });
    return { entries, unavailableCount: missing.size };
}
