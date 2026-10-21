import { describe, expect, it } from 'vitest';
import { foodAppear, smoothstep, spawnFade } from './fades';

describe('fades', () => {
  it('smoothsteps the unit interval', () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBe(0.5);
    expect(smoothstep(-1)).toBe(0);
    expect(smoothstep(2)).toBe(1);
  });

  it('fades snakes in over 0.4s and food in over 0.3s', () => {
    expect(spawnFade(10, 10)).toBe(0);
    expect(spawnFade(10.2, 10)).toBeCloseTo(0.5, 8);
    expect(spawnFade(10.4, 10)).toBe(1);
    expect(spawnFade(12, 10)).toBe(1);
    expect(foodAppear(5, 5)).toBe(0);
    expect(foodAppear(5.15, 5)).toBeCloseTo(0.5, 8);
    expect(foodAppear(5.3, 5)).toBe(1);
  });
});
