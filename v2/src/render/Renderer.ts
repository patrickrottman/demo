import { GameConfig } from '../config/GameConfig';
import type { GameEvent } from '../core/contracts/GameEvent';
import type { Vec2 } from '../core/contracts/Vec2';
import type { WorldView } from '../core/contracts/WorldView';
import { Camera } from './camera/Camera';
import { BackgroundLayer } from './layers/BackgroundLayer';
import { EffectsLayer } from './layers/EffectsLayer';
import { FoodLayer } from './layers/FoodLayer';
import { MinimapLayer } from './layers/MinimapLayer';
import { SnakeLayer } from './layers/SnakeLayer';
import { sharedSpriteCache } from './sprites/SpriteCache';

const LOST_RADIUS_SCALE = 1.18;

export class Renderer {
  readonly camera = new Camera();
  private readonly ctx: CanvasRenderingContext2D;
  private readonly sprites = sharedSpriteCache();
  private readonly background = new BackgroundLayer();
  private readonly food: FoodLayer;
  private readonly snakes: SnakeLayer;
  private readonly effects = new EffectsLayer();
  private readonly minimap = new MinimapLayer();
  private dpr = 1;
  private focusSnakeId: number | null = null;
  private anchorX = 0;
  private anchorY = 0;
  private anchorRadius: number = GameConfig.snake.minRadius;
  private tracking = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false }) ?? canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2d context unavailable');
    }
    this.ctx = ctx;
    this.food = new FoodLayer(this.sprites);
    this.snakes = new SnakeLayer(this.sprites);
    this.resize();
  }

  resize(): void {
    const cssW = this.canvas.clientWidth;
    const cssH = this.canvas.clientHeight;
    const raw = window.devicePixelRatio;
    this.dpr = raw > 0 ? Math.min(raw, 2) : 1;
    const backingW = Math.max(1, Math.round(cssW * this.dpr));
    const backingH = Math.max(1, Math.round(cssH * this.dpr));
    if (this.canvas.width !== backingW) {
      this.canvas.width = backingW;
    }
    if (this.canvas.height !== backingH) {
      this.canvas.height = backingH;
    }
    this.camera.setViewport(cssW, cssH);
    this.background.resize(cssW, cssH, this.dpr);
  }

  render(world: WorldView, focusSnakeId: number | null, dt: number): void {
    this.focusSnakeId = focusSnakeId;
    const focus = focusSnakeId === null ? undefined : world.getSnake(focusSnakeId);
    const head = focus && focus.alive ? focus.segments[0] : undefined;
    if (focus && focus.alive && head) {
      this.anchorX = head.x;
      this.anchorY = head.y;
      this.anchorRadius = focus.radius;
      this.tracking = true;
      this.camera.follow(head.x, head.y, focus.radius, dt);
    } else {
      const radius = this.tracking ? this.anchorRadius * LOST_RADIUS_SCALE : this.anchorRadius;
      this.camera.follow(this.anchorX, this.anchorY, radius, dt);
    }
    const ctx = this.ctx;
    const width = this.camera.viewportWidth;
    const height = this.camera.viewportHeight;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    this.background.draw(ctx, this.camera, world.arenaRadius);
    this.food.draw(ctx, this.camera, world);
    this.snakes.drawBodies(ctx, this.camera, world);
    this.effects.draw(ctx, this.camera, this.sprites, dt);
    this.snakes.drawNames(ctx, this.camera, world);
    this.background.drawVignette(ctx, width, height);
    this.minimap.draw(ctx, this.camera, world, focusSnakeId);
  }

  ingest(events: readonly GameEvent[]): void {
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!event) {
        continue;
      }
      if (event.type === 'snakeDied') {
        this.effects.burst(event.x, event.y, event.color);
      } else if (event.type === 'foodEaten' && this.focusSnakeId !== null && event.snakeId === this.focusSnakeId) {
        this.effects.sparkle(event.x, event.y, event.color);
      }
    }
  }

  screenToWorld(screenX: number, screenY: number): Vec2 {
    return this.camera.screenToWorld(screenX, screenY);
  }
}
