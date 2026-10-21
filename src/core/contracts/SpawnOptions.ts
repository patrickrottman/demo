import type { SnakeSkin } from '../../content/skins/SnakeSkin';
import type { SnakeController } from './SnakeController';
import type { Vec2 } from './Vec2';

export interface SpawnOptions {
  name: string;
  skin: SnakeSkin;
  controller: SnakeController;
  isPlayer?: boolean;
  mass?: number;
  position?: Vec2;
  heading?: number;
}
