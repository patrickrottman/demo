import { sampleDisk } from '../food/sampleDisk';
import type { Vec2 } from '../contracts/Vec2';
import type { Random } from '../random/Random';

export function pickSpawnPoint(
  rng: Random,
  maxRadius: number,
  attempts: number,
  clearance: number,
  nearestDistanceSq: (x: number, y: number) => number,
): Vec2 {
  const point = { x: 0, y: 0 };
  let bestX = 0;
  let bestY = 0;
  let bestClear = -1;
  const clearanceSq = clearance * clearance;
  const tries = attempts > 0 ? attempts : 1;
  for (let i = 0; i < tries; i += 1) {
    sampleDisk(rng, maxRadius, point);
    const clear = nearestDistanceSq(point.x, point.y);
    if (clear >= clearanceSq) return { x: point.x, y: point.y };
    if (clear > bestClear) {
      bestClear = clear;
      bestX = point.x;
      bestY = point.y;
    }
  }
  return { x: bestX, y: bestY };
}
