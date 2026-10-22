import { GameConfig } from '../../config/GameConfig';
import { skinCatalog } from '../../content/skins/skinCatalog';
import { mixHex } from '../../content/skins/skinColors';
import { FOOD_BUCKETS } from '../foodSizeBucket';
import { hexRgb, quantizeHex, rgba } from './hexColor';

const BALL_SIZE = 80;
const BALL_INK = 38;
const TAU = Math.PI * 2;

function canvas2d(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d context unavailable');
  }
  return { canvas, ctx };
}

let shared: SpriteCache | undefined;

export function sharedSpriteCache(): SpriteCache {
  if (!shared) {
    shared = new SpriteCache();
  }
  return shared;
}

export class SpriteCache {
  readonly ballScale = BALL_SIZE / (BALL_INK * 2);
  private readonly balls = new Map<string, HTMLCanvasElement>();
  private readonly glows = new Map<string, HTMLCanvasElement>();
  private readonly foods = new Map<string, HTMLCanvasElement>();

  constructor() {
    const colors = new Set<string>();
    for (const color of GameConfig.food.palette) {
      colors.add(color);
    }
    for (const skin of skinCatalog) {
      colors.add(skin.glow);
      for (const color of skin.colors) {
        colors.add(color);
      }
    }
    for (const color of colors) {
      this.ball(color);
      this.glow(color);
    }
    for (const color of GameConfig.food.palette) {
      for (const bucket of FOOD_BUCKETS) {
        this.food(color, bucket);
      }
    }
  }

  ball(color: string): HTMLCanvasElement {
    const key = quantizeHex(color);
    const cached = this.balls.get(key);
    if (cached) {
      return cached;
    }
    const sprite = this.bakeBall(key);
    this.balls.set(key, sprite);
    return sprite;
  }

  glow(color: string): HTMLCanvasElement {
    const key = quantizeHex(color);
    const cached = this.glows.get(key);
    if (cached) {
      return cached;
    }
    const sprite = this.bakeGlow(key);
    this.glows.set(key, sprite);
    return sprite;
  }

  food(color: string, bucket: number): HTMLCanvasElement {
    const key = `${quantizeHex(color)}|${bucket}`;
    const cached = this.foods.get(key);
    if (cached) {
      return cached;
    }
    const sprite = this.bakeFood(quantizeHex(color), bucket);
    this.foods.set(key, sprite);
    return sprite;
  }

  private bakeBall(color: string): HTMLCanvasElement {
    const { canvas, ctx } = canvas2d(BALL_SIZE, BALL_SIZE);
    const center = BALL_SIZE / 2;
    const [r, g, b] = hexRgb(color);
    ctx.beginPath();
    ctx.arc(center, center, BALL_INK, 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.save();
    ctx.clip();
    const shade = ctx.createRadialGradient(center, center + BALL_INK * 0.15, BALL_INK * 0.2, center, center, BALL_INK);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(0.72, 'rgba(0,0,0,0.04)');
    shade.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, BALL_SIZE, BALL_SIZE);
    const light = ctx.createRadialGradient(
      center - BALL_INK * 0.38,
      center - BALL_INK * 0.46,
      BALL_INK * 0.04,
      center - BALL_INK * 0.12,
      center - BALL_INK * 0.16,
      BALL_INK * 0.95,
    );
    light.addColorStop(0, 'rgba(255,255,255,0.92)');
    light.addColorStop(0.22, 'rgba(255,255,255,0.32)');
    light.addColorStop(0.55, 'rgba(255,255,255,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, BALL_SIZE, BALL_SIZE);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(center, center, BALL_INK - 0.75, 0, TAU);
    ctx.strokeStyle = rgba(r * 0.22, g * 0.22, b * 0.22, 0.55);
    ctx.lineWidth = 2;
    ctx.stroke();
    return canvas;
  }

  private bakeGlow(color: string): HTMLCanvasElement {
    const size = 96;
    const { canvas, ctx } = canvas2d(size, size);
    const center = size / 2;
    const [r, g, b] = hexRgb(color);
    const hot = hexRgb(mixHex(color, '#FFFFFF', 0.55));
    const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
    grad.addColorStop(0, rgba(hot[0], hot[1], hot[2], 0.95));
    grad.addColorStop(0.28, rgba(r, g, b, 0.55));
    grad.addColorStop(0.62, rgba(r, g, b, 0.16));
    grad.addColorStop(1, rgba(r, g, b, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return canvas;
  }

  private bakeFood(color: string, bucket: number): HTMLCanvasElement {
    const size = Math.max(48, Math.round(bucket * 8));
    const { canvas, ctx } = canvas2d(size, size);
    const center = size / 2;
    const [r, g, b] = hexRgb(color);
    const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.14, rgba(255, 255, 255, 0.96));
    grad.addColorStop(0.28, rgba(r + (255 - r) * 0.45, g + (255 - g) * 0.45, b + (255 - b) * 0.45, 0.95));
    grad.addColorStop(0.4, rgba(r, g, b, 0.9));
    grad.addColorStop(0.58, rgba(r, g, b, 0.32));
    grad.addColorStop(1, rgba(r, g, b, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return canvas;
  }
}
