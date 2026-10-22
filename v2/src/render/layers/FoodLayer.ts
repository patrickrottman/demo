import type { WorldView } from '../../core/contracts/WorldView';
import type { Camera } from '../camera/Camera';
import { circleOutside } from '../culling';
import { foodAppear } from '../fades';
import { foodSizeBucket } from '../foodSizeBucket';
import type { SpriteCache } from '../sprites/SpriteCache';

const HALO = 5.9;
const TAU = Math.PI * 2;

export class FoodLayer {
  constructor(private readonly sprites: SpriteCache) {}

  draw(ctx: CanvasRenderingContext2D, camera: Camera, world: WorldView): void {
    const bounds = camera.visibleBounds();
    const zoom = camera.zoom;
    const ox = camera.viewportWidth * 0.5 - camera.x * zoom;
    const oy = camera.viewportHeight * 0.5 - camera.y * zoom;
    const elapsed = world.elapsed;
    const foods = world.foods;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      if (!food || circleOutside(food.x, food.y, food.radius * 3.6, bounds)) {
        continue;
      }
      const appear = foodAppear(elapsed, food.bornAt);
      if (appear <= 0.01) {
        continue;
      }
      const amp = food.kind === 'remains' ? 0.16 : 0.08;
      const pulse = 1 - amp + amp * Math.sin(elapsed * 2.8 + food.seed * TAU);
      let scale = appear * pulse;
      let alpha = 0.62 + 0.38 * appear;
      if (food.kind === 'remains') {
        scale *= 1.24;
        alpha = Math.min(1, alpha * 1.2);
      } else if (food.kind === 'boost') {
        scale *= 1.08;
        alpha = Math.min(1, alpha * 1.05);
      }
      const bucket = foodSizeBucket(food.radius);
      const sprite = this.sprites.food(food.color, bucket);
      const draw = food.radius * HALO * scale * zoom;
      if (draw < 0.8) {
        continue;
      }
      const sx = food.x * zoom + ox;
      const sy = food.y * zoom + oy;
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, sx - draw * 0.5, sy - draw * 0.5, draw, draw);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
