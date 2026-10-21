import { describe, expect, it } from 'vitest';
import { BotPopulation } from '../../ai/BotPopulation';
import { GameConfig } from '../../config/GameConfig';
import { defaultSkin } from '../../content/skins/skinCatalog';
import { skinPrimaryColor } from '../../content/skins/skinColors';
import type { GameEvent } from '../contracts/GameEvent';
import type { SnakeController } from '../contracts/SnakeController';
import type { SnakeDiedEvent } from '../contracts/SnakeDiedEvent';
import type { SnakeView } from '../contracts/SnakeView';
import type { WorldView } from '../contracts/WorldView';
import { ScriptedController } from '../testing/ScriptedController';
import { SeededRandom } from '../random/SeededRandom';
import type { Random } from '../random/Random';
import { World } from './World';

function steer(angle: number, boost = false): ScriptedController {
  return new ScriptedController({ targetAngle: angle, boost });
}

function spawn(
  world: World,
  x: number,
  y: number,
  heading: number,
  mass: number = GameConfig.snake.startMass,
  name = 'Ace',
  boost = false,
): SnakeView {
  return world.spawnSnake({
    name,
    skin: defaultSkin,
    controller: steer(heading, boost),
    mass,
    position: { x, y },
    heading,
  });
}

function died(events: readonly GameEvent[], id: number): SnakeDiedEvent | undefined {
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (event && event.type === 'snakeDied' && event.snakeId === id) return event;
  }
  return undefined;
}

function scriptedRng(inner: Random, script: number[]): Random {
  return {
    next() {
      const value = script.shift();
      return value === undefined ? inner.next() : value;
    },
    range(min: number, max: number) {
      return min + (max - min) * this.next();
    },
    int(min: number, maxInclusive: number) {
      return Math.floor(this.range(min, maxInclusive + 1));
    },
    chance(probability: number) {
      return this.next() < probability;
    },
    pick<T>(items: readonly T[]): T {
      const item = items[Math.floor(this.next() * items.length)];
      if (item === undefined) throw new Error('empty');
      return item;
    },
    angle() {
      return this.next() * Math.PI * 2;
    },
  };
}

