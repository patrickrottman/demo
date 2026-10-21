import type { SnakeController } from '../contracts/SnakeController';
import type { SnakeIntent } from '../contracts/SnakeIntent';
import type { SnakeView } from '../contracts/SnakeView';
import type { WorldView } from '../contracts/WorldView';

export class ScriptedController implements SnakeController {
  constructor(private readonly source: SnakeIntent | (() => SnakeIntent)) {}

  decide(self: SnakeView, world: WorldView, dt: number): SnakeIntent {
    void self;
    void world;
    void dt;
    return typeof this.source === 'function' ? this.source() : this.source;
  }
}
