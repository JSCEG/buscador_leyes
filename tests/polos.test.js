import { describe, it, expect } from 'vitest';
import { polosRoute, polosHash, stats, centroid, poloCenter, permitsNear, hitosOrdenados } from '../src/lib/polos.js';

const square = { type: 'Polygon', coordinates: [[[-95, 18], [-94, 18], [-94, 19], [-95, 19], [-95, 18]]] };

describe('polos routes', () => {
    it('reads #polos and #polo=<id>', () => {
        expect(polosRoute('#polos')).toEqual({ id: null });
        expect(polosRoute('#polo=podebi-coatzacoalcos-i')).toEqual({ id: 'podebi-coatzacoalcos-i' });
        expect(polosRoute('#permisos')).toBeNull();
    });
    it('round-trips ids with accents', () => {
        const id = 'podebi-asunción';
        expect(polosRoute(polosHash(id))).toEqual({ id });
    });
});

describe('stats', () => {
    const polos = [
        { id: 'a', figura: 'PODEBI', estado: 'Oaxaca', superficie_ha: 100, estatus: 'vigente' },
        { id: 'b', figura: 'PODEBI', estado: 'Veracruz', superficie_ha: null, estatus: 'vigente' },
        { id: 'c', figura: 'PODECOBI', estado: 'Oaxaca', superficie_ha: 50.5, estatus: 'vigente' },
        { id: 'd', figura: 'PODECIBI', estado: 'Hidalgo', superficie_ha: 10, estatus: 'abrogada' },
    ];
    it('counts only polos in force', () => {
        const s = stats(polos);
        expect(s.total).toBe(3);
        expect(s.abrogadas).toBe(1);
        expect(s.estados).toBe(2);
        expect(s.porFigura).toEqual({ PODEBI: 2, PODECOBI: 1, PODECIBI: 0 });
        expect(s.porEstado[0]).toEqual(['Oaxaca', 2]);
        expect(s.hectareas).toBeCloseTo(150.5);
        expect(s.conSuperficie).toBe(2);
    });
});

describe('geometry', () => {
    it('centres a polygon without counting the closing vertex twice', () => {
        expect(centroid(square)).toEqual([18.5, -94.5]);
        expect(centroid({ type: 'MultiPolygon', coordinates: [square.coordinates] })).toEqual([18.5, -94.5]);
        expect(centroid(null)).toBeNull();
    });
    it('prefers the polygon over the municipal point', () => {
        expect(poloCenter({ lat: 1, lng: 2 }, { geometry: square })).toEqual({ latlng: [18.5, -94.5], exacta: true });
        expect(poloCenter({ lat: 1, lng: 2 }, null)).toEqual({ latlng: [1, 2], exacta: false });
        expect(poloCenter({ lat: null, lng: null }, null)).toBeNull();
    });
    it('lists permits within the radius, nearest first', () => {
        const pt = (lon, lat, n) => ({ geometry: { coordinates: [lon, lat] }, properties: { n } });
        const near = permitsNear([pt(-94.5, 18.6, 'b'), pt(-94.5, 18.52, 'a'), pt(-90, 20, 'far'), { geometry: null }], [18.5, -94.5], 25);
        expect(near.map(x => x.feature.properties.n)).toEqual(['a', 'b']);
        expect(near[0].km).toBeCloseTo(2.2, 1);
    });
});

it('orders milestones by date', () => {
    expect(hitosOrdenados({ hitos: [{ fecha: '2025-03-01' }, { fecha: '2024-01-10' }] }).map(h => h.fecha)).toEqual(['2024-01-10', '2025-03-01']);
});
