import { FakeSnake } from './FakeSnake';
import type { FakeSnakeOptions } from './FakeSnakeOptions';

export function createFakeSnake(options: FakeSnakeOptions = {}): FakeSnake {
  return new FakeSnake(options);
}
