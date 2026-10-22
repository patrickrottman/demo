import type { FoodKind } from './FoodKind';

export interface FoodView {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly value: number;
  readonly color: string;
  readonly kind: FoodKind;
  readonly seed: number;
  readonly bornAt: number;
}
