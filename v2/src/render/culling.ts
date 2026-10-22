import { GameConfig } from '../config/GameConfig';
import type { VisibleBounds } from './camera/VisibleBounds';

export function circleOutside(x: number, y: number, radius: number, bounds: VisibleBounds): boolean {
  const reach = radius > 0 ? radius : 0;
  return x + reach < bounds.left || x - reach > bounds.right || y + reach < bounds.top || y - reach > bounds.bottom;
}

export function snakeReach(segmentCount: number, radius: number): number {
  const spacing = radius * GameConfig.snake.segmentSpacingRatio;
  const links = segmentCount > 1 ? segmentCount - 1 : 0;
  return links * spacing + (radius > 0 ? radius : 0);
}
