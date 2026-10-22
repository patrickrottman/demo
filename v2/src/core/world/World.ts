import { GameConfig } from '../../config/GameConfig';
import { skinPrimaryColor } from '../../content/skins/skinColors';
import type { DeathCause } from '../contracts/DeathCause';
import type { FoodView } from '../contracts/FoodView';
import type { GameEvent } from '../contracts/GameEvent';
import type { GameWorld } from '../contracts/GameWorld';
import type { SegmentHit } from '../contracts/SegmentHit';
import type { SnakeSpawnedEvent } from '../contracts/SnakeSpawnedEvent';
import type { SnakeView } from '../contracts/SnakeView';
import type { SpawnOptions } from '../contracts/SpawnOptions';
import { Snake } from '../entities/Snake';
import { FoodField } from '../food/FoodField';
import type { Food } from '../food/Food';
import { angleTo, normalizeAngle } from '../math/angles';
import { distanceSquared } from '../math/scalars';
import type { Random } from '../random/Random';
import { SegmentGrid } from '../spatial/SegmentGrid';
import { CollisionResolver } from './CollisionResolver';
import { pickSpawnPoint } from './pickSpawnPoint';

const headingJitter = 0.5;

export class World implements GameWorld {
  readonly arenaRadius = GameConfig.world.arenaRadius;
  readonly foods: Food[];
  readonly snakes: Snake[] = [];
  elapsed = 0;

  private readonly rng: Random;
  private readonly field: FoodField;
  private readonly segments = new SegmentGrid(GameConfig.world.spatialCellSize);
  private readonly collisions = new CollisionResolver();
  private readonly snakeById = new Map<number, Snake>();
  private readonly snakeIndex = new Map<number, number>();
  private readonly events: GameEvent[] = [];
  private readonly spawnQueue: SnakeSpawnedEvent[] = [];
  private readonly spawnHits: SegmentHit[] = [];
  private readonly dyingId: number[] = [];
  private readonly dyingCause: DeathCause[] = [];
  private readonly dyingKiller: (number | null)[] = [];
  private nextSnakeId = 1;
  private updating = false;

  constructor(rng: Random) {
    this.rng = rng;
    this.field = new FoodField(rng);
    this.foods = this.field.foods;
    this.field.fillInitial();
    this.segments.rebuild(this.snakes);
  }

  spawnSnake(options: SpawnOptions): SnakeView {
    const placed = options.position
      ? { x: options.position.x, y: options.position.y }
      : pickSpawnPoint(
          this.rng,
          this.arenaRadius - GameConfig.world.spawnEdgeMargin,
          GameConfig.world.spawnAttempts,
          GameConfig.world.spawnClearance,
          (x, y) => this.nearestSegmentSq(x, y),
        );
    const heading =
      options.heading ??
      normalizeAngle(angleTo(placed.x, placed.y, 0, 0) + this.rng.range(-headingJitter, headingJitter));
    const snake = new Snake(options, this.nextSnakeId, placed.x, placed.y, heading, this.elapsed);
    this.nextSnakeId += 1;
    this.snakeIndex.set(snake.id, this.snakes.length);
    this.snakes.push(snake);
    this.snakeById.set(snake.id, snake);
    this.segments.rebuild(this.snakes);
    const event: SnakeSpawnedEvent = { type: 'snakeSpawned', snakeId: snake.id, isPlayer: snake.isPlayer };
    if (this.updating) this.events.push(event);
    else this.spawnQueue.push(event);
    return snake;
  }

  update(dt: number): readonly GameEvent[] {
    this.events.length = 0;
    for (let i = 0; i < this.spawnQueue.length; i += 1) {
      const event = this.spawnQueue[i];
      if (event) this.events.push(event);
    }
    this.spawnQueue.length = 0;
    const maxDelta = GameConfig.world.maxDeltaSeconds;
    let remaining = dt > maxDelta ? maxDelta : dt > 0 ? dt : 0;
    const maxStep = GameConfig.world.maxStepSeconds;
    this.updating = true;
    while (remaining > 1e-8) {
      const step = remaining > maxStep ? maxStep : remaining;
      this.substep(step);
      remaining -= step;
    }
    this.updating = false;
    return this.events;
  }

  reset(): void {
    this.snakes.length = 0;
    this.snakeById.clear();
    this.snakeIndex.clear();
    this.nextSnakeId = 1;
    this.elapsed = 0;
    this.spawnQueue.length = 0;
    this.events.length = 0;
    this.updating = false;
    this.field.reset();
    this.segments.rebuild(this.snakes);
  }

