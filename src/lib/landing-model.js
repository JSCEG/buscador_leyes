/** What the landing shows about the catalog. Pure: everything comes from the summaries of `search-ready`. */
import { groupAcervo, selectAcervo } from './acervo-model.js';
import { coverData } from './law-cover.js';

const list = summaries => (Array.isArray(summaries) ? summaries : []);

export function catalogFigures(summaries) {
    const documents = list(summaries);
    return {
        documentos: documents.length,
        articulos: documents.reduce((sum, law) => sum + (Number.isFinite(law?.articulos) && law.articulos > 0 ? law.articulos : 0), 0),
    };
}

/** One bar per collection that has documents, in the acervo's order, scaled to the largest (0 to 1). */
export function typeBars(summaries) {
    const groups = groupAcervo(list(summaries)).filter(group => group.items.length);
    const max = Math.max(0, ...groups.map(group => group.items.length));
    return groups.map(group => ({ id: group.id, label: group.label, count: group.items.length, share: group.items.length / max }));
}

/** The latest documents with a publication date, newest first. */
export function recentDocuments(summaries, count = 5) {
    return selectAcervo(list(summaries), { sort: 'date-newest' })
        .filter(law => /^\d{4}/.test(String(law.fecha_publicacion ?? '')))
        .slice(0, count)
        .map(law => {
            const cover = coverData(law);
            // the short title: many documents only have an internal code as their acronym
            return { id: law.id, name: cover.name, date: cover.date, year: cover.year };
        });
}

// The projection of mexico-map.js (scripts/build-intro-map.mjs): equirectangular, scaled by the cosine of the middle latitude.
const MAP = { minLon: -118.37, maxLat: 32.72, k: 0.9164, scale: 34.43 };

/** Where a point falls on the map of Mexico, in the units of MEXICO_VIEWBOX; null without coordinates. */
export function mexicoPoint(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [(lng - MAP.minLon) * MAP.k * MAP.scale, (MAP.maxLat - lat) * MAP.scale];
}

export function figuresLine({ documentos, articulos }) {
    const number = new Intl.NumberFormat('es-MX');
    return `${number.format(articulos)} artículos en ${number.format(documentos)} documentos`;
}
