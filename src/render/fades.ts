export function smoothstep(t: number): number {
  if (t <= 0) {
    return 0;
  }
  if (t >= 1) {
    return 1;
  }
  return t * t * (3 - 2 * t);
}

export function spawnFade(elapsed: number, spawnedAt: number): number {
  return smoothstep((elapsed - spawnedAt) / 0.4);
}

export function foodAppear(elapsed: number, bornAt: number): number {
  return smoothstep((elapsed - bornAt) / 0.3);
}
