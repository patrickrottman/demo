import type { Camera } from '../camera/Camera';
import type { SpriteCache } from '../sprites/SpriteCache';
import { EffectPool } from '../effects/EffectPool';

export class EffectsLayer {
  private readonly pool = new EffectPool();

  burst(x: number, y: number, color: string): void {
    this.pool.burst(x, y, color);
  }

  sparkle(x: number, y: number, color: string): void {
    this.pool.sparkle(x, y, color);
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera, sprites: SpriteCache, dt: number): void {
    this.pool.advance(dt);
    this.pool.draw(ctx, camera, sprites);
  }
}
