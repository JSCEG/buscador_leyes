/**
 * Polos de Desarrollo para el Bienestar (#polos): the pure part of the section — figures, counts,
 * polygon centres and what lies near a polo. Data: public/polos/polos.json (official DOF / gob.mx
 * information) and public/polos/poligonos.geojson (polygons drawn from the coordinates printed in
 * each declaratoria).
 */

/** A design token's current value; Leaflet paints SVG attributes, which cannot read var(). */
const cssToken = (name, fallback) => {
    try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
    catch { return fallback; }
};
// The three official figures, in the order the section shows them. Their colour is a design token
// (read on use, so a theme switch repaints): guinda for the Istmo, gold for Economía, green for SEMARNAT.
const figura = (clave, corto, token, fallback) => ({ clave, corto, token, get color() { return cssToken(token, fallback); } });
export const FIGURAS = [
    figura('PODEBI', 'Bienestar', '--col-ley', '#7f1734'),
    figura('PODECOBI', 'Económico', '--accent', '#7a5a14'),
    figura('PODECIBI', 'Economía circular', '--col-disposicion', '#0e735c'),
];
export const FIGURA = Object.fromEntries(FIGURAS.map(f => [f.clave, f]));

// White line glyph of each figure inside its pin: industrial park, logistics and trade, circular economy.
const GLYPHS = {
    PODEBI: '<path d="M3 20V11l5 3v-3l5 3V7h4v13z"/><path d="M3 20h18"/><path d="M15 4.5c0-1 1-1 1-2"/>',
    PODECOBI: '<rect x="4" y="8" width="16" height="11" rx="1.5"/><path d="M9 8V5.5h6V8"/><path d="M4 13h16"/>',
    PODECIBI: '<path d="M5 12a7 7 0 0 1 12-4.9L19 9"/><path d="M19 4v5h-5"/><path d="M19 12a7 7 0 0 1-12 4.9L5 15"/><path d="M5 20v-5h5"/>',
};

/**
 * Pin of a polo (MarkerSet pin, 36 × 46 px, anchored at the tip) in its figure's colour token.
 * An abrogated polo is the dashed outline; the selected one wears the accent halo.
 */
export function poloPinSVG(clave, { abrogada = false, selected = false } = {}) {
    const f = FIGURA[clave] || FIGURAS[0];
    const colour = `var(${f.token})`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="-3 -3 42 52" aria-hidden="true" style="overflow:visible;filter:drop-shadow(0 3px 4px rgba(18,33,58,.28))">`
        + (selected ? '<path d="M18 -2C7 -2 -2 6.7 -2 17.6 -2 31 18 48.5 18 48.5S38 31 38 17.6C38 6.7 29 -2 18 -2z" style="fill:none;stroke:var(--accent);stroke-width:3"/>' : '')
        + `<path d="M18 1C8.6 1 1 8.4 1 17.6 1 29.5 18 45 18 45s17-15.5 17-27.4C35 8.4 27.4 1 18 1z" style="fill:${abrogada ? 'var(--surface-1)' : colour};stroke:${abrogada ? colour : '#ffffff'};stroke-width:2${abrogada ? ';stroke-dasharray:4 3' : ''}"/>`
        + `<g transform="translate(7 6.6) scale(.92)" style="fill:none;stroke:${abrogada ? colour : '#ffffff'};stroke-width:2.17;stroke-linecap:round;stroke-linejoin:round">${GLYPHS[f.clave]}</g></svg>`;
}

/** Hash of the section or of one polo. */
export const polosHash = id => (id ? `#polo=${encodeURIComponent(id)}` : '#polos');

/** `{ id }` for #polos / #polo=<id>, or null when the hash is not this section. */
export function polosRoute(hash) {
    if (hash === '#polos') return { id: null };
    if (hash?.startsWith('#polo=')) return { id: decodeURIComponent(hash.slice('#polo='.length)) || null };
    return null;
}

export const vigentes = polos => polos.filter(p => p.estatus !== 'abrogada');

/** Headline numbers: polos in force, states, by figure, total declared hectares. */
export function stats(polos) {
    const live = vigentes(polos);
    const porFigura = Object.fromEntries(FIGURAS.map(f => [f.clave, 0]));
    live.forEach(p => { if (p.figura in porFigura) porFigura[p.figura] += 1; });
    const porEstado = {};
    live.forEach(p => { if (p.estado) porEstado[p.estado] = (porEstado[p.estado] || 0) + 1; });
    const conSuperficie = live.filter(p => Number(p.superficie_ha) > 0);
    return {
        total: live.length,
        abrogadas: polos.length - live.length,
        estados: Object.keys(porEstado).length,
        porFigura,
        porEstado: Object.entries(porEstado).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')),
        hectareas: conSuperficie.reduce((sum, p) => sum + Number(p.superficie_ha), 0),
        conSuperficie: conSuperficie.length,
    };
}

/** Great-circle distance in km between two [lat, lon] points. */
export function distanceKm([lat1, lon1], [lat2, lon2]) {
    const rad = Math.PI / 180;
    const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2
        + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Mean of the outer-ring vertices of a Polygon / MultiPolygon, as [lat, lon]; null without rings. */
export function centroid(geometry) {
    const polys = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
    const points = polys.flatMap(([outer = []]) => outer.slice(0, -1));
    if (!points.length) return null;
    const [lon, lat] = points.reduce(([x, y], [px, py]) => [x + px, y + py], [0, 0]);
    return [lat / points.length, lon / points.length];
}

/** Where a polo sits: its polygon's centre when the declaratoria gives one, else its municipal point. */
export function poloCenter(polo, feature) {
    const c = feature ? centroid(feature.geometry) : null;
    if (c) return { latlng: c, exacta: true };
    if (Number.isFinite(polo?.lat) && Number.isFinite(polo?.lng)) return { latlng: [polo.lat, polo.lng], exacta: false };
    return null;
}

/**
 * Permits (GeoJSON point features from /api/mapa/capa) within `radiusKm` of `center`, nearest first,
 * each with its `km`.
 */
export function permitsNear(features, center, radiusKm = 25) {
    const out = [];
    for (const f of features || []) {
        const [lon, lat] = f?.geometry?.coordinates || [];
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const km = distanceKm(center, [lat, lon]);
        if (km <= radiusKm) out.push({ feature: f, km });
    }
    return out.sort((a, b) => a.km - b.km);
}

/** Official milestones of a polo, oldest first. */
export const hitosOrdenados = polo => [...(polo?.hitos || [])].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
