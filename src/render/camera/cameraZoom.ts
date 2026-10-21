import { GameConfig } from '../../config/GameConfig';
import { clamp } from '../../core/math/scalars';

const MIN_VIEWPORT_SCALE = 0.55;
const MAX_VIEWPORT_SCALE = 1.4;
const VIEWPORT_REFERENCE = 1000;
const SIZE_SCALE_AT_MAX = 0.5;
const SIZE_SCALE_FLOOR = 0.34;

export function viewportScale(width: number, height: number): number {
  const minSide = width < height ? width : height;
  return clamp(minSide / VIEWPORT_REFERENCE, MIN_VIEWPORT_SCALE, MAX_VIEWPORT_SCALE);
}

export function sizeScaleForRadius(radius: number): number {
  const minRadius = GameConfig.snake.minRadius;
  const maxRadius = GameConfig.snake.maxRadius;
  const span = maxRadius - minRadius;
  const t = span === 0 ? 0 : (radius - minRadius) / span;
  return clamp(1 - (1 - SIZE_SCALE_AT_MAX) * t, SIZE_SCALE_FLOOR, 1);
}

export function targetZoom(width: number, height: number, radius: number): number {
  return viewportScale(width, height) * sizeScaleForRadius(radius);
}
