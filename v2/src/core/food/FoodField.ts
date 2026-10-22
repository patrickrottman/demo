import { GameConfig } from '../../config/GameConfig';
import { skinColorAt } from '../../content/skins/skinColors';
import type { FoodKind } from '../contracts/FoodKind';
import type { FoodView } from '../contracts/FoodView';
import type { Snake } from '../entities/Snake';
import { distanceSquared } from '../math/scalars';
import type { Random } from '../random/Random';
import { FoodGrid } from '../spatial/FoodGrid';
import { Food } from './Food';
import { sampleDisk } from './sampleDisk';

const initialBornAt = -0.3;

export class FoodField {
  readonly foods: Food[] = [];
  private readonly grid: FoodGrid;
  private readonly point = { x: 0, y: 0 };
  private readonly found: FoodView[] = [];
  private readonly claim: number[] = [];
  private readonly claimDist: number[] = [];
  private readonly dropX: number[] = [];
  private readonly dropY: number[] = [];
  private readonly dropColor: string[] = [];
  private nextId = 1;
  private ambientCount = 0;
  private budget = 0;

  constructor(private readonly rng: Random) {
    this.grid = new FoodGrid(GameConfig.world.spatialCellSize);
  }

  fillInitial(): void {
    const target = Math.min(GameConfig.food.ambientTarget, GameConfig.food.maxFood);
    while (this.ambientCount < target) this.spawnAmbient(initialBornAt);
  }

  reset(): void {
    this.foods.length = 0;
    this.grid.clear();
    this.nextId = 1;
    this.ambientCount = 0;
    this.budget = 0;
    this.fillInitial();
  }

  replenish(dt: number, bornAt: number): void {
    const target = GameConfig.food.ambientTarget;
    const maxFood = GameConfig.food.maxFood;
    if (this.ambientCount >= target || this.foods.length >= maxFood) return;
    this.budget += GameConfig.food.ambientRespawnPerSecond * dt;
    while (this.budget >= 1 && this.ambientCount < target && this.foods.length < maxFood) {
      this.budget -= 1;
      this.spawnAmbient(bornAt);
    }
  }

  addDrop(x: number, y: number, value: number, radius: number, color: string, kind: FoodKind, bornAt: number): void {
    if (value <= 0) return;
    if (this.foods.length >= GameConfig.food.maxFood) {
      this.mergeIntoNearest(x, y, value, radius);
      return;
    }
    this.addFood(x, y, radius, value, color, kind, bornAt);
  }

  dropRemains(snake: Snake, bornAt: number): void {
    const segments = snake.segments;
    const stride = Math.max(1, GameConfig.food.remainsSegmentStride);
    let count = 0;
    for (let i = 0; i < segments.length; i += stride) {
      const segment = segments[i];
      if (!segment) continue;
      const scatter = GameConfig.food.remainsScatter;
      this.dropX[count] = segment.x + this.rng.range(-scatter, scatter);
      this.dropY[count] = segment.y + this.rng.range(-scatter, scatter);
      this.dropColor[count] = skinColorAt(snake.skin, i, segments.length);
      count += 1;
    }
    if (count === 0) return;
    const valueEach = (snake.mass * GameConfig.food.remainsValueRatio) / count;
    const radius = this.remainsRadius(snake.radius);
    const room = GameConfig.food.maxFood - this.foods.length;
    if (room >= count) {
      for (let i = 0; i < count; i += 1) {
        this.addFood(
          this.dropX[i] ?? 0,
          this.dropY[i] ?? 0,
          radius,
          valueEach,
          this.dropColor[i] ?? '#FFFFFF',
          'remains',
          bornAt,
        );
      }
      return;
    }
    if (room <= 0) {
      this.mergeIntoNearest(this.dropX[0] ?? 0, this.dropY[0] ?? 0, valueEach * count, radius);
      return;
    }
    for (let group = 0; group < room; group += 1) {
      const start = Math.floor((group * count) / room);
      const end = Math.floor(((group + 1) * count) / room);
      if (end <= start) continue;
      let x = 0;
      let y = 0;
      for (let i = start; i < end; i += 1) {
        x += this.dropX[i] ?? 0;
        y += this.dropY[i] ?? 0;
      }
      const share = end - start;
      this.addFood(
        x / share,
        y / share,
        radius,
        valueEach * share,
        this.dropColor[start] ?? '#FFFFFF',
        'remains',
        bornAt,
      );
    }
  }

