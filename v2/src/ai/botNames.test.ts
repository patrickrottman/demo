import { describe, expect, it } from 'vitest';
import { botNames } from './botNames';

describe('botNames', () => {
  it('lists unique snake-style names', () => {
    expect(botNames.length).toBeGreaterThanOrEqual(80);
    expect(new Set(botNames).size).toBe(botNames.length);
    for (const name of botNames) {
      expect(name.trim()).toBe(name);
      expect(name.length).toBeGreaterThan(2);
    }
  });
});
