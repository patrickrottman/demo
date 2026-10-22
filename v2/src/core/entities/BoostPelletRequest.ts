import type { FoodKind } from '../contracts/FoodKind';

export interface BoostPelletRequest {
  readonly x: number;
  readonly y: number;
  readonly value: number;
  readonly radius: number;
  readonly color: string;
  readonly kind: FoodKind;
}
