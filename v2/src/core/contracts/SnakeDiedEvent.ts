import type { DeathCause } from './DeathCause';

export interface SnakeDiedEvent {
  readonly type: 'snakeDied';
  readonly snakeId: number;
  readonly name: string;
  readonly isPlayer: boolean;
  readonly killerId: number | null;
  readonly killerName: string | null;
  readonly cause: DeathCause;
  readonly finalMass: number;
  readonly kills: number;
  readonly survivedSeconds: number;
  readonly x: number;
  readonly y: number;
  readonly color: string;
}