  getSnake(id: number): SnakeView | undefined {
    return this.snakeById.get(id);
  }

  queryFood(x: number, y: number, range: number, out?: FoodView[]): FoodView[] {
    return this.field.query(x, y, range, out);
  }

  querySegments(x: number, y: number, range: number, out?: SegmentHit[]): SegmentHit[] {
    return this.segments.query(x, y, range, out);
  }

  private substep(dt: number): void {
    this.elapsed += dt;
    const snakes = this.snakes;
    for (let i = 0; i < snakes.length; i += 1) {
      const snake = snakes[i];
      if (!snake?.alive) continue;
      snake.step(this, dt);
      const drops = snake.pullBoostDrops();
      for (let d = 0; d < drops.length; d += 1) {
        const drop = drops[d];
        if (!drop) continue;
        this.field.addDrop(drop.x, drop.y, drop.value, drop.radius, drop.color, drop.kind, this.elapsed);
      }
    }
    this.segments.rebuild(snakes);
    this.collisions.resolve(snakes, this.segments, this.arenaRadius);
    this.applyDeaths();
    this.segments.rebuild(snakes);
    this.field.attractAndEat(snakes, dt, (snake, food) => {
      snake.mass += food.value;
      this.events.push({
        type: 'foodEaten',
        snakeId: snake.id,
        value: food.value,
        x: food.x,
        y: food.y,
        color: food.color,
      });
    });
    this.field.replenish(dt, this.elapsed);
  }

  private applyDeaths(): void {
    const snakes = this.snakes;
    this.dyingId.length = 0;
    this.dyingCause.length = 0;
    this.dyingKiller.length = 0;
    for (let i = 0; i < snakes.length; i += 1) {
      const cause = this.collisions.causeAt(i);
      const snake = snakes[i];
      if (!cause || !snake) continue;
      this.dyingId.push(snake.id);
      this.dyingCause.push(cause);
      this.dyingKiller.push(this.collisions.killerAt(i));
    }
    for (let i = 0; i < this.dyingId.length; i += 1) {
      const killerId = this.dyingKiller[i];
      if (killerId === undefined || killerId === null) continue;
      const killer = this.snakeById.get(killerId);
      if (killer) killer.kills += 1;
    }
    for (let i = 0; i < this.dyingId.length; i += 1) {
      const id = this.dyingId[i];
      const snake = id === undefined ? undefined : this.snakeById.get(id);
      if (!snake) continue;
      const killerId = this.dyingKiller[i] ?? null;
      const killer = killerId === null ? undefined : this.snakeById.get(killerId);
      const head = snake.segments[0];
      this.events.push({
        type: 'snakeDied',
        snakeId: snake.id,
        name: snake.name,
        isPlayer: snake.isPlayer,
        killerId,
        killerName: killer ? killer.name : null,
        cause: this.dyingCause[i] ?? 'border',
        finalMass: snake.mass,
        kills: snake.kills,
        survivedSeconds: this.elapsed - snake.spawnedAt,
        x: head?.x ?? 0,
        y: head?.y ?? 0,
        color: skinPrimaryColor(snake.skin),
      });
      this.field.dropRemains(snake, this.elapsed);
      snake.alive = false;
    }
    for (let i = 0; i < this.dyingId.length; i += 1) {
      const id = this.dyingId[i];
      if (id === undefined) continue;
      const snake = this.snakeById.get(id);
      if (snake) this.removeSnake(snake);
    }
  }

  private removeSnake(snake: Snake): void {
    const index = this.snakeIndex.get(snake.id);
    if (index === undefined) return;
    const lastIndex = this.snakes.length - 1;
    const last = this.snakes[lastIndex];
    this.snakes.pop();
    if (last && index < lastIndex) {
      this.snakes[index] = last;
      this.snakeIndex.set(last.id, index);
    }
    this.snakeIndex.delete(snake.id);
    this.snakeById.delete(snake.id);
  }

  private nearestSegmentSq(x: number, y: number): number {
    const hits = this.segments.query(x, y, GameConfig.world.spawnClearance, this.spawnHits);
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < hits.length; i += 1) {
      const hit = hits[i];
      if (!hit) continue;
      const dist = distanceSquared(x, y, hit.x, hit.y);
      if (dist < best) best = dist;
    }
    return best;
  }
}
