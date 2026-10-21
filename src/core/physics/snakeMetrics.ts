import { GameConfig } from '../../config/GameConfig';

export function radiusForMass(mass: number): number {
  const { minRadius, maxRadius, radiusMassScale } = GameConfig.snake;
  return minRadius + (maxRadius - minRadius) * (1 - Math.exp(-mass / radiusMassScale));
}

export function segmentCountForMass(mass: number): number {
  const { maxSegments, segmentsBase, segmentsPerSqrtMass } = GameConfig.snake;
  return Math.min(maxSegments, Math.round(segmentsBase + segmentsPerSqrtMass * Math.sqrt(mass)));
}

export function turnRateForMass(mass: number): number {
  const { turnRateMin, turnRateMax, turnRateMassScale } = GameConfig.snake;
  return turnRateMin + (turnRateMax - turnRateMin) * Math.exp(-mass / turnRateMassScale);
}

export function segmentSpacing(radius: number): number {
  return radius * GameConfig.snake.segmentSpacingRatio;
}
