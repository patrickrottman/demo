import { angleTo, normalizeAngle } from '../core/math/angles';
import type { SnakeController } from '../core/contracts/SnakeController';
import type { SnakeIntent } from '../core/contracts/SnakeIntent';
import type { SnakeView } from '../core/contracts/SnakeView';
import type { WorldView } from '../core/contracts/WorldView';
import type { PlayerInput } from './PlayerInput';

export const keyboardTurnRate = 4;

export class PlayerController implements SnakeController {
  constructor(private readonly input: PlayerInput) {}

  decide(self: SnakeView, world: WorldView, dt: number): SnakeIntent {
    void world;
    const boost = this.input.boost;
    if (this.input.steeringMode === 'keyboard') {
      const step = this.input.keyboardDirection * keyboardTurnRate * dt;
      return { targetAngle: normalizeAngle(self.heading + step), boost };
    }
    const head = self.segments[0];
    if (!head) return { targetAngle: self.heading, boost };
    const aim = this.input.aimWorld();
    const angle = angleTo(head.x, head.y, aim.x, aim.y);
    return { targetAngle: Number.isFinite(angle) ? angle : self.heading, boost };
  }
}
