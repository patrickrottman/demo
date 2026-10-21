import { GameConfig } from '../../config/GameConfig';
import type { SnakeSkin } from '../../content/skins/SnakeSkin';
import { skinColorAt } from '../../content/skins/skinColors';
import type { SnakeController } from '../contracts/SnakeController';
import type { SnakeView } from '../contracts/SnakeView';
import type { SpawnOptions } from '../contracts/SpawnOptions';
import type { Vec2 } from '../contracts/Vec2';
import type { WorldView } from '../contracts/WorldView';
import { normalizeAngle, rotateTowards } from '../math/angles';
import { radiusForMass, segmentCountForMass, segmentSpacing, turnRateForMass } from '../physics/snakeMetrics';
import type { BoostPelletRequest } from './BoostPelletRequest';

const noDrops: readonly BoostPelletRequest[] = [];

export class Snake implements SnakeView {
  readonly id: number;
  readonly name: string;
  readonly skin: SnakeSkin;
  readonly isPlayer: boolean;
  mass: number;
  kills = 0;
  readonly spawnedAt: number;
  heading: number;
  targetAngle: number;
  boosting = false;
  alive = true;
  radius: number;
  readonly segments: Vec2[] = [];

  private readonly controller: SnakeController;
  private readonly path: Vec2[] = [];
  private readonly segmentPool: Vec2[] = [];
  private readonly pendingDrops: BoostPelletRequest[] = [];
  private readonly missing: Vec2 = { x: 0, y: 0 };
  private pathStart = 0;
  private pathCount = 0;
  private boostAccum = 0;
  private boostTimer = 0;
  private backDirX = -1;
  private backDirY = 0;
  private edgeX = 0;
  private edgeY = 0;
  private edgeLen = 0;

  constructor(options: SpawnOptions, id: number, x: number, y: number, heading: number, spawnedAt: number) {
    this.id = id;
    this.name = options.name;
    this.skin = options.skin;
    this.isPlayer = options.isPlayer ?? false;
    this.controller = options.controller;
    this.mass = options.mass ?? GameConfig.snake.startMass;
    this.spawnedAt = spawnedAt;
    this.heading = normalizeAngle(heading);
    this.targetAngle = this.heading;
    this.radius = radiusForMass(this.mass);
    this.seedPath(x, y);
    this.syncBody();
  }

  step(world: WorldView, dt: number): void {
    const intent = this.controller.decide(this, world, dt);
    const targetAngle = intent.targetAngle;
    const boost = intent.boost;
    this.targetAngle = targetAngle;
    this.heading = rotateTowards(this.heading, targetAngle, turnRateForMass(this.mass) * dt);
    const floor = GameConfig.snake.minBoostMass;
    this.boosting = boost && this.mass > floor;
    const speed = this.boosting ? GameConfig.snake.boostSpeed : GameConfig.snake.baseSpeed;
    this.advance(speed * dt);
    if (this.boosting) this.drainBoost(dt, floor);
    this.syncBody();
    this.collectBoostDrops();
  }

  pullBoostDrops(): readonly BoostPelletRequest[] {
    if (this.pendingDrops.length === 0) return noDrops;
    const drops = this.pendingDrops.slice();
    this.pendingDrops.length = 0;
    return drops;
  }

  private seedPath(x: number, y: number): void {
    const length = Math.max(
      segmentSpacing(this.radius),
      (segmentCountForMass(this.mass) - 1) * segmentSpacing(this.radius),
    );
    this.backDirX = -Math.cos(this.heading);
    this.backDirY = -Math.sin(this.heading);
    this.appendPath(x + this.backDirX * length, y + this.backDirY * length);
    this.appendPath(x, y);
  }

  private advance(distance: number): void {
    const head = this.pointAt(this.pathCount - 1);
    this.appendPath(head.x + Math.cos(this.heading) * distance, head.y + Math.sin(this.heading) * distance);
  }

  private drainBoost(dt: number, floor: number): void {
    const rate = GameConfig.snake.boostDrainBase + this.mass * GameConfig.snake.boostDrainRatio;
    const drain = Math.min(rate * dt, this.mass - floor);
    this.mass -= drain;
    this.boostAccum += drain;
    this.boostTimer += dt;
    if (this.mass <= floor) {
      this.mass = floor;
      this.boosting = false;
    }
  }

  private collectBoostDrops(): void {
    const interval = GameConfig.snake.boostDropInterval;
    const ratio = GameConfig.snake.boostDropValueRatio;
    while (this.boostTimer >= interval) {
      this.boostTimer -= interval;
      const value = this.boostAccum * ratio;
      this.boostAccum = 0;
      if (value > 0) this.pushDrop(value);
    }
  }

  private pushDrop(value: number): void {
    const count = this.segments.length;
    const tail = this.segments[count - 1];
    if (!tail) return;
    this.pendingDrops.push({
      x: tail.x,
      y: tail.y,
      value,
      radius: GameConfig.food.boostPelletRadius,
      color: skinColorAt(this.skin, count - 1, count),
      kind: 'boost',
    });
  }

