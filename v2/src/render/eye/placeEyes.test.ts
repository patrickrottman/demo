import { describe, expect, it } from 'vitest';
import { EyeSample } from './EyeSample';
import { placeEyes } from './placeEyes';

describe('placeEyes', () => {
  it('places symmetric eyes that look along the heading', () => {
    const eyes = new EyeSample();
    expect(placeEyes(eyes, 0, 0, 20)).toBe(eyes);
    expect(eyes.leftX).toBeCloseTo(eyes.rightX, 8);
    expect(eyes.leftY).toBeGreaterThan(0);
    expect(eyes.rightY).toBeCloseTo(-eyes.leftY, 8);
    expect(eyes.pupilLeftX).toBeGreaterThan(eyes.leftX);
    expect(eyes.pupilLeftY).toBeCloseTo(eyes.leftY, 8);
    expect(eyes.eyeRadius).toBeCloseTo(5.4, 8);
    expect(eyes.pupilRadius).toBeLessThan(eyes.eyeRadius);
  });

  it('shifts pupils toward a positive turn and scales with radius', () => {
    const eyes = new EyeSample();
    placeEyes(eyes, 0, Math.PI / 2, 20);
    expect(eyes.pupilLeftY).toBeGreaterThan(eyes.leftY);
    expect(eyes.pupilRightY).toBeGreaterThan(eyes.rightY);
    const small = new EyeSample();
    placeEyes(small, 0.4, 0.2, 10);
    placeEyes(eyes, 0.4, 0.2, 30);
    expect(eyes.eyeRadius / small.eyeRadius).toBeCloseTo(3, 5);
    expect(eyes.leftX / small.leftX).toBeCloseTo(3, 5);
  });
});
