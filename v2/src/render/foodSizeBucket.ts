const MIN_BUCKET = 4;
const MAX_BUCKET = 16;
const STEP = 2;

export const FOOD_BUCKETS: readonly number[] = [4, 6, 8, 10, 12, 14, 16];

export function foodSizeBucket(radius: number): number {
  if (!Number.isFinite(radius)) {
    return MIN_BUCKET;
  }
  const snapped = Math.round(radius / STEP) * STEP;
  if (snapped < MIN_BUCKET) {
    return MIN_BUCKET;
  }
  if (snapped > MAX_BUCKET) {
    return MAX_BUCKET;
  }
  return snapped;
}
