import { describe, expect, it } from 'vitest';
import { GameConfig } from '../../config/GameConfig';
import { defaultSkin, skinCatalog } from '../../content/skins/skinCatalog';
import { skinColorAt } from '../../content/skins/skinColors';
import type { FoodView } from '../contracts/FoodView';
import type { SegmentHit } from '../contracts/SegmentHit';
import type { SnakeIntent } from '../contracts/SnakeIntent';
import type { SnakeSkin } from '../../content/skins/SnakeSkin';
import type { WorldView } from '../contracts/WorldView';
import { segmentCountForMass, segmentSpacing, turnRateForMass } from '../physics/snakeMetrics';
import { ScriptedController } from '../testing/ScriptedController';
import { Snake } from './Snake';

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

function makeSnake(
  intent: SnakeIntent,
  mass: number = GameConfig.snake.startMass,
  skin: SnakeSkin = defaultSkin,
  x: number = 0,
  y: number = 0,
): Snake {
  return new Snake({ name: 'Ace', skin, controller: new ScriptedController(intent), mass }, 1, x, y, 0, 0);
}

describe('Snake', () => {
  it('covers baseSpeed * t in a straight line', () => {
    const intent: SnakeIntent = { targetAngle: 0, boost: false };
    const snake = makeSnake(intent, GameConfig.snake.startMass, defaultSkin, 0, 0);
    const dt = 1 / 60;
    const steps = 120;
    const view = emptyWorld();
    for (let i = 0; i < steps; i += 1) snake.step(view, dt);
    expect(snake.segments[0]?.x).toBeCloseTo(GameConfig.snake.baseSpeed * dt * steps, 4);
    expect(snake.segments[0]?.y).toBeCloseTo(0, 4);
    const spacing = segmentSpacing(snake.radius);
    const back = snake.segments[4];
    expect(Math.hypot((back?.x ?? 0) - ((snake.segments[0]?.x ?? 0) - spacing * 4), back?.y ?? 0)).toBeLessThan(0.05);
  });

  it('limits turn rate', () => {
    const intent: SnakeIntent = { targetAngle: Math.PI, boost: false };
    const snake = makeSnake(intent);
    const dt = 1 / 60;
    const rate = turnRateForMass(snake.mass);
    snake.step(emptyWorld(), dt);
    expect(snake.targetAngle).toBe(Math.PI);
    expect(snake.heading).toBeCloseTo(rate * dt, 6);
    expect(Math.abs(snake.heading)).toBeLessThanOrEqual(rate * dt + 1e-9);
  });

  it('boosts faster, drains mass, and requests tail pellets', () => {
    const skin = skinCatalog.find((entry) => entry.id === 'sunset') ?? defaultSkin;
    const intent: SnakeIntent = { targetAngle: 0, boost: true };
    const mass0 = 1000;
    const snake = makeSnake(intent, mass0, skin);
    const dt = 1 / 60;
    const steps = 6;
    const floor = GameConfig.snake.minBoostMass;
    let mass = mass0;
    let accum = 0;
    let timer = 0;
    let expectedValue = 0;
    const view = emptyWorld();
    for (let i = 0; i < steps; i += 1) {
      const rate = GameConfig.snake.boostDrainBase + mass * GameConfig.snake.boostDrainRatio;
      const drain = Math.min(rate * dt, mass - floor);
      mass -= drain;
      accum += drain;
      timer += dt;
      if (mass <= floor) mass = floor;
      while (timer >= GameConfig.snake.boostDropInterval) {
        timer -= GameConfig.snake.boostDropInterval;
        expectedValue = accum * GameConfig.snake.boostDropValueRatio;
        accum = 0;
      }
      snake.step(view, dt);
    }
    expect(snake.segments[0]?.x).toBeCloseTo(GameConfig.snake.boostSpeed * dt * steps, 4);
    expect(snake.mass).toBeCloseTo(mass, 8);
    expect(snake.boosting).toBe(true);
    const drops = snake.pullBoostDrops();
    const drop = drops[0];
    const tail = snake.segments[snake.segments.length - 1];
    expect(drops).toHaveLength(1);
    expect(drop?.value).toBeCloseTo(expectedValue, 8);
    expect(drop?.radius).toBe(GameConfig.food.boostPelletRadius);
    expect(drop?.kind).toBe('boost');
    expect(drop?.x).toBeCloseTo(tail?.x ?? 0, 6);
    expect(drop?.y).toBeCloseTo(tail?.y ?? 0, 6);
    expect(drop?.color).toBe(skinColorAt(skin, snake.segments.length - 1, snake.segments.length));
    expect(snake.pullBoostDrops()).toEqual([]);
  });

  it('does not boost at or below minBoostMass', () => {
    const below: SnakeIntent = { targetAngle: 0, boost: true };
    const low = GameConfig.snake.minBoostMass - 1;
    const snake = makeSnake(below, low, defaultSkin, 10, -4);
    const dt = 1 / 60;
    const steps = 30;
    const view = emptyWorld();
    for (let i = 0; i < steps; i += 1) snake.step(view, dt);
    expect(snake.boosting).toBe(false);
    expect(snake.mass).toBe(low);
    expect(snake.pullBoostDrops()).toEqual([]);
    expect(snake.segments[0]?.x).toBeCloseTo(10 + GameConfig.snake.baseSpeed * dt * steps, 4);
    expect(snake.segments[0]?.y).toBeCloseTo(-4, 4);

    const atFloor: SnakeIntent = { targetAngle: 0, boost: true };
    const parked = makeSnake(atFloor, GameConfig.snake.minBoostMass);
    parked.step(view, dt);
    expect(parked.boosting).toBe(false);
    expect(parked.mass).toBe(GameConfig.snake.minBoostMass);
    expect(parked.segments[0]?.x).toBeCloseTo(GameConfig.snake.baseSpeed * dt, 5);
  });

  it('places a later segment near an earlier head position after a turn', () => {
    const intent: SnakeIntent = { targetAngle: 0, boost: false };
    const snake = makeSnake(intent);
    const dt = 1 / 60;
    const view = emptyWorld();
    for (let i = 0; i < 90; i += 1) snake.step(view, dt);
    const markerX = snake.segments[0]?.x ?? 0;
    const markerY = snake.segments[0]?.y ?? 0;
    intent.targetAngle = Math.PI / 2;
    const spacing = segmentSpacing(snake.radius);
    let traveled = 0;
    const goal = spacing * 6;
    while (traveled < goal) {
      snake.step(view, dt);
      traveled += GameConfig.snake.baseSpeed * dt;
    }
    const index = Math.round(traveled / spacing);
    const seg = snake.segments[index];
    expect(index).toBeGreaterThan(1);
    expect(Math.hypot((seg?.x ?? 0) - markerX, (seg?.y ?? 0) - markerY)).toBeLessThan(spacing * 0.5 + 0.25);
  });

  it('grows the segment count with mass and extends a short history', () => {
    const intent: SnakeIntent = { targetAngle: 0, boost: false };
    const snake = makeSnake(intent);
    const before = snake.segments.length;
    expect(before).toBe(segmentCountForMass(snake.mass));
    snake.mass = 5000;
    snake.step(emptyWorld(), 1 / 60);
    const count = snake.segments.length;
    expect(count).toBe(segmentCountForMass(5000));
    expect(count).toBeGreaterThan(before);
    const head = snake.segments[0];
    const tail = snake.segments[count - 1];
    const along = (count - 1) * segmentSpacing(snake.radius);
    expect(tail?.x).toBeCloseTo((head?.x ?? 0) - Math.cos(snake.heading) * along, 3);
    expect(tail?.y).toBeCloseTo((head?.y ?? 0) - Math.sin(snake.heading) * along, 3);
  });

  it('reads a fresh intent from a scripted function every step', () => {
    let calls = 0;
    const snake = new Snake(
      {
        name: 'Ace',
        skin: defaultSkin,
        controller: new ScriptedController(() => {
          calls += 1;
          return { targetAngle: Math.PI / 2, boost: false };
        }),
      },
      4,
      0,
      0,
      0,
      1.5,
    );
    const view = emptyWorld();
    snake.step(view, 1 / 60);
    snake.step(view, 1 / 60);
    expect(calls).toBe(2);
    expect(snake.targetAngle).toBeCloseTo(Math.PI / 2);
    expect(snake.spawnedAt).toBe(1.5);
    expect(snake.id).toBe(4);
  });
});
