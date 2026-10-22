import type { SnakeIntent } from './SnakeIntent';
import type { SnakeView } from './SnakeView';
import type { WorldView } from './WorldView';

export interface SnakeController {
  decide(self: SnakeView, world: WorldView, dt: number): SnakeIntent;
}
