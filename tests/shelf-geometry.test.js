import { describe, expect, it } from 'vitest';
import { arcLength, rel, screenScale, screenX, shelfMetrics, stepSpring, tomeTransform } from '../src/lib/shelf-geometry.js';

const m = shelfMetrics(400, { mobile: false });

describe('shelf geometry', () => {
  it('derives measures from H', () => {
    expect(m.ws).toBeCloseTo(64); expect(m.d).toBeCloseTo(288); expect(m.gap).toBeCloseTo(4.8);
    expect(m.U).toBeCloseTo(520); expect(shelfMetrics(400, { mobile: true }).U).toBeCloseTo(420);
    expect(m.P).toBe(1400);
  });
  it('wraps relative index', () => {
    expect(rel(1, 0, 124)).toBe(1); expect(rel(123, 0, 124)).toBe(-1);
    expect(rel(62, 0, 124)).toBe(-62); expect(rel(0, 0, 1)).toBe(0); expect(rel(1, 0, 2)).toBe(-1);
  });
  it('pushes neighbours apart around the open cover', () => {
    expect(arcLength(0, m)).toBe(0);
    expect(arcLength(1, m)).toBeCloseTo(m.ws + m.gap + (m.d - m.ws + 1.4 * m.gap) * 0.5);
    expect(arcLength(-1, m)).toBeCloseTo(-arcLength(1, m));
    expect(arcLength(0.001, m)).toBeLessThan(2);
  });
  it('scale and screen x fall off monotonically', () => {
    expect(screenScale(0, m)).toBe(1); expect(screenScale(m.U, m)).toBeCloseTo(0.5);
    expect(screenX(100, m)).toBeGreaterThan(screenX(50, m));
    expect(screenX(-100, m)).toBeCloseTo(-screenX(100, m));
    expect(screenX(200, m) - screenX(150, m)).toBeLessThan(screenX(50, m) - screenX(0, m));
  });
  it('turns only the centred tome and hides far ones', () => {
    const c = tomeTransform(0, m);
    expect(c.o).toBe(1); expect(c.rotateY).toBeCloseTo(-90); expect(c.z).toBeCloseTo(40); expect(c.visible).toBe(true);
    expect(tomeTransform(3, m).o).toBe(0);
    expect(tomeTransform(3, m).rotateY).toBeGreaterThan(0); expect(tomeTransform(-3, m).rotateY).toBeLessThan(0);
    expect(tomeTransform(60, m).visible).toBe(false);
    expect(tomeTransform(5, m).spineShade).toBeLessThanOrEqual(0.6);
    expect(tomeTransform(3, m).coverShade).toBeCloseTo(0.3);
    expect(tomeTransform(3, m).rotateY).toBeLessThanOrEqual(14);
    expect(tomeTransform(10, m).spineShade).toBeLessThanOrEqual(0.35);
  });
  it('spring approaches the target and caps dt', () => {
    expect(stepSpring(0, 10, 0.05, 5.2)).toBeCloseTo(10 * (1 - Math.exp(-0.26)));
    expect(stepSpring(0, 10, 5, 5.2)).toBeCloseTo(stepSpring(0, 10, 0.05, 5.2));
  });
});
