/**
 * Polos de Desarrollo para el Bienestar (#polos): the pure part of the section — figures, counts,
 * polygon centres and what lies near a polo. Data: public/polos/polos.json (official DOF / gob.mx
 * information) and public/polos/poligonos.geojson (polygons drawn from the coordinates printed in
 * each declaratoria).
 */

/** The three official figures, in the order the section shows them, with their map colour. */
export const FIGURAS = [
    { clave: 'PODEBI', corto: 'Bienestar', color: '#9B2247' },
    { clave: 'PODECOBI', corto: 'Económico', color: '#A57F2C' },
    { clave: 'PODECIBI', corto: 'Científico', color: '#1E5B4F' },
];
export const FIGURA = Object.fromEntries(FIGURAS.map(f => [f.clave, f]));

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
