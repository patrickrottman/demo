import { describe, expect, it } from 'vitest';
import { defaultSkin } from '../content/skins/skinCatalog';
import { normalizeAngle } from '../core/math/angles';
import type { SnakeView } from '../core/contracts/SnakeView';
import type { WorldView } from '../core/contracts/WorldView';
import type { Vec2 } from '../core/contracts/Vec2';
import { keyboardTurnRate, PlayerController } from './PlayerController';
import type { PlayerInput } from './PlayerInput';
import type { SteeringMode } from './SteeringMode';

const world: WorldView = {
  arenaRadius: 100,
  elapsed: 0,
  snakes: [],
  foods: [],
  getSnake: () => undefined,
  queryFood: () => [],
  querySegments: () => [],
};

function snake(heading: number, segments: readonly Vec2[]): SnakeView {
  return {
    id: 1,
    name: 'Hero',
    skin: defaultSkin,
    isPlayer: true,
    alive: true,
    segments,
    radius: 12,
    heading,
    targetAngle: heading,
    mass: 20,
    boosting: false,
    kills: 0,
    spawnedAt: 0,
  };
}

function input(steeringMode: SteeringMode, aim: Vec2, boost: boolean, keyboardDirection = 0): PlayerInput {
  return {
    boost,
    steeringMode,
    keyboardDirection,
    aimWorld: () => aim,
  };
}

describe('PlayerController', () => {
  it('aims from the head to the world point', () => {
    const controller = new PlayerController(input('pointer', { x: 30, y: 0 }, false));
    const right = controller.decide(snake(1.2, [{ x: 0, y: 0 }]), world, 0.016);
    expect(right.targetAngle).toBeCloseTo(0);
    expect(right.boost).toBe(false);
    const down = new PlayerController(input('pointer', { x: 5, y: 40 }, true)).decide(
      snake(0, [{ x: 5, y: 5 }]),
      world,
      0.016,
    );
    expect(down.targetAngle).toBeCloseTo(Math.PI / 2);
    expect(down.boost).toBe(true);
  });

  it('rotates from the current heading while keyboard steering is active', () => {
    const heading = 0.4;
    const dt = 0.25;
    const turning = new PlayerController(input('keyboard', { x: 100, y: 100 }, false, 1)).decide(
      snake(heading, [{ x: 0, y: 0 }]),
      world,
      dt,
    );
    expect(turning.targetAngle).toBeCloseTo(normalizeAngle(heading + keyboardTurnRate * dt));
    expect(turning.targetAngle).not.toBeCloseTo(Math.atan2(100, 100));
    const straight = new PlayerController(input('keyboard', { x: 80, y: -20 }, true, 0)).decide(
      snake(heading, [{ x: 0, y: 0 }]),
      world,
      dt,
    );
    expect(straight.targetAngle).toBeCloseTo(normalizeAngle(heading));
    expect(straight.boost).toBe(true);
    const left = new PlayerController(input('keyboard', { x: 0, y: 0 }, false, -1)).decide(
      snake(0.2, [{ x: 0, y: 0 }]),
      world,
      0.5,
    );
    expect(left.targetAngle).toBeCloseTo(normalizeAngle(0.2 - keyboardTurnRate * 0.5));
  });

  it('passes boost through and holds heading without a head segment', () => {
    const controller = new PlayerController(input('pointer', { x: 10, y: 10 }, true));
    const intent = controller.decide(snake(0.75, []), world, 0.016);
    expect(intent.targetAngle).toBeCloseTo(0.75);
    expect(intent.boost).toBe(true);
  });
});
