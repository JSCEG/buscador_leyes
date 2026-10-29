import { describe, it, expect } from 'vitest';
import { markerSize, pinIcon } from '../src/lib/map-common.js';

// Minimal Leaflet stand-in: divIcon keeps its options so the test can read them.
const L = { divIcon: options => ({ options }) };

describe('MarkerSet markers on the permits map', () => {
    it('sizes the dot by capacity: < 30, 30–100, 100–300, > 300 MW', () => {
        expect([0.5, 29.9, 30, 99, 100, 299, 300, 5000].map(markerSize)).toEqual([14, 14, 20, 20, 28, 28, 38, 38]);
        expect(markerSize(0)).toBe(20);
        expect(markerSize(undefined)).toBe(20);
    });

    it('draws generation permits as technology dots, rings while not operating and a halo when selected', () => {
        const cache = new Map();
        const dot = pinIcon(L, cache, 'electricidad', 'solar', '', 'eo', { size: 28 });
        expect(dot.options.iconSize).toEqual([36, 36]);
        expect(dot.options.html).toContain('var(--tec-eo)');
        expect(dot.options.html).not.toContain('stroke-dasharray');

        const planned = pinIcon(L, cache, 'electricidad', 'solar', '', 'eo', { size: 28, planned: true });
        expect(planned.options.html).toContain('stroke-dasharray');

        const selected = pinIcon(L, cache, 'electricidad', 'solar', '', 'eo', { size: 28, selected: true });
        expect(selected.options.html).toContain('var(--accent)');
        expect(pinIcon(L, cache, 'electricidad', 'solar', '', 'eo', { size: 28 })).toBe(dot);
    });

    it('keeps the infrastructure pin for markets without a technology', () => {
        const pin = pinIcon(L, new Map(), 'gasnatural', 'ducto', 'is-novig');
        expect(pin.options.html).toContain('class="pmm-pin is-novig"');
        expect(pin.options.iconSize).toEqual([24, 24]);
    });
});
