import type { SnakeSkin } from '../../content/skins/SnakeSkin';
import type { Vec2 } from '../../core/contracts/Vec2';

export interface FakeSnakeOptions {
  id?: number;
  name?: string;
  skin?: SnakeSkin;
  isPlayer?: boolean;
  alive?: boolean;
  segments?: readonly Vec2[];
  radius?: number;
  heading?: number;
  targetAngle?: number;
  mass?: number;
  boosting?: boolean;
  kills?: number;
  spawnedAt?: number;
}
