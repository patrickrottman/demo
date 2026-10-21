import type { Vec2 } from '../core/contracts/Vec2';
import type { SteeringMode } from './SteeringMode';

export interface PlayerInput {
  readonly boost: boolean;
  readonly steeringMode: SteeringMode;
  readonly keyboardDirection: number;
  aimWorld(): Vec2;
}