describe('World', () => {
  it('fills the arena with ambient food', () => {
    const world = new World(new SeededRandom(1));
    const food = GameConfig.food;
    expect(world.foods.length).toBe(food.ambientTarget);
    for (let i = 0; i < world.foods.length; i += 1) {
      const pellet = world.foods[i];
      if (!pellet) throw new Error('hole');
      if (pellet.kind !== 'ambient' || pellet.bornAt >= 0) throw new Error('ambient spawn');
      if (
        !Number.isInteger(pellet.value) ||
        pellet.value < food.ambientMinValue ||
        pellet.value > food.ambientMaxValue
      ) {
        throw new Error('ambient value');
      }
      if (pellet.radius < food.ambientMinRadius - 1e-9 || pellet.radius > food.ambientMaxRadius + 1e-9) {
        throw new Error('ambient radius');
      }
      if (Math.hypot(pellet.x, pellet.y) > world.arenaRadius + 1e-6) throw new Error('outside arena');
    }
  });

  it('eats overlapping food, adds its value, and emits an event', () => {
    const world = new World(new SeededRandom(2));
    const pellet = world.foods[0];
    if (!pellet) throw new Error('no food');
    const snake = spawn(world, pellet.x, pellet.y, 0, 80, 'Munches');
    const mass = snake.mass;
    const events = world.update(1 / 60);
    expect(world.foods.some((food) => food.id === pellet.id)).toBe(false);
    expect(snake.mass).toBeCloseTo(mass + pellet.value, 6);
    const eaten = events.find((event) => event.type === 'foodEaten');
    expect(eaten).toMatchObject({
      type: 'foodEaten',
      snakeId: snake.id,
      value: pellet.value,
      color: pellet.color,
    });
  });

  it('pulls nearby food toward the head without eating it yet', () => {
    const world = new World(new SeededRandom(3));
    const pellet = world.foods.find((food) => Math.hypot(food.x, food.y) < world.arenaRadius - 400);
    if (!pellet) throw new Error('no interior food');
    const fx = pellet.x;
    const fy = pellet.y;
    const snake = spawn(world, fx + 80, fy, Math.PI / 2, GameConfig.snake.startMass, 'Magnet');
    world.update(1 / 60);
    const moved = world.foods.find((food) => food.id === pellet.id);
    const head = snake.segments[0];
    expect(moved).toBeDefined();
    expect(moved && head && Math.hypot(moved.x - head.x, moved.y - head.y)).toBeLessThan(80);
    expect(moved?.x).toBeGreaterThan(fx);
  });

  it('ends a body hit on the attacker and credits the owner', () => {
    const world = new World(new SeededRandom(4));
    const owner = spawn(world, 0, 0, 0, 100, 'Owner');
    const segment = owner.segments[8];
    if (!segment) throw new Error('short snake');
    const attacker = spawn(world, segment.x, segment.y, Math.PI / 2, 100, 'Attacker');
    const events = world.update(1 / 60);
    const death = died(events, attacker.id);
    expect(attacker.alive).toBe(false);
    expect(owner.alive).toBe(true);
    expect(owner.kills).toBe(1);
    expect(world.getSnake(attacker.id)).toBeUndefined();
    expect(death?.cause).toBe('collision');
    expect(death?.killerId).toBe(owner.id);
    expect(death?.killerName).toBe(owner.name);
    expect(death?.color).toBe(skinPrimaryColor(defaultSkin));
    expect(death?.survivedSeconds).toBeCloseTo(world.elapsed, 5);
  });

  it('resolves a head-on by mass and kills both when equal', () => {
    const world = new World(new SeededRandom(5));
    const heavy = spawn(world, 0, 0, Math.PI, 400, 'Heavy');
    const light = spawn(world, 0, 0, 0, 80, 'Light');
    const events = world.update(1 / 60);
    const death = died(events, light.id);
    expect(light.alive).toBe(false);
    expect(heavy.alive).toBe(true);
    expect(heavy.kills).toBe(1);
    expect(death?.cause).toBe('headOn');
    expect(death?.killerId).toBe(heavy.id);

    const tied = new World(new SeededRandom(6));
    const left = spawn(tied, 0, 0, 0, 150, 'Left');
    const right = spawn(tied, 0, 0, Math.PI, 150, 'Right');
    const both = tied.update(1 / 60);
    expect(left.alive).toBe(false);
    expect(right.alive).toBe(false);
    expect(left.kills).toBe(1);
    expect(right.kills).toBe(1);
    expect(died(both, left.id)?.cause).toBe('headOn');
    expect(died(both, left.id)?.killerId).toBe(right.id);
    expect(died(both, right.id)?.killerId).toBe(left.id);
  });

  it('kills on the border with no credit and drops remains worth the mass ratio', () => {
    const world = new World(new SeededRandom(7));
    const mass = 250;
    const snake = spawn(world, world.arenaRadius - 1, 0, 0, mass, 'Edge');
    const events = world.update(1 / 60);
    const death = died(events, snake.id);
    expect(snake.alive).toBe(false);
    expect(death?.cause).toBe('border');
    expect(death?.killerId).toBeNull();
    expect(death?.killerName).toBeNull();
    expect(death?.finalMass).toBeCloseTo(mass, 6);
    expect(death?.kills).toBe(0);
    let total = 0;
    let count = 0;
    for (let i = 0; i < world.foods.length; i += 1) {
      const food = world.foods[i];
      if (!food || food.kind !== 'remains') continue;
      total += food.value;
      count += 1;
      expect(food.radius).toBeGreaterThanOrEqual(GameConfig.food.remainsMinRadius - 1e-9);
      expect(food.radius).toBeLessThanOrEqual(GameConfig.food.remainsMaxRadius + 1e-9);
    }
    expect(count).toBeGreaterThan(0);
    expect(total).toBeCloseTo(mass * GameConfig.food.remainsValueRatio, 5);
  });

  it('spawns outside occupied space and keeps the clearest blocked point', () => {
    const clearScript: number[] = [];
    const clearWorld = new World(scriptedRng(new SeededRandom(8), clearScript));
    spawn(clearWorld, 0, 0, 0, 40, 'Block');
    clearScript.push(0, 0, 0.25, 1);
    const far = clearWorld.spawnSnake({
      name: 'Far',
      skin: defaultSkin,
      controller: steer(0),
      heading: 0,
    });
    const maxRadius = clearWorld.arenaRadius - GameConfig.world.spawnEdgeMargin;
    expect(far.segments[0]?.y).toBeCloseTo(maxRadius, 3);
    expect(far.segments[0]?.x).toBeCloseTo(0, 3);

    const bestScript: number[] = [];
    const bestWorld = new World(scriptedRng(new SeededRandom(9), bestScript));
    spawn(bestWorld, 0, 0, 0, 40, 'Block');
    const offset = 200 / maxRadius;
    bestScript.push(0, 0, 0, offset * offset);
    for (let i = 0; i < GameConfig.world.spawnAttempts - 2; i += 1) bestScript.push(0, 0);
    const best = bestWorld.spawnSnake({
      name: 'Best',
      skin: defaultSkin,
      controller: steer(0),
      heading: 0,
    });
    expect(best.segments[0]?.x).toBeCloseTo(200, 3);
    expect(best.segments[0]?.y).toBeCloseTo(0, 3);
  });

  it('clamps dt and flushes spawns that happened outside update', () => {
    const world = new World(new SeededRandom(10));
    const snake = spawn(world, 0, 0, 0, 60, 'Clock');
    const queued = world.update(0);
    expect(queued.some((event) => event.type === 'snakeSpawned' && event.snakeId === snake.id)).toBe(true);
    expect(world.update(0).some((event) => event.type === 'snakeSpawned')).toBe(false);
    const x0 = snake.segments[0]?.x ?? 0;
    world.update(10);
    expect(world.elapsed).toBeCloseTo(GameConfig.world.maxDeltaSeconds, 5);
    expect((snake.segments[0]?.x ?? 0) - x0).toBeCloseTo(GameConfig.snake.baseSpeed * world.elapsed, 2);
  });

  it('drops boost pellets while boosting', () => {
    const world = new World(new SeededRandom(11));
    spawn(world, 0, 0, 0, 800, 'Boosty', true);
    for (let i = 0; i < 12; i += 1) world.update(1 / 60);
    expect(world.foods.some((food) => food.kind === 'boost')).toBe(true);
  });

  it('keeps a full bot population, finite state, and eaten food over 20s', () => {
    const world = new World(new SeededRandom(12));
    const bots = new BotPopulation(world, new SeededRandom(13));
    bots.populate();
    const target = GameConfig.bots.count;
    expect(world.snakes.length).toBe(target);
    const steps = 20 * 60;
    const dt = 1 / 60;
    let eaten = 0;
    let countSum = 0;
    for (let step = 0; step < steps; step += 1) {
      const events = world.update(dt);
      bots.update(dt, events);
      let count = 0;
      for (let i = 0; i < world.snakes.length; i += 1) {
        const snake = world.snakes[i];
        if (!snake || snake.isPlayer) continue;
        count += 1;
        expect(Number.isFinite(snake.mass)).toBe(true);
        expect(Number.isFinite(snake.heading)).toBe(true);
        expect(Number.isFinite(snake.radius)).toBe(true);
        const head = snake.segments[0];
        expect(head !== undefined && Number.isFinite(head.x) && Number.isFinite(head.y)).toBe(true);
      }
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(target);
      countSum += count;
      for (let i = 0; i < events.length; i += 1) {
        if (events[i]?.type === 'foodEaten') eaten += 1;
      }
      expect(world.foods.length).toBeLessThanOrEqual(GameConfig.food.maxFood);
    }
    expect(eaten).toBeGreaterThan(0);
    expect(countSum / steps).toBeGreaterThan(target * 0.6);
  }, 60_000);

  it('steps 31 scripted snakes inside a generous time bound', () => {
    const world = new World(new SeededRandom(14));
    const intent = { targetAngle: 0, boost: false };
    const controller: SnakeController = {
      decide(self: SnakeView, worldView: WorldView, dt: number): typeof intent {
        void worldView;
        void dt;
        const head = self.segments[0];
        intent.targetAngle = head ? Math.atan2(-head.y, -head.x) + Math.PI / 2 : self.heading;
        intent.boost = false;
        return intent;
      },
    };
    for (let i = 0; i < 31; i += 1) {
      world.spawnSnake({
        name: `S${i}`,
        skin: defaultSkin,
        controller,
        mass: 30 + (i % 8) * 180,
        heading: (i / 31) * Math.PI * 2,
      });
    }
    world.update(1 / 60);
    const steps = 600;
    const started = performance.now();
    for (let i = 0; i < steps; i += 1) world.update(1 / 60);
    const ms = (performance.now() - started) / steps;
    console.log(`ms/step ${ms.toFixed(3)}`);
    expect(ms).toBeLessThan(15);
    expect(world.foods.length).toBeLessThanOrEqual(GameConfig.food.maxFood);
  }, 30_000);
});
