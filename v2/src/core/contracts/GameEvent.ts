import type { FoodEatenEvent } from './FoodEatenEvent';
import type { SnakeDiedEvent } from './SnakeDiedEvent';
import type { SnakeSpawnedEvent } from './SnakeSpawnedEvent';

export type GameEvent = SnakeSpawnedEvent | FoodEatenEvent | SnakeDiedEvent;
