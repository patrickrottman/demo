import type { Camera } from '../camera/Camera';

const HEX_RADIUS_PX = 120;
const HEX_RADIUS_WORLD = 156;
const TAU = Math.PI * 2;

function traceHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function buildHexTile(): HTMLCanvasElement {
  const width = Math.ceil(Math.sqrt(3) * HEX_RADIUS_PX);
  const height = Math.ceil(HEX_RADIUS_PX * 3);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas;
  }
  ctx.strokeStyle = 'rgba(176, 206, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  const row = HEX_RADIUS_PX * 1.5;
  const coords = [
    width * 0.5,
    HEX_RADIUS_PX,
    0,
    HEX_RADIUS_PX + row,
    width,
    HEX_RADIUS_PX + row,
    width * 0.5,
    HEX_RADIUS_PX + row * 2,
    0,
    HEX_RADIUS_PX + row - height,
    width,
    HEX_RADIUS_PX + row - height,
  ];
  for (let i = 0; i < coords.length; i += 2) {
    traceHex(ctx, coords[i] ?? 0, coords[i + 1] ?? 0, HEX_RADIUS_PX - 1.25);
    ctx.stroke();
  }
  return canvas;
}

export class BackgroundLayer {
  private readonly tile = buildHexTile();
  private readonly matrix = new DOMMatrix();
  private pattern: CanvasPattern | null = null;
  private vignette: HTMLCanvasElement | null = null;
  private vignetteW = 0;
  private vignetteH = 0;
  private readonly scratch = { x: 0, y: 0 };

  resize(width: number, height: number, dpr: number): void {
    const pixelW = Math.max(1, Math.round(width * dpr));
    const pixelH = Math.max(1, Math.round(height * dpr));
    if (this.vignette && this.vignetteW === pixelW && this.vignetteH === pixelH) {
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = pixelW;
    canvas.height = pixelH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const inner = Math.min(pixelW, pixelH) * 0.28;
    const outer = Math.max(pixelW, pixelH) * 0.72;
    const grad = ctx.createRadialGradient(pixelW * 0.5, pixelH * 0.5, inner, pixelW * 0.5, pixelH * 0.5, outer);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.62, 'rgba(0,0,8,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0.58)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, pixelW, pixelH);
    this.vignette = canvas;
    this.vignetteW = pixelW;
    this.vignetteH = pixelH;
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera, arenaRadius: number): void {
    const width = camera.viewportWidth;
    const height = camera.viewportHeight;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#14060C';
    ctx.fillRect(0, 0, width, height);
    const center = camera.worldToScreen(0, 0, this.scratch);
    const arena = arenaRadius * camera.zoom;
    ctx.beginPath();
    ctx.arc(center.x, center.y, Math.max(0, arena), 0, TAU);
    ctx.fillStyle = '#070B16';
    ctx.fill();
    const pattern = this.ensurePattern(ctx);
    if (pattern) {
      const scale = (HEX_RADIUS_WORLD / HEX_RADIUS_PX) * camera.zoom;
      const origin = camera.worldToScreen(0, 0, this.scratch);
      this.matrix.a = scale;
      this.matrix.b = 0;
      this.matrix.c = 0;
      this.matrix.d = scale;
      this.matrix.e = origin.x;
      this.matrix.f = origin.y;
      pattern.setTransform(this.matrix);
      ctx.save();
      ctx.clip();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(center.x, center.y, Math.max(0, arena), 0, TAU);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 36;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 32, 54, 0.14)';
    ctx.lineWidth = 26;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 48, 72, 0.4)';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 86, 102, 0.82)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 214, 214, 0.95)';
    ctx.lineWidth = 1.15;
    ctx.stroke();
  }

  drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.vignette) {
      return;
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(this.vignette, 0, 0, width, height);
  }

  private ensurePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (this.pattern) {
      return this.pattern;
    }
    this.pattern = ctx.createPattern(this.tile, 'repeat');
    return this.pattern;
  }
}
