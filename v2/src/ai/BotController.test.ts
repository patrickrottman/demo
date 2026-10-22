import { describe, expect, it } from 'vitest';
import { GameConfig } from '../config/GameConfig';
import type { FoodKind } from '../core/contracts/FoodKind';
import type { FoodView } from '../core/contracts/FoodView';
import { angleDelta } from '../core/math/angles';
import { SeededRandom } from '../core/random/SeededRandom';
import { BotController } from './BotController';
import type { BotPersonality } from './BotPersonality';
import { BotPopulation } from './BotPopulation';
import { createFakeSnake } from './testing/createFakeSnake';
import { FakeWorld } from './testing/FakeWorld';

function personality(overrides: Partial<BotPersonality> = {}): BotPersonality {
  return {
    aggression: 0.4,
    caution: 0.92,
    greed: 0.9,
    boostiness: 0.15,
    reactionTime: 0.08,
    ...overrides,
  };
}

function pellet(x: number, y: number, value = 4, kind: FoodKind = 'ambient'): FoodView {
  return {
    id: 1,
    x,
    y,
    radius: 6,
    value,
    color: '#ffffff',
    kind,
    seed: 1,
    bornAt: 0,
  };
}

function steer(overrides: Partial<BotPersonality> = {}, seed = 3): BotController {
  return new BotController(new SeededRandom(seed), personality(overrides));
}

