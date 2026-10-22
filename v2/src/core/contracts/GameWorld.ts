import type { GameEvent } from './GameEvent';
import type { SnakeView } from './SnakeView';
import type { SpawnOptions } from './SpawnOptions';
import type { WorldView } from './WorldView';

export interface GameWorld extends WorldView {
  spawnSnake(options: SpawnOptions): SnakeView;
  update(dt: number): readonly GameEvent[];
  reset(): void;
}
