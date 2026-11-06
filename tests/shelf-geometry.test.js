import { describe, expect, it } from 'vitest';
import { arcLength, clampIndex, presencePositions, screenScale, screenX, shelfMetrics, springStep, tomeTransform } from '../src/lib/shelf-geometry.js';

const m = shelfMetrics(400, { mobile: false });

describe('shelf geometry', () => {
  it('derives measures from H', () => {
    expect(m.ws).toBeCloseTo(64); expect(m.d).toBeCloseTo(288); expect(m.gap).toBeCloseTo(4.8);
    expect(m.U).toBeCloseTo(520); expect(shelfMetrics(400, { mobile: true }).U).toBeCloseTo(420);
    expect(m.P).toBe(1400);
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
  it('starts gently on a long jump', () => {
    const s = springStep({ x: 0, v: 0 }, 26, 1 / 60, 7.5, { maxAccel: 60, maxSpeed: 13 });
    expect(s.x).toBeLessThan(0.02);
  });
  it('settles without overshoot', () => {
    let s = { x: 0, v: 0 }, max = 0;
    for (let i = 0; i < 600; i++) { s = springStep(s, 5, 1 / 60, 7.5); max = Math.max(max, s.x); }
    expect(s.x).toBeCloseTo(5, 2); expect(max).toBeLessThanOrEqual(5.001);
  });
  it('never moves faster than its cap', () => {
    let s = { x: 0, v: 0 };
    for (let i = 0; i < 300; i++) {
      const next = springStep(s, 100, 1 / 60, 7.5, { maxAccel: 60, maxSpeed: 13 });
      expect(Math.abs(next.x - s.x)).toBeLessThanOrEqual(13 / 60 + 1e-9);
      s = next;
    }
  });
  it('caps a long frame', () => {
    expect(springStep({ x: 0, v: 0 }, 10, 5, 7.5)).toEqual(springStep({ x: 0, v: 0 }, 10, 0.05, 7.5));
  });
  it('stacks positions by presence', () => { expect(presencePositions([1, 0, 0.5, 1])).toEqual([0, 1, 1, 1.5]); });
  it('clamps to the nearest visible index', () => {
    expect(clampIndex(5, [1, 2, 8])).toBe(2);
    expect(clampIndex(0, [3, 4])).toBe(3);
    expect(clampIndex(9, [3, 4])).toBe(4);
    expect(clampIndex(4, [])).toBe(4);
  });
});