describe('BotController', () => {
  it('steers away from a wall of enemy segments directly ahead', () => {
    const self = createFakeSnake({
      id: 1,
      heading: 0,
      radius: 12,
      mass: 120,
      segments: [{ x: 0, y: 0 }],
    });
    const wall: { x: number; y: number }[] = [{ x: -2200, y: 1800 }];
    for (let y = -220; y <= 220; y += 20) wall.push({ x: 96, y });
    const enemy = createFakeSnake({
      id: 2,
      heading: Math.PI,
      radius: 22,
      mass: 400,
      segments: wall,
    });
    const world = new FakeWorld();
    world.snakes.push(self, enemy);
    const intent = steer().decide(self, world, 0.25);
    expect(Math.abs(angleDelta(self.heading, intent.targetAngle))).toBeGreaterThan(0.7);
    expect(Math.cos(angleDelta(self.heading, intent.targetAngle))).toBeLessThan(0.45);
  });

  it('turns toward nearby food', () => {
    const self = createFakeSnake({
      id: 1,
      heading: 0,
      radius: 12,
      mass: 80,
      segments: [{ x: 0, y: 0 }],
    });
    const world = new FakeWorld();
    world.snakes.push(self);
    world.foods.push(pellet(36, 188, 5));
    const intent = steer({ greed: 0.98 }).decide(self, world, 0.25);
    const foodAngle = Math.atan2(188, 36);
    expect(Math.abs(angleDelta(foodAngle, intent.targetAngle))).toBeLessThan(0.5);
  });

  it('heads back toward the center near the border', () => {
    const x = 5400;
    const y = 1200;
    const heading = Math.atan2(y, x);
    const self = createFakeSnake({
      id: 1,
      heading,
      radius: 12,
      mass: 90,
      segments: [{ x, y }],
    });
    const world = new FakeWorld();
    world.snakes.push(self);
    const intent = steer({ greed: 0.2, aggression: 0.25 }).decide(self, world, 0.25);
    const toCenter = Math.atan2(-y, -x);
    expect(world.arenaRadius - Math.hypot(x, y)).toBeLessThan(600);
    expect(Math.abs(angleDelta(toCenter, intent.targetAngle))).toBeLessThan(0.75);
  });

  it('ignores its own body', () => {
    const segments = [{ x: 0, y: 0 }];
    for (let y = -80; y <= 80; y += 16) segments.push({ x: 38, y });
    const self = createFakeSnake({
      id: 4,
      heading: 0,
      radius: 12,
      mass: 100,
      segments,
    });
    const world = new FakeWorld();
    world.snakes.push(self);
    world.foods.push(pellet(210, 0, 6));
    const intent = steer().decide(self, world, 0.25);
    expect(Math.abs(angleDelta(0, intent.targetAngle))).toBeLessThan(0.5);
  });

  it('does not boost below the threshold', () => {
    const self = createFakeSnake({
      id: 1,
      heading: 0,
      radius: 14,
      mass: GameConfig.snake.minBoostMass * 1.5 - 1,
      segments: [{ x: 0, y: 0 }],
    });
    const threat = createFakeSnake({
      id: 2,
      heading: Math.PI,
      radius: 18,
      mass: 200,
      segments: [{ x: 42, y: 0 }],
    });
    const world = new FakeWorld();
    world.snakes.push(self, threat);
    const intent = steer({ boostiness: 1, caution: 0.95 }).decide(self, world, 0.25);
    expect(intent.boost).toBe(false);
  });

  it('boosts to escape imminent danger when boostiness is high', () => {
    const self = createFakeSnake({
      id: 1,
      heading: 0,
      radius: 14,
      mass: 180,
      segments: [{ x: 0, y: 0 }],
    });
    const threat = createFakeSnake({
      id: 2,
      heading: Math.PI,
      radius: 18,
      mass: 160,
      segments: [{ x: 42, y: 0 }],
    });
    const world = new FakeWorld();
    world.snakes.push(self, threat);
    const intent = steer({ boostiness: 1, caution: 0.95, greed: 0.2 }).decide(self, world, 0.25);
    expect(intent.boost).toBe(true);
  });

  it('reuses the last plan until the reaction time elapses', () => {
    const self = createFakeSnake({
      id: 1,
      heading: 0,
      radius: 12,
      mass: 80,
      segments: [{ x: 0, y: 0 }],
    });
    const food = pellet(30, 200, 6);
    const world = new FakeWorld();
    world.snakes.push(self);
    world.foods.push(food);
    const controller = new BotController(new SeededRandom(8), personality({ reactionTime: 0.3, greed: 0.98 }));
    const first = controller.decide(self, world, 0.3).targetAngle;
    world.foods[0] = pellet(30, -200, 6);
    const cached = controller.decide(self, world, 0.02).targetAngle;
    expect(cached).toBe(first);
    const replanned = controller.decide(self, world, 0.3).targetAngle;
    expect(Math.abs(angleDelta(first, replanned))).toBeGreaterThan(1.2);
  });

  it('ticks a full lobby well under the frame budget', () => {
    const world = new FakeWorld();
    const population = new BotPopulation(world, new SeededRandom(5));
    population.populate();
    for (let i = 0; i < world.snakes.length; i++) {
      const snake = world.snakes[i];
      const head = snake?.segments[0];
      if (!snake || !head) continue;
      head.x = (i - 15) * 280;
      head.y = (((i * 17) % 11) - 5) * 180;
      for (let segment = 1; segment <= 18; segment++) {
        snake.segments.push({ x: head.x - segment * 14, y: head.y + (segment % 3) });
      }
    }
    for (let index = 0; index < 80; index++) {
      const kind = index % 7 === 0 ? 'remains' : 'ambient';
      const x = (((index * 47) % 41) - 20) * 140;
      const y = (((index * 13) % 41) - 20) * 140;
      world.foods.push(pellet(x, y, kind === 'remains' ? 24 : 2, kind));
    }
    const frames = 60;
    const started = performance.now();
    for (let frame = 0; frame < frames; frame++) {
      for (let i = 0; i < world.controllers.length; i++) {
        const snake = world.snakes[i];
        const controller = world.controllers[i];
        if (!snake || !controller) continue;
        controller.decide(snake, world, 1 / 60);
      }
    }
    expect((performance.now() - started) / frames).toBeLessThan(1.5);
  });
});
