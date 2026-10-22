import { skinCatalog } from '../content/skins/skinCatalog';
import { GameConfig } from '../config/GameConfig';
import type { GameEvent } from '../core/contracts/GameEvent';
import type { GameWorld } from '../core/contracts/GameWorld';
import type { Random } from '../core/random/Random';
import { BotController } from './BotController';
import { botNames } from './botNames';
import { createPersonality } from './createPersonality';

export class BotPopulation {
  private readonly world: GameWorld;
  private readonly rng: Random;
  private readonly respawns: number[] = [];
  private readonly usedNames = new Set<string>();

  constructor(world: GameWorld, rng: Random) {
    this.world = world;
    this.rng = rng;
  }

  populate(): void {
    const target = GameConfig.bots.count;
    let guard = target;
    while (this.aliveBotCount() < target && guard > 0) {
      this.spawnBot();
      guard -= 1;
    }
  }

  update(dt: number, events: readonly GameEvent[]): void {
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!event || event.type !== 'snakeDied' || event.isPlayer) continue;
      this.respawns.push(this.rng.range(GameConfig.bots.respawnDelayMin, GameConfig.bots.respawnDelayMax));
    }
    let write = 0;
    for (let i = 0; i < this.respawns.length; i++) {
      const remaining = (this.respawns[i] ?? 0) - dt;
      if (remaining <= 0) {
        if (this.aliveBotCount() < GameConfig.bots.count) this.spawnBot();
        continue;
      }
      this.respawns[write] = remaining;
      write += 1;
    }
    this.respawns.length = write;
  }

  reset(): void {
    this.respawns.length = 0;
    this.usedNames.clear();
  }

  private spawnBot(): void {
    this.world.spawnSnake({
      name: this.pickName(),
      skin: this.rng.pick(skinCatalog),
      controller: new BotController(this.rng, createPersonality(this.rng)),
      mass: this.rollMass(),
    });
  }

  private rollMass(): number {
    const min = GameConfig.bots.initialMassMin;
    const max = GameConfig.bots.initialMassMax;
    const typical = 400;
    if (this.rng.chance(GameConfig.bots.spawnBigChance) && max > typical) {
      return this.rng.range(typical, max);
    }
    const high = Math.min(typical, max);
    return this.rng.range(min, Math.max(high, min + 1));
  }

  private pickName(): string {
    this.usedNames.clear();
    const snakes = this.world.snakes;
    for (let i = 0; i < snakes.length; i++) {
      const snake = snakes[i];
      if (snake && snake.alive && !snake.isPlayer) this.usedNames.add(snake.name);
    }
    const start = this.rng.int(0, botNames.length - 1);
    for (let i = 0; i < botNames.length; i++) {
      const name = botNames[(start + i) % botNames.length];
      if (name && !this.usedNames.has(name)) return name;
    }
    return `${botNames[start] ?? 'Snek'} ${this.rng.int(2, 99)}`;
  }

  private aliveBotCount(): number {
    const snakes = this.world.snakes;
    let count = 0;
    for (let i = 0; i < snakes.length; i++) {
      const snake = snakes[i];
      if (snake && snake.alive && !snake.isPlayer) count += 1;
    }
    return count;
  }
}
