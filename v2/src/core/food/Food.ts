import type { FoodKind } from '../contracts/FoodKind';
import type { FoodView } from '../contracts/FoodView';

export class Food implements FoodView {
  slot = 0;

  constructor(
    readonly id: number,
    public x: number,
    public y: number,
    public radius: number,
    public value: number,
    public color: string,
    public kind: FoodKind,
    public seed: number,
    public bornAt: number,
  ) {}
}
