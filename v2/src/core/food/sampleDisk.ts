import type { Vec2 } from '../contracts/Vec2';
import type { Random } from '../random/Random';

export function sampleDisk(rng: Random, radius: number, out: Vec2): void {
  const angle = rng.angle();
  const dist = Math.sqrt(rng.next()) * radius;
  out.x = Math.cos(angle) * dist;
  out.y = Math.sin(angle) * dist;
}
