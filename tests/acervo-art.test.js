import { describe, expect, it } from 'vitest';
import { collectionSpot, heroArt } from '../src/lib/acervo-art.js';

describe('acervo illustrations', () => {
    it('draws a decorative hero landscape with valid path data', () => {
        document.body.innerHTML = heroArt();
        const svg = document.querySelector('svg.ac-art');
        expect(svg.getAttribute('aria-hidden')).toBe('true');
        expect(svg.querySelectorAll('.ac-art-spin')).toHaveLength(2);
        for (const path of svg.querySelectorAll('path')) expect(path.getAttribute('d')).not.toMatch(/NaN|undefined/);
    });

    it('gives each collection its own spot and falls back for unknown ones', () => {
        const ids = ['leyes', 'reglamentos', 'acuerdos', 'dacg', 'convocatorias', 'normas', 'otros'];
        expect(new Set(ids.map(id => collectionSpot(id))).size).toBe(ids.length);
        expect(collectionSpot('nuevo')).toBe(collectionSpot('otros'));
    });
});
