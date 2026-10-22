export function hexRgb(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  if (!Number.isFinite(value)) {
    return [255, 255, 255];
  }
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function channelByte(channel: number): number {
  const snapped = Math.round(channel / 4) * 4;
  if (snapped < 0) {
    return 0;
  }
  return snapped > 255 ? 255 : snapped;
}

export function quantizeHex(hex: string): string {
  const [r, g, b] = hexRgb(hex);
  const qr = channelByte(r);
  const qg = channelByte(g);
  const qb = channelByte(b);
  return `#${((1 << 24) | (qr << 16) | (qg << 8) | qb).toString(16).slice(1).toUpperCase()}`;
}

export function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}
