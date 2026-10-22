import { describe, expect, it } from 'vitest';
import { GameConfig } from '../../config/GameConfig';
import { defaultSkin } from '../../content/skins/skinCatalog';
import type { FoodView } from '../contracts/FoodView';
import type { SegmentHit } from '../contracts/SegmentHit';
import type { SnakeView } from '../contracts/SnakeView';
import type { WorldView } from '../contracts/WorldView';
import { distanceSquared } from '../math/scalars';
import { SeededRandom } from '../random/SeededRandom';
import { Snake } from '../entities/Snake';
import { ScriptedController } from '../testing/ScriptedController';
import { FoodGrid } from './FoodGrid';
import { SegmentGrid } from './SegmentGrid';

function emptyWorld(): WorldView {
  return {
    arenaRadius: GameConfig.world.arenaRadius,
    elapsed: 0,
    snakes: [],
    foods: [],
    getSnake: () => undefined,
    queryFood: (x: number, y: number, range: number, out?: FoodView[]) => {
      void x;
      void y;
      void range;
      const result = out ?? [];
      result.length = 0;
      return result;
    },
    querySegments: (x: number, y: number, range: number, out?: SegmentHit[]) => {
      void x;
      void y;
      void range;
      const result = out ?? [];
      result.length = 0;
      return result;
    },
  };
}

function pellet(id: number, x: number, y: number, radius = 4) {
  return {
    id,
    x,
    y,
    radius,
    value: 1,
    color: '#FFFFFF',
    kind: 'ambient' as const,
    seed: id,
    bornAt: 0,
  };
}

function idsOf(foods: readonly FoodView[]): number[] {
  return foods.map((food) => food.id).sort((a, b) => a - b);
}

describe('spatial grids', () => {
  it('matches brute-force food queries after inserts, removes, and moves', () => {
    const rng = new SeededRandom(42);
    const cell = GameConfig.world.spatialCellSize;
    const grid = new FoodGrid(cell);
    const active = [];
    for (let i = 0; i < 240; i += 1) {
      const food = pellet(i + 1, rng.range(-4000, 4000), rng.range(-4000, 4000), rng.range(4, 30));
      grid.insert(food);
      active.push(food);
    }
    for (let i = 0; i < 30; i += 1) {
      const food = active.pop();
      if (!food) break;
      grid.remove(food.id);
    }
    for (let i = 0; i < 40; i += 1) {
      const food = active[i];
      if (!food) break;
      food.x = rng.range(-4000, 4000);
      food.y = rng.range(-4000, 4000);
      grid.move(food);
    }
    const stale = pellet(-1, 0, 0);
    const out: FoodView[] = [stale];
    for (let q = 0; q < 40; q += 1) {
      const x = rng.range(-4000, 4000);
      const y = rng.range(-4000, 4000);
      const range = rng.range(0, 900);
      const got = grid.query(x, y, range, out);
      expect(got).toBe(out);
      const rangeSq = range * range;
      const expected = active
        .filter((food) => distanceSquared(x, y, food.x, food.y) <= rangeSq)
        .map((food) => food.id)
        .sort((a, b) => a - b);
      expect(idsOf(got)).toEqual(expected);
    }
  });

  it('swap-removes, rebuckets across cells, and clears', () => {
    const grid = new FoodGrid(GameConfig.world.spatialCellSize);
    const a = pellet(1, 10, 10);
    const b = pellet(2, 20, 10);
    const c = pellet(3, 30, 10);
    grid.insert(a);
    grid.insert(b);
    grid.insert(c);
    grid.remove(2);
    expect(idsOf(grid.query(20, 10, 50))).toEqual([1, 3]);
    c.x = 1000;
    c.y = -1000;
    grid.move(c);
    expect(idsOf(grid.query(20, 10, 50))).toEqual([1]);
    expect(idsOf(grid.query(1000, -1000, 20))).toEqual([3]);
    expect(idsOf(grid.query(10, 40, 30))).toEqual([1]);
    expect(idsOf(grid.query(10, 40, 29.9))).toEqual([]);
    grid.clear();
    expect(grid.query(10, 10, 500)).toEqual([]);
  });

  it('matches brute-force segment queries and adds segment radius', () => {
    const rng = new SeededRandom(9);
    const intent = { targetAngle: 0, boost: false };
    const snakes: Snake[] = [];
    for (let i = 0; i < 5; i += 1) {
      snakes.push(
        new Snake(
          {
            name: `s${i}`,
            skin: defaultSkin,
            controller: new ScriptedController(intent),
            mass: rng.range(30, 800),
          },
          i + 1,
          rng.range(-800, 800),
          rng.range(-800, 800),
          rng.angle(),
          0,
        ),
      );
    }
    const view = emptyWorld();
    for (let step = 0; step < 40; step += 1) {
      intent.targetAngle = rng.angle();
      for (let i = 0; i < snakes.length; i += 1) snakes[i]?.step(view, 1 / 60);
    }
    const grid = new SegmentGrid(GameConfig.world.spatialCellSize);
    grid.rebuild(snakes);
    const out: SegmentHit[] = [];
    for (let q = 0; q < 30; q += 1) {
      const x = rng.range(-1500, 1500);
      const y = rng.range(-1500, 1500);
      const range = rng.range(0, 420);
      const got = grid.query(x, y, range, out);
      expect(got).toBe(out);
      const keys = got.map((hit) => `${hit.snakeId}:${hit.index}`).sort();
      const expected: string[] = [];
      for (let s = 0; s < snakes.length; s += 1) {
        const snake = snakes[s];
        if (!snake) continue;
        for (let i = 0; i < snake.segments.length; i += 1) {
          const seg = snake.segments[i];
          if (!seg) continue;
          const limit = range + snake.radius;
          if (distanceSquared(x, y, seg.x, seg.y) <= limit * limit) expected.push(`${snake.id}:${i}`);
        }
      }
      expected.sort();
      expect(keys).toEqual(expected);
    }

    const lone: SnakeView = {
      id: 7,
      name: 'lone',
      skin: defaultSkin,
      isPlayer: false,
      alive: true,
      segments: [{ x: 30, y: 0 }],
      radius: 10,
      heading: 0,
      targetAngle: 0,
      mass: 20,
      boosting: false,
      kills: 0,
      spawnedAt: 0,
    };
    grid.rebuild([lone]);
    expect(grid.query(0, 0, 20).map((hit) => hit.index)).toEqual([0]);
    expect(grid.query(0, 0, 19)).toEqual([]);
    grid.rebuild([]);
    expect(grid.query(0, 0, 100)).toEqual([]);
  });
});
