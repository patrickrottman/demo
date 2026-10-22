import type { Random } from '../core/random/Random';
import type { BotPersonality } from './BotPersonality';

export function createPersonality(rng: Random): BotPersonality {
  const roll = rng.next();
  if (roll < 0.28) {
    return {
      aggression: rng.range(0.04, 0.26),
      caution: rng.range(0.74, 0.96),
      greed: rng.range(0.72, 0.98),
      boostiness: rng.range(0.02, 0.22),
      reactionTime: rng.range(0.12, 0.18),
    };
  }
  if (roll < 0.62) {
    return {
      aggression: rng.range(0.34, 0.58),
      caution: rng.range(0.42, 0.68),
      greed: rng.range(0.38, 0.66),
      boostiness: rng.range(0.28, 0.52),
      reactionTime: rng.range(0.08, 0.14),
    };
  }
  if (roll < 0.84) {
    return {
      aggression: rng.range(0.74, 0.96),
      caution: rng.range(0.36, 0.62),
      greed: rng.range(0.12, 0.4),
      boostiness: rng.range(0.46, 0.74),
      reactionTime: rng.range(0.06, 0.1),
    };
  }
  return {
    aggression: rng.range(0.58, 0.92),
    caution: rng.range(0.04, 0.28),
    greed: rng.range(0.18, 0.48),
    boostiness: rng.range(0.8, 1),
    reactionTime: rng.range(0.06, 0.09),
  };
}
