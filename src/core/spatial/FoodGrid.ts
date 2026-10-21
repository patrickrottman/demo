import type { FoodView } from '../contracts/FoodView';
import { distanceSquared } from '../math/scalars';
import { cellKey, cellOf } from './cellKey';

export class FoodGrid {
  private readonly buckets = new Map<number, FoodView[]>();
  private readonly foodById = new Map<number, FoodView>();
  private readonly keyById = new Map<number, number>();
  private readonly slotById = new Map<number, number>();

  constructor(private readonly cellSize: number) {}

  insert(food: FoodView): void {
    if (this.foodById.has(food.id)) this.remove(food.id);
    const key = this.keyFor(food.x, food.y);
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = [];
      this.buckets.set(key, bucket);
    }
    this.foodById.set(food.id, food);
    this.keyById.set(food.id, key);
    this.slotById.set(food.id, bucket.length);
    bucket.push(food);
  }

  remove(id: number): void {
    const key = this.keyById.get(id);
    const slot = this.slotById.get(id);
    if (key === undefined || slot === undefined) return;
    const bucket = this.buckets.get(key);
    this.foodById.delete(id);
    this.keyById.delete(id);
    this.slotById.delete(id);
    if (!bucket) return;
    const last = bucket.length - 1;
    const moved = bucket[last];
    if (slot !== last && moved) {
      bucket[slot] = moved;
      this.slotById.set(moved.id, slot);
    }
    bucket.pop();
    if (bucket.length === 0) this.buckets.delete(key);
  }

  move(food: FoodView): void {
    const current = this.keyById.get(food.id);
    if (current === undefined) return;
    const next = this.keyFor(food.x, food.y);
    if (current === next) return;
    this.remove(food.id);
    this.insert(food);
  }

  query(x: number, y: number, range: number, out?: FoodView[]): FoodView[] {
    const result = out ?? [];
    result.length = 0;
    const minX = cellOf(x - range, this.cellSize);
    const maxX = cellOf(x + range, this.cellSize);
    const minY = cellOf(y - range, this.cellSize);
    const maxY = cellOf(y + range, this.cellSize);
    const rangeSq = range * range;
    for (let cx = minX; cx <= maxX; cx += 1) {
      for (let cy = minY; cy <= maxY; cy += 1) {
        const bucket = this.buckets.get(cellKey(cx, cy));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i += 1) {
          const food = bucket[i];
          if (!food) continue;
          if (distanceSquared(x, y, food.x, food.y) <= rangeSq) result.push(food);
        }
      }
    }
    return result;
  }

  clear(): void {
    this.buckets.clear();
    this.foodById.clear();
    this.keyById.clear();
    this.slotById.clear();
  }

  private keyFor(x: number, y: number): number {
    return cellKey(cellOf(x, this.cellSize), cellOf(y, this.cellSize));
  }
}
