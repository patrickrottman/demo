import type { SnakeSkin } from '../../content/skins/SnakeSkin';
import type { Vec2 } from './Vec2';

export interface SnakeView {
  readonly id: number;
  readonly name: string;
  readonly skin: SnakeSkin;
  readonly isPlayer: boolean;
  readonly alive: boolean;
  readonly segments: readonly Vec2[];
  readonly radius: number;
  readonly heading: number;
  readonly targetAngle: number;
  readonly mass: number;
  readonly boosting: boolean;
  readonly kills: number;
  readonly spawnedAt: number;
}
