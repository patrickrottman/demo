import { GameConfig } from '../../config/GameConfig';
import type { DeathCause } from '../contracts/DeathCause';
import type { SegmentHit } from '../contracts/SegmentHit';
import type { Snake } from '../entities/Snake';
import { distanceSquared } from '../math/scalars';
import type { SegmentGrid } from '../spatial/SegmentGrid';

export class CollisionResolver {
  private readonly query: SegmentHit[] = [];
  private readonly cause: (DeathCause | null)[] = [];
  private readonly killer: (number | null)[] = [];
  private readonly selfOf: number[] = [];
  private readonly otherOf: number[] = [];
  private readonly segOf: number[] = [];
  private readonly pairA: number[] = [];
  private readonly pairB: number[] = [];
  private contactCount = 0;
  private pairCount = 0;

  resolve(snakes: readonly Snake[], grid: SegmentGrid, arenaRadius: number): void {
    const count = snakes.length;
    this.contactCount = 0;
    this.pairCount = 0;
    for (let i = 0; i < count; i += 1) {
      this.cause[i] = null;
      this.killer[i] = null;
      const snake = snakes[i];
      if (!snake) continue;
      const head = snake.segments[0];
      if (!head) continue;
      if (Math.hypot(head.x, head.y) + snake.radius > arenaRadius) this.setCause(i, 'border', null, false);
      this.collect(grid, i, snake, head.x, head.y);
    }
    this.resolveHeadOns(snakes);
    this.resolveBodies(snakes);
  }

  causeAt(index: number): DeathCause | null {
    return this.cause[index] ?? null;
  }

  killerAt(index: number): number | null {
    const killer = this.killer[index];
    return killer === undefined ? null : killer;
  }

  private collect(grid: SegmentGrid, index: number, snake: Snake, x: number, y: number): void {
    const tolerance = GameConfig.snake.collisionTolerance;
    const reach = (snake.radius + GameConfig.snake.maxRadius) * tolerance;
    const hits = grid.query(x, y, reach, this.query);
    for (let i = 0; i < hits.length; i += 1) {
      const hit = hits[i];
      if (!hit || hit.snakeId === snake.id) continue;
      const limit = (snake.radius + hit.radius) * tolerance;
      if (distanceSquared(x, y, hit.x, hit.y) >= limit * limit) continue;
      this.selfOf[this.contactCount] = index;
      this.otherOf[this.contactCount] = hit.snakeId;
      this.segOf[this.contactCount] = hit.index;
      this.contactCount += 1;
    }
  }

  private resolveHeadOns(snakes: readonly Snake[]): void {
    for (let i = 0; i < this.contactCount; i += 1) {
      if ((this.segOf[i] ?? -1) !== 0) continue;
      const selfIndex = this.selfOf[i] ?? -1;
      const otherId = this.otherOf[i];
      if (selfIndex < 0 || otherId === undefined) continue;
      const otherIndex = this.findIndex(snakes, otherId);
      if (otherIndex < 0) continue;
      const self = snakes[selfIndex];
      const other = snakes[otherIndex];
      if (!self || !other) continue;
      if (this.hasPair(self.id, other.id)) continue;
      this.pairA[this.pairCount] = self.id;
      this.pairB[this.pairCount] = other.id;
      this.pairCount += 1;
      if (self.mass < other.mass) this.setCause(selfIndex, 'headOn', other.id, true);
      else if (other.mass < self.mass) this.setCause(otherIndex, 'headOn', self.id, true);
      else {
        this.setCause(selfIndex, 'headOn', other.id, true);
        this.setCause(otherIndex, 'headOn', self.id, true);
      }
    }
  }

  private resolveBodies(snakes: readonly Snake[]): void {
    for (let i = 0; i < this.contactCount; i += 1) {
      if ((this.segOf[i] ?? 0) === 0) continue;
      const selfIndex = this.selfOf[i] ?? -1;
      const otherId = this.otherOf[i];
      if (selfIndex < 0 || otherId === undefined) continue;
      const self = snakes[selfIndex];
      if (!self || this.hasPair(self.id, otherId)) continue;
      this.setCause(selfIndex, 'collision', otherId, false);
    }
  }

  private findIndex(snakes: readonly Snake[], id: number): number {
    for (let i = 0; i < snakes.length; i += 1) {
      if (snakes[i]?.id === id) return i;
    }
    return -1;
  }

  private hasPair(a: number, b: number): boolean {
    for (let i = 0; i < this.pairCount; i += 1) {
      const left = this.pairA[i];
      const right = this.pairB[i];
      if ((left === a && right === b) || (left === b && right === a)) return true;
    }
    return false;
  }

  private setCause(index: number, cause: DeathCause, killer: number | null, overwrite: boolean): void {
    if (!overwrite && this.cause[index]) return;
    this.cause[index] = cause;
    this.killer[index] = killer;
  }
}