  private syncBody(): void {
    this.radius = radiusForMass(this.mass);
    this.resample();
  }

  private resample(): void {
    const count = Math.max(1, segmentCountForMass(this.mass));
    this.fitSegments(count);
    const spacing = segmentSpacing(this.radius);
    const head = this.pointAt(Math.max(0, this.pathCount - 1));
    const first = this.segments[0];
    if (first) {
      first.x = head.x;
      first.y = head.y;
    }
    this.updateBackDirection();

    let cursor = this.pathCount - 1;
    let into = 0;
    if (cursor > 0) this.loadEdge(cursor);
    else this.edgeLen = 0;
    let traveled = 0;

    for (let i = 1; i < count; i += 1) {
      const target = i * spacing;
      while (traveled + 1e-9 < target && cursor > 0) {
        if (this.edgeLen <= 1e-12) {
          cursor -= 1;
          into = 0;
          if (cursor > 0) this.loadEdge(cursor);
          else this.edgeLen = 0;
          continue;
        }
        const room = this.edgeLen - into;
        const need = target - traveled;
        if (room >= need) {
          into += need;
          traveled = target;
        } else {
          traveled += room;
          cursor -= 1;
          into = 0;
          if (cursor > 0) this.loadEdge(cursor);
          else this.edgeLen = 0;
        }
      }
      const seg = this.segments[i];
      if (!seg) continue;
      if (cursor > 0 && this.edgeLen > 1e-12) {
        const newer = this.pointAt(cursor);
        const t = into / this.edgeLen;
        seg.x = newer.x + this.edgeX * t;
        seg.y = newer.y + this.edgeY * t;
      } else {
        const oldest = this.pointAt(0);
        const extra = target - traveled;
        seg.x = oldest.x + this.backDirX * extra;
        seg.y = oldest.y + this.backDirY * extra;
      }
    }

    this.trimPath((count - 1) * spacing + spacing);
  }

  private loadEdge(cursor: number): void {
    const newer = this.pointAt(cursor);
    const older = this.pointAt(cursor - 1);
    this.edgeX = older.x - newer.x;
    this.edgeY = older.y - newer.y;
    this.edgeLen = Math.hypot(this.edgeX, this.edgeY);
  }

  private updateBackDirection(): void {
    if (this.pathCount >= 2) {
      const oldest = this.pointAt(0);
      const next = this.pointAt(1);
      const dx = oldest.x - next.x;
      const dy = oldest.y - next.y;
      const len = Math.hypot(dx, dy);
      if (len > 1e-8) {
        this.backDirX = dx / len;
        this.backDirY = dy / len;
        return;
      }
    }
    this.backDirX = -Math.cos(this.heading);
    this.backDirY = -Math.sin(this.heading);
  }

  private trimPath(keepLength: number): void {
    if (this.pathCount <= 2) return;
    let acc = 0;
    let remove = 0;
    for (let i = this.pathCount - 1; i > 0; i -= 1) {
      const newer = this.pointAt(i);
      const older = this.pointAt(i - 1);
      acc += Math.hypot(newer.x - older.x, newer.y - older.y);
      if (acc >= keepLength) {
        remove = i - 1;
        break;
      }
    }
    if (remove <= 0) return;
    this.pathStart = (this.pathStart + remove) % this.path.length;
    this.pathCount -= remove;
  }

  private fitSegments(count: number): void {
    while (this.segments.length > count) {
      const extra = this.segments.pop();
      if (extra) this.segmentPool.push(extra);
    }
    while (this.segments.length < count) {
      this.segments.push(this.segmentPool.pop() ?? { x: 0, y: 0 });
    }
  }

  private ensurePath(minCapacity: number): void {
    if (this.path.length >= minCapacity) return;
    const nextCap = Math.max(minCapacity, this.path.length === 0 ? 8 : this.path.length * 2);
    if (this.pathStart !== 0) {
      const kept: Vec2[] = [];
      for (let i = 0; i < this.pathCount; i += 1) kept.push(this.pointAt(i));
      this.path.length = 0;
      for (let i = 0; i < kept.length; i += 1) {
        const point = kept[i];
        if (point) this.path.push(point);
      }
      this.pathStart = 0;
    }
    while (this.path.length < nextCap) this.path.push({ x: 0, y: 0 });
  }

  private appendPath(x: number, y: number): void {
    if (this.pathCount === this.path.length) this.ensurePath(this.pathCount + 1);
    const slot = this.path[(this.pathStart + this.pathCount) % this.path.length];
    if (!slot) return;
    slot.x = x;
    slot.y = y;
    this.pathCount += 1;
  }

  private pointAt(logical: number): Vec2 {
    return this.path[(this.pathStart + logical) % this.path.length] ?? this.missing;
  }
}
