import type { SkinPattern } from './SkinPattern';

export interface SnakeSkin {
  readonly id: string;
  readonly name: string;
  readonly pattern: SkinPattern;
  readonly colors: readonly string[];
  readonly stripeLength: number;
  readonly glow: string;
}
