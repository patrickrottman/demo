import type { SnakeSkin } from './SnakeSkin';

const rgbCache = new Map<string, readonly [number, number, number]>();

function parseHex(hex: string): readonly [number, number, number] {
  const cached = rgbCache.get(hex);
  if (cached) {
    return cached;
  }
  const value = Number.parseInt(hex.replace('#', ''), 16);
  const rgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
  rgbCache.set(hex, rgb);
  return rgb;
}

function toHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1).toUpperCase()}`;
}

export function mixHex(from: string, to: string, t: number): string {
  const [r1, g1, b1] = parseHex(from);
  const [r2, g2, b2] = parseHex(to);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function skinColorAt(skin: SnakeSkin, index: number, count: number): string {
  const colors = skin.colors;
  const first = colors[0] ?? '#FFFFFF';
  if (skin.pattern === 'solid' || colors.length === 1) {
    return first;
  }
  if (skin.pattern === 'stripes') {
    return colors[Math.floor(index / Math.max(1, skin.stripeLength)) % colors.length] ?? first;
  }
  const t = count <= 1 ? 0 : Math.min(1, Math.max(0, index / (count - 1)));
  const scaled = t * (colors.length - 1);
  const low = Math.floor(scaled);
  const high = Math.min(colors.length - 1, low + 1);
  return mixHex(colors[low] ?? first, colors[high] ?? first, scaled - low);
}

export function skinPrimaryColor(skin: SnakeSkin): string {
  return skin.colors[0] ?? '#FFFFFF';
}
