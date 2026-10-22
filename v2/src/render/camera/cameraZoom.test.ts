import { describe, expect, it } from 'vitest';
import { GameConfig } from '../../config/GameConfig';
import { sizeScaleForRadius, targetZoom, viewportScale } from './cameraZoom';

describe('cameraZoom', () => {
  it('clamps viewport scale', () => {
    expect(viewportScale(100, 2000)).toBe(0.55);
    expect(viewportScale(4000, 3000)).toBe(1.4);
    expect(viewportScale(1000, 1600)).toBe(1);
    expect(viewportScale(800, 1200)).toBe(0.8);
  });

  it('shrinks size scale from the minimum radius to the maximum', () => {
    const minRadius = GameConfig.snake.minRadius;
    const maxRadius = GameConfig.snake.maxRadius;
    expect(sizeScaleForRadius(minRadius)).toBeCloseTo(1, 5);
    expect(sizeScaleForRadius(maxRadius)).toBeCloseTo(0.5, 5);
    expect(sizeScaleForRadius(minRadius)).toBeGreaterThan(sizeScaleForRadius((minRadius + maxRadius) / 2));
    expect(sizeScaleForRadius((minRadius + maxRadius) / 2)).toBeGreaterThan(sizeScaleForRadius(maxRadius));
    expect(sizeScaleForRadius(maxRadius)).toBeGreaterThan(sizeScaleForRadius(maxRadius + 80));
  });

  it('multiplies viewport scale by size scale', () => {
    expect(targetZoom(800, 1200, 10)).toBeCloseTo(viewportScale(800, 1200) * sizeScaleForRadius(10), 8);
    expect(targetZoom(1000, 1000, 44)).toBeCloseTo(0.5, 5);
  });
});
