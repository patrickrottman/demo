import { describe, expect, it } from 'vitest';
import { PreviewPoint } from './PreviewPoint';
import { previewSegment } from './previewSegment';

describe('previewSegment', () => {
  it('puts the head on the right and keeps the body inside the box', () => {
    const head = new PreviewPoint();
    const tail = new PreviewPoint();
    previewSegment(head, 0, 18, 240, 120, 0.2);
    previewSegment(tail, 17, 18, 240, 120, 0.2);
    expect(head.x).toBeGreaterThan(tail.x);
    expect(head.radius).toBeGreaterThan(0);
    expect(head.radius).toBeLessThanOrEqual(120 * 0.22);
    expect(head.x + head.radius).toBeLessThanOrEqual(240);
    expect(tail.x - tail.radius).toBeGreaterThanOrEqual(0);
    expect(head.y).toBeGreaterThan(0);
    expect(head.y).toBeLessThan(120);
  });

  it('waves the body as time changes', () => {
    const a = new PreviewPoint();
    const b = new PreviewPoint();
    previewSegment(a, 12, 18, 240, 120, 0);
    previewSegment(b, 12, 18, 240, 120, 0.7);
    expect(a.y).not.toBeCloseTo(b.y, 3);
    expect(previewSegment(a, 4, 18, 240, 120, 1)).toBe(a);
  });
});
