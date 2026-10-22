import { describe, expect, it } from 'vitest';
import { minimapDotRadius, minimapPoint } from './minimapPoint';

describe('minimapPoint', () => {
  it('maps the arena onto the disc', () => {
    const out = { x: 0, y: 0 };
    expect(minimapPoint(0, 0, 6000, 100, 80, 70, out)).toBe(out);
    expect(out.x).toBeCloseTo(100, 8);
    expect(out.y).toBeCloseTo(80, 8);
    minimapPoint(6000, 0, 6000, 100, 80, 70, out);
    expect(out.x).toBeCloseTo(170, 8);
    expect(out.y).toBeCloseTo(80, 8);
    minimapPoint(0, -6000, 6000, 100, 80, 70, out);
    expect(out.x).toBeCloseTo(100, 8);
    expect(out.y).toBeCloseTo(10, 8);
    minimapPoint(40, 40, 0, 100, 80, 70, out);
    expect(out.x).toBe(100);
    expect(out.y).toBe(80);
  });

  it('grows dots with mass and clamps them', () => {
    expect(minimapDotRadius(0)).toBe(1.7);
    expect(minimapDotRadius(20)).toBeGreaterThan(minimapDotRadius(0));
    expect(minimapDotRadius(2000)).toBeGreaterThan(minimapDotRadius(20));
    expect(minimapDotRadius(1_000_000)).toBe(5.4);
    expect(minimapDotRadius(-5)).toBe(1.7);
  });
});
