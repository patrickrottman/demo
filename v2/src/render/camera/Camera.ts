import type { Vec2 } from '../../core/contracts/Vec2';
import { damp } from '../../core/math/scalars';
import { targetZoom } from './cameraZoom';
import { VisibleBounds } from './VisibleBounds';

const POSITION_SMOOTHING = 18;
const ZOOM_SMOOTHING = 5;
const MIN_ZOOM = 0.05;

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;
  viewportWidth = 0;
  viewportHeight = 0;
  private readonly bounds = new VisibleBounds();

  setViewport(w: number, h: number): void {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  follow(targetX: number, targetY: number, targetRadius: number, dt: number): void {
    if (!Number.isFinite(targetX) || !Number.isFinite(targetY) || !Number.isFinite(targetRadius)) {
      return;
    }
    const step = Number.isFinite(dt) && dt > 0 ? dt : 0;
    this.x = damp(this.x, targetX, POSITION_SMOOTHING, step);
    this.y = damp(this.y, targetY, POSITION_SMOOTHING, step);
    const desired = targetZoom(this.viewportWidth, this.viewportHeight, targetRadius);
    const next = damp(this.zoom, desired, ZOOM_SMOOTHING, step);
    this.zoom = next < MIN_ZOOM ? MIN_ZOOM : next;
  }

  worldToScreen(x: number, y: number, out?: Vec2): Vec2 {
    const sx = (x - this.x) * this.zoom + this.viewportWidth * 0.5;
    const sy = (y - this.y) * this.zoom + this.viewportHeight * 0.5;
    if (out) {
      out.x = sx;
      out.y = sy;
      return out;
    }
    return { x: sx, y: sy };
  }

  screenToWorld(x: number, y: number, out?: Vec2): Vec2 {
    const zoom = this.zoom === 0 ? MIN_ZOOM : this.zoom;
    const wx = (x - this.viewportWidth * 0.5) / zoom + this.x;
    const wy = (y - this.viewportHeight * 0.5) / zoom + this.y;
    if (out) {
      out.x = wx;
      out.y = wy;
      return out;
    }
    return { x: wx, y: wy };
  }

  visibleBounds(): VisibleBounds {
    const zoom = this.zoom < MIN_ZOOM ? MIN_ZOOM : this.zoom;
    const halfW = (this.viewportWidth * 0.5) / zoom;
    const halfH = (this.viewportHeight * 0.5) / zoom;
    this.bounds.left = this.x - halfW;
    this.bounds.top = this.y - halfH;
    this.bounds.right = this.x + halfW;
    this.bounds.bottom = this.y + halfH;
    return this.bounds;
  }
}
