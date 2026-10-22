import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../core/random/SeededRandom';
import type { BotPersonality } from './BotPersonality';
import { createPersonality } from './createPersonality';

function bucket(personality: BotPersonality): string {
  if (personality.boostiness >= 0.8 && personality.caution <= 0.28) return 'reckless';
  if (personality.aggression <= 0.26 && personality.greed >= 0.72 && personality.boostiness <= 0.22) return 'farmer';
  if (personality.aggression >= 0.74 && personality.greed <= 0.4 && personality.boostiness <= 0.74) return 'hunter';
  return 'balanced';
}

describe('createPersonality', () => {
  it('stays inside the playable ranges', () => {
    const rng = new SeededRandom(11);
    for (let i = 0; i < 120; i++) {
      const personality = createPersonality(rng);
      expect(personality.aggression).toBeGreaterThanOrEqual(0);
      expect(personality.aggression).toBeLessThanOrEqual(1);
      expect(personality.caution).toBeGreaterThanOrEqual(0);
      expect(personality.caution).toBeLessThanOrEqual(1);
      expect(personality.greed).toBeGreaterThanOrEqual(0);
      expect(personality.greed).toBeLessThanOrEqual(1);
      expect(personality.boostiness).toBeGreaterThanOrEqual(0);
      expect(personality.boostiness).toBeLessThanOrEqual(1);
      expect(personality.reactionTime).toBeGreaterThanOrEqual(0.06);
      expect(personality.reactionTime).toBeLessThanOrEqual(0.18);
    }
  });

  it('produces varied archetypes', () => {
    const rng = new SeededRandom(11);
    const counts = { farmer: 0, balanced: 0, hunter: 0, reckless: 0 };
    for (let i = 0; i < 120; i++) {
      const kind = bucket(createPersonality(rng));
      counts[kind as keyof typeof counts] += 1;
    }
    expect(counts.farmer).toBeGreaterThan(0);
    expect(counts.balanced).toBeGreaterThan(0);
    expect(counts.hunter).toBeGreaterThan(0);
    expect(counts.reckless).toBeGreaterThan(0);
  });
});
