import { describe, expect, it } from 'vitest';
import { skinCatalog } from '../content/skins/skinCatalog';
import { GameConfig } from '../config/GameConfig';
import type { SnakeDiedEvent } from '../core/contracts/SnakeDiedEvent';
import type { SnakeView } from '../core/contracts/SnakeView';
import { SeededRandom } from '../core/random/SeededRandom';
import { BotController } from './BotController';
import { BotPopulation } from './BotPopulation';
import { createFakeSnake } from './testing/createFakeSnake';
import { FakeWorld } from './testing/FakeWorld';

function aliveBots(world: FakeWorld): SnakeView[] {
  return world.snakes.filter((snake) => snake.alive && !snake.isPlayer);
}

function died(snake: SnakeView): SnakeDiedEvent {
  return {
    type: 'snakeDied',
    snakeId: snake.id,
    name: snake.name,
    isPlayer: snake.isPlayer,
    killerId: null,
    killerName: null,
    cause: 'collision',
    finalMass: snake.mass,
    kills: snake.kills,
    survivedSeconds: 4,
    x: 0,
    y: 0,
    color: snake.skin.colors[0] ?? '#ffffff',
  };
}

describe('BotPopulation', () => {
  it('fills the lobby with uniquely named skinned bots', () => {
    const world = new FakeWorld();
    const population = new BotPopulation(world, new SeededRandom(2));
    population.populate();
    const alive = aliveBots(world);
    const skinIds = new Set(skinCatalog.map((skin) => skin.id));
    expect(alive).toHaveLength(GameConfig.bots.count);
    expect(new Set(alive.map((snake) => snake.name)).size).toBe(alive.length);
    expect(world.lastPosition).toBeUndefined();
    expect(world.controllers).toHaveLength(GameConfig.bots.count);
    for (const controller of world.controllers) {
      expect(controller).toBeInstanceOf(BotController);
    }
    for (const snake of alive) {
      expect(snake.isPlayer).toBe(false);
      expect(skinIds.has(snake.skin.id)).toBe(true);
      expect(snake.mass).toBeGreaterThanOrEqual(GameConfig.bots.initialMassMin);
      expect(snake.mass).toBeLessThan(GameConfig.bots.initialMassMax);
    }
  });

  it('respawns dead bots after the delay and ignores player deaths', () => {
    const world = new FakeWorld();
    const population = new BotPopulation(world, new SeededRandom(4));
    population.populate();
    const player = createFakeSnake({ id: 9000, name: 'Player', isPlayer: true, mass: 50 });
    world.snakes.push(player);
    const full = world.snakes.length;
    population.update(GameConfig.bots.respawnDelayMax, [died(player)]);
    expect(world.snakes.length).toBe(full);
    expect(aliveBots(world)).toHaveLength(GameConfig.bots.count);

    const victim = world.snakes[0];
    expect(victim).toBeDefined();
    if (!victim) return;
    victim.alive = false;
    population.update(GameConfig.bots.respawnDelayMin * 0.5, [died(victim)]);
    expect(aliveBots(world)).toHaveLength(GameConfig.bots.count - 1);
    const beforeRespawn = world.snakes.length;
    population.update(GameConfig.bots.respawnDelayMax, []);
    expect(world.snakes.length).toBe(beforeRespawn + 1);
    const alive = aliveBots(world);
    expect(alive).toHaveLength(GameConfig.bots.count);
    expect(new Set(alive.map((snake) => snake.name)).size).toBe(alive.length);
    expect(alive.some((snake) => snake.id === victim.id)).toBe(false);
  });

  it('never exceeds the configured bot count', () => {
    const world = new FakeWorld();
    const population = new BotPopulation(world, new SeededRandom(6));
    population.populate();
    population.update(GameConfig.bots.respawnDelayMax, []);
    expect(aliveBots(world)).toHaveLength(GameConfig.bots.count);

    const victim = world.snakes[1];
    expect(victim).toBeDefined();
    if (!victim) return;
    victim.alive = false;
    population.update(GameConfig.bots.respawnDelayMin * 0.25, [died(victim), died(victim), died(victim)]);
    expect(aliveBots(world)).toHaveLength(GameConfig.bots.count - 1);
    population.update(GameConfig.bots.respawnDelayMax, []);
    expect(aliveBots(world)).toHaveLength(GameConfig.bots.count);
  });

  it('drops pending respawns on reset', () => {
    const world = new FakeWorld();
    const population = new BotPopulation(world, new SeededRandom(9));
    population.populate();
    const victim = world.snakes[2];
    expect(victim).toBeDefined();
    if (!victim) return;
    victim.alive = false;
    population.update(GameConfig.bots.respawnDelayMin * 0.25, [died(victim)]);
    population.reset();
    population.update(GameConfig.bots.respawnDelayMax, []);
    expect(aliveBots(world)).toHaveLength(GameConfig.bots.count - 1);
  });
});
