import { describe, expect, it } from 'vitest';
import { VisibleBounds } from './camera/VisibleBounds';
import { circleOutside, snakeReach } from './culling';

describe('culling', () => {
  it('rejects circles that miss the bounds and keeps circles that touch them', () => {
    const bounds = new VisibleBounds();
    bounds.left = 0;
    bounds.top = 0;
    bounds.right = 100;
    bounds.bottom = 80;
    expect(circleOutside(50, 40, 4, bounds)).toBe(false);
    expect(circleOutside(100, 40, 0, bounds)).toBe(false);
    expect(circleOutside(110, 40, 10, bounds)).toBe(false);
    expect(circleOutside(110.1, 40, 10, bounds)).toBe(true);
    expect(circleOutside(-1, 40, 0, bounds)).toBe(true);
    expect(circleOutside(50, -5, 4, bounds)).toBe(true);
    expect(circleOutside(50, 90, 10, bounds)).toBe(false);
  });

  it('measures reach from segment spacing', () => {
    expect(snakeReach(1, 12)).toBe(12);
    expect(snakeReach(0, 8)).toBe(8);
    expect(snakeReach(4, 10)).toBe(25);
  });
});
