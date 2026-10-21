import { describe, expect, it } from 'vitest';
import { hexRgb, quantizeHex, rgba } from './hexColor';

describe('hexColor', () => {
  it('parses and formats channels', () => {
    expect(hexRgb('#FF0000')).toEqual([255, 0, 0]);
    expect(hexRgb('nope')).toEqual([255, 255, 255]);
    expect(rgba(1.2, 2.6, 3, 0.5)).toBe('rgba(1,3,3,0.5)');
  });

  it('quantizes nearby hex colors onto the same sprite key', () => {
    expect(quantizeHex('#FFFFFF')).toBe('#FFFFFF');
    expect(quantizeHex('#000000')).toBe('#000000');
    expect(quantizeHex('#C0C0C0')).toBe('#C0C0C0');
    expect(quantizeHex('#C1C1C1')).toBe('#C0C0C0');
    expect(quantizeHex('#123456')).toBe(quantizeHex('#123456'));
    expect(quantizeHex('#FF1020')).toMatch(/^#[0-9A-F]{6}$/);
  });
});
