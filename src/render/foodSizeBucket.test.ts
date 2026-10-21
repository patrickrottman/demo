import { describe, expect, it } from 'vitest';
import { FOOD_BUCKETS, foodSizeBucket } from './foodSizeBucket';

describe('foodSizeBucket', () => {
  it('snaps radii onto even buckets from 4 to 16', () => {
    expect(foodSizeBucket(4)).toBe(4);
    expect(foodSizeBucket(5)).toBe(6);
    expect(foodSizeBucket(7)).toBe(8);
    expect(foodSizeBucket(15)).toBe(16);
    expect(foodSizeBucket(16)).toBe(16);
    expect(foodSizeBucket(100)).toBe(16);
    expect(foodSizeBucket(0)).toBe(4);
    expect(foodSizeBucket(Number.NaN)).toBe(4);
    for (const bucket of FOOD_BUCKETS) {
      expect(foodSizeBucket(bucket)).toBe(bucket);
    }
  });
});
