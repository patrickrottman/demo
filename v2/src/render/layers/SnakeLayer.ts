import type { SnakeView } from '../../core/contracts/SnakeView';
import type { WorldView } from '../../core/contracts/WorldView';
import type { Camera } from '../camera/Camera';
import type { VisibleBounds } from '../camera/VisibleBounds';
import { circleOutside, snakeReach } from '../culling';
import { EyeSample } from '../eye/EyeSample';
import { placeEyes } from '../eye/placeEyes';
import { spawnFade } from '../fades';
import { SkinColorCache } from '../sprites/SkinColorCache';
import type { SpriteCache } from '../sprites/SpriteCache';

const TAU = Math.PI * 2;

function headOf(snake: SnakeView): { x: number; y: number } | undefined {
  return snake.segments[0];
}

function offscreen(snake: SnakeView, bounds: VisibleBounds): boolean {
  const head = headOf(snake);
  if (!snake.alive || !head) {
    return true;
  }
  return circleOutside(head.x, head.y, snakeReach(snake.segments.length, snake.radius) + snake.radius, bounds);
}

export class SnakeLayer {
  private readonly colors = new SkinColorCache();
  private readonly eyes = new EyeSample();

  constructor(private readonly sprites: SpriteCache) {}

  drawBodies(ctx: CanvasRenderingContext2D, camera: Camera, world: WorldView): void {
    this.colors.prepare();
    const bounds = camera.visibleBounds();
    const zoom = camera.zoom;
    const ox = camera.viewportWidth * 0.5 - camera.x * zoom;
    const oy = camera.viewportHeight * 0.5 - camera.y * zoom;
    const elapsed = world.elapsed;
    const snakes = world.snakes;
    ctx.globalCompositeOperation = 'lighter';
    for (let s = 0; s < snakes.length; s++) {
      const snake = snakes[s];
      if (!snake || !snake.boosting || offscreen(snake, bounds)) {
        continue;
      }
      const fade = spawnFade(elapsed, snake.spawnedAt);
      if (fade <= 0) {
        continue;
      }
      const pulse = 0.3 + 0.22 * (0.5 + 0.5 * Math.sin(elapsed * 14));
      ctx.globalAlpha = pulse * fade;
      const glow = this.sprites.glow(snake.skin.glow);
      const cull = snake.radius * 2.4;
      const draw = snake.radius * 5.2 * zoom;
      const segments = snake.segments;
      for (let i = segments.length - 1; i >= 0; i -= 2) {
        const seg = segments[i];
        if (!seg || circleOutside(seg.x, seg.y, cull, bounds)) {
          continue;
        }
        const sx = seg.x * zoom + ox;
        const sy = seg.y * zoom + oy;
        ctx.drawImage(glow, sx - draw * 0.5, sy - draw * 0.5, draw, draw);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    const ballScale = this.sprites.ballScale;
    for (let s = 0; s < snakes.length; s++) {
      const snake = snakes[s];
      if (!snake || offscreen(snake, bounds)) {
        continue;
      }
      const fade = spawnFade(elapsed, snake.spawnedAt);
      if (fade <= 0) {
        continue;
      }
      const grow = 0.84 + 0.16 * fade;
      const segments = snake.segments;
      const diameter = snake.radius * 2 * grow * zoom * ballScale;
      const cull = snake.radius * grow;
      const row = this.colors.row(snake.id, snake.skin, segments.length);
      ctx.globalAlpha = fade;
      let last = '';
      let sprite = this.sprites.ball(row[0] ?? snake.skin.colors[0] ?? '#FFFFFF');
      for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        if (!seg || circleOutside(seg.x, seg.y, cull, bounds)) {
          continue;
        }
        const color = row[i] ?? '#FFFFFF';
        if (color !== last) {
          last = color;
          sprite = this.sprites.ball(color);
        }
        const sx = seg.x * zoom + ox;
        const sy = seg.y * zoom + oy;
        const size = i === 0 ? diameter * 1.06 : diameter;
        ctx.drawImage(sprite, sx - size * 0.5, sy - size * 0.5, size, size);
      }
    }
    this.drawEyes(ctx, snakes, bounds, elapsed, zoom, ox, oy);
    ctx.globalAlpha = 1;
  }

  drawNames(ctx: CanvasRenderingContext2D, camera: Camera, world: WorldView): void {
    const bounds = camera.visibleBounds();
    const zoom = camera.zoom > 0 ? camera.zoom : 1;
    const ox = camera.viewportWidth * 0.5 - camera.x * zoom;
    const oy = camera.viewportHeight * 0.5 - camera.y * zoom;
    const elapsed = world.elapsed;
    const font = Math.round(Math.min(18, Math.max(11, 11 + zoom * 4)));
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = `600 ${font}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const snakes = world.snakes;
    for (let s = 0; s < snakes.length; s++) {
      const snake = snakes[s];
      if (!snake || snake.name.length === 0 || offscreen(snake, bounds)) {
        continue;
      }
      const head = headOf(snake);
      if (!head) {
        continue;
      }
      const fade = spawnFade(elapsed, snake.spawnedAt);
      if (fade <= 0) {
        continue;
      }
      const sx = head.x * zoom + ox;
      const sy = head.y * zoom + oy - snake.radius * zoom - 8;
      ctx.globalAlpha = 0.45 * fade;
      ctx.fillStyle = '#000000';
      ctx.fillText(snake.name, sx + 1, sy + 1);
      ctx.globalAlpha = 0.7 * fade;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(snake.name, sx, sy);
    }
    ctx.globalAlpha = 1;
  }

  private drawEyes(
    ctx: CanvasRenderingContext2D,
    snakes: readonly SnakeView[],
    bounds: VisibleBounds,
    elapsed: number,
    zoom: number,
    ox: number,
    oy: number,
  ): void {
    for (let s = 0; s < snakes.length; s++) {
      const snake = snakes[s];
      if (!snake || offscreen(snake, bounds)) {
        continue;
      }
      const head = headOf(snake);
      if (!head) {
        continue;
      }
      const fade = spawnFade(elapsed, snake.spawnedAt);
      if (fade <= 0) {
        continue;
      }
      const grow = 0.84 + 0.16 * fade;
      placeEyes(this.eyes, snake.heading, snake.targetAngle, snake.radius * grow);
      const eyeR = this.eyes.eyeRadius * zoom;
      if (eyeR < 1.35) {
        continue;
      }
      const hx = head.x * zoom + ox;
      const hy = head.y * zoom + oy;
      const lx = hx + this.eyes.leftX * zoom;
      const ly = hy + this.eyes.leftY * zoom;
      const rx = hx + this.eyes.rightX * zoom;
      const ry = hy + this.eyes.rightY * zoom;
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#F4F7FF';
      ctx.beginPath();
      ctx.arc(lx, ly, eyeR, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx, ry, eyeR, 0, TAU);
      ctx.fill();
      const pupilR = Math.max(0.7, this.eyes.pupilRadius * zoom);
      const plx = hx + this.eyes.pupilLeftX * zoom;
      const ply = hy + this.eyes.pupilLeftY * zoom;
      const prx = hx + this.eyes.pupilRightX * zoom;
      const pry = hy + this.eyes.pupilRightY * zoom;
      ctx.fillStyle = '#141824';
      ctx.beginPath();
      ctx.arc(plx, ply, pupilR, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(prx, pry, pupilR, 0, TAU);
      ctx.fill();
      if (eyeR < 3.2) {
        continue;
      }
      const glint = Math.max(0.6, pupilR * 0.32);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(plx - pupilR * 0.28, ply - pupilR * 0.34, glint, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(prx - pupilR * 0.28, pry - pupilR * 0.34, glint, 0, TAU);
      ctx.fill();
    }
  }
}
