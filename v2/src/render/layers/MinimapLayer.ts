import { skinPrimaryColor } from '../../content/skins/skinColors';
import type { WorldView } from '../../core/contracts/WorldView';
import type { Camera } from '../camera/Camera';
import { minimapDotRadius, minimapPoint } from '../minimapPoint';

const TAU = Math.PI * 2;

export class MinimapLayer {
  private readonly point = { x: 0, y: 0 };

  draw(ctx: CanvasRenderingContext2D, camera: Camera, world: WorldView, focusSnakeId: number | null): void {
    const minSide = camera.viewportWidth < camera.viewportHeight ? camera.viewportWidth : camera.viewportHeight;
    if (minSide < 80) {
      return;
    }
    const diameter = minSide < 520 ? Math.max(96, minSide * 0.3) : 150;
    const radius = diameter * 0.5;
    const margin = 16;
    const cx = Math.round(camera.viewportWidth - margin - radius);
    const cy = Math.round(camera.viewportHeight - margin - radius);
    const mapRadius = radius - 8;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = '#070910';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, mapRadius, 0, TAU);
    ctx.clip();
    const elapsed = world.elapsed;
    this.drawSnakes(ctx, world, cx, cy, mapRadius, focusSnakeId, false, elapsed);
    this.drawSnakes(ctx, world, cx, cy, mapRadius, focusSnakeId, true, elapsed);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private drawSnakes(
    ctx: CanvasRenderingContext2D,
    world: WorldView,
    cx: number,
    cy: number,
    mapRadius: number,
    focusSnakeId: number | null,
    focusPass: boolean,
    elapsed: number,
  ): void {
    const snakes = world.snakes;
    for (let i = 0; i < snakes.length; i++) {
      const snake = snakes[i];
      const head = snake?.segments[0];
      if (!snake || !snake.alive || !head) {
        continue;
      }
      const focused = snake.id === focusSnakeId;
      if (focused !== focusPass) {
        continue;
      }
      minimapPoint(head.x, head.y, world.arenaRadius, cx, cy, mapRadius, this.point);
      const dot = minimapDotRadius(snake.mass);
      ctx.fillStyle = skinPrimaryColor(snake.skin);
      ctx.globalAlpha = focused ? 1 : 0.9;
      ctx.beginPath();
      ctx.arc(this.point.x, this.point.y, focused ? dot + 1.6 : dot, 0, TAU);
      ctx.fill();
      if (!focused) {
        continue;
      }
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 5);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(this.point.x, this.point.y, Math.max(1.3, dot * 0.42), 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.5 + 0.5 * pulse;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.point.x, this.point.y, dot + 2.6 + pulse * 2.2, 0, TAU);
      ctx.stroke();
    }
  }
}
