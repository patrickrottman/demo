import type { SnakeSkin } from '../../content/skins/SnakeSkin';
import { defaultSkin } from '../../content/skins/skinCatalog';
import type { SnakeView } from '../../core/contracts/SnakeView';
import type { Vec2 } from '../../core/contracts/Vec2';
import { GameConfig } from '../../config/GameConfig';
import { clamp } from '../../core/math/scalars';
import type { FakeSnakeOptions } from './FakeSnakeOptions';

function radiusForMass(mass: number): number {
  const minRadius = GameConfig.snake.minRadius;
  const maxRadius = GameConfig.snake.maxRadius;
  const t = clamp(Math.sqrt(Math.max(mass, 1) / GameConfig.snake.radiusMassScale), 0, 1);
  return minRadius + (maxRadius - minRadius) * t;
}

function copySegments(segments: readonly Vec2[] | undefined): Vec2[] {
  if (!segments || segments.length === 0) {
    return [{ x: 0, y: 0 }];
  }
  const copy: Vec2[] = [];
  for (let i = 0; i < segments.length; i++) {
    const point = segments[i];
    if (!point) continue;
    copy.push({ x: point.x, y: point.y });
  }
  if (copy.length === 0) {
    copy.push({ x: 0, y: 0 });
  }
  return copy;
}

export class FakeSnake implements SnakeView {
  id: number;
  name: string;
  skin: SnakeSkin;
  isPlayer: boolean;
  alive: boolean;
  segments: Vec2[];
  radius: number;
  heading: number;
  targetAngle: number;
  mass: number;
  boosting: boolean;
  kills: number;
  spawnedAt: number;

  constructor(options: FakeSnakeOptions = {}) {
    const mass = options.mass ?? GameConfig.snake.startMass;
    const heading = options.heading ?? 0;
    this.id = options.id ?? 1;
    this.name = options.name ?? 'Snek';
    this.skin = options.skin ?? defaultSkin;
    this.isPlayer = options.isPlayer ?? false;
    this.alive = options.alive ?? true;
    this.segments = copySegments(options.segments);
    this.radius = options.radius ?? radiusForMass(mass);
    this.heading = heading;
    this.targetAngle = options.targetAngle ?? heading;
    this.mass = mass;
    this.boosting = options.boosting ?? false;
    this.kills = options.kills ?? 0;
    this.spawnedAt = options.spawnedAt ?? 0;
  }
}
