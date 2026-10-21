import type { SegmentHit } from '../contracts/SegmentHit';
import type { SnakeView } from '../contracts/SnakeView';
import { distanceSquared } from '../math/scalars';
import { cellKey, cellOf } from './cellKey';
import { SegmentRecord } from './SegmentRecord';

export class SegmentGrid {
  private readonly buckets = new Map<number, SegmentRecord[]>();
  private readonly pool: SegmentRecord[] = [];
  private readonly activeKeys: number[] = [];
  private poolCount = 0;
  private maxRadius = 0;

  constructor(private readonly cellSize: number) {}

  rebuild(snakes: readonly SnakeView[]): void {
    this.clear();
    for (let s = 0; s < snakes.length; s += 1) {
      const snake = snakes[s];
      if (!snake) continue;
      const segs = snake.segments;
      for (let i = 0; i < segs.length; i += 1) {
        const seg = segs[i];
        if (!seg) continue;
        this.insert(snake.id, i, seg.x, seg.y, snake.radius);
      }
    }
  }

  query(x: number, y: number, range: number, out?: SegmentHit[]): SegmentHit[] {
    const result = out ?? [];
    result.length = 0;
    const reach = range + this.maxRadius;
    const minX = cellOf(x - reach, this.cellSize);
    const maxX = cellOf(x + reach, this.cellSize);
    const minY = cellOf(y - reach, this.cellSize);
    const maxY = cellOf(y + reach, this.cellSize);
    for (let cx = minX; cx <= maxX; cx += 1) {
      for (let cy = minY; cy <= maxY; cy += 1) {
        const bucket = this.buckets.get(cellKey(cx, cy));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i += 1) {
          const hit = bucket[i];
          if (!hit) continue;
          const limit = range + hit.radius;
          if (distanceSquared(x, y, hit.x, hit.y) <= limit * limit) result.push(hit);
        }
      }
    }
    return result;
  }

  clear(): void {
    for (let i = 0; i < this.activeKeys.length; i += 1) {
      const key = this.activeKeys[i];
      if (key === undefined) continue;
      const bucket = this.buckets.get(key);
      if (bucket) bucket.length = 0;
    }
    this.activeKeys.length = 0;
    this.poolCount = 0;
    this.maxRadius = 0;
  }

  private insert(snakeId: number, index: number, x: number, y: number, radius: number): void {
    let record = this.pool[this.poolCount];
    if (!record) {
      record = new SegmentRecord();
      this.pool[this.poolCount] = record;
    }
    record.set(snakeId, index, x, y, radius);
    this.poolCount += 1;
    if (radius > this.maxRadius) this.maxRadius = radius;
    const key = cellKey(cellOf(x, this.cellSize), cellOf(y, this.cellSize));
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = [];
      this.buckets.set(key, bucket);
    }
    if (bucket.length === 0) this.activeKeys.push(key);
    bucket.push(record);
  }
}
