import { describe, expect, it } from 'vitest';
import { eatMinInterval, eatPitch } from './eatPitch';

describe('eatPitch', () => {
  it('rises with the eat streak and caps', () => {
    expect(eatMinInterval).toBeCloseTo(0.05);
    expect(eatPitch(1)).toBe(480);
    expect(eatPitch(2)).toBe(516);
    expect(eatPitch(16)).toBe(480 + 15 * 36);
    expect(eatPitch(40)).toBe(eatPitch(16));
    expect(eatPitch(0)).toBe(480);
  });
});
