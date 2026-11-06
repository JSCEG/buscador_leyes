import { describe, expect, it } from 'vitest';
import { hasMapLocation } from '../src/lib/permisos-api.js';

describe('whether a selection of SENER records goes on the map', () => {
  it('shows the map for records with coordinates', () => {
    expect(hasMapLocation(64, [])).toBe(true);
  });
  it('shows the map for records located only by state', () => {
    expect(hasMapLocation(0, [{ efId: '27', permisos: 12 }, { efId: '--', permisos: 100 }])).toBe(true);
  });
  it('hides the map when no record has a location', () => {
    expect(hasMapLocation(0, [{ efId: '--', permisos: 41 }])).toBe(false);
    expect(hasMapLocation(0, [{ efId: null, permisos: 3 }])).toBe(false);
    expect(hasMapLocation(0, [{ efId: '27', permisos: 0 }])).toBe(false);
    expect(hasMapLocation(0, [])).toBe(false);
    expect(hasMapLocation(undefined, undefined)).toBe(false);
  });
});
