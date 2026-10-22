import { GameConfig } from '../../config/GameConfig';
import type { FoodView } from '../../core/contracts/FoodView';
import type { GameEvent } from '../../core/contracts/GameEvent';
import type { GameWorld } from '../../core/contracts/GameWorld';
import type { SegmentHit } from '../../core/contracts/SegmentHit';
import type { SnakeController } from '../../core/contracts/SnakeController';
import type { SnakeView } from '../../core/contracts/SnakeView';
import type { SpawnOptions } from '../../core/contracts/SpawnOptions';
import type { Vec2 } from '../../core/contracts/Vec2';
import { distanceSquared } from '../../core/math/scalars';
import { createFakeSnake } from './createFakeSnake';
import { FakeSnake } from './FakeSnake';

export class FakeWorld implements GameWorld {
  readonly arenaRadius = GameConfig.world.arenaRadius;
  elapsed = 0;
  readonly snakes: FakeSnake[] = [];
  readonly foods: FoodView[] = [];
  readonly controllers: SnakeController[] = [];
  lastPosition: Vec2 | undefined;
  private nextId = 1;

  getSnake(id: number): SnakeView | undefined {
    const snakes = this.snakes;
    for (let i = 0; i < snakes.length; i++) {
      const snake = snakes[i];
      if (snake && snake.id === id) return snake;
    }
    return undefined;
  }

  queryFood(x: number, y: number, range: number, out?: FoodView[]): FoodView[] {
    const hits = out ?? [];
    hits.length = 0;
    const rangeSq = range * range;
    const foods = this.foods;
    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      if (!food) continue;
      if (distanceSquared(x, y, food.x, food.y) <= rangeSq) hits.push(food);
    }
    return hits;
  }

  querySegments(x: number, y: number, range: number, out?: SegmentHit[]): SegmentHit[] {
    const hits = out ?? [];
    hits.length = 0;
    const rangeSq = range * range;
    const snakes = this.snakes;
    for (let s = 0; s < snakes.length; s++) {
      const snake = snakes[s];
      if (!snake || !snake.alive) continue;
      const segments = snake.segments;
      for (let i = 0; i < segments.length; i++) {
        const point = segments[i];
        if (!point) continue;
        if (distanceSquared(x, y, point.x, point.y) > rangeSq) continue;
        hits.push({
          snakeId: snake.id,
          index: i,
          x: point.x,
          y: point.y,
          radius: snake.radius,
        });
      }
    }
    return hits;
  }

  spawnSnake(options: SpawnOptions): SnakeView {
    const snake = createFakeSnake({
      id: this.nextId,
      name: options.name,
      skin: options.skin,
      isPlayer: options.isPlayer ?? false,
      mass: options.mass ?? GameConfig.snake.startMass,
      heading: options.heading ?? 0,
      segments: options.position ? [options.position] : [{ x: 0, y: 0 }],
    });
    this.nextId += 1;
    this.snakes.push(snake);
    this.controllers.push(options.controller);
    this.lastPosition = options.position;
    return snake;
  }

  update(dt: number): readonly GameEvent[] {
    this.elapsed += dt;
    return [];
  }

  reset(): void {
    this.snakes.length = 0;
    this.foods.length = 0;
    this.controllers.length = 0;
    this.elapsed = 0;
    this.nextId = 1;
    this.lastPosition = undefined;
  }
}
