import { describe, expect, it } from 'vitest';
import { GameConfig } from '../../config/GameConfig';
import { Camera } from './Camera';
import { targetZoom } from './cameraZoom';

describe('Camera', () => {
  it('round-trips world and screen points', () => {
    const camera = new Camera();
    camera.setViewport(200, 100);
    camera.x = 10;
    camera.y = -4;
    camera.zoom = 2;
    const samples = [
      [-500, 20],
      [0, 0],
      [42.5, -18.25],
      [10, -4],
    ] as const;
    for (const [x, y] of samples) {
      const screen = camera.worldToScreen(x, y);
      const world = camera.screenToWorld(screen.x, screen.y);
      expect(world.x).toBeCloseTo(x, 8);
      expect(world.y).toBeCloseTo(y, 8);
    }
  });

  it('reuses the out vector', () => {
    const camera = new Camera();
    camera.setViewport(300, 200);
    camera.x = 5;
    camera.y = 8;
    camera.zoom = 1.5;
    const screen = { x: 0, y: 0 };
    const world = { x: 0, y: 0 };
    expect(camera.worldToScreen(20, -6, screen)).toBe(screen);
    expect(camera.screenToWorld(screen.x, screen.y, world)).toBe(world);
    expect(world.x).toBeCloseTo(20, 8);
    expect(world.y).toBeCloseTo(-6, 8);
  });

  it('maps the viewport center to the camera position', () => {
    const camera = new Camera();
    camera.setViewport(640, 360);
    camera.x = 123;
    camera.y = -77;
    camera.zoom = 0.8;
    const world = camera.screenToWorld(camera.viewportWidth / 2, camera.viewportHeight / 2);
    expect(world.x).toBeCloseTo(camera.x, 8);
    expect(world.y).toBeCloseTo(camera.y, 8);
    const screen = camera.worldToScreen(camera.x, camera.y);
    expect(screen.x).toBeCloseTo(320, 8);
    expect(screen.y).toBeCloseTo(180, 8);
  });

  it('stores the viewport', () => {
    const camera = new Camera();
    camera.setViewport(320, 180);
    expect(camera.viewportWidth).toBe(320);
    expect(camera.viewportHeight).toBe(180);
  });

  it('decreases zoom monotonically as radius grows', () => {
    const camera = new Camera();
    camera.setViewport(1000, 1000);
    let previous = Number.POSITIVE_INFINITY;
    for (const radius of [10, 16, 24, 34, 44]) {
      camera.follow(0, 0, radius, 20);
      expect(camera.zoom).toBeLessThan(previous);
      previous = camera.zoom;
    }
  });

  it('uses about half the min-radius zoom at max radius', () => {
    const wide = settledZoom(1280, 720, GameConfig.snake.minRadius);
    const tight = settledZoom(1280, 720, GameConfig.snake.maxRadius);
    expect(tight / wide).toBeCloseTo(0.5, 5);
    expect(tight).toBeCloseTo(targetZoom(1280, 720, GameConfig.snake.maxRadius), 5);
  });

  it('clamps viewport scale through follow', () => {
    expect(settledZoom(100, 800, 10)).toBeCloseTo(0.55, 5);
    expect(settledZoom(4000, 3000, 10)).toBeCloseTo(1.4, 5);
    expect(settledZoom(800, 1200, 10)).toBeCloseTo(0.8, 5);
  });

  it('converges onto the follow target', () => {
    const camera = new Camera();
    camera.setViewport(800, 600);
    camera.x = 400;
    camera.y = -200;
    for (let i = 0; i < 180; i++) {
      camera.follow(25, -5, 16, 1 / 60);
    }
    expect(camera.x).toBeCloseTo(25, 1);
    expect(camera.y).toBeCloseTo(-5, 1);
    expect(camera.zoom).toBeCloseTo(targetZoom(800, 600, 16), 3);
  });

  it('ignores zero dt and non-finite targets', () => {
    const camera = new Camera();
    camera.setViewport(400, 400);
    camera.x = 12;
    camera.y = 4;
    camera.zoom = 1;
    camera.follow(100, -50, 30, 0);
    camera.follow(Number.NaN, 1, 10, 1);
    expect(camera.x).toBe(12);
    expect(camera.y).toBe(4);
    expect(camera.zoom).toBe(1);
  });

  it('reports visible bounds centered on the camera', () => {
    const camera = new Camera();
    camera.setViewport(200, 100);
    camera.x = 10;
    camera.y = -4;
    camera.zoom = 2;
    const bounds = camera.visibleBounds();
    expect(bounds.left).toBeCloseTo(-40, 8);
    expect(bounds.right).toBeCloseTo(60, 8);
    expect(bounds.top).toBeCloseTo(-29, 8);
    expect(bounds.bottom).toBeCloseTo(21, 8);
    expect((bounds.left + bounds.right) / 2).toBeCloseTo(camera.x, 8);
    expect((bounds.top + bounds.bottom) / 2).toBeCloseTo(camera.y, 8);
    expect(bounds.right - bounds.left).toBeCloseTo(200 / 2, 8);
    expect(bounds.bottom - bounds.top).toBeCloseTo(100 / 2, 8);
  });
});

function settledZoom(width: number, height: number, radius: number): number {
  const camera = new Camera();
  camera.setViewport(width, height);
  camera.follow(0, 0, radius, 20);
  return camera.zoom;
}
