import type { Vec2 } from '../core/contracts/Vec2';
import { clamp } from '../core/math/scalars';

export function minimapPoint(
  x: number,
  y: number,
  arenaRadius: number,
  centerX: number,
  centerY: number,
  mapRadius: number,
  out: Vec2,
): Vec2 {
  const scale = arenaRadius === 0 ? 0 : mapRadius / arenaRadius;
  out.x = centerX + x * scale;
  out.y = centerY + y * scale;
  return out;
}

export function minimapDotRadius(mass: number): number {
  const safe = mass > 0 ? mass : 0;
  return clamp(1.55 + Math.sqrt(safe) * 0.07, 1.7, 5.4);
}
