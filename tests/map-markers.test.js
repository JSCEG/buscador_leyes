import { describe, it, expect } from 'vitest';
import { pinIcon, pinSize } from '../src/lib/map-common.js';

// Minimal Leaflet stand-in: divIcon keeps its options so the test can read them.
const L = { divIcon: options => ({ options }) };

describe('MarkerSet markers on the permits map', () => {
    it('sizes the teardrop by capacity', () => {
        expect([0.5, 29.9, 30, 299, 300, 5000].map(pinSize)).toEqual([22, 22, 26, 26, 30, 30]);
    });

    it('draws generation permits as technology teardrops, dashed while not operating and marked when selected', () => {
        const cache = new Map();
        const pin = pinIcon(L, cache, 'electricidad', 'solar', '', 'eo', { size: 26 });
        expect(pin.options.html).toContain('var(--tec-eo)');
        expect(pin.options.html).not.toContain('stroke-dasharray');
        expect(pinIcon(L, cache, 'electricidad', 'solar', '', 'eo', { size: 26, planned: true }).options.html).toContain('stroke-dasharray');
        expect(pinIcon(L, cache, 'electricidad', 'solar', '', 'eo', { size: 26, selected: true }).options.className).toContain('is-sel');
        expect(pinIcon(L, cache, 'electricidad', 'solar', '', 'eo', { size: 26 })).toBe(pin);
    });

    it('keeps the infrastructure pin for markets without a technology', () => {
        const pin = pinIcon(L, new Map(), 'gasnatural', 'ducto', 'is-novig');
        expect(pin.options.html).toContain('class="pmm-pin is-novig"');
        expect(pin.options.iconSize).toEqual([24, 24]);
    });
});