  attractAndEat(snakes: readonly Snake[], dt: number, onEat: (snake: Snake, food: Food) => void): void {
    const foods = this.foods;
    const count = foods.length;
    while (this.claim.length < count) {
      this.claim.push(-1);
      this.claimDist.push(0);
    }
    for (let i = 0; i < count; i += 1) this.claim[i] = -1;
    for (let s = 0; s < snakes.length; s += 1) {
      const snake = snakes[s];
      if (!snake?.alive) continue;
      const head = snake.segments[0];
      if (!head) continue;
      const range = GameConfig.food.attractBaseRange + snake.radius * GameConfig.food.attractRadiusRatio;
      const found = this.grid.query(head.x, head.y, range, this.found);
      const rangeSq = range * range;
      for (let i = 0; i < found.length; i += 1) {
        const food = found[i];
        if (!food) continue;
        const dist = distanceSquared(head.x, head.y, food.x, food.y);
        if (dist > rangeSq) continue;
        const slot = food instanceof Food ? food.slot : -1;
        if (slot < 0 || slot >= count) continue;
        const claimed = this.claim[slot] ?? -1;
        if (claimed !== -1 && dist >= (this.claimDist[slot] ?? 0)) continue;
        this.claim[slot] = s;
        this.claimDist[slot] = dist;
      }
    }
    const speed = GameConfig.food.attractSpeed * dt;
    for (let i = count - 1; i >= 0; i -= 1) {
      const snakeIndex = this.claim[i] ?? -1;
      if (snakeIndex < 0) continue;
      const food = foods[i];
      const snake = snakes[snakeIndex];
      if (!food || !snake) continue;
      const head = snake.segments[0];
      if (!head) continue;
      this.pull(food, head.x, head.y, speed);
      const eat = snake.radius + food.radius * 0.5;
      if (distanceSquared(head.x, head.y, food.x, food.y) < eat * eat) {
        onEat(snake, food);
        this.removeIndex(i);
      }
    }
  }

  query(x: number, y: number, range: number, out?: FoodView[]): FoodView[] {
    return this.grid.query(x, y, range, out);
  }

  removeIndex(index: number): void {
    const removed = this.foods[index];
    if (!removed) return;
    if (removed.kind === 'ambient') this.ambientCount = Math.max(0, this.ambientCount - 1);
    this.grid.remove(removed.id);
    const lastIndex = this.foods.length - 1;
    const last = this.foods[lastIndex];
    this.foods.pop();
    if (last && index < lastIndex) {
      this.foods[index] = last;
      last.slot = index;
    }
  }

  private spawnAmbient(bornAt: number): void {
    const food = GameConfig.food;
    const value = this.rng.int(food.ambientMinValue, food.ambientMaxValue);
    const span = food.ambientMaxValue - food.ambientMinValue;
    const t = span <= 0 ? 0 : (value - food.ambientMinValue) / span;
    const radius = food.ambientMinRadius + (food.ambientMaxRadius - food.ambientMinRadius) * t;
    sampleDisk(this.rng, GameConfig.world.arenaRadius, this.point);
    this.addFood(this.point.x, this.point.y, radius, value, this.rng.pick(food.palette), 'ambient', bornAt);
    this.ambientCount += 1;
  }

  private addFood(
    x: number,
    y: number,
    radius: number,
    value: number,
    color: string,
    kind: FoodKind,
    bornAt: number,
  ): void {
    const food = new Food(this.nextId, x, y, radius, value, color, kind, this.rng.next(), bornAt);
    this.nextId += 1;
    food.slot = this.foods.length;
    this.foods.push(food);
    this.grid.insert(food);
  }

  private remainsRadius(snakeRadius: number): number {
    const food = GameConfig.food;
    const t = Math.min(1, Math.max(0, snakeRadius / GameConfig.snake.maxRadius));
    return food.remainsMinRadius + (food.remainsMaxRadius - food.remainsMinRadius) * t;
  }

  private mergeIntoNearest(x: number, y: number, value: number, radius: number): void {
    let best: Food | undefined;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.foods.length; i += 1) {
      const food = this.foods[i];
      if (!food) continue;
      const dist = distanceSquared(x, y, food.x, food.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = food;
      }
    }
    if (!best) return;
    const previous = Math.max(best.value, 0.0001);
    best.value += value;
    const scaled = best.radius * Math.sqrt(best.value / previous);
    const cap = GameConfig.food.remainsMaxRadius * 3;
    best.radius = Math.min(cap, Math.max(best.radius, radius, scaled));
  }

  private pull(food: Food, x: number, y: number, speed: number): void {
    const dx = x - food.x;
    const dy = y - food.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < 1e-8 || speed <= 0) return;
    const dist = Math.sqrt(distSq);
    const step = Math.min(speed, dist);
    const scale = step / dist;
    food.x += dx * scale;
    food.y += dy * scale;
    this.grid.move(food);
  }
}
