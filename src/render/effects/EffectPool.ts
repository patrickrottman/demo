import type { Camera } from '../camera/Camera';
import type { SpriteCache } from '../sprites/SpriteCache';
import { EFFECT_RING, EFFECT_SPARK, EFFECT_SPARKLE, EffectParticle } from './EffectParticle';

const POOL_SIZE = 320;
const SPARK_COUNT = 24;
const SPARKLE_CAP = 36;
const TAU = Math.PI * 2;

export class EffectPool {
  private sparkleCount = 0;
  private readonly particles: EffectParticle[] = [];

  constructor() {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.particles.push(new EffectParticle());
    }
  }

  burst(x: number, y: number, color: string): void {
    const ring = this.acquire();
    if (ring) {
      ring.active = true;
      ring.kind = EFFECT_RING;
      ring.x = x;
      ring.y = y;
      ring.vx = 0;
      ring.vy = 0;
      ring.age = 0;
      ring.life = 0.7;
      ring.size = 16;
      ring.color = color;
    }
    for (let i = 0; i < SPARK_COUNT; i++) {
      const spark = this.acquire();
      if (!spark) {
        return;
      }
      const angle = (i / SPARK_COUNT) * TAU + (Math.random() - 0.5) * 0.4;
      const speed = 110 + Math.random() * 240;
      spark.active = true;
      spark.kind = EFFECT_SPARK;
      spark.x = x;
      spark.y = y;
      spark.vx = Math.cos(angle) * speed;
      spark.vy = Math.sin(angle) * speed;
      spark.age = 0;
      spark.life = 0.48 + Math.random() * 0.22;
      spark.size = 7 + Math.random() * 7;
      spark.color = color;
    }
  }

  sparkle(x: number, y: number, color: string): void {
    if (this.sparkleCount >= SPARKLE_CAP) {
      return;
    }
    const particle = this.acquire();
    if (!particle) {
      return;
    }
    this.sparkleCount += 1;
    const angle = Math.random() * TAU;
    const speed = 20 + Math.random() * 55;
    particle.active = true;
    particle.kind = EFFECT_SPARKLE;
    particle.x = x;
    particle.y = y;
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed - 36;
    particle.age = 0;
    particle.life = 0.28 + Math.random() * 0.1;
    particle.size = 5 + Math.random() * 3;
    particle.color = color;
  }

  advance(dt: number): void {
    const step = dt > 0 ? (dt > 0.05 ? 0.05 : dt) : 0;
    if (step === 0) {
      return;
    }
    const drag = Math.exp(-2.4 * step);
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle || !particle.active) {
        continue;
      }
      particle.age += step;
      if (particle.age >= particle.life) {
        particle.active = false;
        if (particle.kind === EFFECT_SPARKLE && this.sparkleCount > 0) {
          this.sparkleCount -= 1;
        }
        continue;
      }
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.vx *= drag;
      particle.vy *= drag;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera, sprites: SpriteCache): void {
    const zoom = camera.zoom;
    const ox = camera.viewportWidth * 0.5 - camera.x * zoom;
    const oy = camera.viewportHeight * 0.5 - camera.y * zoom;
    const vw = camera.viewportWidth;
    const vh = camera.viewportHeight;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle || !particle.active || particle.life <= 0) {
        continue;
      }
      const t = particle.age / particle.life;
      const fade = 1 - t;
      const sx = particle.x * zoom + ox;
      const sy = particle.y * zoom + oy;
      if (sx < -220 || sy < -220 || sx > vw + 220 || sy > vh + 220) {
        continue;
      }
      if (particle.kind === EFFECT_RING) {
        const radius = Math.max(1, (particle.size + t * 168) * zoom);
        ctx.strokeStyle = particle.color;
        ctx.globalAlpha = fade * 0.28;
        ctx.lineWidth = 10 + fade * 14;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = fade * 0.9;
        ctx.lineWidth = 1.25 + fade * 3.5;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, TAU);
        ctx.stroke();
        continue;
      }
      const sprite = particle.kind === EFFECT_SPARKLE ? sprites.food(particle.color, 8) : sprites.glow(particle.color);
      const draw = particle.size * (0.45 + fade) * (particle.kind === EFFECT_SPARKLE ? 2.4 : 3.6) * zoom;
      ctx.globalAlpha = fade * (particle.kind === EFFECT_SPARKLE ? 1 : 0.9);
      ctx.drawImage(sprite, sx - draw * 0.5, sy - draw * 0.5, draw, draw);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private acquire(): EffectParticle | null {
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (particle && !particle.active) {
        return particle;
      }
    }
    return null;
  }
}
