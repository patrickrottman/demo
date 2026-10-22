export interface FoodEatenEvent {
  readonly type: 'foodEaten';
  readonly snakeId: number;
  readonly value: number;
  readonly x: number;
  readonly y: number;
  readonly color: string;
}
