import { describe, expect, it } from 'vitest';
import { GameConfig } from '../../config/GameConfig';
import { radiusForMass, segmentCountForMass, segmentSpacing, turnRateForMass } from './snakeMetrics';

describe('snakeMetrics', () => {
  it('matches the mass curves', () => {
    const snake = GameConfig.snake;
    for (const mass of [0, 20, 250, 5000, 20000]) {
      expect(radiusForMass(mass)).toBeCloseTo(
        snake.minRadius + (snake.maxRadius - snake.minRadius) * (1 - Math.exp(-mass / snake.radiusMassScale)),
        10,
      );
      expect(segmentCountForMass(mass)).toBe(
        Math.min(snake.maxSegments, Math.round(snake.segmentsBase + snake.segmentsPerSqrtMass * Math.sqrt(mass))),
      );
      expect(turnRateForMass(mass)).toBeCloseTo(
        snake.turnRateMin + (snake.turnRateMax - snake.turnRateMin) * Math.exp(-mass / snake.turnRateMassScale),
        10,
      );
    }
  });

  it('caps length, grows radius, and slows the turn as mass rises', () => {
    expect(radiusForMass(0)).toBe(GameConfig.snake.minRadius);
    expect(radiusForMass(10)).toBeGreaterThan(radiusForMass(0));
    expect(segmentCountForMass(1e12)).toBe(GameConfig.snake.maxSegments);
    expect(segmentCountForMass(5000)).toBeGreaterThan(segmentCountForMass(20));
    expect(turnRateForMass(5000)).toBeLessThan(turnRateForMass(20));
    expect(segmentSpacing(12)).toBe(12 * GameConfig.snake.segmentSpacingRatio);
  });
});
