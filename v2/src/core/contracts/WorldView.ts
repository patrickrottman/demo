import type { FoodView } from './FoodView';
import type { SegmentHit } from './SegmentHit';
import type { SnakeView } from './SnakeView';

export interface WorldView {
  readonly arenaRadius: number;
  readonly elapsed: number;
  readonly snakes: readonly SnakeView[];
  readonly foods: readonly FoodView[];
  getSnake(id: number): SnakeView | undefined;
  queryFood(x: number, y: number, range: number, out?: FoodView[]): FoodView[];
  querySegments(x: number, y: number, range: number, out?: SegmentHit[]): SegmentHit[];
}
